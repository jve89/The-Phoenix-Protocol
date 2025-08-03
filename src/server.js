require('./utils/loadEnv');
const express = require('express');
const routes = require('./routes/routes');
const webhookRoutes = require('./routes/webhooks');
const unsubscribeRoute = require('./routes/unsubscribe');
const feedbackRoutes = require('./routes/feedback');
const { startCron } = require('./utils/cron');
const { connectAndInit } = require('./db/db');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../public/uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('❌ Failed to create uploads dir:', err);
  process.exit(1);
}

// Crash safety: handle uncaught exceptions and rejections
process.on('uncaughtException', err => {
  console.error('🔥 Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', reason => {
  console.error('🔥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Validate critical ENV vars or exit
['STRIPE_SECRET_KEY', 'SENDGRID_API_KEY', 'DATABASE_URL'].forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  } else {
    console.log(`${key}: ✅ Present`);
  }
});
if (!process.env.JWT_SECRET) {
  console.error('❌ Missing env var: JWT_SECRET');
  process.exit(1);
} else {
  console.log('JWT_SECRET: ✅ Present');
}
if (!process.env.ADMIN_EMAIL) {
  console.warn('⚠️ ADMIN_EMAIL not set — admin preview emails disabled');
} else {
  console.log('ADMIN_EMAIL: ✅ Present');
}

// CREATE THE APP *AFTER* ALL VARS ARE VALIDATED
const app = express();

// Middleware (order matters)
app.use('/', unsubscribeRoute);
app.use('/webhook', webhookRoutes);
app.use(express.json());
app.use(express.static('public'));

// Auto-register clean routes for all public .html pages
const publicDir = path.join(__dirname, '..', 'public');
fs.readdirSync(publicDir)
  .filter(file => file.endsWith('.html'))
  .forEach(file => {
    const route = '/' + file.replace(/\.html$/, '');
    const filePath = path.join(publicDir, file);

    console.log(`🔗 Routing ${route} → ${file}`);

    app.get(route, (req, res) => {
      res.sendFile(filePath);
    });

    app.get('/' + file, (req, res) => {
      res.redirect(301, route);
    });
  });

// Register feedback *before* general routes, both under /api
app.use('/api', feedbackRoutes);
app.use('/api', routes);

const port = process.env.PORT || 3000;

// Prevent Heroku sleep (production only)
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

async function startServer() {
  try {
    // Connect to DB and run init migrations if any
    await connectAndInit();

    // Optional: Run slot-miss check logic here if you want (not required; see below)
    // e.g., await catchUpOnMissedSlots();

    // Start cron jobs (must be after DB is ready)
    startCron();

    // Start HTTP server (only after above)
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

// Global 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

startServer();
