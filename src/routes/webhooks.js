// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const db = require('../db/db');

require('dotenv').config({ path: './.env' });

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Raw body parser middleware for Stripe webhook verification
router.use(
  express.raw({ type: 'application/json' })
);

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific Stripe event types
  try {
    switch (event.type) {
      case 'invoice.payment_failed':
        {
          const email = event.data.object.customer_email;
          if (email) {
            console.log(`⚠️ Payment failed for ${email}. Incrementing bounce count.`);
            await db.query(
              `UPDATE users SET bounces = bounces + 1 WHERE email = $1`,
              [email]
            );
          }
        }
        break;

      case 'customer.subscription.deleted':
        {
          const email = event.data.object.customer_email;
          if (email) {
            console.log(`⚠️ Subscription deleted for ${email}. Incrementing bounce count.`);
            await db.query(
              `UPDATE users SET bounces = bounces + 1 WHERE email = $1`,
              [email]
            );
          }
        }
        break;

      // Add additional cases as needed for email delivery failure reporting in the future

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook event:', err);
    res.status(500).json({ error: 'Webhook handler failure' });
  }
});

module.exports = router;
