// src/utils/backup.js
const fs = require('fs').promises;
const { sendRawEmail } = require('./email');
const { logEvent } = require('./db_logger');

// Helper for YYYY-MM-DD in UTC
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Send the daily guide backup to ADMIN_EMAIL.
 * Defensive: sanitize attachments list; skip missing files.
 * @param {Object} guideJson - The guide data to backup. (unused, kept for API stability)
 * @param {string} htmlBody - HTML body for email.
 * @param {Array<string>} attachments - Absolute file paths to attach.
 */
async function sendDailyGuideBackup(guideJson, htmlBody = '', attachments = []) {
  const admin = process.env.ADMIN_EMAIL;
  const dateStr = todayUtc();

  if (!admin) {
    logEvent('backup', 'warn', 'ADMIN_EMAIL not set, skipping email backup');
    return;
  }

  // Sanitize attachments: strings only, unique, existing
  let safeAttachments = [];
  try {
    const list = Array.isArray(attachments) ? attachments : [attachments];
    const uniq = Array.from(new Set(
      list.filter(p => typeof p === 'string' && p.trim())
    )).slice(0, 10); // hard cap to avoid huge emails
    for (const p of uniq) {
      try {
        await fs.access(p);
        safeAttachments.push(p);
      } catch { /* skip missing */ }
    }
  } catch (e) {
    logEvent('backup', 'warn', `Attachment sanitation failed: ${e.message}`);
  }

  const subject = `📦 Daily Guide Backup – ${dateStr}`;
  const body = htmlBody || `<p>Attached is the guide backup for ${dateStr}</p>`;

  try {
    await sendRawEmail(
      admin,
      subject,
      body,
      safeAttachments.length ? safeAttachments : null,
      { suppressUnsubscribeFooter: true, suppressFeedbackFooter: true } // system mail: no footers
    );
    logEvent('backup', 'info', `Guide backup emailed to ${admin}`);
  } catch (err) {
    logEvent('backup', 'error', `Failed to email backup: ${err.message}`);
  }
}

module.exports = { sendDailyGuideBackup };
