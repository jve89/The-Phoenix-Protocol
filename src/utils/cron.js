// src/utils/cron.js

require('dotenv').config();
const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const { sendEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logFailure } = require('./retry_email_queue');
const { logEvent } = require('./db_logger');

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
    console.log(`[CRON] Generating today's guide: ${time}`);
    await logEvent('cron', 'info', `🚀 Guide generation started at ${time}`);

    try {
      await generateAndCacheDailyGuides();
      console.log('[CRON] ✅ Guide cache complete.');
      await logEvent('cron', 'info', '✅ Guide generation complete.');

      const today = new Date().toISOString().split('T')[0];
      const guide = await loadGuideByDate(today);

      if (guide && process.env.ADMIN_EMAIL) {
        setTimeout(async () => {
          try {
            const adminHtml = buildAdminGuideEmailHtml(guide);
            await sendEmail(process.env.ADMIN_EMAIL, `Daily Guide Summary for ${today}`, adminHtml);
            console.log('[CRON] Admin guide email sent.');
            await logEvent('cron', 'info', '✅ Admin summary email sent.');
          } catch (err) {
            console.error('[CRON] Admin email failed:', err.message);
            await logEvent('cron', 'error', `❌ Admin email failed: ${err.message}`);
          }
        }, 30 * 60 * 1000); // 15:30 UTC
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

    console.log(`[CRON] Sending daily guides: ${now.toISOString()}`);
    await logEvent('cron', 'info', `📬 Starting guide send: ${now.toISOString()}`);

    try {
      const { rows: users } = await db.query(`
        SELECT id, email, gender, goal_stage, plan, plan_limit, usage_count
        FROM users
        WHERE plan IS NOT NULL AND usage_count < plan_limit
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
          await sendEmail(user.email, guideContent.title, html);
          console.log(`[CRON] ✅ Sent to ${user.email}`);
          await logEvent('cron', 'info', `✅ Guide sent: ${user.email}`);

          const newUsage = user.usage_count + 1;
          await db.query(
            `UPDATE users SET usage_count = $1, first_guide_sent_at = NOW() WHERE id = $2`,
            [newUsage, user.id]
          );

          // Downgrade if this was the final email
          if (newUsage >= user.plan_limit) {
            await db.query(`UPDATE users SET plan = 'free' WHERE id = $1`, [user.id]);

            const farewellHtml = await fs.readFile(path.join(__dirname, '../../templates/farewell_email.html'), 'utf-8');
            await sendEmail(user.email, 'Thank You for Using The Phoenix Protocol', farewellHtml);

            console.log(`[CRON] 🔚 Final guide sent. Downgraded ${user.email}`);
            await logEvent('cron', 'info', `🔚 Final guide sent & unsubscribed: ${user.email}`);
          }

        } catch (err) {
          console.error(`[CRON] ❌ Send failed for ${user.email}:`, err.message);
          await logEvent('cron', 'error', `❌ Send fail: ${user.email} – ${err.message}`);
          logFailure(user.email, guideContent.title, html);
        }
      }
    } catch (err) {
      console.error('[CRON] Send error:', err.message);
      await logEvent('cron', 'error', `❌ Send error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });
}

module.exports = { startCron };
