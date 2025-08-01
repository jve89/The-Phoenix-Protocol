require('dotenv').config();
const { loadGuideByDate } = require('../src/utils/content');
const { validateGuideContent } = require('../src/utils/validateGuide');
const { renderEmailMarkdown } = require('../src/utils/email');
const { sendRawEmail } = require('../src/utils/email');
const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];

(async () => {
  const date = process.argv[2] || new Date().toISOString().slice(0, 10);
  const guide = await loadGuideByDate(date);

  if (!guide) {
    console.error(`[ERROR] No guide object found for ${date}`);
    process.exit(1);
  }

  console.log(`[INFO] Guide keys for ${date}:`, Object.keys(guide));

  for (const variant of VARIANTS) {
    if (!guide[variant]?.content || guide[variant].content.trim().length <= 100) {
      console.warn(`[WARN] Variant missing or too short: ${variant} (len=${guide[variant]?.content?.length || 0})`);
    } else {
      console.log(`[OK] Variant present: ${variant} (len=${guide[variant].content.length})`);
    }
  }

  const { isValid, warnings } = validateGuideContent(guide, VARIANTS);
  let warningBlockHtml = '';
  if (!isValid && warnings.length) {
    warningBlockHtml = `<div style="background:#fff3cd;padding:10px;border-left:5px solid #ffc107;margin-bottom:20px;"><strong>⚠️ Guide Warnings:</strong><ul>` +
      warnings.map(w => `<li>${w}</li>`).join('') + `</ul></div>`;
  }

  const emailPreviewHtml = await renderEmailMarkdown(guide);

  const adminHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Daily Guide Summary - ${date}</title>
    <style>
      body {
        font-family: -apple-system, system-ui, sans-serif;
        background-color: #f9fafb;
        color: #393f4a;
        padding: 20px;
      }
      h1 {
        color: #5f259f;
      }
      h2 {
        margin-top: 1.5em;
      }
      hr {
        margin: 2rem 0;
      }
    </style>
  </head>
  <body>
    <h1>Daily Guide Summary - ${date}</h1>
    ${warningBlockHtml}
    ${emailPreviewHtml}
  </body>
  </html>
  `;

  if (!process.env.ADMIN_EMAIL) {
    console.error('[ERROR] ADMIN_EMAIL env var not set');
    process.exit(1);
  }

  await sendRawEmail(process.env.ADMIN_EMAIL, `📦 Daily Guide Backup – ${date}`, adminHtml);
  console.log(`[INFO] Admin backup sent to ${process.env.ADMIN_EMAIL} for ${date}`);
})();
