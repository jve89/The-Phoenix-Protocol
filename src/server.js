const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const webhookRoutes = require('./routes/webhooks');
const unsubscribeRoute = require('./routes/unsubscribe');
const { startCron } = require('./utils/cron');
const { connectAndInit } = require('./db/db');

// ✅ Load environment variables
dotenv.config();

// ✅ Crash safety: Handle uncaught exceptions and rejections
process.on('uncaughtException', err => {
  console.error('🔥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// ✅ Validate critical ENV vars
const requiredEnv = ['STRIPE_SECRET_KEY', 'SENDGRID_API_KEY', 'DATABASE_URL'];
for (const key of requiredEnv) {
  if (!process.env[key]) console.error(`❌ Missing env var: ${key}`);
  else console.log(`${key}: ✅ Present`);
}

// ✅ App setup
const app = express();
app.use('/', unsubscribeRoute);
app.use('/webhook', webhookRoutes); // must be before body parser
app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

const port = process.env.PORT || 3000;

// ✅ Prevent Heroku sleep (production only)
if (process.env.NODE_ENV === 'production') {
  const url = process.env.SELF_PING_URL || 'https://www.thephoenixprotocol.app/';
  setInterval(() => {
    require('https').get(url, res => {
      console.log(`[PING] ${url} - ${res.statusCode}`);
    }).on('error', err => {
      console.error('[PING] Error:', err.message);
    });
  }, 5 * 60 * 1000);
}

// ✅ Connect to DB and start server + cron
async function startServer() {
  try {
    await connectAndInit();
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      startCron();
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

startServer();
