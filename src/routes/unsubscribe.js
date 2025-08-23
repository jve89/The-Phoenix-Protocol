// src/routes/unsubscribe.js
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
    const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    if (!email) throw new Error('Decoded token missing email');

    logger.info(`Verified unsubscribe token for ${email}`);

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
    const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    if (!email) throw new Error('Decoded token missing email');

    logger.info(`Processing unsubscribe for ${email}`);

    const { rows } = await db.query(
      'SELECT is_trial_user, unsubscribed FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      logger.warn(`Unsubscribe: user not found for ${email}`);
      return res.status(404).type('text/html').send('<h2>Email not found.</h2>');
    }

    const user = rows[0];
    if (user.unsubscribed) {
      logger.info(`User ${email} already unsubscribed`);
      return res.status(200).type('text/html').send('<h2>You are already unsubscribed.</h2>');
    }

    const isTrial = user.is_trial_user;
    const farewellTimeField = isTrial ? 'trial_farewell_sent_at' : 'paid_farewell_sent_at';

    // Update with defensive defaults
    try {
      if (isTrial) {
        await db.query(
          `UPDATE users
           SET plan = 0,
               trial_usage_count = COALESCE(plan_limit, 3),
               unsubscribed = TRUE,
               ${farewellTimeField} = NOW()
           WHERE email = $1`,
          [email]
        );
      } else {
        await db.query(
          `UPDATE users
           SET plan = 0,
               paid_usage_count = COALESCE(plan_limit, paid_usage_count),
               unsubscribed = TRUE,
               ${farewellTimeField} = NOW()
           WHERE email = $1`,
          [email]
        );
      }
    } catch (e) {
      logger.error(`DB update failed for unsubscribe ${email}: ${e.message}`);
    }

    const templateName = isTrial ? 'trial_farewell.html' : 'farewell_email.html';
    const farewellPath = path.join(__dirname, `../../templates/${templateName}`);
    let farewellHtml = '';
    try {
      farewellHtml = await fs.readFile(farewellPath, 'utf-8');
    } catch (e) {
      logger.error(`Failed to load farewell template ${templateName}: ${e.message}`);
      farewellHtml = `<p>You have been unsubscribed from The Phoenix Protocol.</p>`;
    }

    try {
      await sendRawEmail(
        email,
        'Thank You for Using The Phoenix Protocol',
        farewellHtml
      );
      logger.info(`Farewell email (${templateName}) sent to ${email}`);
    } catch (e) {
      logger.error(`Farewell email send failed to ${email}: ${e.message}`);
    }

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
