// src/utils/db_logger.js

const db = require('../db/db');

/**
 * Insert an event log into guide_generation_logs table.
 * @param {string} source - The source or category of the log (e.g. 'cron', 'content').
 * @param {string} level - Log level: 'info', 'warn', 'error', etc. Default is 'info'.
 * @param {string} message - Log message content.
 */
async function logEvent(source, level = 'info', message) {
  try {
    await db.query(
      `INSERT INTO guide_generation_logs (source, level, message) VALUES ($1, $2, $3)`,
      [source, level, message]
    );
  } catch (err) {
    console.error('[db_logger] Failed to insert log:', err.message);
  }
}

module.exports = {
  logEvent
};
