// Load critical envs
require('./loadEnv');

// Core dependencies
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// App modules
const { sendRawEmail, renderEmailMarkdown } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logEvent, logDelivery } = require('./db_logger');
const { marked } = require('marked');
const { validateGuideContent } = require('./validateGuide');

const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];

const todayUtc = () => new Date().toISOString().slice(0, 10);

const logger = {
  info:  msg => logEvent('cron_retry', 'info', msg),
  warn:  msg => logEvent('cron_retry', 'warn', msg),
  error: msg => logEvent('cron_retry', 'error', msg),
  debug: msg => console.log('[DEBUG]', msg),
};

/**
 * Retry: Generate & cache guides for paid users, only if missing
 */
async function runGeneratePaidSlot() {
  const date = todayUtc();
  const existing = await loadGuideByDate(date);
  const allVariantsPresent = VARIANTS.every(
    variant => existing?.[variant]?.content?.trim()?.length > 100
  );
  if (allVariantsPresent) {
    logger.info(`Retry: Guide for ${date} already exists. Skipping.`);
    return;
  }
  logger.info(`Retry: Guide for ${date} missing. Generating now.`);
  try {
    await generateAndCacheDailyGuides();
    logger.info(`Retry: Guide generation complete for ${date}`);
  } catch (err) {
    logger.error(`Retry: Guide generation failed for ${date}: ${err.message}`);
    return;
  }

  // Admin backup (same as main)
  try {
    const guide = await loadGuideByDate(date);
    const allVariantsPresent = VARIANTS.every(
      variant => guide?.[variant]?.content?.trim()?.length > 100
    );
    if (!allVariantsPresent) {
      logger.warn(`Retry: Guide incomplete for ${date}, skipping backup.`);
      return;
    }
    if (process.env.ADMIN_EMAIL) {
      const { isValid, warnings } = validateGuideContent(guide, VARIANTS);
      let warningBlockHtml = '', warningBlockMd = '';
      if (!isValid && warnings.length) {
        logger.warn('Retry: Guide warnings: ' + warnings.join(' | '));
        warningBlockHtml = `<div style="background:#fff3cd;padding:10px;border-left:5px solid #ffc107;margin-bottom:20px;"><strong>⚠️ Guide Warnings:</strong><ul>` +
          warnings.map(w => `<li>${w}</li>`).join('') + `</ul></div>`;
        warningBlockMd = warnings.map(w => `> ⚠️ ${w}`).join('\n') + '\n\n---\n';
      }
      const emailPreviewHtml = await renderEmailMarkdown(guide);
      const adminHtml = `<h1>Daily Guide Summary - ${date}</h1>` + warningBlockHtml + emailPreviewHtml;
      const mdPath = path.join(os.tmpdir(), `daily_guide_${date}.md`);
      const jsonPath = path.join(os.tmpdir(), `daily_guide_${date}.json`);
      let md = `# Daily Guide Summary - ${date}\n\n` + warningBlockMd;
      for (const variant of VARIANTS) {
        const section = guide[variant];
        if (section?.content) {
          md += `## ${section.title}\n\n${section.content.trim()}\n\n---\n`;
        }
      }
      await fs.writeFile(jsonPath, JSON.stringify(guide, null, 2));
      await fs.writeFile(mdPath, md);
      await sendRawEmail(process.env.ADMIN_EMAIL, `📦 [RETRY] Daily Guide Backup – ${date}`, adminHtml, [jsonPath, mdPath]);
      logger.info('Retry: Admin guide + backup sent');
      await fs.unlink(jsonPath).catch(() => {});
      await fs.unlink(mdPath).catch(() => {});
    }
  } catch (err) {
    logger.error(`Retry: Backup email failed: ${err.message}`);
  }
}

/**
 * Retry: Deliver trial emails & farewells to only those missed today
 */
