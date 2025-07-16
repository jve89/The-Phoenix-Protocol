require('dotenv').config();

const cron = require('node-cron');
const db = require('../db/db');
const { sendEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logFailure } = require('./retry_email_queue');

const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../../logs/generate_today_guide_debug.log');

function logCron(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  const logDir = path.dirname(logPath);


  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`✅ Created missing logs directory at ${logDir}`);
  }

  fs.appendFileSync(logPath, entry);
}

function startCron() {
  global.lastCronTimestamp = new Date().toISOString();
  console.log('[CRON] Subscription expiry, guide generation, and premium email schedule active.');
  logCron('✅ Cron system started and monitoring triggers.');

  // 1️⃣ Generate & cache daily guides at 15:00 UTC
  cron.schedule('0 15 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Generating and caching premium guides: ${time}`);
    logCron(`🚀 Generating and caching premium guides at ${time}`);
    try {
      await generateAndCacheDailyGuides();
      console.log('[CRON] Guide generation complete.');
      logCron('✅ Guide generation completed successfully.');
    } catch (err) {
      console.error('[CRON] Guide generation error:', err.message);
      logCron(`❌ Guide generation error: ${err.message}`);
    }
  }, {
    timezone: 'Etc/UTC'
  });

  // 2️⃣ Send premium guides at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Sending premium guides: ${time}`);
    logCron(`🚀 Sending premium guides at ${time}`);

    try {
      const { rows: users } = await db.query(`
        SELECT email, gender, goal_stage FROM users
        WHERE plan IN ('30', '90', '365') AND (first_guide_sent_at IS NULL OR first_guide_sent_at::date != CURRENT_DATE)
      `);

      if (!users.length) {
        console.log('[CRON] No active users to send guides to.');
        logCron('⚠️ No active users found, skipping send.');
        return;
      }

      const todayGuide = loadTodayGuide();
      if (!todayGuide) {
        console.error('[CRON] No cached guide found for today, aborting email send.');
        logCron('❌ No cached guide found for today, aborting email send.');
        return;
      }

      const template = loadTemplate('premium_guide_email.html');

      for (const user of users) {
        try {
          const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
          const guide = todayGuide[variant];

          if (!guide) {
            console.warn(`[CRON] Missing guide for variant: ${variant}. Skipping ${user.email}`);
            logCron(`⚠️ Missing guide for ${variant}, skipping ${user.email}`);
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
            logCron(`✅ Guide sent to ${user.email}`);
          } catch (err) {
            console.error(`[CRON] Send error for ${user.email}: ${err.message}`);
            logCron(`❌ Send error for ${user.email}: ${err.message}`);
            logFailure(user.email, subject, htmlContent);
          }
        } catch (err) {
          console.error(`[CRON] Processing error for ${user.email}: ${err.message}`);
          logCron(`❌ Processing error for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] User fetch/send error:', err.message);
      logCron(`❌ User fetch/send error: ${err.message}`);
    }
  }, {
    timezone: 'Etc/UTC'
  });

  // 3️⃣ Downgrade expired subscriptions at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Checking for expired subscriptions: ${time}`);
    logCron(`🚀 Checking for expired subscriptions at ${time}`);

    try {
      const { rows: expiredUsers } = await db.query(
        `SELECT id, email FROM users WHERE end_date IS NOT NULL AND end_date <= CURRENT_DATE`
      );

      if (!expiredUsers.length) {
        console.log('[CRON] No users to downgrade today.');
        logCron('⚠️ No users to downgrade today.');
        return;
      }

      for (const user of expiredUsers) {
        try {
          await db.query(
            `UPDATE users SET plan = 'free', end_date = NULL WHERE id = $1`,
            [user.id]
          );
          console.log(`[CRON] Downgraded ${user.email} to free plan.`);
          logCron(`✅ Downgraded ${user.email} to free plan.`);


          const farewellPath = path.join(__dirname, '../../templates/farewell_email.html');
          const farewellHtml = fs.readFileSync(farewellPath, 'utf-8');

          await sendEmail(
            user.email,
            'Thank You for Using The Phoenix Protocol',
            farewellHtml
          );

          console.log(`[CRON] Expiry notice sent to ${user.email}`);
          logCron(`📧 Expiry notice sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Downgrade error for ${user.email}:`, err.message);
          logCron(`❌ Downgrade error for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Expiry check error:', err.message);
      logCron(`❌ Expiry check error: ${err.message}`);
    }
  });
}

module.exports = { startCron };
