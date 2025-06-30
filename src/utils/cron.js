const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { sendEmail } = require('./email');

// Define the cron job logic as a function
function startCron() {
  console.log('[CRON] Subscription expiry cron job with email notifications scheduled to run daily at midnight.');

  cron.schedule('0 0 * * *', async () => {
    console.log(`[CRON] Running subscription expiry check: ${new Date().toISOString()}`);

    const db = new sqlite3.Database('users.db', (err) => {
      if (err) {
        console.error('[CRON] Database connection error:', err.message);
        return;
      }
    });

    db.serialize(() => {
      db.all(`SELECT id, email, plan, end_date FROM users WHERE end_date IS NOT NULL AND end_date <= date('now')`, [], async (err, rows) => {
        if (err) {
          console.error('[CRON] Error selecting expired users:', err.message);
          return;
        }

        if (rows.length === 0) {
          console.log('[CRON] No users to downgrade today.');
          return;
        }

        let downgradedCount = 0;

        for (const user of rows) {
          await new Promise((resolve) => {
            db.run(`UPDATE users SET plan = 'free', end_date = NULL WHERE id = ?`, [user.id], async (err) => {
              if (err) {
                console.error(`[CRON] Error updating user ${user.email} (id: ${user.id}):`, err.message);
                return resolve();
              }

              console.log(`[CRON] Subscription expired for: ${user.email} (id: ${user.id}), downgraded to 'free'.`);
              downgradedCount++;

              try {
                await sendEmail(
                  user.email,
                  'Your Phoenix Protocol Subscription Has Expired',
                  '<p>Your subscription has expired and your account has been downgraded to the free plan. Renew anytime from your dashboard to regain full access.</p>'
                );
                console.log(`[CRON] Notification sent to ${user.email}`);
              } catch (emailErr) {
                console.error(`[CRON] Email error for ${user.email}:`, emailErr);
              }

              resolve();
            });
          });
        }

        console.log(`[CRON] Downgrade process completed. Total users downgraded today: ${downgradedCount}`);
      });
    });

    db.close((err) => {
      if (err) {
        console.error('[CRON] Error closing database:', err.message);
      } else {
        console.log('[CRON] Database connection closed.');
      }
    });
  });
}

// Export the startCron function
module.exports = { startCron };
