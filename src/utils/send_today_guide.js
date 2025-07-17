const fs = require('fs');
const path = require('path');
const db = require('../db/db');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./email');
const { loadTodayGuide } = require('./content');
const { marked } = require('marked');

const logPath = path.join(__dirname, '../../logs/send_today_guide.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFile(logPath, entry, 'utf8', err => {
    if (err) console.error('Log write error:', err);
  });
  console.log(message);
}

(async () => {
  try {
    log('🚀 Starting premium guide send pipeline...');

    const { rows: users } = await db.query(`
      SELECT email, gender, goal_stage FROM users
      WHERE plan IN ('30', '90', '365')
        AND (created_at IS NULL OR created_at::date != CURRENT_DATE)
        AND (first_guide_sent_at IS NULL OR first_guide_sent_at::date != CURRENT_DATE)
    `);

    if (!users.length) {
      log('⚠️ No premium users found. Exiting.');
      process.exit(0);
    }
    log(`✅ Found ${users.length} premium user(s).`);

    const todayGuide = await loadTodayGuide();
    if (!todayGuide) {
      log('❌ No cached guide found for today. Exiting.');
      process.exit(1);
    }

    const { loadTemplate } = require('./loadTemplate');
    const template = loadTemplate('premium_guide_email.html');

    if (!process.env.JWT_SECRET) {
      log('❌ JWT_SECRET missing in environment');
      process.exit(1);
    }

    for (const user of users) {
      try {
        const gender = user.gender || 'neutral';
        const goalStage = user.goal_stage || 'reconnect';
        const variant = `${gender}_${goalStage}`;
        const guide = todayGuide[variant];

        if (!guide) {
          log(`⚠️ Missing guide for ${variant}. Skipping ${user.email}.`);
          continue;
        }

        const formattedContent = marked.parse((guide.content || '').trim());

        const token = jwt.sign(
          { email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '14d' }
        );

        const htmlContent = template
          .replace('{{title}}', guide.title)
          .replace('{{content}}', formattedContent)
          .replace(/{{unsubscribe_token}}/g, encodeURIComponent(token));

        log(`🔗 Unsubscribe URL for ${user.email}: https://www.thephoenixprotocol.app/unsubscribe?token=${encodeURIComponent(token)}`);

        await sendEmail(user.email, guide.title, htmlContent);
        log(`✅ Sent premium guide to ${user.email}`);
      } catch (err) {
        log(`❌ Error sending to ${user.email}: ${err.stack || err}`);
      }
    }

    log('🎉 Premium guide send pipeline completed successfully.');
    process.exit(0);

  } catch (err) {
    log(`❌ Pipeline error: ${err.stack || err}`);
    process.exit(1);
  }
})();
