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

// Crash safety
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
// Stripe needs raw body on /webhook, so mount before express.json()
app.use('/', unsubscribeRoute);
app.use('/webhook', webhookRoutes);
app.use(express.json());
app.use(express.static('public'));

// Auto-register clean routes for all public .html pages
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir)
    .filter(file => file.endsWith('.html'))
    .forEach(file => {
      const route = '/' + file.replace(/\.html$/, '');
      const filePath = path.join(publicDir, file);

      console.log(`🔗 Routing ${route} → ${file}`);

      app.get(route, (req, res) => {
        res.sendFile(filePath);
      });

      // Support /file.html → /file
      app.get('/' + file, (req, res) => {
        res.redirect(301, route);
      });
    });
} else {
  console.warn('⚠️ Public directory missing:', publicDir);
}

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
    await connectAndInit();   // no-op in prod per db.js patch
    startCron();              // after DB ready
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

// Global 404 fallback (use top-level /public/404.html if present)
app.use((req, res) => {
  const notFoundPath = path.join(__dirname, '..', 'public', '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).type('text/plain').send('404 Not Found');
  }
});

startServer();
