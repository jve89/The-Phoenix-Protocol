const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./email');

async function sendDailyGuideBackup(adminEmail) {
  try {
    const cachePath = path.join(__dirname, '../../content/daily_cache.json');

    if (!fs.existsSync(cachePath)) {
      console.warn('[BACKUP] ❌ No daily_cache.json found.');
      return;
    }

    const raw = fs.readFileSync(cachePath, 'utf-8');
    const guide = JSON.parse(raw);
    const date = guide?.date || new Date().toISOString().split('T')[0];

    let html = `<h2>📦 Daily Guide Backup — ${date}</h2><hr>`;
    for (const [variant, data] of Object.entries(guide)) {
      if (variant === 'date') continue;
      html += `<h3>🔸 ${variant}</h3><b>${data.title}</b><br><br>`;
      const paragraphs = data.content
        .split(/\n{2,}/)
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
      html += paragraphs + '<hr>';
    }

    await sendEmail(
      adminEmail,
      `📦 Daily Guide Backup — ${date}`,
      html
    );

    console.log(`[BACKUP] ✅ Sent daily backup to ${adminEmail}`);
  } catch (err) {
    console.error('[BACKUP] ❌ Failed to send backup:', err.message);
  }
}

module.exports = { sendDailyGuideBackup };
