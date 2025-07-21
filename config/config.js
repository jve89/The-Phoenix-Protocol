// Centralized configuration with validation
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

// PORT
const rawPort = process.env.PORT || '3000';
const port = parseInt(rawPort, 10);
if (isNaN(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: ${rawPort}`);
}

// FROM_EMAIL
const fromEmail = process.env.FROM_EMAIL || 'no-reply@thephoenixprotocol.app';
if (!isValidEmail(fromEmail)) {
  throw new Error(`Invalid FROM_EMAIL: ${fromEmail}`);
}

// ADMIN_EMAIL (optional)
const adminEmail = process.env.ADMIN_EMAIL || '';
if (adminEmail && !isValidEmail(adminEmail)) {
  throw new Error(`Invalid ADMIN_EMAIL: ${adminEmail}`);
}

module.exports = {
  port,
  fromEmail,
  adminEmail
};
