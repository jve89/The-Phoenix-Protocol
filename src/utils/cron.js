const cron = require('node-cron');
const { sendEmail } = require('./email');
const { generateTip } = require('./content');
const db = require('../db/db');

const startCron = () => {
  cron.schedule('0 0 * * *', async () => {
    db.all('SELECT email, focus, gender FROM users', async (err, rows) => {
      if (err) console.error(err);
      for (const user of rows) {
        const tip = await generateTip(user.focus, user.gender);
        await sendEmail(user.email, 'Your Daily Tip', `<p>${tip}</p>`);
      }
    });
  });
};

module.exports = { startCron };