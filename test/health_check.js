// test/health_check.js

require('dotenv').config();
const OpenAI = require('openai');
const { Client } = require('pg');
const sgMail = require('@sendgrid/mail');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const db = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  // 1. OpenAI
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Health check' }],
      max_tokens: 10
    });
    if (!resp.choices || !resp.choices[0]?.message?.content) throw new Error('OpenAI returned empty response');
    console.log('[OK] OpenAI API: success');
  } catch (err) {
    console.error('[FAIL] OpenAI API:', err.message);
    process.exit(1);
  }

  // 2. Postgres
  try {
    await db.connect();
    const { rows } = await db.query('SELECT 1 as ok');
    if (rows[0]?.ok !== 1) throw new Error('Invalid DB response');
    console.log('[OK] Postgres: success');
    await db.end();
  } catch (err) {
    console.error('[FAIL] Postgres:', err.message);
    process.exit(1);
  }

  // 3. SendGrid (send to yourself or a safe test address)
  const TEST_EMAIL = process.env.ADMIN_EMAIL || 'youremail@example.com';
  try {
    await sgMail.send({
      to: TEST_EMAIL,
      from: {
        name: 'Phoenix Health Check',
        email: 'no-reply@thephoenixprotocol.app'
      },
      subject: 'Phoenix Protocol Health Check',
      text: 'If you see this, SendGrid is working.'
    });
    console.log(`[OK] SendGrid: email sent to ${TEST_EMAIL}`);
  } catch (err) {
    console.error('[FAIL] SendGrid:', err.message);
    process.exit(1);
  }

  console.log('✅ All systems operational.');
  process.exit(0);
})();
