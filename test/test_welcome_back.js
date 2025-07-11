// test_welcome_back.js

const { sendEmail } = require('../src/utils/email');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const recipient = 'johanvanerkel@gmail.com';

    const welcomePath = path.join(__dirname, 'templates', 'welcome_back.html');
    const welcomeHtml = fs.readFileSync(welcomePath, 'utf-8');

    await sendEmail(
      recipient,
      'Welcome Back to The Phoenix Protocol',
      welcomeHtml
    );

    console.log(`✅ Welcome back email sent successfully to ${recipient}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send welcome back email:', error);
    process.exit(1);
  }
})();
