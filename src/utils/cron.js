require('dotenv').config();
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { sendEmail } = require('./email');
const { generateAndCacheDailyGuides, loadTodayGuide } = require('./content');

function startCron() {
  console.log('[CRON] Subscription expiry, guide generation, and premium email schedule active.');

  // 1️⃣ Generate & cache premium guides daily at 15:55 UTC
  cron.schedule('55 15 * * *', async () => {
    console.log(`[CRON] Generating and caching premium guides: ${new Date().toISOString()}`);
    try {
      await generateAndCacheDailyGuides();
    } catch (err) {
      console.error('[CRON] Guide generation error:', err.message);
    }
  });

  // 2️⃣ Send premium guide to all active users daily at 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    console.log(`[CRON] Sending premium guides: ${new Date().toISOString()}`);
    const db = new sqlite3.Database('users.db', (err) => {
      if (err) return console.error('[CRON] DB error:', err);
    });

    db.all(`SELECT email, gender FROM users WHERE plan != 'free'`, [], async (err, rows) => {
      if (err) {
        console.error('[CRON] User query error:', err);
      } else if (!rows.length) {
        console.log('[CRON] No active users to send guides to.');
      } else {
        const todayGuide = loadTodayGuide();
        if (!todayGuide) {
          console.error('[CRON] No cached guide found for today, aborting email send.');
          return;
        }

        for (const user of rows) {
          try {
            let guide;
            if (user.gender === 'male') guide = todayGuide.male;
            else if (user.gender === 'female') guide = todayGuide.female;
            else guide = todayGuide.neutral;

            if (!guide) {
              console.error(`[CRON] Missing guide for gender ${user.gender}, skipping ${user.email}`);
              continue;
            }

            const subject = guide.title || 'Your Daily Phoenix Protocol Guide';
            const htmlContent = `<h1>${guide.title}</h1>\n${guide.content}\n<p>— The Phoenix Protocol</p>`;

            await sendEmail(user.email, subject, htmlContent);
            console.log(`[CRON] Guide sent to ${user.email}`);
          } catch (err) {
            console.error(`[CRON] Error sending to ${user.email}:`, err.message);
          }
        }
      }

      db.close((err) => {
        if (err) console.error('[CRON] DB close error:', err);
        else console.log('[CRON] Database connection closed.');
      });
    });
  });

  // 3️⃣ Downgrade expired subscriptions at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    console.log(`[CRON] Checking for expired subscriptions: ${new Date().toISOString()}`);
    const db = new sqlite3.Database('users.db', (err) => {
      if (err) return console.error('[CRON] DB error:', err);
    });

    db.all(`SELECT id, email FROM users WHERE end_date IS NOT NULL AND end_date <= date('now')`, [], async (err, rows) => {
      if (err) {
        console.error('[CRON] Expiry query error:', err);
      } else if (!rows.length) {
        console.log('[CRON] No users to downgrade today.');
      } else {
        for (const user of rows) {
          db.run(`UPDATE users SET plan = 'free', end_date = NULL WHERE id = ?`, [user.id], async (err) => {
            if (err) {
              console.error(`[CRON] Downgrade error for ${user.email}:`, err);
            } else {
              console.log(`[CRON] Downgraded ${user.email} to free plan.`);
              try {
                await sendEmail(
                  user.email,
                  'Your Subscription Has Ended',
                  '<p>Your premium plan has ended, and you are now on the free plan. Renew anytime for continued premium guidance.</p>'
                );
                console.log(`[CRON] Expiry notice sent to ${user.email}`);
              } catch (err) {
                console.error(`[CRON] Expiry email error for ${user.email}:`, err.message);
              }
            }
          });
        }
      }

      db.close((err) => {
        if (err) console.error('[CRON] DB close error:', err);
        else console.log('[CRON] Database connection closed.');
      });
    });
  });
}

module.exports = { startCron };
