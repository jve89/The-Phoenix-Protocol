const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { marked } = require('marked');
const { convert } = require('html-to-text');
const fs = require('fs').promises;
const path = require('path');
const { logEvent } = require('./db_logger');
const { loadTemplate } = require('./loadTemplate');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = {
  name: 'The Phoenix Protocol',
  email: 'support@thephoenixprotocol.app'
};

// Atomic email send, with single-attempt (no retries)
async function sendRawEmail(to, subject, html, attachmentPath = null) {
  if (!to || !subject || typeof html !== 'string' || html.trim().length === 0) {
    logEvent('email', 'error', 'Invalid parameters for sendRawEmail');
    throw new Error('Invalid raw email parameters');
  }

  // Subject truncation (if needed)
  let finalSubject = subject.length > 140 ? subject.slice(0, 137) + '...' : subject;

  // Always generate a one-time unsubscribe token
  let finalHtml = html;
  try {
    const token = jwt.sign({ email: to }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const unsubscribeUrl = `https://www.thephoenixprotocol.app/unsubscribe?token=${encodeURIComponent(token)}`;
    const footer = `
      <div style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
        <p>If you no longer want to receive these emails, <a href="${unsubscribeUrl}" style="color:#7c3aed;">click here to unsubscribe</a>.</p>
      </div>
    `;
    finalHtml += footer;
  } catch (err) {
    logEvent('email', 'warn', `Unsubscribe token error for ${to}: ${err.message}`);
  }

  // Plain text version for fallback
  const text = convert(finalHtml, {
    wordwrap: 130,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
  });

  const msg = { to, from: fromEmail, subject: finalSubject, html: finalHtml, text };

  // Attachments (if any)
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
        logEvent('email', 'warn', `Attachment failed for ${to}: ${err.message}`);
      }
    }
  }

  logEvent('email', 'info', `[sendRawEmail] Sending to ${to} — ${finalSubject}`);
  try {
    await sgMail.send(msg);
    logEvent('email', 'info', `SendGrid send success to ${to}`);
  } catch (error) {
    logEvent('email', 'error', `SendGrid error for ${to}: ${error.message}`);
    throw error;
  }
}

// Markdown-to-HTML email sender (helper, optional)
async function sendMarkdownEmail(to, subject, markdown) {
  if (!to || !subject || !markdown) {
    logEvent('email', 'error', 'Invalid parameters for sendMarkdownEmail');
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

// Renders a guide object into HTML using /templates/daily_summary.html
async function renderEmailMarkdown(guide) {
  const template = await loadTemplate('daily_summary.html');
  const isFullGuide = typeof guide === 'object' &&
    Object.values(guide).every(
      v => typeof v === 'object' && ('content' in v || 'title' in v)
    );

  if (isFullGuide) {
    let fullHtml = '';
    for (const [key, { title, content }] of Object.entries(guide)) {
      const safeTitle = title || key;
      const safeContent = marked.parse(content || '');
      fullHtml += `<h2>${safeTitle}</h2>\n<div>${safeContent}</div><hr style="margin:2rem 0;">`;
    }
    return template
      .replace(/{{\s*title\s*}}/g, 'Daily Guide Summary')
      .replace(/{{\s*content\s*}}/g, fullHtml);
  }
  const contentHtml = marked.parse(guide?.content || '');
  return template
    .replace(/{{\s*title\s*}}/g, guide?.title || '')
    .replace(/{{\s*content\s*}}/g, contentHtml);
}

module.exports = {
  sendRawEmail,
  sendMarkdownEmail,
  renderEmailMarkdown,
  fromEmail
};
