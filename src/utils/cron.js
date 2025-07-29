// Load critical envs
require('./loadEnv');

// Core dependencies
const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// App-specific modules
const { sendRawEmail, renderEmailMarkdown } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logEvent, logDelivery } = require('./db_logger');
const { sendDailyGuideBackup } = require('./backup');
const { marked } = require('marked');
const { validateGuideContent } = require('./validateGuide');

// Guide content variants (keep in sync with all guide generators)
const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];

// Prevent overlapping runs for each slot job
const jobRunning = {
  generate: false,
  trial: false,         // <--- was deliverTrial, now trial for consistency
  deliver: false,
  trialFarewell: false,
  farewell: false,
  retryGeneration: false,
  retry: false,
  prune: false
};

// Helper: get current UTC date (YYYY-MM-DD)
const todayUtc = () => new Date().toISOString().slice(0, 10);

// Structured logger (no side effects)
const logger = {
  info:  msg => logEvent('cron', 'info', msg),
  warn:  msg => logEvent('cron', 'warn', msg),
  error: msg => logEvent('cron', 'error', msg)
};

// Validate required environment variables before running any slots
const validateEnv = () => {
  const required = ['SENDGRID_API_KEY', 'DATABASE_URL', 'ADMIN_EMAIL'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing ENV ${key} — cron disabled`);
      return false;
    }
  }
  return true;
};

// CLI entry point to manually trigger individual cron jobs (e.g. deliverTrial)
async function main() {
  const job = process.argv[2];

  switch (job) {
    case 'deliverTrial':
      await runDeliverTrialEmailsSlot();
      break;
    case 'deliverPaid':
      await runDeliverDailyGuidesSlot();
      break;
    case 'generateGuides':
      await runGenerateDailyGuidesSlot();
      break;
    case 'sendTrialFarewells':
      await runSendTrialFarewellsSlot();
      break;
    case 'sendFarewells':
      await runSendFarewellEmailsSlot();
      break;
    case 'retryGeneration':
      await runRetryFailedGenerationSlot();
      break;
    case 'retryFailedEmails':
      await runRetryFailedDeliveriesSlot();
      break;
    case 'pruneLogs':
      await runPruneOldLogsSlot();
      break;
    default:
      console.error(`Unknown job: ${job}`);
      process.exit(1);
  }
}

// Job 1: Generate & cache, then send admin backup
/**
 * Attempts to generate today's daily guide, retrying every interval within the slot window.
 * - Only generates if today's guide does NOT already exist.
 * - Retries every retryInterval (minutes) within maxMinutes slot.
 * - After generation, sends admin backup with JSON and MD attachments.
 *
 * Usage in cron: 
 *   runGenerateDailyGuidesSlot({ maxMinutes: 30, retryInterval: 5 });
 */
async function runGenerateDailyGuidesSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const date = todayUtc();
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    // Step 1: Idempotency — skip if ALL variants already exist
    const existing = await loadGuideByDate(date);
    const allVariantsPresent = VARIANTS.every(
      variant => existing?.[variant]?.content?.trim()?.length > 100
    );

    if (allVariantsPresent) {
      console.log(`[CRON] Guide for ${date} already exists. Slot complete.`);
      logger.info(`Guide for ${date} already exists. Slot complete.`);

      const backupLog = await db.query(
        `SELECT 1 FROM guide_generation_logs
        WHERE DATE(timestamp) = $1 AND message ILIKE '%Admin guide + backup sent%'
        LIMIT 1`,
        [date]
      );

    if (backupLog.rowCount > 0) {
      console.log(`[CRON] Admin backup already sent for ${date}. Skipping.`);
      logger.info(`Admin backup already sent for ${date}. Skipping.`);
      return;
    }
      break;
    }

    // Step 2: Attempt generation
    try {
      console.log(`[CRON] (${attempt}/${maxRetries}) 🚀 Attempting guide generation for ${date}`);
      logger.info(`(${attempt}/${maxRetries}) 🚀 Attempting guide generation for ${date}`);

      await generateAndCacheDailyGuides();

      console.log(`[CRON] ✅ Guide generation complete for ${date}`);
      logger.info(`✅ Guide generation complete for ${date}`);
      break; // On success, exit slot retry loop

    } catch (err) {
      console.error(`[CRON] Guide generation failed: ${err.message} (attempt ${attempt})`);
      logger.error(`Guide generation failed: ${err.message} (attempt ${attempt})`);
      if (attempt === maxRetries) {
        console.error(`[CRON] ❌ All attempts exhausted. Guide not generated for ${date}.`);
        logger.error(`❌ All attempts exhausted. Guide not generated for ${date}.`);
        return;
      }
      await sleep(retryInterval * 60 * 1000);
    }
    attempt++;
  }

  // Step 3: Send admin backup if guide now exists
  try {
    const guide = await loadGuideByDate(date);
    const allVariantsPresent = VARIANTS.every(
      variant => guide?.[variant]?.content?.trim()?.length > 100
    );
    if (!allVariantsPresent) {
      console.warn(`[CRON] ⚠️ No complete guide found for ${date} after slot. Skipping backup.`);
      logger.warn(`⚠️ No complete guide found for ${date} after slot. Skipping backup.`);
      return;
    }

    if (process.env.ADMIN_EMAIL) {
      const { isValid, warnings } = validateGuideContent(guide, VARIANTS);

      let warningBlockHtml = '';
      let warningBlockMd = '';

      if (!isValid && warnings.length) {
        console.warn('[CRON] ⚠️ Guide content warnings:');
        for (const w of warnings) console.warn(' -', w);
        logger.warn('⚠️ Guide content warnings:\n' + warnings.map(w => ' - ' + w).join('\n'));

        warningBlockHtml = `<div style="background:#fff3cd;padding:10px;border-left:5px solid #ffc107;margin-bottom:20px;">
          <strong>⚠️ Guide Warnings:</strong><ul>` +
          warnings.map(w => `<li>${w}</li>`).join('') +
          `</ul></div>`;

        warningBlockMd = warnings.map(w => `> ⚠️ ${w}`).join('\n') + '\n\n---\n';
      }

      const emailPreviewHtml = renderEmailMarkdown(guide);
      const adminHtml = `<h1>Daily Guide Summary - ${date}</h1>` + warningBlockHtml + emailPreviewHtml;
      const mdPath = path.join(os.tmpdir(), `daily_guide_${date}.md`);
      const jsonPath = path.join(os.tmpdir(), `daily_guide_${date}.json`);

      // Build Markdown
      let md = `# Daily Guide Summary - ${date}\n\n` + warningBlockMd;
      for (const variant of VARIANTS) {
        const section = guide[variant];
        if (section?.content) {
          md += `## ${section.title}\n\n${section.content.trim()}\n\n---\n`;
        }
      }

      // Write temp files (fail early if error)
      try {
        await fs.writeFile(jsonPath, JSON.stringify(guide, null, 2));
        await fs.writeFile(mdPath, md);
      } catch (err) {
        console.error('[CRON] ❌ Failed to write backup files:', err.message);
        logger.error(`❌ Failed to write backup files: ${err.message}`);
        return;
      }

      // Send email
      await sendDailyGuideBackup(guide, adminHtml, [jsonPath, mdPath]);
      console.log('[CRON] ✅ Admin guide + backup sent');
      logger.info('✅ Admin guide + backup sent');

      // Cleanup
      try {
        if (await fs.stat(jsonPath).catch(() => null)) {
          await fs.unlink(jsonPath);
          console.log(`[CRON] 🧹 Deleted temp file: ${jsonPath}`);
          logger.info(`🧹 Deleted temp file: ${jsonPath}`);
        } else {
          logger.debug(`[CRON] Temp file already deleted (probably handled earlier): ${jsonPath}`);
          logger.info(`ℹ️ Temp file not found: ${jsonPath}`);
        }

        if (await fs.stat(mdPath).catch(() => null)) {
          await fs.unlink(mdPath);
          console.log(`[CRON] 🧹 Deleted temp file: ${mdPath}`);
          logger.info(`🧹 Deleted temp file: ${mdPath}`);
        } else {
          console.log(`[CRON] ℹ️ Temp file not found (maybe already deleted): ${mdPath}`);
          logger.info(`ℹ️ Temp file not found: ${mdPath}`);
        }
      } catch (err) {
        console.warn('[CRON] ⚠️ Failed during temp file cleanup:', err.message);
        logger.warn(`⚠️ Failed during temp file cleanup: ${err.message}`);
       }
    } // closes: if (process.env.ADMIN_EMAIL)
  } catch (err) {
    console.error('[CRON] Backup email failed:', err.message);
    logger.error(`Backup email failed: ${err.message}`);
  }
}

