// src/utils/backup.js

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { sendRawEmail } = require('./email');
const { logEvent } = require('./db_logger');

async function sendDailyGuideBackup(guideJson, htmlBody = '') {
  const backupMethod = process.env.BACKUP_METHOD || 'email';
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    // Write guide to temp file
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `guide-backup-${dateStr}.json`);
    await fs.writeFile(filePath, JSON.stringify(guideJson, null, 2), 'utf8');

    if (backupMethod === 'email') {
      const html = htmlBody || `<p>Attached is the guide backup for ${dateStr}</p>`;
      await sendRawEmail(process.env.ADMIN_EMAIL, `📦 Daily Guide + Backup – ${dateStr}`, html, filePath);
      await logEvent('backup', 'info', `✅ Guide backup emailed to admin`);
    } else {
      await logEvent('backup', 'warn', `⚠️ Unsupported BACKUP_METHOD: ${backupMethod}`);
    }

    await fs.unlink(filePath); // Clean up temp file
  } catch (err) {
    console.error('[BACKUP] ❌ Backup failed:', err.message);
    await logEvent('backup', 'error', `❌ Backup failed: ${err.message}`);
  }
}

module.exports = { sendDailyGuideBackup };
