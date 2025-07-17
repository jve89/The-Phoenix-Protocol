require('dotenv').config();

const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs');
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
      html += `<h2>${section.title}</h2>`;
      html += `<p>${section.content.replace(/\n/g, '<br>')}</p>`;
      html += `<hr>`;
    }
  }

  return html;
}

function startCron() {
  global.lastCronTimestamp = new Date().toISOString();
  console.log('[CRON] Subscription expiry, guide generation, and premium email schedule active.');
  logEvent('cron', '✅ Cron system started and monitoring triggers.');

  // 1️⃣ Generate & cache daily guides at 15:00 UTC
  cron.schedule('0 15 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Generating and caching premium guides: ${time}`);
    await logEvent('cron', `🚀 Generating and caching premium guides at ${time}`);

    try {
      await generateAndCacheDailyGuides();
      console.log('[CRON] Guide generation complete.');
      await logEvent('cron', '✅ Guide generation completed successfully.');

      // Send full guide summary to admin 30 minutes later
      const today = new Date().toISOString().split('T')[0];
      const fullGuide = await loadGuideByDate(today);

      if (fullGuide && process.env.ADMIN_EMAIL) {
        setTimeout(async () => {
          try {
            const adminHtml = buildAdminGuideEmailHtml(fullGuide);
            await sendEmail(process.env.ADMIN_EMAIL, `Daily Guide Summary for ${today}`, adminHtml);
            console.log('[CRON] Admin guide email sent successfully.');
            await logEvent('cron', '✅ Admin guide email sent.');
          } catch (err) {
            console.error('[CRON] Admin guide email send failed:', err.message);
            await logEvent('cron', `❌ Admin guide email send failed: ${err.message}`);
          }
        }, 30 * 60 * 1000); // 30 minutes delay
      }
    } catch (err) {
      console.error('[CRON] Guide generation error:', err.message);
      await logEvent('cron', `❌ Guide generation error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });

  // 2️⃣ Send premium guides at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Sending premium guides: ${time}`);
    await logEvent('cron', `🚀 Sending premium guides at ${time}`);

    try {
      // Updated SQL: exclude new subscribers (first_guide_sent_at IS NOT NULL)
      const { rows: users } = await db.query(`
        SELECT email, gender, goal_stage FROM users
        WHERE plan IN ('30', '90', '365')
          AND first_guide_sent_at IS NOT NULL
          AND first_guide_sent_at::date != CURRENT_DATE
      `);

      if (!users.length) {
        console.log('[CRON] No active users to send guides to.');
        await logEvent('cron', '⚠️ No active users found, skipping send.');
        return;
      }

      let todayGuide = await loadTodayGuide();

      if (!todayGuide) {
        console.error('[CRON] ❌ No guide available for today in DB');
        await logEvent('cron', '❌ Guide missing in DB.');
        return;
      }

      const template = loadTemplate('premium_guide_email.html');

      for (const user of users) {
        try {
          const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
          const guide = todayGuide[variant];

          if (!guide) {
            console.warn(`[CRON] Missing guide for variant: ${variant}. Skipping ${user.email}`);
            await logEvent('cron', `⚠️ Missing guide for ${variant}, skipping ${user.email}`);
            continue;
          }

          const formattedContent = guide.content
            .split(/\n{2,}/)
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join('\n');

          const htmlContent = template
            .replace('{{title}}', guide.title)
            .replace('{{content}}', formattedContent);

          const subject = guide.title || 'Your Daily Phoenix Protocol Guide';

          try {
            await sendEmail(user.email, subject, htmlContent);
            console.log(`[CRON] Guide sent to ${user.email}`);
            await logEvent('cron', `✅ Guide sent to ${user.email}`);
          } catch (err) {
            console.error(`[CRON] Send error for ${user.email}: ${err.message}`);
            await logEvent('cron', `❌ Send error for ${user.email}: ${err.message}`);
            logFailure(user.email, subject, htmlContent);
          }
        } catch (err) {
          console.error(`[CRON] Processing error for ${user.email}: ${err.message}`);
          await logEvent('cron', `❌ Processing error for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] User fetch/send error:', err.message);
      await logEvent('cron', `❌ User fetch/send error: ${err.message}`);
    }
  }, { timezone: 'Etc/UTC' });


  // 3️⃣ Downgrade expired subscriptions at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Checking for expired subscriptions: ${time}`);
    await logEvent('cron', `🚀 Checking for expired subscriptions at ${time}`);

    try {
      const { rows: expiredUsers } = await db.query(
        `SELECT id, email FROM users WHERE end_date IS NOT NULL AND end_date <= CURRENT_DATE`
      );

      if (!expiredUsers.length) {
        console.log('[CRON] No users to downgrade today.');
        await logEvent('cron', '⚠️ No users to downgrade today.');
        return;
      }

      for (const user of expiredUsers) {
        try {
          await db.query(
            `UPDATE users SET plan = 'free', end_date = NULL WHERE id = $1`,
            [user.id]
          );
          console.log(`[CRON] Downgraded ${user.email} to free plan.`);
          await logEvent('cron', `✅ Downgraded ${user.email} to free plan.`);

          const farewellPath = path.join(__dirname, '../../templates/farewell_email.html');
          const farewellHtml = fs.readFileSync(farewellPath, 'utf-8');

          await sendEmail(
            user.email,
            'Thank You for Using The Phoenix Protocol',
            farewellHtml
          );

          console.log(`[CRON] Expiry notice sent to ${user.email}`);
          await logEvent('cron', `📧 Expiry notice sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Downgrade error for ${user.email}:`, err.message);
          await logEvent('cron', `❌ Downgrade error for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Expiry check error:', err.message);
      await logEvent('cron', `❌ Expiry check error: ${err.message}`);
    }
  });
}

module.exports = { startCron };
