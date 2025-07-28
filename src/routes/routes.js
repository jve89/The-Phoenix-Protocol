const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendRawEmail } = require('../utils/email');
const { loadTemplate } = require('../utils/loadTemplate');
const { logEvent } = require('../utils/db_logger');

const router = express.Router();

// Structured logger for routes
const logger = {
  info:  msg => logEvent('routes', 'info', msg),
  warn:  msg => logEvent('routes', 'warn', msg),
  error: msg => logEvent('routes', 'error', msg)
};

// Rate limiter config
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_REQUESTS = 20;

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(ts => now - ts < WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(ip, recent);

  if (recent.length > MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for ${ip}`);
    return res.status(429).send('Too many requests, slow down.');
  }

  // Periodic cleanup to prevent memory leak
  if (rateLimitMap.size > 5000) {
    for (const [key, ts] of rateLimitMap) {
      if (ts[ts.length - 1] < now - WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  next();
}

function sanitizeInput(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Wrapper to catch async errors
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(rateLimiter);

// Health check
router.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  logger.info(`/api/ping at ${timestamp}`);
  res.json({ status: 'ok', timestamp });
});

// Cron status - expects server to set app.locals.lastCron
router.get('/cron/status', (req, res) => {
  const lastRun = req.app.locals.lastCron || 'unknown';
  res.json({ cronLastRun: lastRun });
});

// Debug: list users
router.get('/debug/list-users', asyncHandler(async (req, res) => {
  logger.info('Debug list-users');
  const { rows } = await db.query('SELECT id, email, plan, usage_count FROM users ORDER BY id');
  res.json(rows);
}));

// Signup route
router.post('/signup', asyncHandler(async (req, res) => {
  const email = sanitizeInput(req.body.email);
  const name = sanitizeInput(req.body.name) || null;
  const gender = sanitizeInput(req.body.gender);
  const plan = sanitizeInput(req.body.plan);
  const rawGoal = sanitizeInput(req.body.goal_stage);
  const goal_stage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';

  if (!email || !gender || !plan || !rawGoal) {
    logger.error(`Signup validation failed: missing ${JSON.stringify({ email, gender, plan, rawGoal })}`);
    return res.status(400).json({ error: 'Email, gender, plan, and goal_stage are required.' });
  }

  if (!['3','7','30','90'].includes(plan)) {
    logger.error(`Invalid plan: ${plan}`);
    return res.status(400).json({ error: 'Invalid plan. Allowed: 3, 7, 30, 90.' });
  }

  if (!['moveon','reconnect'].includes(goal_stage)) {
    logger.error(`Invalid goal_stage: ${goal_stage}`);
    return res.status(400).json({ error: 'Invalid goal_stage. Allowed: moveon, reconnect.' });
  }

  const welcomeTemplate = await loadTemplate('welcome.html');

  try {
    const { rows } = await db.query(
      'SELECT plan_limit, usage_count FROM users WHERE email = $1',
      [email]
    );

    if (rows.length) {
      const user = rows[0];
      
      if (user.plan === '3' && user.usage_count < 3) {
        logger.warn(`Trial already in progress for ${email}`);
        return res.status(400).json({ error: 'You already have an active trial.' });
      }

      if (user.usage_count < user.plan_limit) {
        logger.warn(`Active plan exists for ${email}`);
        return res.status(400).json({ error: 'You already have an active plan.' });
      }
      logger.info(`Renewing plan for ${email}`);
      await db.query(
        `UPDATE users SET plan = $1, goal_stage = $2, plan_limit = $3, usage_count = 0, first_guide_sent_at = NULL, farewell_sent = FALSE
        WHERE email = $4`,
        [plan, goal_stage, parseInt(plan,10), email]
      );
    } else {
      logger.info(`Creating new user ${email}`);
      const isTrial = plan === '3';
      await db.query(
        `INSERT INTO users (email, name, gender, plan, plan_limit, usage_count, goal_stage, is_trial_user)
        VALUES ($1,$2,$3,$4,$5,0,$6,$7)`,
        [email, name, gender, plan, parseInt(plan,10), goal_stage, isTrial]
      );
    }

    await sendRawEmail(email, 'Welcome to The Phoenix Protocol', welcomeTemplate);
    logger.info(`Welcome email sent to ${email}`);

    if (plan === '3') {
      logger.info(`Trial user created: ${email}`);
      return res.json({ message: 'Trial signup successful', url: null });
    }

    console.log(`🧪 Creating checkout session for: ${email}, plan: ${plan}, gender: ${gender}, goal: ${goal_stage}`);
    const url = await createCheckoutSession(email, plan, gender, goal_stage);
    res.json({ message: 'Sign-up successful', url });
  } catch (err) {
    logger.error(`Signup failed for ${email}: ${err.message}`);
    res.status(500).json({ error: 'Sign-up failed' });
    console.error('❌ Stripe error:', err);
  }
}));

// Create checkout session
router.post('/create-checkout-session', asyncHandler(async (req, res) => {
  const email = sanitizeInput(req.body.email);
  const plan = sanitizeInput(req.body.plan);
  const gender = sanitizeInput(req.body.gender);
  const rawGoal = sanitizeInput(req.body.goal_stage);
  const goal_stage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';

  if (!email || !plan || !rawGoal) {
    logger.error(`Validation failed for checkout: missing ${JSON.stringify({ email, plan, rawGoal })}`);
    return res.status(400).json({ error: 'Email, plan, and goal_stage are required.' });
  }

  if (!['7','30','90'].includes(plan)) {
    logger.error(`Invalid plan: ${plan}`);
    return res.status(400).json({ error: 'Invalid plan. Allowed: 7, 30, 90.' });
  }
  if (!['moveon','reconnect'].includes(goal_stage)) {
    logger.error(`Invalid goal_stage for checkout: ${goal_stage}`);
    return res.status(400).json({ error: 'Invalid goal_stage.' });
  }

  try {
    const url = await createCheckoutSession(email, plan, gender, goal_stage);
    res.json({ url });
  } catch (err) {
    logger.error(`Checkout session error for ${email}: ${err.message}`);
    console.error(err);  // For full stack trace in terminal
    res.status(500).json({ error: 'Payment setup failed' });
  }
}));

module.exports = router;
