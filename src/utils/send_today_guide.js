// src/utils/send_today_guide.js

require('dotenv').config();
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
  fs.appendFileSync(logPath, entry, 'utf8');
  console.log(message);
}

(async () => {
  try {
    log('🚀 Starting premium guide send pipeline...');

    const { rows: users } = await db.query(`SELECT email, gender FROM users WHERE plan = 'premium'`);
    if (!users.length) {
      log('⚠️ No premium users found. Exiting.');
      process.exit(0);
    }
    log(`✅ Found ${users.length} premium user(s).`);

    const todayGuide = loadTodayGuide();
    if (!todayGuide) {
      log('❌ No cached guide found for today. Exiting.');
      process.exit(1);
    }

    const { loadTemplate } = require('./loadTemplate');
    const template = loadTemplate('premium_guide_email.html');

    for (const user of users) {
      try {
        let guide;
        if (user.gender === 'male') guide = todayGuide.male;
        else if (user.gender === 'female') guide = todayGuide.female;
        else guide = todayGuide.neutral;

        if (!guide) {
          log(`⚠️ Missing guide for ${user.gender}. Skipping ${user.email}.`);
          continue;
        }

        const formattedContent = marked.parse(guide.content || '');

        // 🟣 Generate unsubscribe token
        const token = jwt.sign(
          { email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '14d' }
        );

        // 🟣 Replace both content + token
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
