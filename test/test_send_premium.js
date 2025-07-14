// test_send_premium.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { sendEmail } = require('../src/utils/email');

// Load latest available cached guide (even if yesterday)
const cacheDir = path.join(__dirname, '../content/daily_cache');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
if (!files.length) {
  console.error('❌ No cached guide found in daily_cache.');
  process.exit(1);
}

// Find latest file by date
const latestFile = files.sort().reverse()[0];
const guidePath = path.join(cacheDir, latestFile);
const todayGuide = JSON.parse(fs.readFileSync(guidePath, 'utf-8'));

// Load premium email template
const { loadTemplate } = require('../src/utils/loadTemplate');
const template = loadTemplate('premium_guide_email.html');

// Set gender for test (adjust if desired)
const testVariant = 'neutral_moveon'; // or any of the 6: male_reconnect, etc.
const guide = todayGuide[testVariant];

if (!guide) {
  console.error(`❌ No guide found for gender ${testGender}.`);
  process.exit(1);
}

// Parse Markdown to HTML
const formattedContent = marked.parse(guide.content || '');

// TEST EMAIL: replace with your email
const testEmail = 'johanvanerkel@gmail.com';

// Inject into template
const jwt = require('jsonwebtoken');
const token = jwt.sign({ email: testEmail }, process.env.JWT_SECRET, { expiresIn: '14d' });

const htmlContent = template
  .replace('{{title}}', guide.title)
  .replace('{{content}}', formattedContent)
  .replace(/{{unsubscribe_token}}/g, encodeURIComponent(token));

// Send email
sendEmail(
  testEmail,
  guide.title || 'Your Daily Phoenix Protocol Guide',
  htmlContent
).then(() => {
  console.log(`✅ Test premium guide sent to ${testEmail} using ${latestFile}`);
}).catch(err => {
  console.error(`❌ Error sending test premium guide:`, err);
});
