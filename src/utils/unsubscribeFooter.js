// src/utils/unsubscribeFooter.js
// Single source of truth for unsubscribe footer injection with inline styles

function buildUnsubscribeUrl(email, token) {
  if (!email || !token) return '';
  return `https://www.thephoenixprotocol.app/unsubscribe?token=${encodeURIComponent(token)}`;
}

function hasUnsubscribe(html) {
  return /\/unsubscribe\?token=|{{\s*unsubscribe_token\s*}}/i.test(String(html || ''));
}

function renderFooter(unsubscribeUrl) {
  if (!unsubscribeUrl) return '';
  return `
    <div role="contentinfo" style="margin:24px 0 0 0;text-align:center;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:14px;line-height:20px;color:#6b7280;">
        If you no longer want to receive these emails,
        <a href="${unsubscribeUrl}" style="color:#4F46E5;text-decoration:underline;">click here to unsubscribe</a>.
      </p>
    </div>
  `;
}

module.exports = {
  buildUnsubscribeUrl,
  hasUnsubscribe,
  renderFooter,
};
