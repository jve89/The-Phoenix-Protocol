const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();

const path = require('path');
const fs = require('fs').promises;
const { sendRawEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not set!');
}

// Step 1: Show confirmation page
router.get('/unsubscribe', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).type('text/html').send('<h2>Missing token</h2>');
  }

  try {
    jwt.verify(token, JWT_SECRET);
    const html = `
      <html>
        <head>
          <title>Unsubscribe</title>
          <style>
            body {
              font-family: sans-serif;
              text-align: center;
              padding: 60px 20px;
              max-width: 500px;
              margin: auto;
              color: #333;
            }
            .button {
              background-color: #7c3aed;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
        <div style="margin-bottom: 40px;">
          <img src="https://www.thephoenixprotocol.app/logo-purple.png" alt="The Phoenix Protocol" width="120" />
        </div>
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
    res.status(400).type('text/html').send('<h2>Invalid or expired token.</h2>');
  }
});

// Step 2: Process unsubscribe
router.post('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).type('text/html').send('<h2>Missing token</h2>');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const result = await db.query(
      `UPDATE users SET plan = 0, usage_count = plan_limit WHERE email = $1 RETURNING email`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).type('text/html').send('<h2>Email not found.</h2>');
    }

    const farewellHtml = await fs.readFile(path.join(__dirname, '../../templates/farewell_email.html'), 'utf-8');
    await sendRawEmail(email, 'Thank You for Using The Phoenix Protocol', farewellHtml);

    const html = `
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: sans-serif;
              text-align: center;
              padding: 60px 20px;
              max-width: 500px;
              margin: auto;
              color: #333;
            }
          </style>
        </head>
        <body>
        <div style="margin-bottom: 40px;">
          <img src="https://www.thephoenixprotocol.app/logo-purple.png" alt="The Phoenix Protocol" width="120" />
        </div>
          <h1>You've been unsubscribed</h1>
          <p>You will no longer receive premium emails.</p>
        </body>
      </html>
    `;
    res.status(200).type('text/html').send(html);
  } catch (err) {
    res.status(400).type('text/html').send('<h2>Invalid or expired token.</h2>');
  }
});

module.exports = router;
