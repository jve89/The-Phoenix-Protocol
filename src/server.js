const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const webhookRoutes = require('./routes/webhooks');
const unsubscribeRoute = require('./routes/unsubscribe');
const { startCron } = require('./utils/cron');
const { connectAndInit } = require('./db/db');

// ✅ Global error handlers for uncaught runtime crashes
process.on('uncaughtException', err => {
  console.error('🔥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// ✅ Load env vars (default path is './.env')
dotenv.config();

// ✅ Log env var presence for Heroku debug
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Present' : '❌ Missing');
console.log('GROK_API_KEY:', process.env.GROK_API_KEY ? '✅ Present' : '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Present' : '❌ Missing');

if (!process.env.STRIPE_SECRET_KEY) console.error('Stripe key not loaded');

const app = express();

app.use('/', unsubscribeRoute);
app.use('/webhook', webhookRoutes); // raw body parser inside webhookRoutes
app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

const port = process.env.PORT || 3000;

// ✅ Keep Heroku awake by self-pinging every 5 minutes
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const url = process.env.SELF_PING_URL || 'https://www.thephoenixprotocol.app/';
    require('https').get(url, res => {
      console.log(`[PING] Self-pinged ${url} — Status: ${res.statusCode}`);
    }).on('error', err => {
      console.error('[PING] Error during self-ping:', err.message);
    });
  }, 1000 * 60 * 5);
}

async function startServer() {
  try {
    await connectAndInit();
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      startCron();
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
