const db = require('../db/db');

// 🔹 Insert into guide_generation_logs
async function logEvent(source, message, level = 'info') {
  try {
    await db.query(
      `INSERT INTO guide_generation_logs (source, level, message) VALUES ($1, $2, $3)`,
      [source, level, message]
    );
  } catch (err) {
    console.error('[db_logger] Failed to insert log:', err.message);
  }
}

// 🔹 Insert into fallback_logs
async function logFallback(variant, fallbackTitle = null) {
  try {
    await db.query(
      `INSERT INTO fallback_logs (variant, fallback_title) VALUES ($1, $2)`,
      [variant, fallbackTitle]
    );
  } catch (err) {
    console.error('[db_logger] Failed to insert fallback log:', err.message);
  }
}

module.exports = {
  logEvent,
  logFallback,
};
