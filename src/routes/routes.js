const express = require('express');
const db = require('../db/db');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, name, focus, gender } = req.body;
  if (!email || !focus || !gender) {
    return res.status(400).json({ error: 'Email, focus, and gender required' });
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

module.exports = router;