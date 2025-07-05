const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendEmail } = require('../utils/email');

const router = express.Router();

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

  if (
    !email || !gender || !plan ||
    typeof email !== 'string' || typeof gender !== 'string' || typeof plan !== 'string' ||
    email.trim() === '' || gender.trim() === '' || plan.trim() === ''
  ) {
    console.error('❌ Signup validation failed:', { email, gender, plan });
    return res.status(400).json({ error: 'Email, gender, and plan are required and cannot be empty.' });
  }

  try {
    const checkResult = await db.query(`SELECT email FROM users WHERE email = $1`, [email.trim()]);

    if (checkResult.rows.length > 0) {
      console.warn('⚠️ Email already registered:', email.trim());
      return res.status(400).json({ error: 'Email already registered' });
    }

    const days = parseInt(plan.trim());
    let endDate = null;
    if (!isNaN(days)) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      endDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    await db.query(
      `INSERT INTO users (email, name, gender, plan, end_date) VALUES ($1, $2, $3, $4, $5)`,
      [email.trim(), name ? name.trim() : null, gender.trim(), plan.trim(), endDate]
    );

    sendEmail(
      email.trim(),
      'Welcome to The Phoenix Protocol',
      '<p>Thank you for signing up! Your journey begins now.</p>'
    )
      .then(() => console.log('✅ Welcome email sent to', email.trim()))
      .catch(err => console.error('❌ Email sending error:', err));

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

  if (
    !email || !plan ||
    typeof email !== 'string' || typeof plan !== 'string' ||
    email.trim() === '' || plan.trim() === ''
  ) {
    console.error('❌ Validation failed for /create-checkout-session:', { email, plan });
    return res.status(400).json({ error: 'Email and plan are required and cannot be empty.' });
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
