// src/utils/unsubscribeFooter.js
// Single source of truth for unsubscribe footer injection

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
    <div style="margin-top:40px;font-size:12px;color:#888;text-align:center;">
      <p>If you no longer want to receive these emails,
        <a href="${unsubscribeUrl}" style="color:#4f46e5;">click here to unsubscribe</a>.
      </p>
    </div>
  `;
}

module.exports = {
  buildUnsubscribeUrl,
  hasUnsubscribe,
  renderFooter,
};
