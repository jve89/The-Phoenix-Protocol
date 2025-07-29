// test/test_send_trial.js
require('dotenv').config();
const db = require('../src/db/db');
const { sendRawEmail } = require('../src/utils/email');
const { loadTemplate } = require('../src/utils/loadTemplate');

(async () => {
  const { rows: users } = await db.query(`SELECT * FROM users WHERE is_trial_user = true`);
  if (users.length === 0) {
    console.log('❌ No trial users found.');
    return;
  }

  for (const user of users) {
    const { email, gender, goal_stage, usage_count } = user;
    const day = usage_count + 1;
    const variant = `${gender || 'neutral'}_${goal_stage || 'moveon'}`;
    const trialPath = `trial/${variant}_day${day}.html`;

    console.log(`\n📨 Preparing trial email for ${email} (Day ${day}) → ${trialPath}`);

    try {
      const html = await loadTemplate(trialPath);
      if (!html) throw new Error('Loaded HTML is empty or missing');

      const finalHtml = html.replace('{{unsubscribe_token}}', 'test-token');
      const subject = `Phoenix Protocol — Trial Day ${day}`;

      await sendRawEmail(email, subject, finalHtml);
      console.log(`✅ Sent ${subject} to ${email}`);
    } catch (err) {
      console.error(`❌ Failed for ${email}: ${err.message}`);
    }
  }

  console.log('\n✅ Trial email test run complete.\n');
})();
