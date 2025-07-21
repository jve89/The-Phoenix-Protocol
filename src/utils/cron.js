const cron = require('node-cron');
const db = require('../db/db');
const fs = require('fs').promises;
const path = require('path');
const { sendRawEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide, loadGuideByDate } = require('./content');
const { loadTemplate } = require('./loadTemplate');
const { logEvent } = require('./db_logger');
const { sendDailyGuideBackup } = require('./backup');

// Alias structured logger using db_logger
const logger = {
  info:  (msg) => logEvent('cron', 'info', msg),
  warn:  (msg) => logEvent('cron', 'warn', msg),
  error: (msg) => logEvent('cron', 'error', msg),
};

// Prevent overlapping runs
const jobRunning = {
  generate: false,
  deliver:  false,
  retry:    false,
  prune:    false
};

// Helper: YYYY-MM-DD in UTC
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

// Validate required environment variables
function validateEnv() {
  const required = ['SENDGRID_API_KEY', 'DATABASE_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing ENV ${key} — cron disabled`);
      return false;
    }
  }
  return true;
}

// Job 1: Generate & cache daily guides, then send admin backup
async function runGenerateDailyGuides() {
  logger.info('🚀 Starting daily guide generation');
  try {
    await generateAndCacheDailyGuides();
    logger.info('✅ Guide generation complete');
  } catch (err) {
    logger.error(`Guide generation failed: ${err.message}`);
    return;
  }

  const date = todayUtc();
  try {
    const guide = await loadGuideByDate(date);
    if (guide && process.env.ADMIN_EMAIL) {
      const adminHtml = (() => {
        let html = `<h1>Daily Guide Summary - ${date}</h1>`;
        for (const variant of ['male_moveon','male_reconnect','female_moveon','female_reconnect','neutral_moveon','neutral_reconnect']) {
          const section = guide[variant];
          if (section) {
            html += `<h2>${section.title}</h2><p>${section.content.replace(/\n/g,'<br>')}</p><hr>`;
          }
        }
        return html;
      })();

      try {
        await sendDailyGuideBackup(guide, adminHtml);
        logger.info('✅ Admin guide + backup sent');
      } catch (err) {
        logger.error(`Backup email failed: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Loading guide or sending backup failed: ${err.message}`);
  }
}

// Job 2: Deliver daily guides to users
async function runDeliverDailyGuides() {
  logger.info('📬 Starting guide delivery');
  let users;
  try {
    ({ rows: users } = await db.query(
      `SELECT id, email, gender, goal_stage, plan, plan_limit, usage_count
       FROM users
       WHERE plan IS NOT NULL AND plan > 0 AND usage_count < plan_limit`
    ));
  } catch (err) {
    logger.error(`User query failed: ${err.message}`);
    return;
  }
  if (!users.length) {
    logger.warn('No eligible subscribers to send');
    return;
  }

  const [template, guide] = await Promise.all([
    loadTemplate('premium_guide_email.html'),
    loadTodayGuide()
  ]);
  if (!template || !guide) {
    logger.error('Missing template or guide');
    return;
  }

  for (const user of users) {
    const variant = `${user.gender||'neutral'}_${user.goal_stage||'reconnect'}`;
    const guideContent = guide[variant];
    if (!guideContent) {
      logger.warn(`No guide for ${variant}, skipping ${user.email}`);
      continue;
    }

    const html = template
      .replace('{{title}}', guideContent.title)
      .replace('{{content}}', guideContent.content.replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>'));

    try {
      await sendRawEmail(user.email, guideContent.title, html);
      logger.info(`✅ Sent to ${user.email}`);

      // Log & update within a transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO delivery_log (user_id, email, variant, status, error_message)
           VALUES ($1,$2,$3,'success',NULL)` ,
          [user.id, user.email, variant]
        );
        const newUsage = user.usage_count + 1;
        await client.query(
          `UPDATE users SET usage_count=$1, first_guide_sent_at=NOW() WHERE id=$2`,
          [newUsage, user.id]
        );

        if (newUsage >= user.plan_limit) {
          await client.query(`UPDATE users SET plan=0 WHERE id=$1`, [user.id]);
          const farewellHtml = await fs.readFile(
            path.join(__dirname, '../../templates/farewell_email.html'), 'utf-8'
          );
          await sendRawEmail(user.email, 'Thank You for Using The Phoenix Protocol', farewellHtml);
          logger.info(`🔚 Final guide sent & unsubscribed: ${user.email}`);
          await client.query(
            `INSERT INTO delivery_log (user_id,email,variant,status,error_message)
             VALUES ($1,$2,$3,'info','final')`,
            [user.id, user.email, variant]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`DB transaction failed for ${user.email}: ${err.message}`);
      } finally {
        client.release();
      }

    } catch (err) {
      logger.error(`❌ Send failed for ${user.email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id, email, variant, status, error_message)
         VALUES ($1,$2,$3,'failed',$4)` ,
        [user.id, user.email, variant, err.message]
      );
    }
  }
}

// Job 3: Retry failed deliveries
async function runRetryFailedDeliveries() {
  logger.info('🔁 Starting retry of failed emails');
  let failures;
  try {
    ({ rows: failures } = await db.query(
      `SELECT user_id, email, variant, COUNT(*) AS attempts
       FROM delivery_log
       WHERE status='failed' AND sent_at > NOW() - INTERVAL '24 hours'
       GROUP BY user_id,email,variant
       HAVING COUNT(*) < $1
       LIMIT 50`,
      [3]
    ));
  } catch (err) {
    logger.error(`Retry query failed: ${err.message}`);
    return;
  }
  if (!failures.length) {
    logger.info('No failures to retry');
    return;
  }

  const [template, guide] = await Promise.all([
    loadTemplate('premium_guide_email.html'),
    loadGuideByDate(todayUtc())
  ]);

  for (const { user_id, email, variant } of failures) {
    const guideContent = guide?.[variant];
    if (!guideContent || !template) {
      logger.warn(`Missing guide or template for retry: ${variant}`);
      continue;
    }
    const html = template
      .replace('{{title}}', guideContent.title)
      .replace('{{content}}', guideContent.content.replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>'));

    try {
      await sendRawEmail(email, guideContent.title, html);
      logger.info(`✅ Retry sent: ${email}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status)
         VALUES ($1,$2,$3,'success')`,
        [user_id, email, variant]
      );
    } catch (err) {
      logger.error(`Retry failed for ${email}: ${err.message}`);
      await db.query(
        `INSERT INTO delivery_log (user_id,email,variant,status,error_message)
         VALUES ($1,$2,$3,'failed',$4)` ,
        [user_id, email, variant, err.message]
      );
    }
  }
}

// Job 4: Prune logs older than 90 days
async function runPruneOldLogs() {
  logger.info('🧹 Starting log pruning');
  const tables = [
    'guide_generation_logs',
    'delivery_log',
    'daily_guides',
    'email_retry_queue',
    'fallback_logs'
  ];
  for (const table of tables) {
    const col = table === 'fallback_logs' ? 'timestamp' : 'created_at';
    try {
      const res = await db.query(
        `DELETE FROM ${table} WHERE ${col} < NOW() - INTERVAL '90 days'`
      );
      logger.info(`Pruned ${res.rowCount} rows from ${table}`);
    } catch (err) {
      logger.error(`Prune failed for ${table}: ${err.message}`);
    }
  }
}

function startCron() {
  if (!validateEnv()) return;

  // Schedule jobs with overlap protection
  cron.schedule('0 15 * * *', async () => {
    if (jobRunning.generate) {
      logger.warn('Generate job already running, skipping');
      return;
    }
    jobRunning.generate = true;
    try { await runGenerateDailyGuides(); } finally { jobRunning.generate = false; }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 16 * * *', async () => {
    if (jobRunning.deliver) {
      logger.warn('Deliver job already running, skipping');
      return;
    }
    jobRunning.deliver = true;
    try { await runDeliverDailyGuides(); } finally { jobRunning.deliver = false; }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 17 * * *', async () => {
    if (jobRunning.retry) {
      logger.warn('Retry job already running, skipping');
      return;
    }
    jobRunning.retry = true;
    try { await runRetryFailedDeliveries(); } finally { jobRunning.retry = false; }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 3 * * *', async () => {
    if (jobRunning.prune) {
      logger.warn('Prune job already running, skipping');
      return;
    }
    jobRunning.prune = true;
    try { await runPruneOldLogs(); } finally { jobRunning.prune = false; }
  }, { timezone: 'Etc/UTC' });
}

// Export scheduler
module.exports = { startCron };
