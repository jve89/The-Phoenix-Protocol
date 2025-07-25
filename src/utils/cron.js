const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { sendRawEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logEvent } = require('./db_logger');
const { sendDailyGuideBackup } = require('./backup');
const { marked } = require('marked'); // Markdown to HTML converter

// Structured logger
const logger = {
  info:  msg => logEvent('cron', 'info', msg),
  warn:  msg => logEvent('cron', 'warn', msg),
  error: msg => logEvent('cron', 'error', msg)
};

const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];

// Prevent overlapping runs
const jobRunning = { generate: false, deliver: false, retry: false, prune: false };

// Helper: get YYYY-MM-DD in UTC
const todayUtc = () => new Date().toISOString().slice(0, 10);

// Validate critical envs
const validateEnv = () => {
  const required = ['SENDGRID_API_KEY', 'DATABASE_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing ENV ${key} — cron disabled`);
      return false;
    }
  }
  return true;
};

// Job 1: Generate & cache, then send admin backup
async function runGenerateDailyGuides() {
  console.log('[CRON] 🚀 Starting daily guide generation');
  logger.info('🚀 Starting daily guide generation');
  try {
    await generateAndCacheDailyGuides();
    console.log('[CRON] ✅ Guide generation complete');
    logger.info('✅ Guide generation complete');
  } catch (err) {
    console.error('[CRON] Guide generation failed:', err.message);
    logger.error(`Guide generation failed: ${err.message}`);
    return;
  }

  // Build and send admin backup
  const date = todayUtc();
  if (process.env.ADMIN_EMAIL) {
    try {
      const guide = await loadGuideByDate(date);
      if (guide) {
        // HTML for admin email body
        let adminHtml = `<h1>Daily Guide Summary - ${date}</h1>`;
        for (const variant of VARIANTS) {
          const section = guide[variant];
          if (!section?.content) {
            logger.warn(`[CRON] Missing content for variant ${variant} on ${date}`);
            continue; // skip to next variant
          }
          adminHtml += `<h2>${section.title}</h2>` + marked.parse(section.content) + '<hr/>';
        }

        // Write JSON + Markdown temp files for attachment
        const jsonPath = path.join(os.tmpdir(), `daily_guide_${date}.json`);
        const mdPath = path.join(os.tmpdir(), `daily_guide_${date}.md`);
        await fs.writeFile(jsonPath, JSON.stringify(guide, null, 2));

        // Build markdown string (not HTML!)
        let md = `# Daily Guide Summary - ${date}\n\n`;
        for (const variant of VARIANTS) {
          const section = guide[variant];
          if (section?.content) {
            md += `## ${section.title}\n\n${section.content.trim()}\n\n---\n`;
          }
        }
        await fs.writeFile(mdPath, md);

        // Send email using backup util, attach both
        await sendDailyGuideBackup(guide, adminHtml, [jsonPath, mdPath]);
        console.log('[CRON] ✅ Admin guide + backup sent');
        logger.info('✅ Admin guide + backup sent');
      }
    } catch (err) {
      console.error('[CRON] Backup email failed:', err.message);
      logger.error(`Backup email failed: ${err.message}`);
    }
  }
}

// Job 2: Deliver to users, rendering markdown
async function runDeliverDailyGuides() {
  console.log('[CRON] 📬 Starting guide delivery');
  logger.info('📬 Starting guide delivery');

  let users = [];
  try {
    ({ rows: users } = await db.query(
      `SELECT id, email, gender, goal_stage, plan_limit, usage_count
       FROM users
       WHERE plan IS NOT NULL AND plan > 0 AND usage_count < plan_limit`
    ));
  } catch (err) {
    console.error('[CRON] User query failed:', err.message);
    logger.error(`User query failed: ${err.message}`);
    return;
  }
  if (!users.length) {
    console.log('[CRON] No eligible subscribers to send');
    logger.warn('No eligible subscribers to send');
    return;
  }

  const [template, guide] = await Promise.all([
    loadTemplate('premium_guide_email.html'),
    loadTodayGuide()
  ]);
  if (!template || !guide) {
    console.error('[CRON] Missing template or guide');
    logger.error('Missing template or guide');
    return;
  }

  for (const user of users) {
    const variant = `${user.gender||'neutral'}_${user.goal_stage||'reconnect'}`;
    const section = guide[variant];
    if (!section?.content) {
      console.warn(`[CRON] No content for ${variant}, skipping ${user.email}`);
      logger.warn(`No content for ${variant}: ${user.email}`);
      continue;
    }

    const contentHtml = marked.parse(section.content);
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
      console.error(`[CRON] ❌ Send failed for ${user.email}:`, err.message);
      logger.error(`Send failed for ${user.email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message) VALUES ($1,$2,$3,'failed',$4)`,
        [user.id, user.email, variant, err.message]
      );
    }
  }
}

