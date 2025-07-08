const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
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

// Optional HTTPS redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startCron();
});
