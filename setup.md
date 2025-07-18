**The Phoenix Protocol – Long-Term SaaS Maintenance Guide**
*Run for 10+ years with no human intervention.*

---

### 🚀 1️⃣ Purpose & Philosophy

**Name:** The Phoenix Protocol
**Mission:** Deliver automated, daily heartbreak recovery guides via email.
**SaaS Goal:**

* Zero human support
* Fully automated billing, refunds, and content delivery
* Built to quietly run in the background

---

### 🔧 2️⃣ Core Tech Stack

| Layer        | Tool / Platform     |
| ------------ | ------------------- |
| Backend      | Node.js + Express   |
| Database     | PostgreSQL (Heroku) |
| Payments     | Stripe              |
| Email        | SendGrid            |
| Cron / Tasks | node-cron           |
| AI Tips      | Grok (optional)     |
| Frontend     | HTML + TailwindCSS  |
| Hosting      | Heroku              |

---

### 🔑 3️⃣ Environment Variables

Ensure **all** are set in Heroku → **Settings → Config Vars**:

```
DATABASE_URL
PORT
SENDGRID_API_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLIC_KEY
STRIPE_WEBHOOK_SECRET
GROK_API_KEY      # (Optional – only needed for AI tips)
```

**Local Testing:** Use `.env` file. Check for `.env.example` as future reference.

---

### 📦 4️⃣ Folder Structure Reference

```
/public
  index.html, checkout.html, success.html, ...
/src
  server.js
  /routes
    routes.js, webhooks.js, unsubscribe.js
  /utils
    content.js, payment.js, email.js, cron.js, ...
/config
  config.js
/templates
  welcome.html, premium_guide_email.html, ...
/content/prompts
  male_moveon.js, female_reconnect.js, ...
```

---

### 💸 5️⃣ Auto-Refund Logic (SendGrid Bounces)

* Each user has a `bounces` counter in the `users` table
* When it reaches **5**, the latest charge is refunded
* Implemented in:

  * `src/routes/webhooks.js` (SendGrid events)
  * `refundLatestChargeForEmail()` in `src/utils/payment.js`

---

### 🛠️ 6️⃣ Regular Maintenance

#### ✅ Monthly

* `heroku logs --tail --app the-phoenix-protocol`
* Stripe Dashboard → check payments, chargebacks
* SendGrid Dashboard → check bounce/spam rates

#### ✅ Quarterly

* Make a test Stripe purchase
* Backup database
* Trigger a test bounce to confirm refund flow works

#### ✅ Annually

* Renew domain & SSL (Heroku ACM handles SSL by default)
* Run `npm outdated` + `npm update`
* Test signup-to-checkout flow end-to-end

---

### 🔄 7️⃣ Refund Logic – Manual Test

1. Sign up with a test email
2. Simulate 5 SendGrid bounces (or fake via DB increment)
3. Confirm:

   * `users.bounces` hits 5
   * Refund is auto-triggered
   * Webhook log confirms refund via Stripe

---

### 🛡️ 8️⃣ Disaster Recovery – What to Do If It Breaks

1. Run:

   ```bash
   heroku restart --app the-phoenix-protocol
   ```

2. Check Config Vars in Heroku

3. Look at logs:

   ```bash
   heroku logs --tail --app the-phoenix-protocol
   ```

4. Investigate files:

   * `src/routes/webhooks.js`
   * `src/utils/payment.js`
   * `src/utils/email.js`

---

### 🧠 9️⃣ Final Notes for Future You

* Built to require **no support team**
* Stripe refunds on bounces = fewer angry users
* Do not overcomplicate
* Prioritise:

  * ✅ Deterministic logic
  * ✅ Clear folder structure
  * ✅ Isolated responsibilities
  * ✅ Flat dependencies, no framework lock-in

---
