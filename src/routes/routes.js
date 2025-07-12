// src/routes/routes.js

const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendEmail } = require('../utils/email');
const { loadTemplate } = require('../utils/loadTemplate');
const { sendFirstGuideImmediately } = require('../utils/send_first_guide_immediately');

const router = express.Router();

// ✅ Lightweight backend health check (for UptimeRobot)
router.get('/api/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[PING] /api/ping called at ${timestamp}`);
  res.status(200).json({ status: 'ok', timestamp });
});

/**
 * 🚩 TEMPORARY DEBUG ROUTE: List all users in JSON for inspection
 * REMOVE AFTER DEBUGGING
 */
router.get('/api/debug/list-users', async (req, res) => {
  console.log('[DEBUG] List users route triggered');
  try {
    const result = await db.query(`SELECT * FROM users ORDER BY id ASC`);
    console.log(`[DEBUG] Retrieved ${result.rows.length} user(s) from Postgres`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('[DEBUG] Query error in /api/debug/list-users:', err);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});

// 🚀 Handle user signup
router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const { email, name, gender, plan } = req.body;

  console.log('Validating signup fields:', { email, gender, plan });

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
    const checkResult = await db.query(`SELECT plan FROM users WHERE email = $1`, [email.trim()]);

    if (checkResult.rows.length > 0) {
      const existingPlan = checkResult.rows[0].plan;
      if (existingPlan === 'free') {
        console.log(`✅ Existing user on 'free' plan re-subscribing: ${email.trim()}`);

        const days = parseInt(plan.trim());
        let endDate = null;
        if (!isNaN(days)) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          endDate = d.toISOString().split('T')[0];
        }

        await db.query(
          `UPDATE users SET plan = $1, end_date = $2 WHERE email = $3`,
          [plan.trim(), endDate, email.trim()]
        );

        const welcomeBackTemplate = loadTemplate('welcome_back.html');
        await sendEmail(
          email.trim(),
          'Welcome Back to The Phoenix Protocol',
          welcomeBackTemplate
        );
        console.log('✅ Welcome back email sent to', email.trim());

        setTimeout(async () => {
          try {
            await sendFirstGuideImmediately(email.trim(), gender.trim());
            console.log(`✅ First premium guide re-sent to ${email.trim()} after 10-minute delay`);
          } catch (err) {
            console.error(`❌ Error sending first premium guide to ${email.trim()}:`, err);
          }
        }, 600000); // 10 minutes

      } else {
        console.warn('⚠️ Email already registered and active:', email.trim());
        return res.status(400).json({ error: 'You already have an active plan.' });
      }
    } else {
      const days = parseInt(plan.trim());
      let endDate = null;
      if (!isNaN(days)) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        endDate = d.toISOString().split('T')[0];
      }

      await db.query(
        `INSERT INTO users (email, name, gender, plan, end_date) VALUES ($1, $2, $3, $4, $5)`,
        [email.trim(), name ? name.trim() : null, gender.trim(), plan.trim(), endDate]
      );

      const welcomeTemplate = loadTemplate('welcome.html');
      await sendEmail(
        email.trim(),
        'Welcome to The Phoenix Protocol',
        welcomeTemplate
      );
      console.log('✅ Welcome email sent to', email.trim());

      setTimeout(async () => {
        try {
          await sendFirstGuideImmediately(email.trim(), gender.trim());
          console.log(`✅ First premium guide sent to ${email.trim()} after 10-minute delay`);
        } catch (err) {
          console.error(`❌ Error sending first premium guide to ${email.trim()}:`, err);
        }
      }, 600000); // 10 minutes
    }

    const url = await createCheckoutSession(email.trim(), plan.trim());
    console.log('✅ Stripe checkout session created, redirecting user.');
    res.status(200).json({ message: 'Sign-up successful', url });

  } catch (err) {
    console.error('❌ Database error during signup:', err);
    res.status(500).json({ error: 'Sign-up failed: Database issue' });
  }
});

// 🚀 Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  const { email, plan } = req.body;
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
    const url = await createCheckoutSession(email.trim(), plan.trim());
    console.log('✅ Stripe checkout session created for', email.trim());
    res.json({ url });
  } catch (error) {
    console.error('❌ Checkout session creation error:', error.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

module.exports = router;
