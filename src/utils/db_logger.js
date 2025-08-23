const db = require('../db/db');

// Max length for log messages (avoid excessive payloads)
const MAX_MESSAGE_LENGTH = 2000;

const LEVELS = new Set(['info', 'warn', 'error']);
const DELIVERY_STATUSES = new Set(['success', 'failed']);
const DELIVERY_TYPES = new Set(['trial', 'paid']);

/**
 * Insert an event log into guide_generation_logs.
 * Defensive: validate types, clamp sizes, never throw.
 */
function logEvent(source, level = 'info', message = '') {
  try {
    const src = typeof source === 'string' ? source.slice(0, 50) : 'unknown';
    const lvl = LEVELS.has(level) ? level : 'info';
    const msgRaw = typeof message === 'string' ? message : String(message ?? '');
    const msg = msgRaw.length > MAX_MESSAGE_LENGTH
      ? msgRaw.slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
      : msgRaw;

    return db.query(
      `INSERT INTO guide_generation_logs (source, level, message, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [src, lvl, msg]
    ).catch(err => {
      // swallow to avoid cascading failures
      console.error('[db_logger] Failed to insert log:', err.stack || err.message || err);
    });
  } catch (err) {
    console.error('[db_logger] logEvent guard error:', err.message);
    return Promise.resolve();
  }
}

/**
 * Log a delivery status to delivery_log.
 * Defensive: sanitize inputs, normalize email, clamp lengths.
 */
async function logDelivery(userId, email, variant, status, errorMessage = null, deliveryType) {
  try {
    const uid = Number.isInteger(userId) ? userId : null;
    const mail = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 320) : null;
    const varSafe = typeof variant === 'string' ? variant.slice(0, 64) : 'unknown';
    const stat = DELIVERY_STATUSES.has(status) ? status : 'failed';
    const dtype = DELIVERY_TYPES.has(deliveryType) ? deliveryType : 'paid'; // default to paid to keep schema simple
    const errMsg = errorMessage == null ? null
      : String(errorMessage).slice(0, MAX_MESSAGE_LENGTH);

    if (!mail) {
      console.warn('[db_logger] logDelivery called without valid email');
      return;
    }

    await db.query(
      `INSERT INTO delivery_log (user_id, email, variant, status, error_message, delivery_type, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uid, mail, varSafe, stat, errMsg, dtype]
    );
  } catch (err) {
    console.error('[db_logger] Failed to log delivery:', err.message);
  }
}

module.exports = {
  logEvent,
  logDelivery
};
