// src/routes/routes.js

const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendRawEmail } = require('../utils/email');
const { loadTemplate } = require('../utils/loadTemplate');

const router = express.Router();

const VALID_PLANS = ['30', '90', '365'];
const VALID_GOAL_STAGES = ['moveon', 'reconnect'];

// Simple in-memory rate limiter middleware for admin routes
const rateLimitMap = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 20;

  let requestLog = rateLimitMap.get(ip) || [];
  requestLog = requestLog.filter(ts => now - ts < windowMs);
  if (requestLog.length >= maxRequests) {
    return res.status(429).send('Too many requests, slow down.');
  }
  requestLog.push(now);
  rateLimitMap.set(ip, requestLog);
  next();
}

// Basic input sanitizer
function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

router.use(rateLimiter);

// Health check ping
router.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[PING] /api/ping called at ${timestamp}`);
  res.status(200).json({ status: 'ok', timestamp });
});

// Cron last run status
router.get('/cron/status', (req, res) => {
  const lastRun = global.lastCronTimestamp || 'Unknown';
  res.status(200).json({ cronLastRun: lastRun });
});

// Debug list users
router.get('/debug/list-users', async (req, res) => {
  console.log('[DEBUG] List users route triggered');
  try {
    const result = await db.query('SELECT * FROM users ORDER BY id ASC');
    console.log(`[DEBUG] Retrieved ${result.rows.length} user(s) from Postgres`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Query error in /debug/list-users:', err);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);

  const email = sanitizeInput(req.body.email);
  const name = sanitizeInput(req.body.name);
  const gender = sanitizeInput(req.body.gender);
  const plan = sanitizeInput(req.body.plan);
  // normalize goal_stage: anything not 'reconnect' becomes 'moveon'
  const rawGoal = sanitizeInput(req.body.goal_stage);
  const goal_stage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';

  // Validate required fields
  if (!email || !gender || !plan || !rawGoal) {
    console.error('❌ Signup validation failed: Missing fields.', { email, gender, plan, rawGoal });
    return res.status(400).json({ error: 'Email, gender, plan, and goal_stage are required.' });
  }

  if (!VALID_PLANS.includes(plan)) {
    console.error('❌ Signup validation failed: Invalid plan provided:', plan);
    return res.status(400).json({ error: 'Invalid plan. Allowed plans: 30, 90, 365.' });
  }
  if (!VALID_GOAL_STAGES.includes(goal_stage)) {
    console.error('❌ Signup validation failed: Invalid goal_stage provided:', goal_stage);
    return res.status(400).json({ error: 'Invalid goal_stage. Allowed: moveon, reconnect.' });
  }

  try {
    const { rows: existingUserRows } = await db.query(
      'SELECT plan, plan_limit, usage_count FROM users WHERE email = $1',
      [email]
    );
    const welcomeTemplate = await loadTemplate('welcome.html');

    if (existingUserRows.length > 0) {
      const user = existingUserRows[0];
      const isActive = user.usage_count < user.plan_limit;

      if (isActive) {
        console.warn(`⚠️ Signup blocked — user has an active countdown plan: ${email}`);
        return res.status(400).json({ error: 'You already have an active plan.' });
      }

      console.log(`🔄 Re-signing expired user: ${email}`);
      await db.query(
        `UPDATE users
        SET plan = $1,
            goal_stage = $2,
            plan_limit = $3,
            usage_count = 0,
            first_guide_sent_at = NULL
        WHERE email = $4`,
        [plan, goal_stage, parseInt(plan, 10), email]
      );

      await sendRawEmail(email, 'Welcome to The Phoenix Protocol', welcomeTemplate);
      console.log('✅ Welcome email sent to returning user:', email);

    } else {
      const insertValues = [
        email,
        name || null,
        gender,
        plan,
        parseInt(plan, 10),
        0,
        goal_stage
      ];
      console.log('🧩 Insert values:', insertValues);

      await db.query(
        'INSERT INTO users (email, name, gender, plan, plan_limit, usage_count, goal_stage) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        insertValues
      );

      await sendRawEmail(email, 'Welcome to The Phoenix Protocol', welcomeTemplate);
      console.log('✅ Welcome email sent to new user:', email);
    }

    // Create Stripe checkout session
    const url = await createCheckoutSession(email, plan, gender, goal_stage);
    console.log('✅ Stripe checkout session created, redirecting user.');
    res.status(200).json({ message: 'Sign-up successful', url });

  } catch (err) {
    console.error('❌ Database error during signup:', err);
    res.status(500).json({ error: 'Sign-up failed: Database issue' });
  }
});

// Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  const email = sanitizeInput(req.body.email);
  const plan = sanitizeInput(req.body.plan);
  const gender = sanitizeInput(req.body.gender);
  const rawGoal = sanitizeInput(req.body.goal_stage);
  const goal_stage = rawGoal === 'reconnect' ? 'reconnect' : 'moveon';

  console.log('Creating checkout session:', { email, plan, goal_stage });

  if (!email || !plan || !rawGoal) {
    console.error('❌ Validation failed for /create-checkout-session: Missing fields.', { email, plan, rawGoal });
    return res.status(400).json({ error: 'Email, plan, and goal_stage are required.' });
  }

  if (!VALID_PLANS.includes(plan)) {
    console.error('❌ Validation failed for /create-checkout-session: Invalid plan provided.', plan);
    return res.status(400).json({ error: 'Invalid plan. Allowed plans: 30, 90, 365.' });
  }
  if (!VALID_GOAL_STAGES.includes(goal_stage)) {
    console.error('❌ Validation failed for /create-checkout-session: Invalid goal_stage provided.', goal_stage);
    return res.status(400).json({ error: 'Invalid goal_stage. Allowed: moveon, reconnect.' });
  }

  try {
    const url = await createCheckoutSession(email, plan, gender, goal_stage);
    console.log('✅ Stripe checkout session created for', email);
    res.json({ url });
  } catch (error) {
    console.error('❌ Checkout session creation error:', error.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

module.exports = router;

