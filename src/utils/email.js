const path = require('path');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const mime = require('mime-types'); 
const fs = require('fs').promises;
const { marked } = require('marked');
const { convert } = require('html-to-text');

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
  const finalSubject = subject.length > 140 ? subject.slice(0, 137) + '...' : subject;

  // Build unsubscribe token + URL
  let token = '';
  let unsubscribeUrl = '';
  try {
    token = jwt.sign({ email: to }, process.env.JWT_SECRET, { expiresIn: '365d' });
    unsubscribeUrl = `https://www.thephoenixprotocol.app/unsubscribe?token=${encodeURIComponent(token)}`;
  } catch (err) {
    logEvent('email', 'warn', `Unsubscribe token error for ${to}: ${err.message}`);
  }

  // Only append our tiny footer if the HTML doesn't already contain an unsubscribe
  const hasCustomUnsub = /{{\s*unsubscribe_token\s*}}|\/unsubscribe\?token=/i.test(html);
  let finalHtml = html;

  if (!hasCustomUnsub && unsubscribeUrl) {
    const footer = `
      <div style="margin-top:40px;font-size:12px;color:#888;text-align:center;">
        <p>If you no longer want to receive these emails,
          <a href="${unsubscribeUrl}" style="color:#4f46e5;">click here to unsubscribe</a>.
        </p>
      </div>`;
    finalHtml += footer;
  }

  // Plain text version for fallback
  const text = convert(finalHtml, {
    wordwrap: 130,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
  });

  // Build message
  const msg = {
    to,
    from: fromEmail,
    subject: finalSubject,
    html: finalHtml,
    text,
    // Prevent SendGrid from adding its own unsubscribe/footer on these emails
    mailSettings: {
      subscriptionTracking: { enable: false },
      footer: { enable: false },
    },
    // Help Gmail/Apple Mail with one-click unsubscribe
    headers: unsubscribeUrl ? {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
  };

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
          type: mime.lookup(filePath) || 'application/octet-stream',
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
  // Use all present keys instead of a hardcoded subset
  const keys = Object.keys(guide).filter(k => guide[k]?.content);

  if (keys.length) {
    let fullHtml = '';
    for (const key of keys) {
      const { title = key, content = '' } = guide[key] || {};
      if (content.trim().length > 0) {
        fullHtml += `<h2>${key.replace('_', ' ').toUpperCase()} — ${title}</h2>\n<div>${marked.parse(content)}</div><hr style="margin:2rem 0;">`;
      }
    }
    return template
      .replace(/{{\s*title\s*}}/g, 'Daily Guide Summary')
      .replace(/{{\s*content\s*}}/g, fullHtml || '<p><em>No guide content available.</em></p>');
  }

  // fallback: assume it's a single guide object
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