// Job 2: Deliver trial emails
/**
 * Attempts trial email delivery, retrying within a slot.
 * - Only sends each trial email once per user per day.
 * - Retries every retryInterval (minutes) within maxMinutes slot.
 * - After all, attempts trial farewells.
 */
async function runDeliverTrialEmailsSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    let users = [];
    try {
      ({ rows: users } = await db.query(
        `SELECT id, email, usage_count, gender, goal_stage
        FROM users
        WHERE is_trial_user = TRUE
          AND unsubscribed = FALSE
          AND usage_count < 3
          AND (last_trial_sent_at IS NULL OR last_trial_sent_at::date != CURRENT_DATE)`
      ));
    } catch (err) {
      console.error('[CRON] Trial user query failed:', err.message);
      logger.error(`Trial user query failed: ${err.message}`);
      return;
    }

    if (!users.length) {
      console.log('[CRON] No trial users to send, slot complete.');
      logger.info('No trial users to send, slot complete.');
      break;
    }

    let allSucceeded = true;
    for (const user of users) {
      const day = user.usage_count + 1;
      const gender = user.gender || 'neutral';
      const goal = user.goal_stage || 'reconnect';
      const templatePath = `trial/${gender}_${goal}_day${day}.html`;

      let html;
      try {
        html = await loadTemplate(templatePath);
      } catch (err) {
        console.error(`[CRON] Missing trial template: ${templatePath} — skipping ${user.email}`);
        logger.error(`Missing trial template ${templatePath}: ${err.message}`);
        continue;
      }

      const subject = `Phoenix Protocol — Day ${day}`;
      const variantMatch = templatePath.match(/trial\/([a-z_]+)_day\d+\.html$/);
      const variant = variantMatch ? variantMatch[1] : 'unknown';

      try {
        await sendRawEmail(user.email, subject, html);
        console.log(`[CRON] ✅ Trial Day ${day} sent: ${user.email}`);
        logger.info(`✅ Trial Day ${day} sent: ${user.email}`);

        await logDelivery(user.id, user.email, variant, 'success');

        await db.query(
          `UPDATE users
          SET usage_count = usage_count + 1,
              last_trial_sent_at = NOW(),
              first_guide_sent_at = COALESCE(first_guide_sent_at, NOW())
          WHERE id = $1`,
          [user.id]
        );
      } catch (err) {
        allSucceeded = false;
        console.error(`[CRON] ❌ Trial send failed for ${user.email}:`, err.message);
        logger.error(`Trial send failed: ${err.message}`);
        await logDelivery(user.id, user.email, variant, 'failed', err.message);
      }
    }

    if (allSucceeded) {
      break; // If no users left, stop slot
    } else {
      await sleep(retryInterval * 60 * 1000); // Wait and retry failed users
    }
    attempt++;
  }

  // After slot, farewell handling
  try {
    const { rows: farewellUsers } = await db.query(
      `SELECT id, email FROM users
       WHERE is_trial_user = TRUE
         AND usage_count >= 3
         AND farewell_sent = FALSE`
    );

    for (const user of farewellUsers) {
      try {
        const html = await loadTemplate('trial_farewell.html');
        if (!html) throw new Error('Farewell template is empty or not loaded');

        const subject = 'Your Phoenix Trial Has Ended';
        await sendRawEmail(user.email, subject, html);
        logger.info(`🟣 Farewell trial email sent to ${user.email}`);
        console.log(`[CRON] 🟣 Farewell sent: ${user.email}`);

        await db.query(
          `UPDATE users SET farewell_sent = TRUE WHERE id = $1`,
          [user.id]
        );
      } catch (err) {
        logger.error(`Farewell trial email failed for ${user.email}: ${err.message}`);
        console.error(`[CRON] ❌ Farewell send failed: ${user.email}`, err.message);
      }
    }
  } catch (err) {
    logger.error(`Farewell trial user query failed: ${err.message}`);
    console.error('[CRON] Farewell trial user query failed:', err.message);
  }
}

