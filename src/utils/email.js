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

// --- helpers ---------------------------------------------------------------

/** Remove a single leading H1/H2 from an HTML fragment. */
function stripLeadingHeading(html) {
  if (typeof html !== 'string') return html;
  return html.replace(/^\s*<h[12][^>]*>[\s\S]*?<\/h[12]>\s*/i, '');
}

/** Force consistent heading sizes inside content fragments by downgrading any stray H1s to H2. */
function normalizeHeadings(html) {
  if (typeof html !== 'string') return html;
  // Only convert remaining H1s, keep other tags intact
  return html.replace(/<h1([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
}

/** Render Markdown -> sanitized HTML fragment */
function renderMd(md) {
  const raw = marked.parse(md || '');
  const noLead = stripLeadingHeading(raw);
  return normalizeHeadings(noLead);
}

/** Strip basic Markdown from a subject line (subjects are plain text). */
function stripMdSubject(s) {
  return String(s || '')
    .replace(/^#+\s*/, '')            // leading # headings
    .replace(/\*\*(.*?)\*\*/g, '$1')  // bold
    .replace(/\*(.*?)\*/g, '$1')      // italic
    .replace(/[`_~>]/g, '')           // misc md chars
    .replace(/\s{2,}/g, ' ')          // collapse spaces
    .trim();
}

// --- email sending ---------------------------------------------------------

async function sendRawEmail(to, subject, html, attachmentPath = null) {
  if (!to || !subject || typeof html !== 'string' || html.trim().length === 0) {
    logEvent('email', 'error', 'Invalid parameters for sendRawEmail');
    throw new Error('Invalid raw email parameters');
  }

  // Sanitize Markdown before truncation for subjects
  const cleanedSubject = stripMdSubject(subject);
  const finalSubject = cleanedSubject.length > 140 ? cleanedSubject.slice(0, 137) + '...' : cleanedSubject;

  let token = '';
  let unsubscribeUrl = '';
  try {
    token = jwt.sign({ email: to }, process.env.JWT_SECRET, { expiresIn: '365d' });
    unsubscribeUrl = `https://www.thephoenixprotocol.app/unsubscribe?token=${encodeURIComponent(token)}`;
  } catch (err) {
    logEvent('email', 'warn', `Unsubscribe token error for ${to}: ${err.message}`);
  }

  // Replace {{unsubscribe_token}} placeholders before deciding footer injection
  if (unsubscribeUrl) {
    html = html.replace(/{{\s*unsubscribe_token\s*}}/g, token);
  }

  // Detect if template already carries an unsubscribe link
  const hasCustomUnsub = /\/unsubscribe\?token=|{{\s*unsubscribe_token\s*}}/i.test(html);

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

  const text = convert(finalHtml, {
    wordwrap: 130,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
  });

  const msg = {
    to,
    from: fromEmail,
    subject: finalSubject,
    html: finalHtml,
    text,
    mailSettings: {
      subscriptionTracking: { enable: false },
      footer: { enable: false },
    },
    headers: unsubscribeUrl ? {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
  };

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

// Simple Markdown sender (kept for completeness)
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
<body>${renderMd(markdown)}</body>
</html>`;
  await sendRawEmail(to, stripMdSubject(subject), html);
}

// Render a guide object using /templates/daily_summary.html while enforcing consistent headings
async function renderEmailMarkdown(guide) {
  const template = await loadTemplate('daily_summary.html');

  // If guide is a multi-section object
  const keys = Object.keys(guide || {}).filter(k => guide[k]?.content);
  if (keys.length) {
    let fullHtml = '';
    for (const key of keys) {
      const { title = key, content = '' } = guide[key] || {};
      if (content.trim().length > 0) {
        fullHtml += `
<h2 style="font-size:20px;line-height:1.4;margin:24px 0 8px 0;font-weight:700;">
  ${key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${title}
</h2>
<div>${renderMd(content)}</div>
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
`;
      }
    }
    return template
      .replace(/{{\s*title\s*}}/g, 'Daily Guide Summary')
      .replace(/{{\s*content\s*}}/g, fullHtml || '<p><em>No guide content available.</em></p>');
  }

  // Fallback: single guide object
  const safeTitle = (guide && guide.title) ? String(guide.title) : 'Your Daily Guide';
  const contentHtml = renderMd(guide?.content || '');
  return template
    .replace(/{{\s*title\s*}}/g, safeTitle)
    .replace(/{{\s*content\s*}}/g, contentHtml);
}

module.exports = {
  sendRawEmail,
  sendMarkdownEmail,
  renderEmailMarkdown,
  fromEmail
};
