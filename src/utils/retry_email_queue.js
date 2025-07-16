const db = require('../db/db');
const { sendEmail } = require('./email');

// 📦 Centralised event logger (shared across system)
async function logEvent(source, level, message) {
  try {
    await db.query(
      `INSERT INTO guide_generation_logs (source, level, message) VALUES ($1, $2, $3)`,
      [source, level, message]
    );
  } catch (err) {
    console.error(`[LOG] Failed to write to DB: ${err.message}`);
  }
}

// ⏺️ Log a failed email for retry
async function logFailure(email, subject, html) {
  try {
    const { rowCount } = await db.query(
      `SELECT 1 FROM email_retry_queue WHERE email = $1 AND subject = $2`,
      [email, subject]
    );

    if (rowCount > 0) {
      const msg = `[RETRY] Duplicate retry already exists for ${email}`;
      console.warn(msg);
      await logEvent('retry', 'warn', msg);
      return;
    }

    await db.query(
      `INSERT INTO email_retry_queue (email, subject, html) VALUES ($1, $2, $3)`,
      [email, subject, html]
    );

    const msg = `[RETRY] Logged email failure for ${email}`;
    console.log(msg);
    await logEvent('retry', 'info', msg);
  } catch (err) {
    const msg = `[RETRY] Failed to log retry: ${err.message}`;
    console.error(msg);
    await logEvent('retry', 'error', msg);
  }
}

// 🔁 Retry all pending emails
async function retryAllPendingEmails() {
  try {
    const { rows } = await db.query(
      `SELECT * FROM email_retry_queue ORDER BY created_at ASC`
    );

    if (!rows.length) {
      const msg = '[RETRY] No pending retries.';
      console.log(msg);
      await logEvent('retry', 'info', msg);
      return;
    }

    for (const row of rows) {
      try {
        await sendEmail(row.email, row.subject, row.html);
        console.log(`[RETRY] ✅ Re-sent to ${row.email}`);

        await db.query(`DELETE FROM email_retry_queue WHERE id = $1`, [row.id]);

        await logEvent('retry', 'info', `✅ Retry success: ${row.email}`);
      } catch (err) {
        console.error(`[RETRY] ❌ Failed again for ${row.email}: ${err.message}`);

        await db.query(
          `UPDATE email_retry_queue
           SET attempts = attempts + 1, last_attempt = NOW()
           WHERE id = $1`,
          [row.id]
        );

        await logEvent('retry', 'warn', `❌ Retry failed again for ${row.email}: ${err.message}`);
      }
    }

    console.log('[RETRY] Retry cycle complete.');
    await logEvent('retry', 'info', `Retry cycle completed with ${rows.length} attempts`);

  } catch (err) {
    const msg = `[RETRY] Fatal error during retry process: ${err.message}`;
    console.error(msg);
    await logEvent('retry', 'error', msg);
  }
}

module.exports = { logFailure, retryAllPendingEmails };
