// src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const Stripe = require('stripe');
const { refundLatestChargeForEmail } = require('../utils/payment');
const { logEvent } = require('../utils/db_logger');

// Structured logger
const logger = {
  info: msg => logEvent('webhook', 'info', msg),
  warn: msg => logEvent('webhook', 'warn', msg),
  error: msg => logEvent('webhook', 'error', msg),
};

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

// Check if this event.id has already been processed
async function isDuplicateEvent(eventId) {
  try {
    const { rowCount } = await db.query(
      `INSERT INTO processed_webhooks (event_id) VALUES ($1)
       ON CONFLICT DO NOTHING`,
      [eventId]
    );
    return rowCount === 0; // if conflict, already processed
  } catch (err) {
    logger.error(`processed_webhooks insert failed: ${err.message}`);
    // fallback: never block, but risk duplicate
    return false;
  }
}

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

    // Deduplicate
    if (await isDuplicateEvent(event.id)) {
      logger.warn(`Duplicate event skipped: ${event.id}`);
      return res.json({ received: true });
    }

    const type = event.type;

    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const email = (session.customer_email || '').trim().toLowerCase();
      const gender = (session.metadata?.gender || 'neutral').trim();
      const rawGoal = (session.metadata?.goalStage || '').trim().toLowerCase();
      const goalStage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';
      const plan = (session.metadata?.plan || '30').trim();
      const limit = parseInt(plan, 10);

      const { rows: dupRows } = await db.query(
        'SELECT 1 FROM users WHERE session_id = $1',
        [sessionId]
      );
      if (dupRows.length) {
        logger.warn(`Duplicate checkout session: ${sessionId}`);
        return res.json({ received: true });
      }

      const { rowCount } = await db.query(
        `UPDATE users SET
            plan                  = $1,
            plan_limit            = $2,
            paid_usage_count      = 0,
            gender                = $3,
            goal_stage            = $4,
            session_id            = $5,
            is_trial_user         = FALSE,
            unsubscribed          = FALSE,
            paid_started_at       = NOW(),
            last_paid_sent_at     = NULL,
            paid_farewell_sent_at = NULL,
            trial_started_at      = NULL,
            last_trial_sent_at    = NULL,
            trial_farewell_sent_at = NULL
          WHERE email = $6`,
        [plan, limit, gender, goalStage, sessionId, email]
      );
      if (!rowCount) {
        logger.warn(`No user updated for session ${sessionId}, email ${email}`);
      }
    }

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
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
        if (!rows.length) {
          logger.warn(`Bounce for unknown user: ${email}`);
        } else {
          const user = rows[0];
          const { rows: updated } = await db.query(
            'UPDATE users SET bounces = bounces + 1 WHERE id=$1 RETURNING bounces',
            [user.id]
          );
          const newBounces = updated[0].bounces;
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
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (!rows.length) {
        logger.warn(`SendGrid bounce for unknown user: ${email}`);
        continue;
      }
      const user = rows[0];
      const { rows: updated } = await db.query(
        'UPDATE users SET bounces = bounces + 1 WHERE id=$1 RETURNING bounces',
        [user.id]
      );
      const newBounces = updated[0].bounces;
      logger.info(`SendGrid bounce for ${email}: ${newBounces}`);
      if (newBounces >= 5) {
        logger.info(`Bounce limit reached for ${email}, refunding`);
        await refundLatestChargeForEmail(email);
      }
    }

    res.json({ received: true });
  })
);

// Error handler
router.use((err, req, res, next) => {
  logger.error(err.stack || `Webhook handler error: ${err.message}`);
  res.status(500).json({ error: 'Webhook handling failed' });
});

module.exports = router;