async function runDeliverTrialSlot() {
  let users;
  try {
    ({ rows: users } = await db.query(
      `SELECT id, email, usage_count, gender, goal_stage, last_trial_sent_at
       FROM users
       WHERE is_trial_user = TRUE
         AND unsubscribed = FALSE
         AND usage_count < 3
         AND (last_trial_sent_at IS NULL OR last_trial_sent_at::date != CURRENT_DATE)`
    ));
  } catch (err) {
    logger.error(`Retry: Trial user query failed: ${err.message}`);
    return;
  }

  for (const user of users) {
    const day = user.usage_count + 1;
    const gender = user.gender || 'neutral';
    const goal = user.goal_stage || 'reconnect';
    const templatePath = `trial/${gender}_${goal}_day${day}.html`;
    let html;
    try {
      html = await loadTemplate(templatePath);
    } catch (err) {
      logger.error(`Retry: Missing trial template ${templatePath}: ${err.message}`);
      continue;
    }
    const subject = `Phoenix Protocol — Day ${day} [RETRY]`;
    const variant = `${gender}_${goal}`;
    try {
      await sendRawEmail(user.email, subject, html);
      logger.info(`Retry: Trial Day ${day} sent: ${user.email}`);
      await logDelivery(user.id, user.email, variant, 'success', null, 'trial');
      await db.query(
        `UPDATE users SET usage_count = usage_count + 1,
                          last_trial_sent_at = NOW(),
                          first_guide_sent_at = COALESCE(first_guide_sent_at, NOW())
         WHERE id = $1`,
        [user.id]
      );
    } catch (err) {
      logger.error(`Retry: Trial send failed for ${user.email}: ${err.message}`);
      await logDelivery(user.id, user.email, variant, 'failed', err.message, 'trial');
    }
  }

  // Farewell (only those not already sent)
  try {
    const { rows: farewellUsers } = await db.query(
      `SELECT id, email FROM users
       WHERE is_trial_user = TRUE
         AND usage_count >= 3
         AND farewell_sent = FALSE`
    );
    if (!farewellUsers.length) return;
    const html = await loadTemplate('trial_farewell.html');
    if (!html) throw new Error('Missing trial_farewell.html');
    for (const user of farewellUsers) {
      try {
        const subject = 'Your Trial with The Phoenix Protocol Has Ended [RETRY]';
        await sendRawEmail(user.email, subject, html);
        await db.query(
          `UPDATE users SET farewell_sent = TRUE, unsubscribed = TRUE WHERE id = $1`,
          [user.id]
        );
        logger.info(`Retry: Trial farewell sent: ${user.email}`);
      } catch (err) {
        logger.error(`Retry: Farewell trial email failed for ${user.email}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Retry: Farewell trial user query failed: ${err.message}`);
  }
}

/**
 * Retry: Deliver paid guides & farewells only to those missed today
 */
async function runDeliverPaidSlot() {
  let users;
  try {
    ({ rows: users } = await db.query(
      `SELECT id, email, gender, goal_stage, plan_limit, usage_count, farewell_sent, first_guide_sent_at
       FROM users
       WHERE plan IS NOT NULL
         AND plan > 0
         AND (is_trial_user IS NULL OR is_trial_user = FALSE)
         AND unsubscribed = FALSE`
    ));
  } catch (err) {
    logger.error(`Retry: Paid user query failed: ${err.message}`);
    return;
  }

  let template, guide, farewellHtml;
  try {
    [template, guide, farewellHtml] = await Promise.all([
      loadTemplate('premium_guide_email.html'),
      loadTodayGuide(),
      loadTemplate('farewell_email.html')
    ]);
  } catch (err) {
    logger.error('Retry: Missing template or guide: ' + err.message);
    return;
  }

  for (const user of users) {
    const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;

    // Skip if user already completed plan
    if (user.usage_count >= user.plan_limit) {
      if (!user.farewell_sent) {
        try {
          await sendRawEmail(user.email, "Thank You for Using The Phoenix Protocol [RETRY]", farewellHtml);
          await db.query(
            `UPDATE users SET farewell_sent = TRUE, unsubscribed = TRUE WHERE id = $1`,
            [user.id]
          );
          logger.info(`Retry: Farewell sent: ${user.email}`);
        } catch (err) {
          logger.error(`Retry: Farewell send failed for ${user.email}: ${err.message}`);
        }
      }
      continue;
    }

    // **Check if today's email was already sent**
    const alreadySent = user.first_guide_sent_at &&
      new Date(user.first_guide_sent_at).toISOString().slice(0, 10) === todayUtc() &&
      user.usage_count > 0;

    if (alreadySent) {
      logger.info(`Retry: Guide for ${user.email} already sent today. Skipping.`);
      continue;
    }

    const section = guide[variant];
    if (!section?.content) {
      logger.warn(`Retry: No content for ${variant}: ${user.email}`);
      continue;
    }

    let contentHtml;
    try {
      contentHtml = marked.parse(section.content);
    } catch (err) {
      logger.error(`Retry: Markdown parse failed for ${variant}: ${err.message}`);
      continue;
    }

    const html = template
      .replace('{{title}}', section.title)
      .replace('{{content}}', contentHtml);

    try {
      await sendRawEmail(user.email, section.title + ' [RETRY]', html);
      logger.info(`Retry: Guide sent: ${user.email}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,delivery_type) VALUES ($1,$2,$3,'success','paid')`,
        [user.id, user.email, variant]
      );
      await db.query(
        `UPDATE users SET usage_count = usage_count + 1,
                          first_guide_sent_at = COALESCE(first_guide_sent_at, NOW())
         WHERE id = $1`,
        [user.id]
      );
    } catch (err) {
      logger.error(`Retry: Send failed for ${user.email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message,delivery_type) VALUES ($1,$2,$3,'failed',$4,'paid')`,
        [user.id, user.email, variant, err.message]
      );
    }
  }
}

/**
 * Retry: System maintenance (idempotent)
 */
async function runMaintenanceSlot() {
  logger.info('Retry: 🔧 Starting system maintenance slot');
  const logTables = [
    { table: 'guide_generation_logs', col: 'created_at' },
    { table: 'delivery_log', col: 'sent_at' },
    { table: 'daily_guides', col: 'date' },
    { table: 'fallback_logs', col: 'timestamp' }
  ];
  for (const { table, col } of logTables) {
    try {
      const res = await db.query(
        `DELETE FROM ${table} WHERE ${col} < NOW() - INTERVAL '90 days'`
      );
      logger.info(`Retry: 🧹 Pruned ${res.rowCount} from ${table}`);
    } catch (err) {
      logger.error(`Retry: ❌ Prune failed for ${table}: ${err.message}`);
    }
  }
  logger.info('Retry: ✅ Maintenance slot complete');
}

/**
 * CLI job map for manual triggering
 */
const jobMap = {
  generatePaid: runGeneratePaidSlot,
  deliverTrial: runDeliverTrialSlot,
  deliverPaid: runDeliverPaidSlot,
  maintenance: runMaintenanceSlot
};

async function main() {
  const job = process.argv[2];
  if (!job) {
    console.error('[CRON-RETRY] ❌ No job name provided. Usage: node src/utils/cron_retry.js <jobName>');
    return;
  }
  const fn = jobMap[job];
  if (!fn) {
    console.error(`[CRON-RETRY] ❌ Unknown job: ${job}`);
    return;
  }
  try {
    console.log(`[CRON-RETRY] ▶️ Starting job: ${job}`);
    await fn();
    console.log(`[CRON-RETRY] ✅ Job complete: ${job}`);
  } catch (err) {
    console.error(`[CRON-RETRY] ❌ Job failed: ${err.message}`);
  }
}

if (require.main === module) {
  main();
}
