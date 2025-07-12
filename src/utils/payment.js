require('dotenv').config({ path: './.env' });

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const createCheckoutSession = async (email, plan) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not found in environment');
    throw new Error('Missing Stripe API key');
  }

  console.log(`Creating checkout session for email: ${email}, plan: ${plan}`);

  const pricingMap = { "30": 1900, "90": 4900, "365": 9900 }; // amounts in cents
  const amount = pricingMap[plan];
  if (!amount) {
    throw new Error('Invalid plan');
  }
  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid plan amount received:', plan);
    throw new Error('Invalid plan amount');
  }

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
      success_url: `https://www.thephoenixprotocol.app/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.thephoenixprotocol.app/checkout.html`,
      customer_email: email,
      customer_creation: 'always', // ✅ Ensure Stripe creates a persistent customer ID
    });
    console.log('Stripe checkout session created:', session.id);
    return session.url;
  } catch (error) {
    console.error('Stripe error:', error.message, error);
    throw new Error('Payment setup failed');
  }
};

const refundLatestChargeForEmail = async (email) => {
  try {
    // Find the customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      console.warn(`⚠️ No customer found for ${email}, cannot refund.`);
      return;
    }
    const customer = customers.data[0];

    // Find the latest charge for the customer
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 1,
    });
    if (!charges.data.length) {
      console.warn(`⚠️ No charge found for ${email}, cannot refund.`);
      return;
    }
    const charge = charges.data[0];

    // Issue the refund
    await stripe.refunds.create({ charge: charge.id });
    console.log(`✅ Issued refund for ${email}, charge ${charge.id}`);

  } catch (error) {
    console.error(`❌ Error issuing refund for ${email}:`, error);
  }
};

module.exports = { createCheckoutSession, refundLatestChargeForEmail };
