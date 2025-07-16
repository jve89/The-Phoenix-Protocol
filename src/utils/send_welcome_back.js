const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./email');

async function sendWelcomeBackEmail(recipient) {
  try {
    const htmlPath = path.join(__dirname, '..', 'templates', 'welcome_back.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    await sendEmail(
      recipient,
      'Welcome Back to The Phoenix Protocol',
      html
    );

    console.log(`📬 Welcome back email sent to ${recipient}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome back email to ${recipient}:`, err.message);
  }
}

module.exports = { sendWelcomeBackEmail };
