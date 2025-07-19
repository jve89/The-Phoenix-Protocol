// src/utils/email.js

const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const { marked } = require('marked');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = {
  name: 'The Phoenix Protocol',
  email: 'no-reply@thephoenixprotocol.app',
};

/**
 * Sends a fully rendered HTML email (no Markdown conversion)
 */
const sendRawEmail = async (to, subject, html) => {
  if (!to || !subject || !html) {
    console.error('[sendRawEmail] Invalid params:', { to, subject });
    throw new Error('Invalid raw email parameters');
  }

  const msg = {
    to,
    from: fromEmail,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('📤 Raw email sent to', to);
  } catch (error) {
    console.error('❌ Raw email error:', error.response ? error.response.body : error.message);
    throw error;
  }
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
  fromEmail
};
