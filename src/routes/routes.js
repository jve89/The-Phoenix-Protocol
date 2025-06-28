const express = require('express');
const db = require('../db/db');
const { createCheckoutSession } = require('../utils/payment');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, name, focus, gender } = req.body;
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
    db.run(`INSERT INTO users (email, name, focus, gender) VALUES (?, ?, ?, ?)`,
      [email, name || null, focus, gender], (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Sign-up failed: Database issue' });
        }
        res.status(200).json({ message: 'Sign-up successful' });
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