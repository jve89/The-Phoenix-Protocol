// src/routes/unsubscribe.js

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Step 1: Show unsubscribe confirmation page
router.get('/unsubscribe', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
          <h1>Are you sure?</h1>
          <p>This will cancel your premium content and cannot be undone.</p>
          <form method="POST" action="/unsubscribe?token=${token}">
            <button class="button" type="submit">Yes, unsubscribe me</button>
          </form>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    return res.status(400).send('Invalid or expired token.');
  }
});

// Step 2: Process unsubscribe
router.post('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const result = await db.query(
      `UPDATE users SET plan = 'free' WHERE email = $1 RETURNING email`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Email not found.');
    }

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
          <h1>You've been unsubscribed</h1>
          <p>You will no longer receive premium emails.</p>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    return res.status(400).send('Invalid or expired token.');
  }
});

module.exports = router;
