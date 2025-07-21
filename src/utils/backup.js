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
 * Send or store a daily guide backup in JSON form.
 * Supports email backup currently.
 * @param {Object} guideJson - The guide data to backup.
 * @param {string} htmlBody - Optional HTML body for email.
 */
async function sendDailyGuideBackup(guideJson, htmlBody = '') {
  const backupMethod = process.env.BACKUP_METHOD || 'email';
  const dateStr = todayUtc();
  const fileName = `guide-backup-${dateStr}-${process.pid}-${Date.now()}.json`;
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, fileName);

  try {
    // Write JSON backup file atomically
    const data = JSON.stringify(guideJson, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
    logEvent('backup', 'info', `Backup file written: ${filePath}`);

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
          await sendRawEmail(admin, subject, body, filePath);
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
    // Clean up temp file if it was created
    try {
      await fs.unlink(filePath);
      logEvent('backup', 'info', `Temporary backup file removed: ${filePath}`);
    } catch (cleanupErr) {
      logEvent('backup', 'warn', `Failed to delete temp file: ${cleanupErr.message}`);
    }
  }
}

module.exports = { sendDailyGuideBackup };
