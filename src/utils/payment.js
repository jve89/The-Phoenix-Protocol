require('dotenv').config({ path: './.env' });

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const createCheckoutSession = async (email, plan) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not found in environment');
    throw new Error('Missing Stripe API key');
  }

  console.log(`Creating checkout session for email: ${email}, plan: ${plan}`);

  const amount = parseInt(plan);
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
          unit_amount: amount * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://the-phoenix-protocol-d0f5db370981.herokuapp.com/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://the-phoenix-protocol-d0f5db370981.herokuapp.com/`,
      customer_email: email,
    });
    console.log('Stripe checkout session created:', session.id);
    return session.url;
  } catch (error) {
    console.error('Stripe error:', error.message, error);
    throw new Error('Payment setup failed');
  }
};

module.exports = { createCheckoutSession };
