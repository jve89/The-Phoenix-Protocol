const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const { refundLatestChargeForEmail } = require('../utils/payment');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!process.env.STRIPE_SECRET_KEY) console.error('❌ STRIPE_SECRET_KEY not set');
if (!webhookSecret) console.error('❌ STRIPE_WEBHOOK_SECRET not set');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  const sig = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    const type = event.type;

    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const email = (session.customer_email || '').trim().toLowerCase();

      const gender = (session.metadata?.gender || 'neutral').trim();
      const goalStage = (session.metadata?.goal_stage || 'reconnect').trim();
      const plan = (session.metadata?.plan || '30').trim();
      const limit = parseInt(plan, 10);

      const { rows: dup } = await db.query(`SELECT email FROM users WHERE session_id = $1`, [sessionId]);
      if (dup.length > 0) {
        console.log(`⚠️ Duplicate webhook for ${email} with session ${sessionId}`);
        return res.status(200).json({ received: true });
      }

      const { rowCount } = await db.query(
        `UPDATE users SET
          plan = $1,
          plan_limit = $2,
          usage_count = 0,
          gender = $3,
          goal_stage = $4,
          session_id = $5
        WHERE email = $6`,
        [plan, limit, gender, goalStage, sessionId, email]
      );

      if (rowCount === 0) {
        console.warn(`⚠️ No user matched for ${email}`);
      }
    }

    const isBounceEvent = [
      'invoice.payment_failed',
      'charge.failed',
      'customer.subscription.deleted',
      'customer.subscription.updated',
    ].includes(type);

    if (isBounceEvent) {
      const obj = event.data.object;
      const email = (obj.customer_email || obj.billing_details?.email || '').trim().toLowerCase();

      if (!email) {
        console.warn(`⚠️ No email in ${type}`);
        return res.status(200).json({ received: true });
      }

      const { rows } = await db.query(`SELECT id, bounces FROM users WHERE email = $1`, [email]);

      if (rows.length === 0) {
        console.warn(`⚠️ No user for bounce email: ${email}`);
        return res.status(200).json({ received: true });
      }

      const user = rows[0];
      const newBounces = user.bounces + 1;
      await db.query(`UPDATE users SET bounces = $1 WHERE id = $2`, [newBounces, user.id]);

      console.log(`📌 Updated bounces for ${email} to ${newBounces}`);

      if (newBounces >= 5) {
        console.log(`⚠️ ${email} reached bounce limit. Refunding.`);
        await refundLatestChargeForEmail(email);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).send('Internal error');
  }
});

module.exports = router;
