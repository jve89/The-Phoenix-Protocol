// src/utils/send_today_guide.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db/db');
const { sendEmail } = require('./email');
const { loadTodayGuide } = require('./content');

(async () => {
  try {
    console.log('🚀 Manual send_today_guide.js triggered');

    // Load email HTML template
    const templatePath = path.join(__dirname, '../../templates/premium_guide_email.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Fetch active subscribers
    const result = await db.query(`SELECT email, gender FROM users WHERE plan != 'free'`);
    const users = result.rows;
    console.log(`✅ Found ${users.length} active user(s)`);

    if (!users.length) {
      console.log('⚠️ No active users found, exiting.');
      process.exit(0);
    }

    for (const user of users) {
      const userGuide = loadTodayGuide(user.gender);
      if (!userGuide) {
        console.error(`❌ No guide found for ${user.gender} (${user.email})`);
        continue;
      }

      // Format guide content into HTML paragraphs for clarity
      const formattedContent = userGuide.content
        .split(/\n{2,}/) // split on empty lines (paragraph breaks)
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('\n');

      // Inject into template cleanly
      const htmlContent = template
        .replace('{{title}}', userGuide.title)
        .replace('{{content}}', formattedContent);

      // Send the premium guide email
      await sendEmail(user.email, userGuide.title, htmlContent);
      console.log(`✅ Sent premium guide to ${user.email}`);
    }

    console.log('🎉 Manual send_today_guide.js completed successfully.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during manual guide sending:', err);
    process.exit(1);
  }
})();
