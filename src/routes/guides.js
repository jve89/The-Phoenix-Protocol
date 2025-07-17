const express = require('express');
const router = express.Router();
const db = require('../db/db');

const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error('❌ ADMIN_SECRET environment variable is not set!');
}

// ✅ Middleware to protect admin-only access
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Simple date format validation helper
function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// ✅ Secure guide fetch endpoint
router.get('/api/guides/:date', requireAdmin, async (req, res) => {
  const { date } = req.params;

  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
  }

  try {
    const result = await db.query(
      'SELECT guide FROM daily_guides WHERE date = $1',
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No guide found for this date' });
    }

    res.status(200).json(result.rows[0].guide);
  } catch (err) {
    console.error('[ADMIN] Failed to fetch guide:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