// Job 3: Deliver to users, rendering markdown
/**
 * Attempts paid guide delivery within a slot window.
 * - Retries every retryInterval for up to maxMinutes.
 * - Never double-sends to any user (usage_count logic).
 */
async function runDeliverDailyGuidesSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    let users = [];
    try {
      ({ rows: users } = await db.query(
        `SELECT id, email, gender, goal_stage, plan_limit, usage_count
         FROM users
         WHERE plan IS NOT NULL
           AND plan > 0
           AND usage_count < plan_limit
           AND (is_trial_user IS NULL OR is_trial_user = FALSE)
           AND unsubscribed = FALSE`
      ));
    } catch (err) {
      console.error('[CRON] User query failed:', err.message);
      logger.error(`User query failed: ${err.message}`);
      return;
    }

    if (!users.length) {
      console.log('[CRON] No eligible subscribers to send, slot complete.');
      logger.info('No eligible subscribers to send, slot complete.');
      break;
    }

    let template, guide;
    try {
      [template, guide] = await Promise.all([
        loadTemplate('premium_guide_email.html'),
        loadTodayGuide()
      ]);
    } catch (err) {
      template = null;
      guide = null;
      console.error('[CRON] Missing template or guide:', err.message);
      logger.error('Missing template or guide:', err.message);
    }
    if (!template || !guide) {
      if (attempt === maxRetries) {
        console.error('[CRON] Aborting: Could not load template/guide for slot.');
        logger.error('Aborting: Could not load template/guide for slot.');
        break;
      }
      await sleep(retryInterval * 60 * 1000);
      attempt++;
      continue;
    }

    let allSucceeded = true;
    for (const user of users) {
      const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
      const section = guide[variant];
      if (!section?.content) {
        console.warn(`[CRON] No content for ${variant}, skipping ${user.email}`);
        logger.warn(`No content for ${variant}: ${user.email}`);
        continue;
      }
      if (user.is_trial_user === true) {
        logger.warn(`Skipping trial user during paid guide run: ${user.email}`);
        continue;
      }
      let contentHtml;
      try {
        contentHtml = marked.parse(section.content);
      } catch (err) {
        logger.error(`Markdown parse failed for ${variant}: ${err.message}`);
        continue;
      }

      const html = template
        .replace('{{title}}', section.title)
        .replace('{{content}}', contentHtml);

      try {
        await sendRawEmail(user.email, section.title, html);
        console.log(`[CRON] ✅ Sent to ${user.email}`);
        logger.info(`✅ Guide sent: ${user.email}`);

        // Log and update usage
        await db.query(
          `INSERT INTO delivery_log (user_id,email,variant,status) VALUES ($1,$2,$3,'success')`,
          [user.id, user.email, variant]
        );
        await db.query(
          `UPDATE users SET usage_count = usage_count + 1, first_guide_sent_at = COALESCE(first_guide_sent_at, NOW()) WHERE id = $1`,
          [user.id]
        );
      } catch (err) {
        allSucceeded = false;
        console.error(`[CRON] ❌ Send failed for ${user.email}:`, err.message);
        logger.error(`Send failed for ${user.email}: ${err.message}`);
        await db.query(
          `INSERT INTO delivery_log (user_id,email,variant,status,error_message) VALUES ($1,$2,$3,'failed',$4)`,
          [user.id, user.email, variant, err.message]
        );
      }
    }

    if (allSucceeded) {
      break; // All done, exit slot
    } else {
      await sleep(retryInterval * 60 * 1000);
    }
    attempt++;
  }
}

