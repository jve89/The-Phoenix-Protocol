# 📖 The Phoenix Protocol – Long-Term SaaS Maintenance Guide
_Run for 10+ years with no human intervention._

---

## 🚀 1️⃣ Purpose & Philosophy

**Name:** The Phoenix Protocol  
**Mission:** Deliver automated, daily heartbreak recovery guides via email.

**SaaS Goal:**
- Zero human support
- Fully automated billing, refunds, and content delivery
- Built to quietly run in the background

---

## 🔧 2️⃣ Core Tech Stack

| Layer        | Tool / Platform     |
| ------------ | ------------------- |
| Backend      | Node.js + Express   |
| Database     | PostgreSQL (Heroku) |
| Payments     | Stripe              |
| Email        | SendGrid            |
| Cron / Tasks | node-cron           |
| AI           | OpenAI (optional)   |
| Frontend     | HTML + TailwindCSS  |
| Hosting      | Heroku              |

---

## 🔑 3️⃣ Environment Variables

Set in Heroku → **Settings → Config Vars**:

```bash
DATABASE_URL
SENDGRID_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
JWT_SECRET
ADMIN_EMAIL
PORT                 # optional; Heroku sets it
SUCCESS_URL          # optional override
CANCEL_URL           # optional override
OPENAI_API_KEY       # optional; enables AI generation
```

**Local:** use `.env`. Keep `.env.example` in sync.

---

## 📦 4️⃣ Folder Structure Reference

```plaintext
/public
  index.html, checkout.html, success.html, feedback.html, ...
/src
  server.js
  /routes
    routes.js, webhooks.js, unsubscribe.js, feedback.js
  /utils
    cron.js, content.js, email.js, payment.js, loadEnv.js,
    loadTemplate.js, db_logger.js, backup.js, validateGuide.js,
  /db
    db.js
/config
  config.js
/templates
  welcome.html, premium_guide_email.html, daily_summary.html, ...
/content/prompts
  male_moveon.js, female_reconnect.js, ...
```

---

## 💸 5️⃣ Auto-Refund Logic (SendGrid Bounces)

- Each user has a `bounces` counter in `users`.  
- When it reaches **5**, the latest Stripe charge is refunded.  
- Implemented in:
  - `src/routes/webhooks.js` (`/sendgrid` events)
  - `refundLatestChargeForEmail()` in `src/utils/payment.js`

---

## 🛠️ 6️⃣ Regular Maintenance

### ✅ Monthly
- `heroku logs --tail --app the-phoenix-protocol`
- Stripe Dashboard → payments, chargebacks
- SendGrid Dashboard → bounce/spam rates

### ✅ Quarterly
- Make a test Stripe purchase
- Backup database
- Trigger a test bounce to confirm refund flow

### ✅ Annually
- Renew domain; Heroku ACM manages SSL
- `npm outdated` review; update cautiously (deps are pinned)
- Test signup → checkout → delivery end-to-end

---

## 🔄 7️⃣ Refund Logic – Manual Test

1. Sign up with a test email  
2. Simulate 5 SendGrid bounces (or increment `users.bounces` in a sandbox)  
3. Confirm:
   - `users.bounces` == 5
   - Refund fired
   - Log entry in `guide_generation_logs` / Stripe dashboard

---

## 🛡️ 8️⃣ Disaster Recovery – If It Breaks

1. Restart:

   ```bash
   heroku restart --app the-phoenix-protocol
   ```

2. Verify Config Vars in Heroku  
3. Inspect logs:

   ```bash
   heroku logs --tail --app the-phoenix-protocol
   ```

4. Check these files first:
   - `src/routes/webhooks.js`
   - `src/utils/payment.js`
   - `src/utils/email.js`

---

## 🧠 9️⃣ Final Notes

- Designed for no support team  
- Bounce-triggered refunds reduce churn friction  
- Do not add complexity without clear ROI

Prioritise:
- Deterministic logic
- Clean folder structure
- Single responsibility per module
- Pinned dependencies, no framework lock-in
