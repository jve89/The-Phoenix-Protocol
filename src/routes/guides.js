// src/routes/guides.js

const express = require('express');
const db = require('../db/db');
const router = express.Router();

// GET /api/guides/:date → return full guide JSON for a given date (admin-only)
router.get('/api/guides/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT guide FROM daily_guides WHERE date = $1`,
      [date]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'No guide found for this date' });
    }

    res.json({ date, guide: rows[0].guide });
  } catch (err) {
    console.error('[GUIDES] DB error:', err.message);
    res.status(500).json({ error: 'Failed to load guide', details: err.message });
  }
});

module.exports = router;