// Job 4: Send farewell email to trial users
/**
 * Attempts to send all missing trial farewells within the slot.
 * Retries every retryInterval (default: 5m) for up to maxMinutes (default: 30m).
 * Skips users already marked as farewell_sent = true.
 */
async function runSendTrialFarewellsSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    let users = [];
    try {
      const result = await db.query(`
        SELECT * FROM users
        WHERE is_trial_user = true AND usage_count >= plan_limit AND farewell_sent = false
      `);
      users = result.rows;
    } catch (err) {
      console.error('[CRON] Trial farewell user query failed:', err.message);
      logger.error(`Trial farewell user query failed: ${err.message}`);
      break;
    }

    if (!users.length) {
      console.log('[CRON] No pending trial farewells, slot complete.');
      logger.info('No pending trial farewells, slot complete.');
      break;
    }

    let allSucceeded = true;
    for (const user of users) {
      try {
        await sendTrialFarewellEmail(user);
        console.log(`[CRON] ✅ Sent trial farewell to ${user.email}`);
        logger.info(`✅ Sent trial farewell to ${user.email}`);
      } catch (err) {
        allSucceeded = false;
        console.error(`[CRON] ❌ Failed to send trial farewell to ${user.email}:`, err.message);
        logger.error(`❌ Failed to send trial farewell to ${user.email}: ${err.message}`);
      }
    }

    if (allSucceeded) {
      break; // All farewells sent, exit slot
    } else {
      await sleep(retryInterval * 60 * 1000);
    }
    attempt++;
  }
}

