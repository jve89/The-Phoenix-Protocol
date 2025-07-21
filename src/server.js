const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/routes');
const webhookRoutes = require('./routes/webhooks');
const unsubscribeRoute = require('./routes/unsubscribe');
const { startCron } = require('./utils/cron');
const db = require('./db/db'); // assume db exposes close or uses pool

// Load environment variables
dotenv.config();

// Structured logger (using console for now)
const logger = {
  info:  msg => console.log(msg),
  warn:  msg => console.warn(msg),
  error: msg => console.error(msg)
};

// Crash safety: log and exit on uncaught errors
process.on('uncaughtException', err => {
  logger.error(`🔥 Uncaught Exception: ${err.stack || err}`);
  process.exit(1);
});
process.on('unhandledRejection', reason => {
  logger.error(`🔥 Unhandled Rejection: ${reason.stack || reason}`);
  process.exit(1);
});

// Validate critical environment variables or exit
function validateEnvOrExit(keys) {
  let ok = true;
  for (const key of keys) {
    if (!process.env[key]) {
      logger.error(`❌ Missing ENV ${key}`);
      ok = false;
    } else {
      logger.info(`${key}: ✅ Present`);
    }
  }
  if (!ok) process.exit(1);
}
validateEnvOrExit([
  'STRIPE_SECRET_KEY',
  'SENDGRID_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET'
]);
if (!process.env.ADMIN_EMAIL) {
  logger.warn('⚠️ ADMIN_EMAIL not set — admin preview emails disabled');
} else {
  logger.info('ADMIN_EMAIL: ✅ Present');
}

// Create Express app
const app = express();
app.set('trust proxy', 1);
app.use(helmet());

// Health endpoint for uptime monitoring
app.get('/health', (req, res) => res.sendStatus(200));

// Prevent Heroku dyno sleep (production only)
if (process.env.NODE_ENV === 'production') {
  const url = process.env.SELF_PING_URL || 'https://www.thephoenixprotocol.app/';
  setInterval(() => {
    require('https').get(url, res => {
      logger.info(`[PING] ${url} - ${res.statusCode}`);
    }).on('error', err => {
      logger.error(`[PING] Error: ${err.message}`);
    });
  }, 5 * 60 * 1000);
}

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' })
});

// Routes setup
app.use('/', unsubscribeRoute);
app.use('/webhook', express.raw({ type: '*/*' }), webhookRoutes);
app.use(express.json());
app.use(express.static('public'));
app.use('/api', apiLimiter, routes);

// Start server and cron after DB init
const port = process.env.PORT || 3000;
let server;
async function startServer() {
  try {
    await db.connectAndInit();
    server = app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      startCron();
    });
  } catch (err) {
    logger.error(`❌ Startup failed: ${err.stack || err}`);
    process.exit(1);
  }
}
startServer();

// Graceful shutdown on SIGINT/SIGTERM
async function shutdown() {
  logger.info('⚙️ Shutting down...');
  try {
    if (server) server.close();
    if (db && typeof db.close === 'function') await db.close();
  } catch (err) {
    logger.error(`Error during shutdown: ${err.stack || err}`);
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
