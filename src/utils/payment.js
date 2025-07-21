const Stripe = require('stripe');
const { logEvent } = require('./db_logger');

// Validate Stripe key at load time
if (!process.env.STRIPE_SECRET_KEY) {
  logEvent('payment', 'error', 'Missing STRIPE_SECRET_KEY');
  throw new Error('Stripe API key not configured');
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Pricing map in cents
const pricingMap = { '30': 1900, '90': 4900, '365': 9900 };

// Default URLs from env (fallback to constants)
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://www.thephoenixprotocol.app/success.html?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL  = process.env.CANCEL_URL  || 'https://www.thephoenixprotocol.app/checkout.html';

/**
 * Create a Stripe Checkout session for a subscription plan.
 * @param {string} email - Customer email address.
 * @param {number|string} plan - Subscription duration in days (30, 90, 365).
 * @param {string} gender - Optional customer gender metadata.
 * @param {string} goalStage - Optional customer goal stage metadata.
 * @returns {Promise<string>} - URL to redirect customer for checkout.
 */
async function createCheckoutSession(email, plan, gender = '', goalStage = '') {
  // Parameter validation
  if (typeof email !== 'string' || !email.includes('@')) {
    logEvent('payment', 'warn', `Invalid email passed to createCheckoutSession: ${email}`);
    throw new Error('Invalid email address');
  }
  const planKey = String(plan);
  const amount = pricingMap[planKey];
  if (!amount) {
    logEvent('payment', 'warn', `Invalid plan passed: ${planKey}`);
    throw new Error(`Invalid plan: ${plan}`);
  }

  logEvent('payment', 'info', `Creating Stripe session for ${email}, plan ${planKey}`);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'The Phoenix Protocol' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      customer_email: email,
      metadata: { email, plan: planKey, gender, goalStage }
    });

    logEvent('payment', 'info', `Stripe session created: ${session.id}`);
    return session.url;
  } catch (err) {
    logEvent('payment', 'error', `Stripe checkout creation failed for ${email}: ${err.message}`);
    throw new Error('Payment setup failed');
  }
}

/**
 * Refund the most recent charge for a given email address.
 * @param {string} email - Customer email.
 */
async function refundLatestChargeForEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    logEvent('payment', 'warn', `Invalid email for refund: ${email}`);
    return;
  }
  logEvent('payment', 'info', `Initiating refund lookup for ${email}`);

  try {
    const { data: customers } = await stripe.customers.list({ email, limit: 1 });
    if (!customers.length) {
      logEvent('payment', 'warn', `No customer found for ${email}`);
      return;
    }
    const customer = customers[0];

    const { data: charges } = await stripe.charges.list({ customer: customer.id, limit: 1 });
    if (!charges.length) {
      logEvent('payment', 'warn', `No charges found for ${email}`);
      return;
    }
    const charge = charges[0];
    if (charge.refunded) {
      logEvent('payment', 'info', `Charge ${charge.id} already refunded for ${email}`);
      return;
    }

    await stripe.refunds.create({ charge: charge.id });
    logEvent('payment', 'info', `Refund successful for charge ${charge.id} and email ${email}`);
  } catch (err) {
    logEvent('payment', 'error', `Refund error for ${email}: ${err.message}`);
  }
}

module.exports = { createCheckoutSession, refundLatestChargeForEmail };