async function sendTrialFarewellEmail(user) {
  const filePath = path.join(__dirname, '..', 'templates', 'trial_farewell.html');

  let html;
  try {
    html = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error(`[CRON] ❌ Missing trial_farewell.html:`, err.message);
    logger.error(`Missing trial farewell template: ${err.message}`);
    return;
  }

  const subject = 'Your Trial with The Phoenix Protocol Has Ended';

  try {
    await sendRawEmail(user.email, subject, html);
    await db.query('UPDATE users SET farewell_sent = true WHERE id = $1', [user.id]);
    console.log(`[CRON] ✅ Trial farewell sent: ${user.email}`);
    logger.info(`✅ Trial farewell sent: ${user.email}`);
  } catch (err) {
    console.error(`[CRON] ❌ Trial farewell send failed: ${err.message}`);
    logger.error(`Trial farewell send failed: ${err.message}`);
  }
}

// Job 5: Send farewell email to users who maxed out their plan and haven’t received farewell yet
/**
 * Attempts to send all missing *paid* user farewells within the slot.
 * Retries every retryInterval (default: 5m) for up to maxMinutes (default: 30m).
 * Skips users already marked as farewell_sent = true.
 */
async function runSendFarewellEmailsSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;
  let farewellHtml = null;

  while (attempt <= maxRetries) {
    // Query users still needing a farewell
    let users = [];
    try {
      ({ rows: users } = await db.query(
        `SELECT id, email FROM users
         WHERE plan_limit > 0 AND usage_count >= plan_limit
         AND NOT farewell_sent`
      ));
    } catch (err) {
      console.error('[CRON] Farewell user query failed:', err.message);
      logger.error(`Farewell user query failed: ${err.message}`);
      break;
    }

    if (!users.length) {
      console.log('[CRON] No pending farewells, slot complete.');
      logger.info('No pending farewells, slot complete.');
      break;
    }

    // Load template ONCE (only if at least one user to send)
    if (!farewellHtml) {
      try {
        farewellHtml = await loadTemplate('farewell_email.html');
      } catch (err) {
        console.error('[CRON] Could not load farewell email template:', err.message);
        logger.error(`Could not load farewell email template: ${err.message}`);
        return;
      }
    }

    let allSucceeded = true;
    for (const user of users) {
      try {
        await sendRawEmail(user.email, "Thank You for Using The Phoenix Protocol", farewellHtml);
        console.log(`[CRON] 🎉 Farewell sent: ${user.email}`);
        logger.info(`🎉 Farewell sent: ${user.email}`);
        const { rows: updated } = await db.query(
          `UPDATE users SET farewell_sent = TRUE WHERE id = $1 RETURNING email`, [user.id]
        );
        if (updated.length) {
          console.log(`[CRON] DB: Marked farewell_sent for ${updated[0].email}`);
        }
      } catch (err) {
        allSucceeded = false;
        console.error(`[CRON] ❌ Farewell send failed for ${user.email}:`, err.message);
        logger.error(`Farewell send failed for ${user.email}: ${err.message}`);
      }
    }

    if (allSucceeded) {
      break; // All farewells sent, exit slot
    } else {
      await sleep(retryInterval * 60 * 1000);
    }
    attempt++;
  }
}

// Job 6: Retry generation
/**
 * Retry daily guide generation (catch-up) slot for catastrophic earlier failure.
 * - Only runs if today’s guide is still missing at 18:00 UTC.
 * - Retries every retryInterval (default: 5m) within maxMinutes (default: 30m).
 * - Logs a FATAL error if the slot ends and the guide is still missing.
 */
