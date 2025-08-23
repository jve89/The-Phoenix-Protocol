const Stripe = require('stripe');
const { logEvent } = require('./db_logger');

// Validate Stripe key at load time
if (!process.env.STRIPE_SECRET_KEY) {
  logEvent('payment', 'error', 'Missing STRIPE_SECRET_KEY');
  throw new Error('Stripe API key not configured');
}

// Initialize Stripe client with conservative retries
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  maxNetworkRetries: 2,     // retry safe idempotent requests
  timeout: 30000            // 30s network timeout
});

// Pricing map in cents (authoritative; only these are valid)
const pricingMap = Object.freeze({ '7': 900, '30': 1900, '90': 4900 });

// Default URLs from env (fallback to constants)
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://www.thephoenixprotocol.app/success.html?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL  = process.env.CANCEL_URL  || 'https://www.thephoenixprotocol.app/checkout.html';

// Basic URL guard (defensive; does not throw)
function isHttpsUrl(s) {
  try { const u = new URL(s); return u.protocol === 'https:'; } catch { return false; }
}

/**
 * Create a Stripe Checkout session for a plan.
 * No new features. Defensive input handling only.
 */
async function createCheckoutSession(email, plan, gender = '', goalStage = '') {
  // Normalize and validate inputs
  const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normEmail || !normEmail.includes('@')) {
    logEvent('payment', 'warn', `Invalid email passed to createCheckoutSession: ${email}`);
    throw new Error('Invalid email address');
  }

  const planKey = String(plan);
  const amount = pricingMap[planKey];
  if (!amount) {
    if (planKey === '365') {
      logEvent('payment', 'info', `Attempted use of deprecated plan: ${planKey}`);
      throw new Error('This plan is no longer available. Please select a different option.');
    }
    logEvent('payment', 'warn', `Invalid plan passed: ${planKey}`);
    throw new Error(`Invalid plan: ${plan}`);
  }

  // Metadata must be short strings
  const meta = {
    email: normEmail,
    plan: planKey,
    gender: String(gender || '').trim().slice(0, 32),
    goalStage: String(goalStage || '').trim().slice(0, 32)
  };

  // URLs must be https (if custom env overrides are incorrect, fall back to defaults)
  const successUrl = isHttpsUrl(SUCCESS_URL) ? SUCCESS_URL : 'https://www.thephoenixprotocol.app/success.html?session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl  = isHttpsUrl(CANCEL_URL)  ? CANCEL_URL  : 'https://www.thephoenixprotocol.app/checkout.html';

  logEvent('payment', 'info', `Creating Stripe session for ${normEmail}, plan ${planKey}`);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // safe, explicit
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `The Phoenix Protocol — ${planKey}-Day Plan` },
          unit_amount: amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: normEmail,
      metadata: meta
    });

    logEvent('payment', 'info', `Stripe session created: ${session.id}`);
    return session.url;
  } catch (err) {
    // Do not leak full error; keep message
    logEvent('payment', 'error', `Stripe checkout creation failed for ${normEmail}: ${err.message}`);
    throw new Error('Payment setup failed');
  }
}

/**
 * Refund the most recent successful charge for a given email address.
 * Defensive: pick last SUCCEEDED charge, skip if already refunded.
 * Use idempotency key based on charge id to avoid duplicate refunds on retries.
 */
async function refundLatestChargeForEmail(email) {
  const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normEmail || !normEmail.includes('@')) {
    logEvent('payment', 'warn', `Invalid email for refund: ${email}`);
    return;
  }
  logEvent('payment', 'info', `Initiating refund lookup for ${normEmail}`);

  try {
    const { data: customers } = await stripe.customers.list({ email: normEmail, limit: 1 });
    if (!customers.length) {
      logEvent('payment', 'warn', `No customer found for ${normEmail}`);
      return;
    }
    const customer = customers[0];

    // Get the most recent succeeded charge
    const { data: charges } = await stripe.charges.list({
      customer: customer.id,
      limit: 1
    });
    if (!charges.length) {
      logEvent('payment', 'warn', `No charges found for ${normEmail}`);
      return;
    }

    const charge = charges[0];
    if (charge.status !== 'succeeded') {
      logEvent('payment', 'warn', `Latest charge not succeeded (${charge.status}) for ${normEmail}`);
      return;
    }
    if (charge.refunded) {
      logEvent('payment', 'info', `Charge ${charge.id} already refunded for ${normEmail}`);
      return;
    }

    // Idempotency key prevents double-refund on retries
    await stripe.refunds.create(
      { charge: charge.id },
      { idempotencyKey: `refund_${charge.id}` }
    );
    logEvent('payment', 'info', `Refund successful for charge ${charge.id} and email ${normEmail}`);
  } catch (err) {
    logEvent('payment', 'error', `Refund error for ${normEmail}: ${err.message}`);
  }
}

module.exports = { createCheckoutSession, refundLatestChargeForEmail };
