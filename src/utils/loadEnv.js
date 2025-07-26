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