async function runRetryFailedGenerationSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const date = todayUtc();
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    // Check if today's guide exists
    const guide = await loadGuideByDate(date);
    if (guide && guide['male_moveon'] && guide['male_moveon'].content) {
      console.log(`[CRON] [GEN-RETRY] Guide for ${date} exists — nothing to do.`);
      logger.info(`[GEN-RETRY] Guide for ${date} exists — nothing to do.`);
      break;
    }

    // Try to generate/catch-up
    try {
      console.log(`[CRON] [GEN-RETRY] (${attempt}/${maxRetries}) Attempting catch-up guide generation for ${date}`);
      logger.info(`[GEN-RETRY] (${attempt}/${maxRetries}) Attempting catch-up guide generation for ${date}`);
      await generateAndCacheDailyGuides();
      console.log(`[CRON] [GEN-RETRY] ✅ Catch-up generation complete for ${date}`);
      logger.info(`[GEN-RETRY] ✅ Catch-up generation complete for ${date}`);
      break;
    } catch (err) {
      console.error(`[CRON] [GEN-RETRY] Guide generation failed: ${err.message} (attempt ${attempt})`);
      logger.error(`[GEN-RETRY] Guide generation failed: ${err.message} (attempt ${attempt})`);
      if (attempt === maxRetries) {
        console.error(`[CRON] [GEN-RETRY] ❌ FATAL: All retry attempts failed for ${date}`);
        logger.error(`[GEN-RETRY] ❌ FATAL: All retry attempts failed for ${date}`);
        // Optionally: notify admin, escalate here if needed
        break;
      }
      await sleep(retryInterval * 60 * 1000);
    }
    attempt++;
  }
}

// Job 7: Retry delivery
/**
 * Final catch-all retry for failed email deliveries (premium & trial).
 * - Paid users: retry sending today’s guide.
 * - Trial users: retry sending correct trial day template.
 * - Retries each failed delivery only once in this slot.
 */
async function runRetryFailedDeliveriesSlot() {
  console.log('[CRON] 🔁 Starting unified final retry of failed email deliveries');
  logger.info('🔁 Starting unified final retry of failed email deliveries');

  // Step 1: Get all failed deliveries for past 24h, not already max-attempted
  let failures = [];
  try {
    ({ rows: failures } = await db.query(
      `SELECT user_id, email, variant, COUNT(*) AS attempts
       FROM delivery_log
       WHERE status='failed' AND sent_at > NOW() - INTERVAL '24 hours'
       GROUP BY user_id,email,variant
       HAVING COUNT(*) < 3
       LIMIT 100`
    ));
  } catch (err) {
    console.error('[CRON] Retry query failed:', err.message);
    logger.error(`Retry query failed: ${err.message}`);
    return;
  }

  if (!failures.length) {
    console.log('[CRON] No failed emails to retry');
    logger.info('No failed emails to retry');
    return;
  }

  // Cache premium guide and template ONCE
  const [premiumGuide, premiumTemplate] = await Promise.all([
    loadGuideByDate(todayUtc()),
    loadTemplate('premium_guide_email.html')
  ]);

  for (const { user_id, email, variant } of failures) {
    let html, subject;

    // Check if user is a trial user
    let trialUser = false;
    let trialDay = null;
    try {
      const { rows: users } = await db.query(
        `SELECT is_trial_user, usage_count, gender, goal_stage
        FROM users
        WHERE id = $1 AND unsubscribed = FALSE`, [user_id]
      );
      if (users.length && users[0].is_trial_user) {
        trialUser = true;
        trialDay = users[0].usage_count + 1; // Next expected trial day
        const gender = users[0].gender || 'neutral';
        const goal = users[0].goal_stage || 'reconnect';
        const templatePath = `trial/${gender}_${goal}_day${trialDay}.html`;
        try {
          html = await loadTemplate(templatePath);
        } catch {
          html = null;
        }
        subject = `Phoenix Protocol — Day ${trialDay}`;
      }
    } catch {}

    if (!trialUser) {
      // Premium (paid) user, use premium guide/template
      const section = premiumGuide?.[variant];
      if (!section?.content || !premiumTemplate) {
        console.warn(`[CRON] No guide/template for retry: ${variant} — skipping ${email}`);
        logger.warn(`No guide/template for retry: ${variant} — skipping ${email}`);
        continue;
      }
      html = premiumTemplate.replace('{{title}}', section.title).replace('{{content}}', marked.parse(section.content));
      subject = section.title;
    }

    if (!html) {
      console.warn(`[CRON] No email body for retry: ${variant} — skipping ${email}`);
      logger.warn(`No email body for retry: ${variant} — skipping ${email}`);
      continue;
    }

    try {
      await sendRawEmail(email, subject, html);
      console.log(`[CRON] ✅ Final retry sent: ${email}`);
      logger.info(`✅ Final retry sent: ${email}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status) VALUES ($1,$2,$3,'success')`,
        [user_id, email, variant]
      );
    } catch (err) {
      console.error(`[CRON] ❌ Final retry failed for ${email}:`, err.message);
      logger.error(`Final retry failed for ${email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message) VALUES ($1,$2,$3,'failed',$4)`,
        [user_id, email, variant, err.message]
      );
    }
  }
}

