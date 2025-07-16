// src/routes/routes.js

const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendEmail } = require('../utils/email');
const { loadTemplate } = require('../utils/loadTemplate');
const { retryAllPendingEmails } = require('../utils/retry_email_queue');
const guideRoutes = require('./guides');

const router = express.Router();

router.use(guideRoutes);

// ✅ Manual retry route for email failures (debug only)
router.get('/debug/retry-emails', async (req, res) => {
  try {
    await retryAllPendingEmails();
    res.status(200).json({ status: 'Retry attempt complete' });
  } catch (err) {
    console.error('[DEBUG] Email retry route error:', err.message);
    res.status(500).json({ error: 'Retry failed', details: err.message });
  }
});

// ✅ Lightweight backend health check (for UptimeRobot)
router.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[PING] /api/ping called at ${timestamp}`);
  res.status(200).json({ status: 'ok', timestamp });
});

// ✅ Cron healthcheck endpoint (shows last run time)
router.get('/cron/status', (req, res) => {
  const lastRun = global.lastCronTimestamp || 'Unknown';
  res.status(200).json({ cronLastRun: lastRun });
});

/**
 * 🚩 TEMPORARY DEBUG ROUTE: List all users in JSON for inspection
 * REMOVE AFTER DEBUGGING
 */
router.get('/debug/list-users', async (req, res) => {
  console.log('[DEBUG] List users route triggered');
  try {
    const result = await db.query(`SELECT * FROM users ORDER BY id ASC`);
    console.log(`[DEBUG] Retrieved ${result.rows.length} user(s) from Postgres`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Query error in /debug/list-users:', err);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});

// 🚀 Handle user signup
router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const { email, name, gender, plan, goal_stage } = req.body;

  const validPlans = ["30", "90", "365"];
  if (
    !email || !gender || !plan ||
    typeof email !== 'string' || typeof gender !== 'string' || typeof plan !== 'string' ||
    email.trim() === '' || gender.trim() === '' || plan.trim() === ''
  ) {
    console.error('❌ Signup validation failed: Missing fields.', { email, gender, plan });
    return res.status(400).json({ error: 'Email, gender, and plan are required and cannot be empty.' });
  }

  if (!validPlans.includes(plan.trim())) {
    console.error('❌ Signup validation failed: Invalid plan provided:', plan.trim());
    return res.status(400).json({ error: 'Invalid plan. Allowed plans: 30, 90, 365 days.' });
  }

  try {
    const { rows: existingUserRows } = await db.query(
      `SELECT plan, end_date FROM users WHERE email = $1`,
      [email.trim()]
    );

    if (existingUserRows.length > 0) {
      const user = existingUserRows[0];
      const now = new Date();
      const endDate = user.end_date ? new Date(user.end_date) : null;
      const isActive = endDate && endDate >= now;

      if (isActive) {
        console.warn(`⚠️ Signup blocked — existing active user: ${email.trim()}`);
        return res.status(400).json({ error: 'You already have an active plan.' });
      }

      console.log(`🔄 Re-signing expired user: ${email.trim()}`);
      await db.query(
        `UPDATE users SET plan = $1, end_date = NULL, goal_stage = $2 WHERE email = $3`,
        [plan.trim(), goal_stage || null, email.trim()]
      );

      const welcomeBackTemplate = loadTemplate('welcome_back.html');
      await sendEmail(
        email.trim(),
        'Welcome Back to The Phoenix Protocol',
        welcomeBackTemplate
      );
    } else {
      let endDate = null; // Will be set later by webhook

      const insertValues = [
        email.trim(),
        name ? name.trim() : null,
        gender.trim(),
        plan.trim(),
        endDate,
        goal_stage || null
      ];
      console.log('🧩 Insert values:', insertValues);

      await db.query(
        `INSERT INTO users (email, name, gender, plan, end_date, goal_stage) VALUES ($1, $2, $3, $4, $5, $6)`,
        insertValues
      );

      const welcomeTemplate = loadTemplate('welcome.html');
      await sendEmail(
        email.trim(),
        'Welcome to The Phoenix Protocol',
        welcomeTemplate
      );
      console.log('✅ Welcome email sent to', email.trim());
    }

    const url = await createCheckoutSession(
      email.trim(),
      plan.trim(),
      gender?.trim() || null,
      goal_stage?.trim() || null
    );
    console.log('✅ Stripe checkout session created, redirecting user.');
    res.status(200).json({ message: 'Sign-up successful', url });

  } catch (err) {
    console.error('❌ Database error during signup:', err);
    res.status(500).json({ error: 'Sign-up failed: Database issue' });
  }
});

// 🚀 Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  const { email, plan, gender, goal_stage } = req.body;
  console.log('Creating checkout session:', { email, plan });

  const validPlans = ["30", "90", "365"];
  if (
    !email || !plan ||
    typeof email !== 'string' || typeof plan !== 'string' ||
    email.trim() === '' || plan.trim() === ''
  ) {
    console.error('❌ Validation failed for /create-checkout-session: Missing fields.', { email, plan });
    return res.status(400).json({ error: 'Email and plan are required and cannot be empty.' });
  }

  if (!validPlans.includes(plan.trim())) {
    console.error('❌ Validation failed for /create-checkout-session: Invalid plan provided.', plan.trim());
    return res.status(400).json({ error: 'Invalid plan. Allowed plans: 30, 90, 365 days.' });
  }

  try {
    const url = await createCheckoutSession(
      email.trim(), 
      plan.trim(),
      gender?.trim() || null,
      goal_stage?.trim() || null,
    );
    console.log('✅ Stripe checkout session created for', email.trim());
    res.json({ url });
  } catch (error) {
    console.error('❌ Checkout session creation error:', error.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// ✅ GET /api/today — secured by x-admin-secret header
router.get('/today', async (req, res) => {
  const clientSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret || clientSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const guide = await loadTodayGuide();

    if (!guide) {
      return res.status(404).json({ error: 'No guide available for today or yesterday.' });
    }

    res.status(200).json(guide);
  } catch (err) {
    console.error('[API] /api/today error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Human-readable admin view of today's guide
const { loadTodayGuide } = require('../utils/content');

router.get('/admin/today', async (req, res) => {
  const clientSecret = req.query.secret;
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret || clientSecret !== expectedSecret) {
    return res.status(401).send('<h2>❌ Unauthorized</h2>');
  }

  try {
    const guide = await loadTodayGuide();

    if (!guide) {
      return res.status(404).send('<h2>⚠️ No guide available for today or yesterday.</h2>');
    }

    let html = `<h1>The Phoenix Protocol — Guide for ${guide.date}</h1><hr>`;

    for (const [variant, data] of Object.entries(guide)) {
      if (variant === 'date') continue;

      const paragraphs = data.content
        .split(/\n{2,}/)
        .map(p => `<p>${p.trim()}</p>`)
        .join('\n');

      html += `
        <h2>📘 ${variant}</h2>
        <h3>${data.title}</h3>
        ${paragraphs}
        <hr>
      `;
    }

    res.send(`
      <html>
        <head>
          <title>Admin — Daily Guide</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.6; }
            h1 { border-bottom: 2px solid #ccc; padding-bottom: 0.5rem; }
            h2 { margin-top: 2rem; color: #333; }
            p { margin: 0.75rem 0; }
            hr { margin: 2rem 0; border: none; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
  } catch (err) {
    console.error('[ADMIN] /admin/today error:', err.message);
    res.status(500).send('<h2>❌ Internal error loading guide</h2>');
  }
});