// Job 3: Retry failed deliveries
async function runRetryFailedDeliveries() {
  console.log('[CRON] 🔁 Starting retry of failed emails');
  logger.info('🔁 Starting retry of failed emails');

  let failures = [];
  try {
    ({ rows: failures } = await db.query(
      `SELECT user_id, email, variant, COUNT(*) AS attempts
       FROM delivery_log
       WHERE status='failed' AND sent_at > NOW() - INTERVAL '24 hours'
       GROUP BY user_id,email,variant
       HAVING COUNT(*) < 3
       LIMIT 50`
    ));
  } catch (err) {
    console.error('[CRON] Retry query failed:', err.message);
    logger.error(`Retry query failed: ${err.message}`);
    return;
  }
  if (!failures.length) {
    console.log('[CRON] No failures to retry');
    logger.info('No failures to retry');
    return;
  }

  const [template, guide] = await Promise.all([
    loadTemplate('premium_guide_email.html'),
    loadGuideByDate(todayUtc())
  ]);

  for (const { user_id, email, variant } of failures) {
    const section = guide?.[variant];
    if (!section?.content || !template) {
      console.warn(`[CRON] Missing guide or template for retry: ${variant}`);
      logger.warn(`Missing guide or template for retry: ${variant}`);
      continue;
    }

    const contentHtml = marked.parse(section.content);
    const html = template
      .replace('{{title}}', section.title)
      .replace('{{content}}', contentHtml);

    try {
      await sendRawEmail(email, section.title, html);
      console.log(`[CRON] ✅ Retry sent: ${email}`);
      logger.info(`✅ Retry sent: ${email}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status) VALUES ($1,$2,$3,'success')`,
        [user_id, email, variant]
      );
    } catch (err) {
      console.error(`[CRON] ❌ Retry failed for ${email}:`, err.message);
      logger.error(`Retry failed for ${email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message) VALUES ($1,$2,$3,'failed',$4)`,
        [user_id, email, variant, err.message]
      );
    }
  }
}

// Job 4: Prune logs older than 90 days
async function runPruneOldLogs() {
  console.log('[CRON] 🧹 Starting log pruning');
  logger.info('🧹 Starting log pruning');

  const tables = ['guide_generation_logs','delivery_log','daily_guides','email_retry_queue','fallback_logs'];
  for (const table of tables) {
    const col = table === 'fallback_logs' ? 'timestamp' : 'created_at';
    try {
      const res = await db.query(`DELETE FROM ${table} WHERE ${col} < NOW() - INTERVAL '90 days'`);
      console.log(`[CRON] 🧹 Pruned ${res.rowCount} from ${table}`);
      logger.info(`Pruned ${res.rowCount} from ${table}`);
    } catch (err) {
      console.error(`[CRON] ❌ Prune failed for ${table}:`, err.message);
      logger.error(`Prune failed for ${table}: ${err.message}`);
    }
  }
}

// utils/cron.js (add after runDeliverDailyGuides)

// Job 5: Send farewell email to users who maxed out their plan and haven’t received farewell yet
async function runSendFarewellEmails() {
  console.log('[CRON] 💌 Checking for farewell emails');
  logger.info('💌 Checking for farewell emails');
  // Select users who maxed out plan and haven't been sent farewell
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
    return;
  }
  if (!users.length) {
    console.log('[CRON] No farewells to send');
    return;
  }
  // Load template ONCE
  let farewellHtml;
  try {
    farewellHtml = await loadTemplate('farewell_email.html');
  } catch (err) {
    console.error('[CRON] Could not load farewell email template:', err.message);
    return;
  }
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
      console.error(`[CRON] ❌ Farewell send failed for ${user.email}:`, err.message);
      logger.error(`Farewell send failed for ${user.email}: ${err.message}`);
    }
  }
}

// Schedule tasks
function startCron() {
  if (!validateEnv()) return;

  cron.schedule('0 15 * * *', async () => {
    if (!jobRunning.generate) {
      jobRunning.generate = true;
      try { await runGenerateDailyGuides(); } finally { jobRunning.generate = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 16 * * *', async () => {
    if (!jobRunning.deliver) {
      jobRunning.deliver = true;
      try { await runDeliverDailyGuides(); } finally { jobRunning.deliver = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('5 16 * * *', async () => {
    if (!jobRunning.farewell) {
      jobRunning.farewell = true;
      try { await runSendFarewellEmails(); } finally { jobRunning.farewell = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 17 * * *', async () => {
    if (!jobRunning.retry) {
      jobRunning.retry = true;
      try { await runRetryFailedDeliveries(); } finally { jobRunning.retry = false; }
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 3 * * *', async () => {
    if (!jobRunning.prune) {
      jobRunning.prune = true;
      try { await runPruneOldLogs(); } finally { jobRunning.prune = false; }
    }
  }, { timezone: 'Etc/UTC' });
}

module.exports = { startCron };
