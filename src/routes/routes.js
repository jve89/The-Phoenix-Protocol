const express = require('express');
const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, name, focus } = req.body;
  if (!email || !focus) {
    return res.status(400).json({ error: 'Email and focus required' });
  }
  // Placeholder: Save to database (added later)
  res.status(200).json({ message: 'Sign-up successful' });
});

module.exports = router;