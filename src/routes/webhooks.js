// src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const { refundLatestChargeForEmail } = require('../utils/payment');
const { logEvent } = require('../utils/db_logger');

// Structured logger for webhooks
const logger = {
  info: msg => logEvent('webhook', 'info', msg),
  warn: msg => logEvent('webhook', 'warn', msg),
  error: msg => logEvent('webhook', 'error', msg),
};

// Validate Stripe config at load time
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeSecret) {
  logger.error('Missing STRIPE_SECRET_KEY');
  throw new Error('Missing STRIPE_SECRET_KEY');
}
if (!webhookSecret) {
  logger.error('Missing STRIPE_WEBHOOK_SECRET');
  throw new Error('Missing STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

// Async handler wrapper
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Primary Stripe webhook handler
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      logger.info(`Webhook received: ${event.type}`);
    } catch (err) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const type = event.type;

    // Handle checkout completion
    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const email = (session.customer_email || '').trim().toLowerCase();
      const gender = (session.metadata?.gender || 'neutral').trim();
      const rawGoal = (session.metadata?.goalStage || '').trim().toLowerCase();
      const goalStage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';
      const plan = (session.metadata?.plan || '30').trim();
      const limit = parseInt(plan, 10);

      // Idempotency check
      const { rows: dupRows } = await db.query(
        'SELECT 1 FROM users WHERE session_id = $1',
        [sessionId]
      );
      if (dupRows.length) {
        logger.warn(`Duplicate webhook session: ${sessionId}`);
        return res.json({ received: true });
      }

      const now = new Date();
      const { rowCount } = await db.query(
        `UPDATE users SET
            plan = $1,
            plan_limit = $2,
            paid_usage_count = 0,                -- was usage_count
            gender = $3,
            goal_stage = $4,
            session_id = $5,
            is_trial_user = FALSE,
            paid_started_at = COALESCE(paid_started_at, $7),
            last_paid_sent_at = NULL,
            paid_farewell_sent_at = NULL,
            trial_started_at = NULL,
            last_trial_sent_at = NULL,
            trial_farewell_sent_at = NULL
          WHERE email = $6`,
        [plan, limit, gender, goalStage, sessionId, email, now]
      );
      if (!rowCount) {
        logger.warn(`No user updated for session ${sessionId}, email ${email}`);
      }
    }

    // Handle bounce-related events
    const bounceEvents = new Set([
      'invoice.payment_failed',
      'charge.failed',
      'customer.subscription.deleted',
      'customer.subscription.updated',
    ]);

    if (bounceEvents.has(type)) {
      const obj = event.data.object;
      const email = (obj.customer_email || obj.billing_details?.email || '')
        .trim()
        .toLowerCase();
      if (!email) {
        logger.warn(`No email for bounce event ${type}`);
      } else {
        const { rows } = await db.query(
          'SELECT id, bounces FROM users WHERE email = $1',
          [email]
        );
        if (!rows.length) {
          logger.warn(`Bounce for unknown user: ${email}`);
        } else {
          const user = rows[0];
          const newBounces = (user.bounces || 0) + 1;
          await db.query('UPDATE users SET bounces = $1 WHERE id = $2', [
            newBounces,
            user.id,
          ]);
          logger.info(`Updated bounces for ${email}: ${newBounces}`);
          if (newBounces >= 5) {
            logger.info(`Bounce limit reached for ${email}, refunding`);
            await refundLatestChargeForEmail(email);
          }
        }
      }
    }

    res.json({ received: true });
  })
);

// SendGrid event webhooks
router.post(
  '/sendgrid',
  express.json(),
  asyncHandler(async (req, res) => {
    const events = req.body;
    if (!Array.isArray(events)) {
      logger.warn('Invalid SendGrid webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    for (const evt of events) {
      const type = evt.event;
      const email = (evt.email || '').trim().toLowerCase();
      if (!email || !['bounce', 'dropped'].includes(type)) {
        continue;
      }

      const { rows } = await db.query(
        'SELECT id, bounces FROM users WHERE email = $1',
        [email]
      );
      if (!rows.length) {
        logger.warn(`SendGrid bounce for unknown user: ${email}`);
        continue;
      }
      const user = rows[0];
      const newBounces = (user.bounces || 0) + 1;
      await db.query('UPDATE users SET bounces = $1 WHERE id = $2', [
        newBounces,
        user.id,
      ]);
      logger.info(`SendGrid bounce for ${email}: ${newBounces}`);
      if (newBounces >= 5) {
        logger.info(`Bounce limit reached for ${email}, refunding`);
        await refundLatestChargeForEmail(email);
      }
    }

    res.json({ received: true });
  })
);

// Error handler middleware
router.use((err, req, res, next) => {
  logger.error(`Webhook handler error: ${err.message}`);
  res.status(500).json({ error: 'Webhook handling failed' });
});

module.exports = router;
