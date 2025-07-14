// src/utils/send_first_guide_immediately.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

const sendFirstGuideImmediately = async (userEmail, userGender = 'prefer not to say', goalStage = 'reconnect') => {
  try {
    log(`🚀 Sending first premium guide immediately to ${userEmail}`);

    const todayGuide = loadTodayGuide();
    if (!todayGuide) {
      log('❌ No cached guide found for today. Cannot send first guide.');
      return;
    }

    const { loadTemplate } = require('./loadTemplate');
    const template = loadTemplate('premium_guide_email.html');

    const variant = `${userGender}_${goalStage}`;
    const guide = todayGuide[variant];

    if (!guide) {
      log(`⚠️ Missing guide for ${variant}. Skipping ${userEmail}.`);
      return;
    }

    const formattedContent = marked.parse(guide.content || '');

    const htmlContent = template
      .replace('{{title}}', guide.title)
      .replace('{{content}}', formattedContent);

    await sendEmail(userEmail, guide.title, htmlContent);
    log(`✅ Sent first premium guide to ${userEmail}`);
  } catch (err) {
    log(`❌ Error sending first guide to ${userEmail}: ${err.stack || err}`);
  }
};

// CLI usage: node src/utils/send_first_guide_immediately.js user@example.com female
if (require.main === module) {
  const [userEmail, userGender, goalStage] = process.argv.slice(2);
  if (!userEmail || !userGender || !goalStage) {
    console.error('Usage: node src/utils/send_first_guide_immediately.js user@example.com gender goal_stage');
    process.exit(1);
  }
  sendFirstGuideImmediately(userEmail, userGender, goalStage);
}

module.exports = { sendFirstGuideImmediately };