// Job 8: Delete old logs from DB
/**
 * Slot-based log pruning: attempts to prune old logs up to maxRetries in the slot.
 * Each attempt waits retryInterval minutes if pruning fails.
 * If pruning succeeds, stops further retries for this slot.
 */
async function runPruneOldLogsSlot({
  maxMinutes = 30,
  retryInterval = 5,
  sleep = ms => new Promise(res => setTimeout(res, ms))
} = {}) {
  const maxRetries = Math.ceil(maxMinutes / retryInterval);
  let attempt = 1;

  while (attempt <= maxRetries) {
    console.log(`[CRON] (${attempt}/${maxRetries}) 🧹 Attempting log pruning`);
    logger.info(`(${attempt}/${maxRetries}) 🧹 Attempting log pruning`);
    let allOk = true;

    const logs = [
      { table: 'guide_generation_logs', col: 'created_at' },
      { table: 'delivery_log', col: 'sent_at' },
      { table: 'daily_guides', col: 'date' },
      { table: 'email_retry_queue', col: 'created_at' },
      { table: 'fallback_logs', col: 'timestamp' }
    ];

    for (const { table, col } of logs) {
      try {
        const res = await db.query(
          `DELETE FROM ${table} WHERE ${col} < NOW() - INTERVAL '90 days'`
        );
        console.log(`[CRON] 🧹 Pruned ${res.rowCount} from ${table}`);
        logger.info(`🧹 Pruned ${res.rowCount} from ${table}`);
      } catch (err) {
        allOk = false;
        console.error(`[CRON] ❌ Prune failed for ${table}:`, err.message);
        logger.error(`❌ Prune failed for ${table}: ${err.message}`);
      }
    }

    if (allOk) {
      console.log(`[CRON] 🧹 Log pruning complete for slot`);
      logger.info(`🧹 Log pruning complete for slot`);
      break;
    }

    if (attempt === maxRetries) {
      console.error(`[CRON] ❌ All attempts exhausted. Pruning not fully completed this slot.`);
      logger.error(`❌ All attempts exhausted. Pruning not fully completed this slot.`);
      return;
    }

    await sleep(retryInterval * 60 * 1000);
    attempt++;
  }
}

// Schedule tasks
function startCron() {
  if (!validateEnv()) return;

  cron.schedule('0 12 * * *', async () => {
    if (!jobRunning.generate) {
      jobRunning.generate = true;
      try { await runGenerateDailyGuidesSlot(); } finally { jobRunning.generate = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 13 * * *', async () => {
    if (!jobRunning.trial) {
      jobRunning.trial = true;
      try { await runDeliverTrialEmailsSlot(); } finally { jobRunning.trial = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 14 * * *', async () => {
    if (!jobRunning.deliver) {
      jobRunning.deliver = true;
      try { await runDeliverDailyGuidesSlot(); } finally { jobRunning.deliver = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 15 * * *', async () => {
    if (!jobRunning.trialFarewell) {
      jobRunning.trialFarewell = true;
      try { await runSendTrialFarewellsSlot(); } finally { jobRunning.trialFarewell = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 16 * * *', async () => {
    if (!jobRunning.farewell) {
      jobRunning.farewell = true;
      try { await runSendFarewellEmailsSlot(); } finally { jobRunning.farewell = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 18 * * *', async () => {
    if (!jobRunning.generate) {
      jobRunning.generate = true;
      try { await runRetryFailedGenerationSlot(); } finally { jobRunning.generate = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 19 * * *', async () => {
    if (!jobRunning.retry) {
      jobRunning.retry = true;
      try { await runRetryFailedDeliveriesSlot(); } finally { jobRunning.retry = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 3 * * *', async () => {
    if (!jobRunning.prune) {
      jobRunning.prune = true;
      try { await runPruneOldLogsSlot(); } finally { jobRunning.prune = false; }
    }
  }, { timezone: 'Etc/UTC' });

}

module.exports = { startCron };

if (require.main === module) {
  main();
}
