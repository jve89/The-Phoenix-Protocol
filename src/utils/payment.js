const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (email, plan) => {
  const prices = { '30': 999, '90': 2499, '365': 7999 }; // cents
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'usd', product_data: { name: 'The Phoenix Protocol' }, unit_amount: prices[plan] }, quantity: 1 }],
    mode: 'payment',
    success_url: `https://3000-jve89-thephoenixprotoc-nlh9a38871c.ws-eu120.gitpod.io/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://3000-jve89-thephoenixprotoc-nlh9a38871c.ws-eu120.gitpod.io/`,
    customer_email: email,
  });
  return session.url;
};

module.exports = { createCheckoutSession };