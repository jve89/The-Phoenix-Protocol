require('dotenv').config();
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { sendEmail } = require('./email');
const { generateTip } = require('./content');

function startCron() {
  console.log('[CRON] Subscription expiry and tip job scheduled.');

  // Send daily tip at 16:00 UTC (noon EST, early evening Europe)
  cron.schedule('0 16 * * *', async () => {
    console.log(`[CRON] Sending test tip: ${new Date().toISOString()}`);
    const db = new sqlite3.Database('users.db', (err) => {
      if (err) console.error('[CRON] DB error:', err);
    });
    db.all(`SELECT email, gender FROM users WHERE plan != 'free'`, [], async (err, rows) => {
      if (err) {
        console.error('[CRON] Tip query error:', err);
      } else {
        for (const user of rows) {
          try {
            const tip = await generateTip(user.gender);
            await sendEmail(user.email, 'Your Daily Tip', `<p>${tip}</p>`);
            console.log(`[CRON] Tip sent to ${user.email}`);
          } catch (err) {
            console.error('[CRON] Tip email error:', err);
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

  // Expiry check at midnight
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
                console.error('[CRON] Expiry email error:', err);
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
