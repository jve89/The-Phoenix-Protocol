// src/utils/feedbackFooter.js
// Inline-styled feedback block for broad email client support

function renderFeedbackFooter() {
  return `
    <div role="presentation" style="margin:32px 0 0 0;padding:0;text-align:center;">
      <hr style="margin:0 0 20px 0;border:none;border-top:1px solid #eeeeee;">
      <div style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:14px;line-height:20px;color:#6b7280;">
        <div style="margin:0 0 6px 0;color:#111827;font-size:16px;line-height:24px;font-weight:600;">
          💬 <span>Share your experience with The Phoenix Protocol?</span>
        </div>
        <div style="margin:0 0 12px 0;">
          Your feedback helps others and makes the program stronger.
        </div>
        <a href="https://www.thephoenixprotocol.app/feedback.html"
           target="_blank" rel="noopener noreferrer"
           style="display:inline-block;margin:0;padding:12px 20px;background:#4F46E5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Leave Feedback
        </a>
      </div>
    </div>
  `;
}

module.exports = { renderFeedbackFooter };
