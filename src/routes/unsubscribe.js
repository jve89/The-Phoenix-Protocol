const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db/db');
const { sendRawEmail } = require('../utils/email');
const { logEvent } = require('../utils/db_logger');

// Validate JWT_SECRET at load time
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logEvent('unsubscribe', 'error', 'Missing JWT_SECRET');
  throw new Error('Missing JWT_SECRET');
}

const router = express.Router();

// Structured logger
const logger = {
  info:  msg => logEvent('unsubscribe', 'info', msg),
  warn:  msg => logEvent('unsubscribe', 'warn', msg),
  error: msg => logEvent('unsubscribe', 'error', msg)
};

// Wrapper to catch async errors
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Step 1: Show confirmation page
router.get('/unsubscribe', asyncHandler(async (req, res) => {
  const token = req.query.token;
  if (!token) {
    logger.warn('GET /unsubscribe missing token');
    return res.status(400).type('text/html').send('<h2>Missing token</h2>');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info(`Verified unsubscribe token for ${decoded.email}`);

    const html = `
      <html>
        <head><title>Unsubscribe</title>
          <style>body{font-family:sans-serif;text-align:center;padding:60px 20px;max-width:500px;margin:auto;color:#333;} .button{background:#7c3aed;color:#fff;padding:12px 24px;border:none;border-radius:6px;font-size:16px;cursor:pointer;margin-top:24px;}</style>
        </head>
        <body>
          <div style="margin-bottom:40px;"><img src="https://www.thephoenixprotocol.app/logo-purple.png" width="120" alt="Logo"/></div>
          <h1>Are you sure?</h1>
          <p>This will cancel your premium content and cannot be undone.</p>
          <form method="POST" action="/unsubscribe?token=${encodeURIComponent(token)}">
            <button class="button" type="submit">Yes, unsubscribe me</button>
          </form>
        </body>
      </html>
    `;
    res.status(200).type('text/html').send(html);
  } catch (err) {
    logger.error(`Invalid token on GET /unsubscribe: ${err.message}`);
    res.status(400).type('text/html').send('<h2>Invalid or expired token.</h2>');
  }
}));

// Step 2: Process unsubscribe
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const token = req.query.token;
  if (!token) {
    logger.warn('POST /unsubscribe missing token');
    return res.status(400).type('text/html').send('<h2>Missing token</h2>');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    logger.info(`Processing unsubscribe for ${email}`);

    const result = await db.query(
      `UPDATE users
      SET plan = 0,
          usage_count = plan_limit,
          unsubscribed = TRUE
      WHERE email = $1
      RETURNING email`,
      [email]
    );

    if (result.rowCount === 0) {
      logger.warn(`Unsubscribe: no user found for ${email}`);
      return res.status(404).type('text/html').send('<h2>Email not found.</h2>');
    }

    const farewellPath = path.join(__dirname, '../../templates/farewell_email.html');
    const farewellHtml = await fs.readFile(farewellPath, 'utf-8');
    await sendRawEmail(email, 'Thank You for Using The Phoenix Protocol', farewellHtml);
    logger.info(`Farewell email sent to ${email}`);

    const html = `
      <html>
        <head><title>Unsubscribed</title>
          <style>body{font-family:sans-serif;text-align:center;padding:60px 20px;max-width:500px;margin:auto;color:#333;}</style>
        </head>
        <body>
          <div style="margin-bottom:40px;"><img src="https://www.thephoenixprotocol.app/logo-purple.png" width="120" alt="Logo"/></div>
          <h1>You've been unsubscribed</h1>
          <p>You will no longer receive premium emails.</p>
        </body>
      </html>
    `;
    res.status(200).type('text/html').send(html);
  } catch (err) {
    logger.error(`Error in POST /unsubscribe: ${err.message}`);
    res.status(400).type('text/html').send('<h2>Invalid or expired token.</h2>');
  }
}));

// Global error handler for this router
router.use((err, req, res, next) => {
  logger.error(`Unhandled error in unsubscribe routes: ${err.stack || err}`);
  res.status(500).type('text/html').send('<h2>Internal Server Error</h2>');
});

module.exports = router;
