// src/routes/logs.js

const express = require('express');
const db = require('../db/db');

const router = express.Router();

// GET /api/logs/recent?limit=50
router.get('/logs/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500); // Cap at 500

  try {
    const { rows } = await db.query(
      `SELECT id, timestamp, source, level, message
       FROM guide_generation_logs
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({ logs: rows });
  } catch (err) {
    console.error('[LOG API] Failed to fetch logs:', err.message);
    res.status(500).json({ error: 'Could not retrieve logs' });
  }
});

module.exports = router;
