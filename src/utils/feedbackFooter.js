// src/utils/feedbackFooter.js
function renderFeedbackFooter() {
  return `
    <div class="footer">
      <hr style="margin: 32px 0 20px 0; border: none; border-top: 1px solid #eee;">
      <div style="margin-bottom: 12px;">
        💬 <strong>Share your experience with The Phoenix Protocol?</strong><br>
        Your feedback helps others and makes the program stronger.<br>
        <a href="https://www.thephoenixprotocol.app/feedback.html"
          class="button"
          target="_blank" rel="noopener noreferrer"
          style="display:inline-block;margin-top:8px;">
          Leave Feedback
        </a>
      </div>
    </div>
  `;
}

module.exports = { renderFeedbackFooter };
