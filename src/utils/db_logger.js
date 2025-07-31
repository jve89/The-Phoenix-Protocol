const db = require('../db/db');

// Max length for log messages (avoid excessive payloads)
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Insert an event log into guide_generation_logs table.
 * Non-blocking: returns immediately and logs errors internally.
 * @param {string} source - Category of the log (e.g. 'cron', 'email', 'server').
 * @param {string} level - Log level: 'info', 'warn', 'error'. Default: 'info'.
 * @param {string} message - Log message content.
 * @returns {Promise<void>}
 */
function logEvent(source, level = 'info', message) {
  if (typeof source !== 'string' || typeof level !== 'string' || typeof message !== 'string') {
    console.warn('[db_logger] Invalid log params:', { source, level, message });
    return Promise.resolve();
  }
  const msg = message.length > MAX_MESSAGE_LENGTH
    ? message.slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
    : message;
  return db.query(
    `INSERT INTO guide_generation_logs (source, level, message) VALUES ($1, $2, $3)`,
    [source, level, msg]
  ).catch(err => {
    console.error('[db_logger] Failed to insert log:', err.stack || err);
  });
}

/**
 * Log a delivery status to delivery_log table.
 * @param {number} userId 
 * @param {string} email 
 * @param {string} variant 
 * @param {string} status - 'success' or 'failed'
 * @param {string|null} errorMessage 
 * @param {string} deliveryType - 'trial' or 'paid'
 */
async function logDelivery(userId, email, variant, status, errorMessage = null, deliveryType) {
  try {
    await db.query(
      `INSERT INTO delivery_log (user_id, email, variant, status, error_message, delivery_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, variant, status, errorMessage, deliveryType]
    );
  } catch (err) {
    console.error('[db_logger] Failed to log delivery:', err.message);
  }
}

module.exports = {
  logEvent,
  logDelivery
};
