const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');
const { sendEmail } = require('../utils/email');

const router = express.Router();

router.post('/signup', (req, res) => {
  console.log('Signup request:', req.body);
  const { email, name, focus, gender, plan } = req.body;
  if (!email || !focus || !gender) {
    return res.status(400).json({ error: 'Email, focus, and gender required' });
  }
  db.get(`SELECT email FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Sign-up failed: Database issue' });
    }
    if (row) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    let endDate = null;
    if (plan) {
      const days = parseInt(plan);
      if (!isNaN(days)) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        endDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    db.run(`INSERT INTO users (email, name, focus, gender, plan, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [email, name || null, focus, gender, plan || 'free', endDate], (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Sign-up failed: Database issue' });
        }
        sendEmail(email, 'Welcome to The Phoenix Protocol', '<p>Thank you for signing up! Your journey begins now.</p>')
          .then(() => console.log('Email sent to', email))
          .catch(err => console.error('Email error:', err));
        if (plan) {
          createCheckoutSession(email, plan)
            .then(url => res.status(200).json({ message: 'Sign-up successful', url }))
            .catch(err => res.status(500).json({ error: 'Payment setup failed' }));
        } else {
          res.status(200).json({ message: 'Sign-up successful' });
        }
      });
  });
});

router.post('/create-checkout-session', async (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.status(400).json({ error: 'Email and plan required' });
  try {
    const url = await createCheckoutSession(email, plan);
    res.json({ url });
  } catch (error) {
    console.error('Checkout error:', error.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

module.exports = router;