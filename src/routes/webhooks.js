// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const { refundLatestChargeForEmail } = require('../utils/payment');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Received webhook event: ${event.type}`);

  // ✅ 1. Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const customerId = session.customer;
    const paymentIntent = session.payment_intent;

    // 🧠 Extract custom metadata from Stripe
    const gender = session.metadata?.gender || 'neutral';
    const goalStage = session.metadata?.goal_stage || 'reconnect';
    const plan = session.metadata?.plan || '30'; // fallback to default plan if missing

    try {
      const { rowCount } = await db.query(
        `UPDATE users SET 
          plan = $1,
          payment_status = $2,
          stripe_customer_id = $3,
          stripe_payment_intent = $4,
          gender = $5,
          goal_stage = $6
        WHERE email = $7`,
        [plan, 'success', customerId, paymentIntent, gender, goalStage, email]
      );

      if (rowCount > 0) {
        console.log(`✅ Payment confirmed via webhook for ${email} (gender=${gender}, goal_stage=${goalStage})`);
      } else {
        console.warn(`⚠️ No matching user found for ${email} on payment confirmation`);
      }

    } catch (err) {
      console.error(`❌ Failed to update user after payment confirmation:`, err.message);
    }
  }

  // ✅ 2. Handle failure/bounce scenarios
  if (
    event.type === 'invoice.payment_failed' ||
    event.type === 'charge.failed' ||
    event.type === 'customer.subscription.deleted' ||
    event.type === 'customer.subscription.updated'
  ) {
    const customerEmail =
      event.data.object.customer_email ||
      event.data.object.billing_details?.email ||
      null;

    if (customerEmail) {
      try {
        const { rows } = await db.query(`SELECT id, bounces FROM users WHERE email = $1`, [customerEmail]);
        if (rows.length > 0) {
          const user = rows[0];
          const newBounces = user.bounces + 1;

          await db.query(`UPDATE users SET bounces = $1 WHERE id = $2`, [newBounces, user.id]);
          console.log(`📌 Updated bounce count for ${customerEmail} to ${newBounces}`);

          if (newBounces >= 5) {
            console.log(`⚠️ Bounce threshold reached for ${customerEmail}. Initiating refund.`);
            await refundLatestChargeForEmail(customerEmail);
          }
        } else {
          console.warn(`⚠️ No user found for bounced email: ${customerEmail}`);
        }
      } catch (dbErr) {
        console.error('❌ Database error during bounce tracking:', dbErr.message);
      }
    } else {
      console.warn(`⚠️ No customer email found in webhook event for ${event.type}`);
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
