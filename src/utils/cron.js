// src/utils/cron.js

require('dotenv').config();
const cron = require('node-cron');
const db = require('../db/db');
const { sendEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide } = require('./content');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../../logs/cron_activity.log');

function logCron(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, entry);
}

function startCron() {
  console.log('[CRON] Subscription expiry, guide generation, and premium email schedule active.');
  logCron('✅ Cron system started and monitoring triggers.');

  // 1️⃣ Generate & cache premium guides daily at 15:55 UTC
  cron.schedule('50 15 * * *', async () => {
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
  });

  // 2️⃣ Send premium guide to all active users daily at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    const time = new Date().toISOString();
    console.log(`[CRON] Sending premium guides: ${time}`);
    logCron(`🚀 Sending premium guides at ${time}`);

    try {
      const { rows: users } = await db.query(`SELECT email, gender FROM users WHERE plan != 'free'`);
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

      // Load premium email HTML template
      const templatePath = path.join(__dirname, '../../templates/premium_guide_email.html');
      const template = fs.readFileSync(templatePath, 'utf-8');

      for (const user of users) {
        try {
          let guide;
          if (user.gender === 'male') guide = todayGuide.male;
          else if (user.gender === 'female') guide = todayGuide.female;
          else guide = todayGuide.neutral;

          if (!guide) {
            console.error(`[CRON] Missing guide for gender ${user.gender}, skipping ${user.email}`);
            logCron(`⚠️ Missing guide for gender ${user.gender}, skipping ${user.email}`);
            continue;
          }

          // Format guide content into clean paragraphs
          const formattedContent = guide.content
            .split(/\n{2,}/)
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join('\n');

          // Inject into template
          const htmlContent = template
            .replace('{{title}}', guide.title)
            .replace('{{content}}', formattedContent);

          const subject = guide.title || 'Your Daily Phoenix Protocol Guide';

          await sendEmail(user.email, subject, htmlContent);
          console.log(`[CRON] Guide sent to ${user.email}`);
          logCron(`✅ Guide sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Error sending to ${user.email}:`, err.message);
          logCron(`❌ Error sending to ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Error fetching users or sending guides:', err.message);
      logCron(`❌ Error fetching users or sending guides: ${err.message}`);
    }
  });

  // 3️⃣ Downgrade expired subscriptions at midnight UTC
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

          await sendEmail(
            user.email,
            'Your Subscription Has Ended',
            '<p>Your premium plan has ended, and you are now on the free plan. Renew anytime for continued premium guidance.</p>'
          );
          console.log(`[CRON] Expiry notice sent to ${user.email}`);
          logCron(`📧 Expiry notice sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Error processing downgrade for ${user.email}:`, err.message);
          logCron(`❌ Error processing downgrade for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[CRON] Error during subscription expiry check:', err.message);
      logCron(`❌ Error during subscription expiry check: ${err.message}`);
    }
  });
}

module.exports = { startCron };
