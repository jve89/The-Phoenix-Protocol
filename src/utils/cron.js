require('dotenv').config();
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { sendEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide } = require('./content');

function startCron() {
  console.log('[CRON] Subscription expiry and tip job scheduled.');

  // 🚀 Generate and cache premium guides daily at 15:55 UTC
  cron.schedule('55 15 * * *', async () => {
    console.log(`[CRON] Generating and caching premium guides: ${new Date().toISOString()}`);
    await generateAndCacheDailyGuides();
  });

  // 🚀 Send daily premium guide at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    console.log(`[CRON] Sending premium guides: ${new Date().toISOString()}`);
    const db = new sqlite3.Database('users.db', (err) => {
      if (err) console.error('[CRON] DB error:', err);
    });

    db.all(`SELECT email, gender FROM users WHERE plan != 'free'`, [], async (err, rows) => {
      if (err) {
        console.error('[CRON] Tip query error:', err);
      } else if (!rows.length) {
        console.log('[CRON] No active users to send tips to.');
      } else {
        for (const user of rows) {
          try {
            const guide = loadTodayGuide(user.gender);
            if (!guide) {
              console.error(`[CRON] No cached guide available for ${user.gender}, skipping ${user.email}`);
              continue;
            }
            const subject = guide.title || 'Your Phoenix Protocol Premium Guide';
            const htmlContent = `<h1>${guide.title}</h1>\n${guide.content}\n<p>— The Phoenix Protocol</p>`;

            await sendEmail(user.email, subject, htmlContent);
            console.log(`[CRON] Premium guide sent to ${user.email}`);
          } catch (err) {
            console.error(`[CRON] Email error for ${user.email}:`, err.message);
          }
        }
      }
      db.close(err => {
        if (err) {
          console.error('[CRON] DB close error:', err);
        } else {
          console.log('[CRON] Database connection closed.');
        }
      });
    });
  });

  // ✅ Subscription expiry check at midnight (unchanged)
  cron.schedule('0 0 * * *', async () => {
    console.log(`[CRON] Running subscription expiry check: ${new Date().toISOString()}`);
    const db = new sqlite3.Database('users.db', (err) => {
      if (err) console.error('[CRON] DB error:', err);
    });

    db.all(`SELECT id, email, plan, end_date FROM users WHERE end_date IS NOT NULL AND end_date <= date('now')`, [], async (err, rows) => {
      if (err) {
        console.error('[CRON] Expiry query error:', err);
      } else if (!rows.length) {
        console.log('[CRON] No users to downgrade.');
      } else {
        let downgradedCount = 0;
        for (const user of rows) {
          db.run(`UPDATE users SET plan = 'free', end_date = NULL WHERE id = ?`, [user.id], async (err) => {
            if (err) {
              console.error(`[CRON] Update error for ${user.email}:`, err);
            } else {
              console.log(`[CRON] Expired ${user.email}, downgraded to free.`);
              downgradedCount++;
              try {
                await sendEmail(user.email, 'Subscription Expired', '<p>Your plan is now free—renew for full access!</p>');
                console.log(`[CRON] Expiry notice sent to ${user.email}`);
              } catch (err) {
                console.error('[CRON] Expiry email error:', err.message);
              }
            }
          });
        }
        console.log(`[CRON] Downgraded ${downgradedCount} users.`);
      }
      db.close(err => {
        if (err) {
          console.error('[CRON] DB close error:', err);
        } else {
          console.log('[CRON] Database connection closed.');
        }
      });
    });
  });
}

module.exports = { startCron };
