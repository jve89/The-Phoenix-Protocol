// src/config/config.js
const dotenv = require('dotenv');

// Load .env in non-production for local dev
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Helper to validate email format
function isValidEmail(email) {
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return typeof email === 'string' && re.test(email);
}

// Helper to safely read envs with trimming
function env(key, fallback = '') {
  const val = process.env[key];
  return typeof val === 'string' ? val.trim() : fallback;
}

// PORT
const rawPort = env('PORT', '3000');
const port = parseInt(rawPort, 10);
if (isNaN(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: ${rawPort}`);
}

// FROM_EMAIL
const fromEmail = env('FROM_EMAIL', 'support@thephoenixprotocol.app');
if (!isValidEmail(fromEmail)) {
  throw new Error(`Invalid FROM_EMAIL: ${fromEmail}`);
}

// SUPPORT_EMAIL
const supportEmail = env('SUPPORT_EMAIL', 'support@thephoenixprotocol.app');
if (!isValidEmail(supportEmail)) {
  throw new Error(`Invalid SUPPORT_EMAIL: ${supportEmail}`);
}

// ADMIN_EMAIL (optional)
const adminEmail = env('ADMIN_EMAIL', '');
if (adminEmail && !isValidEmail(adminEmail)) {
  throw new Error(`Invalid ADMIN_EMAIL: ${adminEmail}`);
}

// Immutable export
module.exports = Object.freeze({
  port,
  fromEmail,
  supportEmail,
  adminEmail
});
