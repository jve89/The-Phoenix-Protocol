// Load critical envs
require('./loadEnv');

// Core dependencies
const cron = require('node-cron');
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

// Prevent overlapping runs
const jobRunning = {
  generatePaid: false,
  deliverTrial: false,
  deliverPaid: false,
  maintenance: false
};

const todayUtc = () => new Date().toISOString().slice(0, 10);

// Structured logger
const logger = {
  info:  msg => logEvent('cron', 'info', msg),
  warn:  msg => logEvent('cron', 'warn', msg),
  error: msg => logEvent('cron', 'error', msg),
  debug: msg => console.log('[DEBUG]', msg),
};

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

/**
 * 1. Generate & cache guides for paid users (12:00 UTC)
 */
async function runGeneratePaidSlot() {
  const date = todayUtc();
  const existing = await loadGuideByDate(date);
  const allVariantsPresent = VARIANTS.every(
    variant => existing?.[variant]?.content?.trim()?.length > 100
  );
  if (allVariantsPresent) {
    logger.info(`Guide for ${date} already exists. Slot complete.`);
    const backupLog = await db.query(
      `SELECT 1 FROM guide_generation_logs
      WHERE DATE(created_at) = $1 AND message ILIKE '%Admin guide + backup sent%' LIMIT 1`, [date]
    );
    if (backupLog.rowCount > 0) {
      logger.info(`Admin backup already sent for ${date}. Skipping.`);
      return;
    }
  } else {
    try {
      logger.info(`🚀 Generating daily guides for ${date}`);
      await generateAndCacheDailyGuides();
      logger.info(`✅ Guide generation complete for ${date}`);
    } catch (err) {
      logger.error(`Guide generation failed for ${date}: ${err.message}`);
      return;
    }
  }

  try {
    logger.debug('📅 Date passed to loadGuideByDate:', date);
    const guide = await loadGuideByDate(date);
    logger.debug('📦 Loaded guide object:', guide);
    const allVariantsPresent = VARIANTS.every(
      variant => guide?.[variant]?.content?.trim()?.length > 100
    );
    for (const variant of VARIANTS) {
      if (!guide?.[variant]?.content || guide[variant].content.trim().length <= 100) {
        logger.warn(`[DEBUG] Variant missing or too short: ${variant} (len=${guide?.[variant]?.content?.length || 0})`);
      }
    }

    if (!allVariantsPresent) {
      logger.warn(`⚠️ Guide incomplete for ${date}, skipping backup.`);
      return;
    }

    if (process.env.ADMIN_EMAIL) {
      const { isValid, warnings } = validateGuideContent(guide, VARIANTS);
      let warningBlockHtml = '';
      if (!isValid && warnings.length) {
        logger.warn('⚠️ Guide warnings: ' + warnings.join(' | '));
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
      logger.debug('🧪 Guide keys included in email:', Object.keys(guide));
      await sendRawEmail(process.env.ADMIN_EMAIL, `📦 Daily Guide Backup – ${date}`, adminHtml);
      logger.info('✅ Admin guide + backup sent');
    }
  } catch (err) {
    logger.error(`Backup email failed: ${err.message}`);
  }
}

/**
 * 2. Deliver trial guides & farewells (13:00 UTC)
 */
async function runDeliverTrialSlot() {
  let users;
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
    logger.error(`Trial user query failed: ${err.message}`);
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
      logger.error(`Missing trial template ${templatePath}: ${err.message}`);
      continue;
    }
    const subject = `Phoenix Protocol — Day ${day}`;
    const variant = `${gender}_${goal}`;
    try {
      await sendRawEmail(user.email, subject, html);
      logger.info(`✅ Trial Day ${day} sent: ${user.email}`);
      await logDelivery(user.id, user.email, variant, 'success', null, 'trial');
      await db.query(
        `UPDATE users SET 
            usage_count = usage_count + 1,
            last_trial_sent_at = NOW(),
            trial_started_at = COALESCE(trial_started_at, NOW())
          WHERE id = $1`,
        [user.id]
      );
    } catch (err) {
      logger.error(`Trial send failed for ${user.email}: ${err.message}`);
      await logDelivery(user.id, user.email, variant, 'failed', err.message, 'trial');
    }
  }

  try {
    const { rows: farewellUsers } = await db.query(
      `SELECT id, email FROM users
       WHERE is_trial_user = TRUE
         AND usage_count >= 3
         AND trial_farewell_sent_at IS NULL`
    );
    if (!farewellUsers.length) return;
    const html = await loadTemplate('trial_farewell.html');
    for (const user of farewellUsers) {
      try {
        const subject = 'Your Trial with The Phoenix Protocol Has Ended';
        await sendRawEmail(user.email, subject, html);
        await db.query(
          `UPDATE users SET 
              unsubscribed = TRUE, 
              trial_farewell_sent_at = NOW()
            WHERE id = $1`,
          [user.id]
        );
        logger.info(`🟣 Trial farewell sent: ${user.email}`);
      } catch (err) {
        logger.error(`Farewell trial email failed for ${user.email}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Farewell trial user query failed: ${err.message}`);
  }
}

/**
 * 3. Deliver paid guides & farewells (14:00 UTC)
 */
async function runDeliverPaidSlot() {
  let users;
  try {
    ({ rows: users } = await db.query(
      `SELECT id, email, gender, goal_stage, plan_limit, usage_count, paid_farewell_sent_at
       FROM users
       WHERE plan IS NOT NULL
         AND plan > 0
         AND (is_trial_user IS NULL OR is_trial_user = FALSE)
         AND unsubscribed = FALSE`
    ));
  } catch (err) {
    logger.error(`Paid user query failed: ${err.message}`);
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
    logger.error('Missing template or guide: ' + err.message);
    return;
  }

  for (const user of users) {
    const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
    if (user.usage_count >= user.plan_limit) {
      if (!user.paid_farewell_sent_at) {
        try {
          await sendRawEmail(user.email, "Thank You for Using The Phoenix Protocol", farewellHtml);
          await db.query(
            `UPDATE users SET 
                unsubscribed = TRUE, 
                paid_farewell_sent_at = NOW()
              WHERE id = $1`,
            [user.id]
          );
          logger.info(`🟣 Paid farewell sent: ${user.email}`);
        } catch (err) {
          logger.error(`Paid farewell send failed for ${user.email}: ${err.message}`);
        }
      }
      continue;
    }

    const section = guide[variant];
    if (!section?.content) {
      logger.warn(`No content for ${variant}: ${user.email}`);
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
      logger.info(`✅ Guide sent: ${user.email}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,delivery_type) VALUES ($1,$2,$3,'success','paid')`,
        [user.id, user.email, variant]
      );
      await db.query(
        `UPDATE users SET 
            usage_count = usage_count + 1,
            paid_started_at = COALESCE(paid_started_at, NOW()),
            last_paid_sent_at = NOW()
          WHERE id = $1`,
        [user.id]
      );
    } catch (err) {
      logger.error(`Paid send failed for ${user.email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message,delivery_type) VALUES ($1,$2,$3,'failed',$4,'paid')`,
        [user.id, user.email, variant, err.message]
      );
    }
  }
}

/**
 * 4. System maintenance slot (03:00 UTC)
 */
async function runMaintenanceSlot() {
  logger.info('🔧 Starting system maintenance slot');
  const logTables = [
    { table: 'guide_generation_logs', col: 'created_at' },
    { table: 'delivery_log', col: 'sent_at' },
    { table: 'daily_guides', col: 'date' }
  ];
  for (const { table, col } of logTables) {
    try {
      const res = await db.query(
        `DELETE FROM ${table} WHERE ${col} < NOW() - INTERVAL '90 days'`
      );
      logger.info(`🧹 Pruned ${res.rowCount} from ${table}`);
    } catch (err) {
      logger.error(`❌ Prune failed for ${table}: ${err.message}`);
    }
  }
  logger.info('✅ Maintenance slot complete');
}

/**
 * On-boot audit and catch-up — never miss a slot.
 */
async function auditAndCatchUp() {
  const date = todayUtc();

  // 1. Guide generation catch-up
  const guide = await loadGuideByDate(date);
  const allVariantsPresent = VARIANTS.every(
    variant => guide?.[variant]?.content?.trim()?.length > 100
  );
  if (!allVariantsPresent) {
    logger.warn(`[BOOT] Guide for ${date} missing or incomplete. Generating now.`);
    await runGeneratePaidSlot();
  } else {
    logger.info(`[BOOT] Guide for ${date} present. No generation needed.`);
  }

  // 2. Paid guide delivery catch-up (do not repeat, only if usage lags)
  // This only runs if guides are present.
  if (allVariantsPresent) {
    let users;
    try {
      ({ rows: users } = await db.query(
        `SELECT id, email, gender, goal_stage, plan_limit, usage_count, paid_farewell_sent_at
         FROM users
         WHERE plan IS NOT NULL
           AND plan > 0
           AND (is_trial_user IS NULL OR is_trial_user = FALSE)
           AND unsubscribed = FALSE`
      ));
    } catch (err) {
      logger.error(`[BOOT] Paid user query failed: ${err.message}`);
      users = [];
    }

    let deliveryPending = false;
    for (const user of users) {
      const variant = `${user.gender || 'neutral'}_${user.goal_stage || 'reconnect'}`;
      if (
        user.usage_count < user.plan_limit &&
        guide[variant] &&
        guide[variant].content &&
        guide[variant].content.trim().length > 100
      ) {
        deliveryPending = true;
        break;
      }
    }

    if (deliveryPending) {
      logger.warn(`[BOOT] Paid guide delivery pending for some users. Delivering now.`);
      await runDeliverPaidSlot();
    } else {
      logger.info(`[BOOT] All paid user deliveries up to date.`);
    }
  }

  // 3. Trial guide/farewell catch-up — similar logic could be added if desired.
  // For now, only paid content is fully autopiloted.
}

/**
 * Schedule tasks (UTC)
 */
function startCron() {
  if (!validateEnv()) return;

  cron.schedule('0 12 * * *', async () => {
    if (!jobRunning.generatePaid) {
      jobRunning.generatePaid = true;
      try { await runGeneratePaidSlot(); } finally { jobRunning.generatePaid = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 13 * * *', async () => {
    if (!jobRunning.deliverTrial) {
      jobRunning.deliverTrial = true;
      try { await runDeliverTrialSlot(); } finally { jobRunning.deliverTrial = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 14 * * *', async () => {
    if (!jobRunning.deliverPaid) {
      jobRunning.deliverPaid = true;
      try { await runDeliverPaidSlot(); } finally { jobRunning.deliverPaid = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 3 * * *', async () => {
    if (!jobRunning.maintenance) {
      jobRunning.maintenance = true;
      try { await runMaintenanceSlot(); } finally { jobRunning.maintenance = false; }
    }
  }, { timezone: 'Etc/UTC' });
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
    console.error('[CRON] ❌ No job name provided. Usage: node src/utils/cron.js <jobName>');
    return;
  }
  const fn = jobMap[job];
  if (!fn) {
    console.error(`[CRON] ❌ Unknown job: ${job}`);
    return;
  }
  try {
    console.log(`[CRON] ▶️ Starting job: ${job}`);
    await fn();
    console.log(`[CRON] ✅ Job complete: ${job}`);
  } catch (err) {
    console.error(`[CRON] ❌ Job failed: ${err.message}`);
  }
}

// Export both startCron and auditAndCatchUp for clean main entry use
module.exports = { startCron, auditAndCatchUp };

if (require.main === module) {
  main();
}
