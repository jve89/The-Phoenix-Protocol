// test/trigger_guide_cron.js

require('dotenv').config();
const { generateAndCacheDailyGuides, loadGuideByDate } = require('../src/utils/content');
const { sendRawEmail } = require('../src/utils/email');
const { logEvent } = require('../src/utils/db_logger');
const path = require('path');
const fs = require('fs').promises;

function buildAdminGuideEmailHtml(guide) {
  let html = `<h1>Daily Guide Summary - ${guide.date}</h1>`;
  for (const variant of [
    'male_moveon', 'male_reconnect',
    'female_moveon', 'female_reconnect',
    'neutral_moveon', 'neutral_reconnect'
  ]) {
    const section = guide[variant];
    if (section) {
      html += `<h2>${section.title}</h2><p>${section.content.replace(/\n/g, '<br>')}</p><hr>`;
    }
  }
  return html;
}

(async () => {
  const timestamp = new Date().toISOString();
  global.lastCronTimestamp = timestamp;

  console.log(`[MANUAL CRON] Generating today's guide: ${timestamp}`);
  await logEvent('cron', 'info', `🚀 Manual guide generation triggered at ${timestamp}`);

  try {
    await generateAndCacheDailyGuides();
    console.log('[MANUAL CRON] ✅ Guide cache complete.');
    await logEvent('cron', 'info', '✅ Guide generation completed.');

    const today = new Date().toISOString().split('T')[0];
    const guide = await loadGuideByDate(today);

    if (guide && process.env.ADMIN_EMAIL) {
      // Save JSON to /tmp for attachment
      const os = require('os');
      const jsonPath = path.join(os.tmpdir(), `daily_guide_${today}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(guide, null, 2));

      const html = buildAdminGuideEmailHtml(guide);
      await sendRawEmail(
        process.env.ADMIN_EMAIL,
        `Daily Guide Summary for ${today}`,
        html,
        jsonPath // Attach the JSON file
      );
      console.log('[MANUAL CRON] ✅ Admin summary email sent with JSON attachment.');
      await logEvent('cron', 'info', '✅ Admin summary email sent with JSON.');
    } else {
      console.log('[MANUAL CRON] ℹ️ No ADMIN_EMAIL or guide not found.');
    }

  } catch (err) {
    console.error('[MANUAL CRON] ❌ Error:', err.message);
    await logEvent('cron', 'error', `❌ Manual guide gen error: ${err.message}`);
  }
})();
