# The Phoenix Protocol

**The Phoenix Protocol** is a premium heartbreak recovery service that delivers daily, psychologically grounded guides to paying subscribers. Each guide is tailored to the user's gender and emotional goal (reconnect or move on). The app uses AI-generated content, email automation, and Stripe integration to operate autonomously.

---

## 📦 Features

- 🔥 6 personalised story variants:
  - `male_reconnect`, `male_moveon`
  - `female_reconnect`, `female_moveon`
  - `neutral_reconnect`, `neutral_moveon`
- ✅ Stripe checkout with webhook-based payment confirmation
- 📧 Premium email delivery system (daily + immediate first guide)
- 🔁 Retry queue for failed emails
- 🧠 AI prompt system for generating new content
- 🧾 Unsubscribe mechanism with JWT tokens
- 🛠️ CLI utilities for testing and debugging

---

## 🧩 Architecture Overview

├── content/ # AI prompts and generated daily content
│ ├── prompts/ # 6 variant prompt files (male/female/neutral × reconnect/move_on)
│ ├── daily_cache/ # JSON output from daily AI guide generation
│ └── fallback.json # Default fallback guide
│
├── logs/ # Log files for debugging and audit
│
├── public/ # Static frontend assets (HTML, images, scripts)
│
├── src/
│ ├── db/ # Postgres connection
│ ├── routes/ # Express API routes
│ └── utils/ # Core pipeline logic (email, cron, Stripe, guide generation)
│
├── templates/ # HTML email templates
├── test/ # Manual test scripts for QA
└── users.db # SQLite for development fallback (use Postgres in production)

---

## 🛠️ Environment Variables

The following variables must be set in `.env` (or on Heroku):

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your_jwt_secret

---

## ⚙️ Core Scripts

### ✅ Generate new content
✅ Send daily premium guides
node src/utils/send_today_guide.js

✅ Send immediate guide to new user
node src/utils/send_first_guide_immediately.js user@example.com female reconnect

🔁 Retry Email Failures
node src/utils/retry_email_queue.js

📩 Stripe Webhook
POST /api/webhooks
It updates the user’s payment status and triggers refunds for repeated email bounces.

🔓 Unsubscribe
Each email contains a secure unsubscribe token using JWT.
Landing page: /unsubscribe?token=...
Route: /api/unsubscribe handles secure opt-out.

🧪 Test Scripts
test/test_send_premium.js
test/test_farewell.js
test/test_welcome_back.js

🧠 Prompt Generation Logic
All 6 variant prompts are located in:
content/prompts/
Each file exports multiple prompt templates used during AI generation.
To update prompts, simply edit the JS files and regenerate guides.

🧼 Logging
Log files are saved to:
logs/send_today_guide.log
logs/generate_today_guide_debug.log
logs/email_retry_failures.json

Use logs to debug sending issues, failed variants, or retry failures.

🚀 Deployment
Heroku-compatible. Make sure the following files are present:

Procfile

.env (via Heroku Config Vars)

package.json with proper start script

📣 Status Monitoring
/api/ping – UptimeRobot-compatible health check
/api/cron/status – Last cron run timestamp
/api/debug/list-users – Debug-only user listing
/api/debug/retry-emails – Force retry for failed emails (manual)

👨‍💻 Author
Built by Johan (@vanerkel)
Clean structure, long-term maintainability, and automation-first design.


