// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const { refundLatestChargeForEmail } = require('../utils/payment');
const { sendFirstGuideImmediately } = require('../utils/send_first_guide_immediately');
const { sendWelcomeBackEmail } = require('../utils/send_welcome_back');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.id;
    const email = session.customer_email;
    const customerId = session.customer;
    const paymentIntent = session.payment_intent;

    const gender = session.metadata?.gender || 'neutral';
    const goalStage = session.metadata?.goal_stage || 'reconnect';
    const plan = session.metadata?.plan || '30';
    const days = parseInt(plan, 10);

    try {
      const { rows } = await db.query(
        `SELECT email FROM users WHERE session_id = $1`,
        [sessionId]
      );

      if (rows.length > 0) {
        console.log(`⚠️ Duplicate webhook received for ${rows[0].email} with session ${sessionId}, skipping.`);
        return res.status(200).json({ received: true });
      }

      // ✅ Get current user info (to calculate stacking)
      const { rows: existingRows } = await db.query(
        `SELECT end_date FROM users WHERE email = $1`,
        [email]
      );

      const existingEnd = existingRows[0]?.end_date ? new Date(existingRows[0].end_date) : null;
      const now = new Date();

      // ⏱ Determine correct plan length in days
      const planDays = parseInt(plan, 10) || 30;
      const msPerDay = 24 * 60 * 60 * 1000;

      // 📦 Apply stacking logic
      let baseDate = now;
      if (existingEnd && existingEnd >= now) {
        baseDate = existingEnd;
      }
      const newEndDate = new Date(baseDate.getTime() + planDays * msPerDay);
      const formattedEndDate = newEndDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      // ✅ Update user with stacked end_date and metadata
      const { rowCount } = await db.query(
        `UPDATE users SET 
          plan = $1,
          end_date = $2,
          payment_status = $3,
          stripe_customer_id = $4,
          stripe_payment_intent = $5,
          gender = $6,
          goal_stage = $7,
          stripe_checkout_session_id = $8,
          session_id = $9
        WHERE email = $10`,
        [plan, formattedEndDate, 'success', customerId, paymentIntent, gender, goalStage, sessionId, sessionId, email]
      );

      if (rowCount > 0) {
        console.log(`✅ Payment confirmed via webhook for ${email}`);

        const { rows: updatedUserRows } = await db.query(
          `SELECT first_guide_sent_at, end_date FROM users WHERE email = $1`,
          [email]
        );

        const { first_guide_sent_at, end_date } = updatedUserRows[0] || {};
        const alreadySent = !!first_guide_sent_at;
        const stillActive = end_date && new Date(end_date) >= now;

        if (alreadySent && stillActive) {
          console.log(`🛑 ${email} already received guide and is still active. Skipping resend.`);
          
          // ✅ Send welcome back email
          await sendWelcomeBackEmail(email);

          return res.status(200).json({ received: true });
        }

        setTimeout(async () => {
          try {
            await sendFirstGuideImmediately(email, gender, goalStage);
            console.log(`✅ First premium guide sent to ${email} after 5-minute delay`);

            try {
              await db.query(
                `UPDATE users SET first_guide_sent_at = CURRENT_TIMESTAMP WHERE email = $1`,
                [email]
              );
              console.log(`🕓 Saved first_guide_sent_at timestamp for ${email}`);
            } catch (timestampErr) {
              console.error(`❌ Failed to update first_guide_sent_at for ${email}:`, timestampErr.message);
            }
          } catch (err) {
            console.error(`❌ Error sending first premium guide to ${email}:`, err);
          }
        }, 300000); // 5 minutes
      } else {
        console.warn(`⚠️ No matching user found for ${email} on payment confirmation`);
      }

    } catch (err) {
      console.error(`❌ Failed to process checkout.session.completed:`, err.message);
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
        const { rows } = await db.query(
          `SELECT id, bounces FROM users WHERE email = $1`,
          [customerEmail]
        );

        if (rows.length > 0) {
          const user = rows[0];
          const newBounces = user.bounces + 1;

          await db.query(
            `UPDATE users SET bounces = $1 WHERE id = $2`,
            [newBounces, user.id]
          );

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
