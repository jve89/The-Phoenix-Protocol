const { sendRawEmail } = require('./email');
const { logEvent } = require('./db_logger');

// Helper for YYYY-MM-DD in UTC
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Send the daily guide backup as an email to ADMIN_EMAIL, with attachments.
 * @param {Object} guideJson - The guide data to backup.
 * @param {string} htmlBody - HTML body for email.
 * @param {Array<string>} attachments - Array of absolute file paths to attach.
 */
async function sendDailyGuideBackup(guideJson, htmlBody = '', attachments = []) {
  const admin = process.env.ADMIN_EMAIL;
  const dateStr = todayUtc();

  if (!admin) {
    logEvent('backup', 'warn', 'ADMIN_EMAIL not set, skipping email backup');
    return;
  }
  const subject = `📦 Daily Guide Backup – ${dateStr}`;
  const body = htmlBody || `<p>Attached is the guide backup for ${dateStr}</p>`;
  try {
    await sendRawEmail(admin, subject, body);
    logEvent('backup', 'info', `Guide backup emailed to ${admin}`);
  } catch (err) {
    logEvent('backup', 'error', `Failed to email backup: ${err.message}`);
  }
}

module.exports = { sendDailyGuideBackup };
