const fs = require('fs').promises;
const path = require('path');
const { sendEmail } = require('./email');

let cachedTemplate = null;

async function loadTemplate() {
  if (cachedTemplate) return cachedTemplate;
  try {
    const htmlPath = path.join(__dirname, '..', 'templates', 'welcome_back.html');
    cachedTemplate = await fs.readFile(htmlPath, 'utf-8');
    return cachedTemplate;
  } catch (err) {
    console.error('❌ Failed to load welcome_back.html template:', err.message);
    return null;
  }
}

async function sendWelcomeBackEmail(recipient) {
  if (!recipient || typeof recipient !== 'string') {
    console.error('Invalid recipient email for welcome back email');
    return;
  }

  try {
    const html = await loadTemplate();
    if (!html) {
      console.error('No email template available for welcome back email');
      return;
    }

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