// ✅ Load guide JSON for a specific date — secure API
router.get('/archive/:date', async (req, res) => {
  const clientSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET;
  const { date } = req.params;

  if (!expectedSecret || clientSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const guide = await loadGuideByDate(date);
    if (!guide) {
      return res.status(404).json({ error: `No guide available for ${date}.` });
    }
    res.status(200).json(guide);
  } catch (err) {
    console.error(`[API] /api/archive/${date} error:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Human-readable view of past guide — browser friendly
router.get('/admin/archive', async (req, res) => {
  const { date, secret } = req.query;
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).send('<h2>❌ Unauthorized</h2>');
  }

  try {
    const guide = await loadGuideByDate(date);
    if (!guide) {
      return res.status(404).send(`<h2>⚠️ No guide available for ${date}.</h2>`);
    }

    let html = `<h1>The Phoenix Protocol — Guide for ${guide.date || date}</h1><hr>`;

    for (const [variant, data] of Object.entries(guide)) {
      if (variant === 'date') continue;

      const paragraphs = data.content
        .split(/\n{2,}/)
        .map(p => `<p>${p.trim()}</p>`)
        .join('\n');

      html += `
        <h2>📘 ${variant}</h2>
        <h3>${data.title}</h3>
        ${paragraphs}
        <hr>
      `;
    }

    res.send(`
      <html>
        <head>
          <title>Admin — Guide Archive</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.6; }
            h1 { border-bottom: 2px solid #ccc; padding-bottom: 0.5rem; }
            h2 { margin-top: 2rem; color: #333; }
            p { margin: 0.75rem 0; }
            hr { margin: 2rem 0; border: none; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
  } catch (err) {
    console.error('[ADMIN] /admin/archive error:', err.message);
    res.status(500).send('<h2>❌ Internal error loading guide</h2>');
  }
});

module.exports = router;
