require('dotenv').config();
const db = require('./src/db/db');
const { sendRawEmail } = require('./src/utils/email');
const { loadTemplate } = require('./src/utils/loadTemplate');
const { loadGuideByDate, loadTodayGuide } = require('./src/utils/content');
const { marked } = require('marked');

(async () => {
  try {
    const template = await loadTemplate('premium_guide_email.html');
    let guide = await loadTodayGuide();

    // 🛟 Fallback to latest guide in DB if today's is missing
    if (!guide) {
      console.warn('⚠️ Today\'s guide not found. Falling back to latest available...');
      const { rows } = await db.query(`
        SELECT date FROM daily_guides
        ORDER BY date DESC
        LIMIT 1
      `);

      if (rows.length > 0) {
        const fallbackDate = rows[0].date.toISOString().split('T')[0];
        guide = await loadGuideByDate(fallbackDate);
        console.log(`📦 Loaded fallback guide from ${fallbackDate}`);
      }
    }

    if (!template || !guide) {
      console.error('❌ Missing template or guide, even after fallback.');
      process.exit(1);
    }

    const { rows: users } = await db.query(`
      SELECT id, email, gender, goal_stage
      FROM users
      WHERE email IN ('johanvanerkel@gmail.com', 'jovanerkel@gmail.com')
    `);

    console.log(`📨 Sending to ${users.length} user(s)...`);

    for (const user of users) {
      const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
      const guideContent = guide[variant];

      if (!guideContent) {
        console.warn(`⚠️ No guide for ${variant}, skipping ${user.email}`);
        continue;
      }

      const htmlBody = marked.parse(guideContent.content);
      const finalHtml = template
        .replace('{{title}}', guideContent.title)
        .replace('{{content}}', htmlBody);

      await sendRawEmail(user.email, guideContent.title, finalHtml);
      console.log(`📤 Re-sent to ${user.email}`);
    }

    console.log('✅ Resend complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Resend error:', err.message);
    process.exit(1);
  }
})();
