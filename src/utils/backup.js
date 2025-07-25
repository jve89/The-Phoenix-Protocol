const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { sendRawEmail } = require('./email');
const { logEvent } = require('./db_logger');

// Helper for YYYY-MM-DD in UTC
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Send or store a daily guide backup in JSON and/or other formats.
 * Supports email backup currently.
 * @param {Object} guideJson - The guide data to backup.
 * @param {string} htmlBody - Optional HTML body for email.
 * @param {Array<string>} attachments - Array of absolute file paths to attach.
 */
async function sendDailyGuideBackup(guideJson, htmlBody = '', attachments = []) {
  const backupMethod = process.env.BACKUP_METHOD || 'email';
  const dateStr = todayUtc();

  try {
    switch (backupMethod.toLowerCase()) {
      case 'email': {
        const admin = process.env.ADMIN_EMAIL;
        if (!admin) {
          logEvent('backup', 'warn', 'ADMIN_EMAIL not set, skipping email backup');
          return;
        }
        const subject = `📦 Daily Guide Backup – ${dateStr}`;
        const body = htmlBody || `<p>Attached is the guide backup for ${dateStr}</p>`;
        try {
          await sendRawEmail(admin, subject, body, attachments); // <--- PASS ARRAY
          logEvent('backup', 'info', `Guide backup emailed to ${admin}`);
        } catch (err) {
          logEvent('backup', 'error', `Failed to email backup: ${err.message}`);
        }
        break;
      }
      default:
        logEvent('backup', 'warn', `Unsupported BACKUP_METHOD: ${backupMethod}`);
    }
  } catch (err) {
    logEvent('backup', 'error', `Backup process failed: ${err.message}`);
  } finally {
    // Optional: Clean up temp files (if you want)
    for (const file of attachments) {
      try {
        await fs.unlink(file);
        logEvent('backup', 'info', `Temporary backup file removed: ${file}`);
      } catch (cleanupErr) {
        logEvent('backup', 'warn', `Failed to delete temp file: ${cleanupErr.message}`);
      }
    }
  }
}

module.exports = { sendDailyGuideBackup };
