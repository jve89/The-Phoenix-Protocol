// test_farewell.js

const { sendEmail } = require('./src/utils/email');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const recipient = 'johanvanerkel@gmail.com';

    const farewellPath = path.join(__dirname, 'templates', 'farewell_email.html');
    const farewellHtml = fs.readFileSync(farewellPath, 'utf-8');

    await sendEmail(
      recipient,
      'Thank You for Using The Phoenix Protocol',
      farewellHtml
    );

    console.log(`✅ Farewell email sent successfully to ${recipient}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send farewell email:', error);
    process.exit(1);
  }
})();
