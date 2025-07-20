// src/utils/email.js

const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const { marked } = require('marked');
const { convert } = require('html-to-text');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// 🔐 Ensure API key is present
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is missing');
  process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = {
  name: 'The Phoenix Protocol',
  email: 'no-reply@thephoenixprotocol.app',
};

/**
 * Retry wrapper for transient SendGrid failures
 */
const sendWithRetry = async (msg, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await sgMail.send(msg);
      return;
    } catch (error) {
      const status = error.response?.statusCode;
      const isTransient = [429, 500, 502, 503, 504].includes(status);
      if (!isTransient || attempt === retries) {
        console.error('❌ Raw email error:', error.response ? error.response.body : error.message);
        throw error;
      }
      console.warn(`⏳ SendGrid retry ${attempt + 1}/${retries} for`, msg.to);
      await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
    }
  }
};

/**
 * Sends a fully rendered HTML email (with optional unsubscribe token replacement + file attachment)
 */
const sendRawEmail = async (to, subject, html, attachmentPath = null) => {
  if (!to || !subject || !html) {
    console.error('[sendRawEmail] Invalid params:', { to, subject });
    throw new Error('Invalid raw email parameters');
  }

  // ✂️ Enforce max subject length
  if (subject.length > 140) {
    console.warn(`✂️ Subject truncated for ${to}`);
    subject = subject.slice(0, 137) + '...';
  }

  // 🔐 Replace {{unsubscribe_token}} if present
  let finalHtml = html;
  if (html.includes('{{unsubscribe_token}}')) {
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET missing for unsubscribe token generation');
      process.exit(1);
    }

    try {
      const token = jwt.sign({ email: to }, process.env.JWT_SECRET, { expiresIn: '90d' });
      finalHtml = html.replace('{{unsubscribe_token}}', token);
    } catch (err) {
      console.error('[sendRawEmail] Failed to generate unsubscribe token:', err.message);
    }
  }

  const plainText = convert(finalHtml, {
    wordwrap: 130,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }],
  });

  const msg = {
    to,
    from: fromEmail,
    subject,
    html: finalHtml,
    text: plainText,
  };

  // 📎 Attach file if present
  if (attachmentPath) {
    try {
      const fileContent = await fs.readFile(attachmentPath, { encoding: 'base64' });
      msg.attachments = [{
        content: fileContent,
        filename: path.basename(attachmentPath),
        type: 'application/json',
        disposition: 'attachment',
      }];
    } catch (err) {
      console.error('[sendRawEmail] Failed to attach file:', err.message);
    }
  }

  await sendWithRetry(msg);
  console.log('📤 Raw email sent to', to);
};

/**
 * Converts Markdown to styled HTML and sends email
 */
const sendMarkdownEmail = async (to, subject, markdownBody) => {
  if (!to || !subject || !markdownBody) {
    console.error('[sendMarkdownEmail] Invalid params:', { to, subject });
    throw new Error('Invalid markdown email parameters');
  }

  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #111; line-height: 1.6; padding: 1rem; }
          h1, h2, h3 { color: #5f259f; }
          strong { font-weight: bold; }
          em { font-style: italic; }
        </style>
      </head>
      <body>
        ${marked.parse(markdownBody)}
      </body>
    </html>
  `;

  return sendRawEmail(to, subject, html);
};

module.exports = {
  sendRawEmail,
  sendMarkdownEmail,
  fromEmail,
};
