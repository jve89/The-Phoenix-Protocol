// test/test_full_delivery.js
require('dotenv').config();
const db = require('../src/db/db');
const { sendRawEmail, sendMarkdownEmail } = require('../src/utils/email');
const { loadTemplate } = require('../src/utils/template');
const { generateTodaysGuide } = require('../src/utils/guide');
const path = require('path');

async function testAllDeliveries() {
  const { rows: users } = await db.query(`SELECT * FROM users`);
  console.log(`🚀 Starting test for ${users.length} users...`);

  const todayGuide = await generateTodaysGuide(); // Paid users use this

  for (const user of users) {
    const { email, gender, goal_stage, is_trial_user, is_subscriber, usage_count, plan_limit } = user;
    const day = usage_count + 1;

    console.log(`\n📨 User: ${email} (Day ${day})`);

    // 1. Send Welcome
    if (usage_count === 0) {
      const welcomePath = path.join(
        __dirname,
        '..',
        'templates',
        is_trial_user ? 'welcome_trial.html' : 'welcome_email.html'
      );
      try {
        const html = await loadTemplate(welcomePath);
        await sendRawEmail(email, '🔥 Welcome to The Phoenix Protocol', html);
        console.log(`✅ Welcome email sent`);
      } catch (err) {
        console.warn(`⚠️ Failed to send welcome email: ${err.message}`);
      }
    }

    // 2. Send Today’s Content
    if (is_trial_user) {
      const variant = `${gender || 'neutral'}_${goal_stage || 'moveon'}`;
      const trialPath = `trial/${variant}_day${day}.html`;
      try {
        const html = await loadTemplate(trialPath);
        const subject = `Phoenix Protocol — Trial Day ${day}`;
        await sendRawEmail(email, subject, html);
        console.log(`✅ Trial Day ${day} sent`);
      } catch (err) {
        console.warn(`⚠️ Trial template missing: ${trialPath}`);
      }
    }

    if (is_subscriber) {
      try {
        const subject = `Phoenix Protocol — Your Daily Guide`;
        await sendMarkdownEmail(email, subject, todayGuide.markdown);
        console.log(`✅ Premium daily guide sent`);
      } catch (err) {
        console.warn(`⚠️ Premium guide send failed: ${err.message}`);
      }
    }

    // 3. Simulate plan usage
    const newCount = usage_count + 1;
    await db.query(`UPDATE users SET usage_count = $1 WHERE id = $2`, [newCount, user.id]);

    // 4. Send Farewell if limit reached
    if (newCount >= plan_limit) {
      const farewellPath = path.join(
        __dirname,
        '..',
        'templates',
        is_trial_user ? 'trial_farewell.html' : 'farewell_email.html'
      );
      try {
        const html = await loadTemplate(farewellPath);
        const subject = 'Your Trial Has Ended';
        await sendRawEmail(email, subject, html);
        console.log(`👋 Farewell email sent`);
      } catch (err) {
        console.warn(`⚠️ Farewell template missing: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Test complete.\n');
}

testAllDeliveries().catch(err => {
  console.error('❌ Test failed:', err);
});
