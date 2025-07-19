// test_welcome_email.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendRawEmail } = require('./src/utils/email');

(async () => {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'templates/welcome.html'), 'utf-8');
    await sendRawEmail('johanvanerkel@gmail.com', 'Welcome to The Phoenix Protocol', html);
    console.log('✅ Welcome email sent.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err.message);
    process.exit(1);
  }
})();
