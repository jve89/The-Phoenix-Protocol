// src/utils/cron.js

require('dotenv').config();
const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const { sendRawEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logEvent } = require('./db_logger');
const { sendDailyGuideBackup } = require('./backup'); // ✅ Added

const RETRY_LIMIT = 3;

function buildAdminGuideEmailHtml(guide) {
  let html = `<h1>Daily Guide Summary - ${guide.date}</h1>`;
  for (const variant of ['male_moveon', 'male_reconnect', 'female_moveon', 'female_reconnect', 'neutral_moveon', 'neutral_reconnect']) {
    const section = guide[variant];
    if (section) {
      html += `<h2>${section.title}</h2><p>${section.content.replace(/\n/g, '<br>')}</p><hr>`;
    }
  }
  return html;
}

function startCron() {
  global.lastCronTimestamp = new Date().toISOString();
  console.log('[CRON] Guide generation and delivery system running.');
  logEvent('cron', 'info', '✅ Cron system booted and active.');

  // 1️⃣ Guide generation at 15:00 UTC
  cron.schedule('0 15 * * *', async () => {
    const time = new Date().toISOString();
    global.lastCronTimestamp = time;
    console.log(`[CRON] Generating today's guide: ${time}`);
    await logEvent('cron', 'info', `🚀 Guide generation started at ${time}`);

    try {
      await generateAndCacheDailyGuides();
      console.log('[CRON] ✅ Guide cache complete.');
      await logEvent('cron', 'info', '✅ Guide generation complete.');

      const today = new Date().toISOString().split('T')[0];
      const guide = await loadGuideByDate(today);

      if (guide && process.env.ADMIN_EMAIL) {
        try {
          const adminHtml = buildAdminGuideEmailHtml(guide);
          await sendDailyGuideBackup(guide, adminHtml); // ← pass HTML body too
          console.log('[CRON] Admin guide + backup sent.');
          await logEvent('cron', 'info', '✅ Guide + backup email sent to admin.');
        } catch (err) {
          console.error('[CRON] Backup email failed:', err.message);
          await logEvent('cron', 'error', `❌ Backup email failed: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Guide generation error:', err.message);
      await logEvent('cron', 'error', `❌ Guide gen error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });

  // 2️⃣ Guide delivery at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    global.lastCronTimestamp = now.toISOString();
    console.log(`[CRON] Sending daily guides: ${now.toISOString()}`);
    await logEvent('cron', 'info', `📬 Starting guide send: ${now.toISOString()}`);

    try {
      const { rows: users } = await db.query(`
        SELECT id, email, gender, goal_stage, plan, plan_limit, usage_count
        FROM users
        WHERE plan IS NOT NULL AND plan > 0 AND usage_count < plan_limit
      `);

      if (!users.length) {
        console.log('[CRON] No active subscribers with remaining uses.');
        await logEvent('cron', 'warn', '⚠️ No eligible users to send.');
        return;
      }

      const template = await loadTemplate('premium_guide_email.html');
      const guide = await loadTodayGuide();
      if (!template || !guide) {
        console.error('[CRON] ❌ Missing template or guide.');
        await logEvent('cron', 'error', '❌ Missing content.');
        return;
      }

      for (const user of users) {
        const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
        const guideContent = guide[variant];

        if (!guideContent) {
          console.warn(`[CRON] No guide for ${variant}, skipping ${user.email}`);
          await logEvent('cron', 'warn', `⚠️ No guide for ${variant} (${user.email})`);
          continue;
        }

        const html = template
          .replace('{{title}}', guideContent.title)
          .replace('{{content}}', guideContent.content.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>'));

        try {
          await sendRawEmail(user.email, guideContent.title, html);
          console.log(`[CRON] ✅ Sent to ${user.email}`);
          await logEvent('cron', 'info', `✅ Guide sent: ${user.email}`);

          await db.query(`
            INSERT INTO delivery_log (user_id, email, variant, status, error_message)
            VALUES ($1, $2, $3, $4, $5)
          `, [user.id, user.email, variant, 'success', null]);

          const newUsage = user.usage_count + 1;
          await db.query(
            `UPDATE users SET usage_count = $1, first_guide_sent_at = NOW() WHERE id = $2`,
            [newUsage, user.id]
          );

          if (newUsage >= user.plan_limit) {
            await db.query(`UPDATE users SET plan = 0 WHERE id = $1`, [user.id]);

            const farewellHtml = await fs.readFile(path.join(__dirname, '../../templates/farewell_email.html'), 'utf-8');
            await sendRawEmail(user.email, 'Thank You for Using The Phoenix Protocol', farewellHtml);

            console.log(`[CRON] 🔚 Final guide sent. Downgraded ${user.email}`);
            await logEvent('cron', 'info', `🔚 Final guide sent & unsubscribed: ${user.email}`);
          }

        } catch (err) {
          console.error(`[CRON] ❌ Send failed for ${user.email}:`, err.message);
          await logEvent('cron', 'error', `❌ Send fail: ${user.email} – ${err.message}`);

          await db.query(`
            INSERT INTO delivery_log (user_id, email, variant, status, error_message)
            VALUES ($1, $2, $3, $4, $5)
          `, [user.id, user.email, variant, 'failed', err.message]);
        }
      }
    } catch (err) {
      console.error('[CRON] Send error:', err.message);
      await logEvent('cron', 'error', `❌ Send error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });

  // 3️⃣ Retry failed deliveries at 17:00 UTC
  cron.schedule('0 17 * * *', async () => {
    console.log('[CRON] 🔁 Retry pass for failed emails...');
    await logEvent('cron', 'info', '🔁 Retry task started.');

    try {
      const { rows: failures } = await db.query(`
        SELECT user_id, email, variant, COUNT(*) AS attempts
        FROM delivery_log
        WHERE status = 'failed'
          AND sent_at > NOW() - INTERVAL '24 hours'
        GROUP BY user_id, email, variant
        HAVING COUNT(*) < $1
        LIMIT 50
      `, [RETRY_LIMIT]);

      if (!failures.length) {
        console.log('[CRON] ✅ No eligible failures to retry.');
        return;
      }

      const template = await loadTemplate('premium_guide_email.html');
      const today = new Date().toISOString().split('T')[0];
      const guide = await loadGuideByDate(today);

      for (const fail of failures) {
        const { user_id, email, variant } = fail;
        const guideContent = guide?.[variant];
        if (!guideContent || !template) {
          console.warn(`[CRON] ⚠️ Missing guide/template for retry: ${variant}`);
          continue;
        }

        const html = template
          .replace('{{title}}', guideContent.title)
          .replace('{{content}}', guideContent.content.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>'));

        try {
          await sendRawEmail(email, guideContent.title, html);
          console.log(`[CRON] ✅ Retry success: ${email}`);
          await logEvent('cron', 'info', `✅ Retry sent: ${email}`);

          await db.query(`
            INSERT INTO delivery_log (user_id, email, variant, status)
            VALUES ($1, $2, $3, 'success')
          `, [user_id, email, variant]);
        } catch (err) {
          console.error(`[CRON] ❌ Retry failed for ${email}:`, err.message);
          await db.query(`
            INSERT INTO delivery_log (user_id, email, variant, status, error_message)
            VALUES ($1, $2, $3, 'failed', $4)
          `, [user_id, email, variant, err.message]);
        }
      }

    } catch (err) {
      console.error('[CRON] Retry task error:', err.message);
      await logEvent('cron', 'error', `❌ Retry cron error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });
}

module.exports = { startCron };
