// src/server.js

const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const webhookRoutes = require('./routes/webhooks');
const { startCron } = require('./utils/cron');

// ✅ Global error handlers for uncaught runtime crashes
process.on('uncaughtException', err => {
  console.error('🔥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// ✅ Load env vars
dotenv.config({ path: './.env' });

// ✅ Log env var presence for Heroku debug
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Present' : '❌ Missing');
console.log('GROK_API_KEY:', process.env.GROK_API_KEY ? '✅ Present' : '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Present' : '❌ Missing');

if (!process.env.STRIPE_SECRET_KEY) console.error('Stripe key not loaded');

const app = express();

// ✅ Optional HTTPS redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

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
  }, 1000 * 60 * 5); // Every 5 minutes
}

// ✅ Stripe webhook BEFORE express.json() to preserve raw body
app.use('/webhook', webhookRoutes);

// ✅ Normal JSON parsing and routes
app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  startCron();
});
