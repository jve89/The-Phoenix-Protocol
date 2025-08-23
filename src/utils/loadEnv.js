// src/utils/loadEnv.js
if (process.env.NODE_ENV !== 'production') {
  const result = require('dotenv').config();
  if (result.error) {
    console.warn('[ENV] ⚠️ .env file not found or failed to load');
  } else {
    console.log('[ENV] ✅ .env file loaded');
  }
} else {
  console.log('[ENV] 🛡️ Skipping dotenv — using system envs');
}

// Fail fast if critical envs are missing
const required = [
  'DATABASE_URL',
  'SENDGRID_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'JWT_SECRET',
  'ADMIN_EMAIL'
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] ❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
