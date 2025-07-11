// test_send_premium.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../src/utils/email');

// Load latest available cached guide (even if yesterday)
const cacheDir = path.join(__dirname, 'content/daily_cache');
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
const templatePath = path.join(__dirname, 'templates/premium_guide_email.html');
const template = fs.readFileSync(templatePath, 'utf-8');

// Set gender for test (adjust if desired)
const testGender = 'neutral';
const guide = todayGuide[testGender];

if (!guide) {
  console.error(`❌ No guide found for gender ${testGender}.`);
  process.exit(1);
}

// Format guide content into paragraphs
const formattedContent = guide.content
  .split(/\n{2,}/)
  .map(paragraph => `<p>${paragraph.trim()}</p>`)
  .join('\n');

// Inject into template
const htmlContent = template
  .replace('{{title}}', guide.title)
  .replace('{{content}}', formattedContent);

// TEST EMAIL: replace with your email
const testEmail = 'johanvanerkel@gmail.com';

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
