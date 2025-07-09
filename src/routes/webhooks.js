// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Received webhook event: ${event.type}`);

  // Handle email bounce notifications
  if (event.type === 'customer.subscription.updated' || event.type === 'charge.failed') {
    const customerEmail = event.data.object.customer_email || event.data.object.billing_details?.email;

    if (customerEmail) {
      try {
        const { rows } = await db.query(`SELECT id, bounces FROM users WHERE email = $1`, [customerEmail]);
        if (rows.length > 0) {
          const user = rows[0];
          const newBounces = user.bounces + 1;

          await db.query(`UPDATE users SET bounces = $1 WHERE id = $2`, [newBounces, user.id]);
          console.log(`📌 Updated bounce count for ${customerEmail} to ${newBounces}`);

          // Auto-refund if bounce threshold reached
          if (newBounces >= 5) {
            const paymentIntentId = event.data.object.payment_intent;
            if (paymentIntentId) {
              try {
                const refund = await stripe.refunds.create({
                  payment_intent: paymentIntentId,
                });
                console.log(`💸 Refunded ${customerEmail} automatically due to 5 bounces:`, refund.id);
              } catch (refundErr) {
                console.error(`❌ Failed to refund ${customerEmail}:`, refundErr.message);
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('❌ Database error during bounce tracking:', dbErr.message);
      }
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
