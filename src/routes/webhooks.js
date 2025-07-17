const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) console.error('❌ STRIPE_SECRET_KEY not set');
if (!stripeWebhookSecret) console.error('❌ STRIPE_WEBHOOK_SECRET not set');

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

const { refundLatestChargeForEmail } = require('../utils/payment');
const { sendFirstGuideImmediately } = require('../utils/send_first_guide_immediately');
const { sendWelcomeBackEmail } = require('../utils/send_welcome_back');

// Helper to safely run async function in setTimeout
function safeAsyncTimeout(fn, delay) {
  setTimeout(() => {
    fn().catch(err => {
      console.error('❌ Error in delayed async function:', err);
    });
  }, delay);
}

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  const sig = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Received webhook event: ${event.type}`);

  try {
    const allowedEvents = [
      'checkout.session.completed',
      'invoice.payment_failed',
      'charge.failed',
      'customer.subscription.deleted',
      'customer.subscription.updated',
    ];

    if (!allowedEvents.includes(event.type)) {
      console.log(`🔕 Ignored webhook: ${event.type}`);
      return res.status(200).json({ received: true });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const email = (session.customer_email || '').trim().toLowerCase();
      const customerId = session.customer;
      const paymentIntent = session.payment_intent;

      const gender = (session.metadata?.gender || 'neutral').trim();
      const goalStage = (session.metadata?.goal_stage || 'reconnect').trim();
      const plan = (session.metadata?.plan || '30').trim();
      const days = parseInt(plan, 10);

      const { rows } = await db.query(`SELECT email FROM users WHERE session_id = $1`, [sessionId]);
      if (rows.length > 0) {
        console.log(`⚠️ Duplicate webhook received for ${rows[0].email} with session ${sessionId}, skipping.`);
        return res.status(200).json({ received: true });
      }

      const { rows: existingRows } = await db.query(`SELECT end_date FROM users WHERE email = $1`, [email]);
      const existingEnd = existingRows[0]?.end_date ? new Date(existingRows[0].end_date) : null;
      const now = new Date();

      let baseDate = now;
      if (existingEnd && existingEnd >= now) baseDate = existingEnd;
      const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      const formattedEndDate = newEndDate.toISOString().split('T')[0];

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
          await sendWelcomeBackEmail(email);
          return res.status(200).json({ received: true });
        }

        // Delay sending first guide by 5 minutes (300000 ms), safely
        safeAsyncTimeout(async () => {
          await sendFirstGuideImmediately(email, gender, goalStage);
          console.log(`✅ First premium guide sent to ${email} after 5-minute delay`);
          // sendFirstGuideImmediately updates first_guide_sent_at internally
        }, 300000);
      } else {
        console.warn(`⚠️ No matching user found for ${email} on payment confirmation`);
      }
    }

    if (
      ['invoice.payment_failed', 'charge.failed', 'customer.subscription.deleted', 'customer.subscription.updated'].includes(event.type)
    ) {
      const customerEmail =
        (event.data.object.customer_email || event.data.object.billing_details?.email || '').trim().toLowerCase() || null;

      if (customerEmail) {
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
      } else {
        console.warn(`⚠️ No customer email found in webhook event for ${event.type}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
