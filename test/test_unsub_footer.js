// DB-free test for unsubscribe footer

// --- Stub out any DB imports before loading email utils ---
function stub(mod, exportsObj = {}) {
  try {
    require.cache[require.resolve(mod)] = { exports: exportsObj };
  } catch {
    // ignore if path does not exist
  }
}

// Common DB touchpoints in this repo
stub('../src/utils/db_logger', { logEvent: (...a) => console.log('[logEvent]', ...a) });
stub('../src/db/db');   // knex/pg client
stub('../src/db');      // alt index re-export

// --- Ensure env vars exist ---
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ Missing SENDGRID_API_KEY');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET');
  process.exit(1);
}

// --- Now require email utils ---
const { sendRawEmail } = require('../src/utils/email');

const to = process.argv[2];
if (!to) {
  console.error('Usage: node test/test_unsub_footer.js you@example.com');
  process.exit(1);
}

(async () => {
  // Case A: no placeholder → backend should append real unsubscribe footer
  await sendRawEmail(
    to,
    'Test A: Auto Unsubscribe Footer',
    '<p>Hello from Test A. Backend should append the unsubscribe footer.</p>'
  );

  // Case B: placeholder present → backend should not append footer
  await sendRawEmail(
    to,
    'Test B: Placeholder Present (no auto footer)',
    '<p>Hello from Test B. {{unsubscribe_token}} should stay literal; no auto footer.</p>'
  );

  console.log('✅ Sent both test emails.');
})();
