const express = require('express');
const db = require('../db/db');

const router = express.Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function requireAdmin(req, res, next) {
  const clientSecret = req.headers['x-admin-secret'];
  if (!ADMIN_SECRET || clientSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/logs/recent?limit=50
router.get('/logs/recent', requireAdmin, async (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit <= 0) {
    limit = 50;
  }
  limit = Math.min(limit, 500); // Cap at 500

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
