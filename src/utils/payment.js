const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const pricingMap = { "30": 1900, "90": 4900, "365": 9900 }; // cents

const createCheckoutSession = async (email, plan, gender = '', goal_stage = '') => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] Missing STRIPE_SECRET_KEY');
    throw new Error('Stripe API key is missing');
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('Invalid email');
  }

  const amount = pricingMap?.[String(plan)];
  if (!amount) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  console.log(`[Stripe] Creating session for ${email} - Plan: ${plan}, Gender: ${gender}, Goal: ${goal_stage}`);

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
      success_url: 'https://www.thephoenixprotocol.app/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.thephoenixprotocol.app/checkout.html',
      customer_email: email,
      customer_creation: 'always',
      metadata: {
        email,
        plan: String(plan),
        gender,
        goal_stage
      }
    });

    console.log('[Stripe] Session created:', session.id);
    return session.url;

  } catch (error) {
    console.error('[Stripe] Checkout creation error:', error.message);
    throw new Error('Payment setup failed');
  }
};

const refundLatestChargeForEmail = async (email) => {
  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      console.warn(`[Stripe] No customer found for ${email}`);
      return;
    }

    const customer = customers.data[0];
    const charges = await stripe.charges.list({ customer: customer.id, limit: 1 });

    if (!charges.data.length) {
      console.warn(`[Stripe] No charges found for ${email}`);
      return;
    }

    const charge = charges.data[0];
    if (charge.refunded) {
      console.log(`[Stripe] Charge ${charge.id} already refunded for ${email}`);
      return;
    }

    await stripe.refunds.create({ charge: charge.id });
    console.log(`[Stripe] Refunded charge ${charge.id} for ${email}`);

  } catch (error) {
    console.error(`[Stripe] Refund error for ${email}:`, error.message);
  }
};

module.exports = { createCheckoutSession, refundLatestChargeForEmail };
