// test_farewell.js

const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./src/utils/email');

(async () => {
  try {
    const farewellPath = path.join(__dirname, 'templates/farewell_email.html');
    const farewellHtml = fs.readFileSync(farewellPath, 'utf-8');

    await sendEmail(
      'johanvanerkel@gmail.com', // replace with your test email
      'Thank You for Using The Phoenix Protocol',
      farewellHtml
    );

    console.log('✅ Farewell email sent successfully.');
  } catch (err) {
    console.error('❌ Error sending farewell email:', err);
  }
})();
