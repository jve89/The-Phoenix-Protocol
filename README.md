# **The Phoenix Protocol**

**The Phoenix Protocol** is a fully automated heartbreak recovery SaaS. It delivers daily AI-generated guides tailored to gender and emotional goals (reconnect or move on), sent via email to paying subscribers. Built for quiet, long-term operation with minimal human maintenance.

---

## 🔥 Key Features

* ✅ **6 Personalised Variants**:
  `male_reconnect`, `male_moveon`
  `female_reconnect`, `female_moveon`
  `neutral_reconnect`, `neutral_moveon`

* 💳 Stripe checkout + webhook-based activation

* 📧 Daily email delivery + instant first guide

* 🔁 Retry queue for failed email attempts

* 🧠 GPT prompt system for content generation

* 🔓 JWT-powered unsubscribe system

* 🛠️ Test + debug CLI scripts included

* 🪫 Auto-refund after 5 bounces (SendGrid + Stripe)

---

## 🧱 Architecture Overview

```
.
├── content/
│   ├── prompts/               # Prompt files per variant (6 total)
│   ├── daily_cache/           # JSON guide output (auto-generated daily)
│   └── fallback.json          # Emergency fallback if guide fails
│
├── logs/                      # Log files (guide generation, retries, etc.)
│
├── public/                    # Frontend: index.html, checkout.html, etc.
│
├── src/
│   ├── db/                    # Postgres connection + setup
│   ├── routes/                # Express routes (signup, webhook, unsubscribe)
│   └── utils/                 # Core logic (email, cron, payment, logging)
│
├── templates/                 # Email HTML templates
├── test/                      # Manual test scripts
├── filetree.txt               # Reference structure (internal)
├── Dockerfile                 # Heroku-compatible container
└── Procfile                   # Heroku process declaration
```

---

## ⚙️ Environment Variables

Must be set in `.env` or via Heroku Config Vars:

```
DATABASE_URL
PORT
STRIPE_SECRET_KEY
STRIPE_PUBLIC_KEY
STRIPE_WEBHOOK_SECRET
SENDGRID_API_KEY
GROK_API_KEY       # Optional (used for AI tip variant)
JWT_SECRET
```

---

## 🧩 Core Commands

### 🔁 Retry Queue

Manages failed email sends:

```bash
node src/utils/retry_email_queue.js
```

### 📤 Daily Premium Guide Sender

Sends one email per user based on variant:

```bash
node src/utils/send_today_guide.js
```

### 🚀 Cron (15:00 UTC)

Automatically runs the above daily. Triggered via:

```js
startCron(); // Inside server.js
```

### 🆕 Immediate Guide for New Signups

Automatically sent via backend, or test manually:

```bash
node src/utils/send_first_guide_immediately.js user@example.com female reconnect
```

---

## 🧪 Manual Testing

Scripts under `/test`:

```bash
node test/test_send_premium.js       # Force-send a guide to a user
node test/test_farewell.js           # Sends exit email
node test/test_welcome_back.js       # Sends "welcome back" email
```

---

## 📩 Stripe Webhook (Refund Logic)

Route: `POST /api/webhooks`

* Updates user payment status
* Triggers auto-refund after 5 bounces
* Refund logic in:

  * `src/utils/payment.js`
  * `src/routes/webhooks.js`

---

## 🧠 AI Prompt Architecture

Prompt variants live in:

```
/content/prompts/
  ├── male_moveon.js
  ├── female_reconnect.js
  └── ...etc
```

Each exports template strings that fuel daily guide generation.
To update: edit prompt file → rerun guide generator.

---

## 🔐 Unsubscribe Logic

* Each email contains a signed JWT unsubscribe token
* Route: `GET /unsubscribe?token=...`
* Backend: `src/routes/unsubscribe.js` handles validation and DB update

---

## 📈 Monitoring

* `GET /api/ping` – UptimeRobot-compatible
* `GET /api/cron/status` – Timestamp of last cron run
* `GET /api/debug/list-users` – Debug only
* `GET /api/debug/retry-emails` – Force all retries (manual override)

---

## 🧼 Logs & Debugging

Check logs under `/logs/`:

* `send_today_guide.log` – Email sends
* `generate_today_guide_debug.log` – Content generation
* `email_retry_failures.json` – Email retry queue

---

## 🚀 Deployment

Fully Heroku-ready.
Ensure the following are present:

```
/Procfile
/Dockerfile
/.env (or Heroku Config Vars)
package.json  → with "start": "node src/server.js"
```

---

## 👨‍💻 Author

Made by **Johan (@vanerkel)**
Cleanly architected for long-term operation with minimal oversight.
No fluff. Just recovery — delivered.

---


