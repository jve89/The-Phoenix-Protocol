const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (email, plan) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not found in .env');
    throw new Error('Missing Stripe API key');
  }
  console.log('Using Stripe key:', process.env.STRIPE_SECRET_KEY);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'The Phoenix Protocol' }, unit_amount: parseInt(plan) * 100 }, quantity: 1 }],
      mode: 'payment',
      success_url: `https://3000-jve89-thephoenixprotoc-nlh9a38871c.ws-eu120.gitpod.io/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3000-jve89-thephoenixprotoc-nlh9a38871c.ws-eu120.gitpod.io/`,
      customer_email: email,
    });
    return session.url;
  } catch (error) {
    console.error('Stripe error:', error.message);
    throw new Error('Payment setup failed');
  }
};

module.exports = { createCheckoutSession };