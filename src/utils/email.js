const sgMail = require('@sendgrid/mail');
const { marked } = require('marked');
const { convert } = require('html-to-text');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const { logEvent } = require('./db_logger');

// Structured logger for email utilities
const logger = {
  info:  msg => logEvent('email', 'info', msg),
  warn:  msg => logEvent('email', 'warn', msg),
  error: msg => logEvent('email', 'error', msg)
};

// Validate required env or throw
function validateEnv() {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('Missing SENDGRID_API_KEY');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET for unsubscribe tokens');
  }
}
validateEnv();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = {
  name: 'The Phoenix Protocol',
  email: 'support@thephoenixprotocol.app'
};

/**
 * Retry wrapper for transient SendGrid failures with exponential backoff
 */
async function sendWithRetry(msg, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await sgMail.send(msg);
      logger.info(`SendGrid send success to ${msg.to}`);
      return;
    } catch (error) {
      const status = error.response?.statusCode;
      const transient = [429, 500, 502, 503, 504].includes(status);
      const msgTo = Array.isArray(msg.to) ? msg.to.join(',') : msg.to;

      if (!transient || attempt === retries) {
        logger.error(`SendGrid permanent error for ${msgTo}: ${error.message}`);
        throw error;
      }
      const delayMs = 1000 * Math.pow(2, attempt);
      logger.warn(`Transient error (${status}) for ${msgTo}, retrying in ${delayMs}ms (${attempt+1}/${retries})`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

/**
 * Sends a fully rendered HTML email with optional attachment
 */
async function sendRawEmail(to, subject, html, attachmentPath = null) {
    if (!to || !subject || typeof html !== 'string' || html.trim().length === 0) {
      logger.error('Invalid parameters for sendRawEmail', {
        to,
        subject,
        htmlLength: html ? html.length : 'undefined'
      });
      throw new Error('Invalid raw email parameters');
    }

  // Truncate long subjects
  let finalSubject = subject;
  if (finalSubject.length > 140) {
    logger.warn(`Subject too long for ${to}, truncating`);
    finalSubject = finalSubject.slice(0, 137) + '...';
  }

  // Replace unsubscribe token
  let finalHtml = html;
  if (html.includes('{{unsubscribe_token}}')) {
    try {
      const token = jwt.sign({ email: to }, process.env.JWT_SECRET, { expiresIn: '90d' });
      finalHtml = html.replace(/{{unsubscribe_token}}/g, token);
    } catch (err) {
      logger.error(`Failed to generate unsubscribe token for ${to}: ${err.message}`);
    }
  }

  const text = convert(finalHtml, {
    wordwrap: 130,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
  });

  const msg = { to, from: fromEmail, subject: finalSubject, html: finalHtml, text };

  // Attach one or multiple files if provided
  if (attachmentPath) {
    msg.attachments = [];
    const paths = Array.isArray(attachmentPath) ? attachmentPath : [attachmentPath];
    for (const filePath of paths) {
      try {
        const content = await fs.readFile(filePath, { encoding: 'base64' });
        msg.attachments.push({
          content,
          filename: path.basename(filePath),
          disposition: 'attachment'
        });
      } catch (err) {
        logger.warn(`Attachment failed for ${to}: ${err.message}`);
      }
    }
  }

  logger.info(`[sendRawEmail] Sending to ${to} — ${finalSubject}`);
  console.log(`[DEBUG] Sending email to ${to} — ${finalSubject}`);

  await sendWithRetry(msg);
}

/**
 * Converts Markdown to HTML template and sends via sendRawEmail
 */
async function sendMarkdownEmail(to, subject, markdown) {
  if (!to || !subject || !markdown) {
    logger.error('Invalid parameters for sendMarkdownEmail', { to, subject });
    throw new Error('Invalid markdown email parameters');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; color: #111; line-height: 1.6; padding: 1rem; }
  h1, h2, h3 { color: #5f259f; }
</style>
</head>
<body>${marked.parse(markdown)}</body>
</html>`;

  await sendRawEmail(to, subject, html);
}

/**
 * Renders a guide object into HTML using a given template
 */
function renderEmailMarkdown(guide, template = defaultTemplate()) {
  const contentHtml = marked.parse(guide?.content || '');
  return template
    .replace('{{title}}', guide?.title || '')
    .replace('{{content}}', contentHtml);
}

/**
 * Provides a minimal default email template if none is supplied
 */
function defaultTemplate() {
  return `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"><title>{{title}}</title></head>
    <body style="font-family:sans-serif;line-height:1.6;padding:1rem;">
      <h1>{{title}}</h1>
      <div>{{content}}</div>
    </body>
  </html>`;
}

module.exports = {
  sendRawEmail,
  sendMarkdownEmail,
  renderEmailMarkdown,
  fromEmail
};
