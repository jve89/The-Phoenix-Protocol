const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// 🚩 TEMPORARY DEBUG ROUTE: Download live users.db for inspection
// REMOVE AFTER DEBUGGING
router.get('/api/debug/download-users-db', (req, res) => {
  const dbPath = path.join(__dirname, '../../users.db');
  if (fs.existsSync(dbPath)) {
    console.log('[DEBUG] Downloading users.db for local inspection.');
    res.download(dbPath, 'users.db');
  } else {
    console.error('[DEBUG] users.db not found on server.');
    res.status(404).send('Database file not found');
  }
});

// 🚀 Handle user signup
router.post('/signup', (req, res) => {
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

  db.get(`SELECT email FROM users WHERE email = ?`, [email.trim()], (err, row) => {
    if (err) {
      console.error('❌ Database read error during signup:', err);
      return res.status(500).json({ error: 'Sign-up failed: Database issue' });
    }
    if (row) {
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

    db.run(
      `INSERT INTO users (email, name, gender, plan, end_date) VALUES (?, ?, ?, ?, ?)`,
      [email.trim(), name ? name.trim() : null, gender.trim(), plan.trim(), endDate],
      (err) => {
        if (err) {
          console.error('❌ Database write error during signup:', err);
          return res.status(500).json({ error: 'Sign-up failed: Database issue' });
        }

        sendEmail(
          email.trim(),
          'Welcome to The Phoenix Protocol',
          '<p>Thank you for signing up! Your journey begins now.</p>'
        )
          .then(() => console.log('✅ Welcome email sent to', email.trim()))
          .catch(err => console.error('❌ Email sending error:', err));

        createCheckoutSession(email.trim(), plan.trim())
          .then(url => {
            console.log('✅ Stripe checkout session created, redirecting user.');
            res.status(200).json({ message: 'Sign-up successful', url });
          })
          .catch(err => {
            console.error('❌ Stripe checkout session creation failed:', err);
            res.status(500).json({ error: 'Payment setup failed' });
          });
      }
    );
  });
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
