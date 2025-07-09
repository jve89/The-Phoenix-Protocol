The Phoenix Protocol – Long-Term SaaS Maintenance Guide
This document ensures your SaaS can run 10+ years without intervention while remaining stable, compliant, and maintainable.

🚀 1️⃣ Project Purpose
Name: The Phoenix Protocol

Mission: Automated daily breakup recovery guidance via Stripe, SendGrid, Postgres.

Goal: Low-touch SaaS requiring near-zero human support, with auto-refunds on undeliverable emails.

🔧 2️⃣ Core Technologies
Backend: Node.js + Express

Database: PostgreSQL (Heroku Postgres)

Email: SendGrid

Payments: Stripe (webhooks for auto-refunds on 5x bounces)

Frontend: HTML, TailwindCSS

Hosting: Heroku

🔑 3️⃣ Environment Variables
Ensure these are always correctly set in Heroku Config Vars:

DATABASE_URL

SENDGRID_API_KEY

STRIPE_SECRET_KEY

STRIPE_PUBLIC_KEY

STRIPE_WEBHOOK_SECRET

GROK_API_KEY (optional, for Grok tips)

PORT

Check .env locally if testing.

📦 4️⃣ Directory Structure Reference
public/
  index.html
  checkout.html
  success.html
  ...
src/
  server.js
  routes/
    routes.js
    webhooks.js
  utils/
    payment.js
    email.js
    ...
logs/
config/
templates/

💸 5️⃣ Stripe Bounce Refund Logic
We track bounces in users table.

After 5 bounces, an automatic refund is triggered using:

refundLatestChargeForEmail in src/utils/payment.js

Webhook handling in src/routes/webhooks.js

🛠️ 6️⃣ Regular Maintenance Checklist
✅ Monthly:

Check Heroku logs: heroku logs --tail --app the-phoenix-protocol

Review Stripe payments dashboard for disputes or failures.

Confirm SendGrid reputation and bounce rates.

✅ Quarterly:

Verify payment flows with a Stripe test purchase.

Backup Postgres database.

Test webhook refund automation.

✅ Annually:

Review and renew domain and SSL (Heroku ACM handles SSL).

Check for Node dependency updates (npm outdated, npm update).

🔄 7️⃣ Testing Refund Automation
To test:

Use a Stripe test card that forces failure.

Check webhook triggers bounce increment.

Confirm refund is processed automatically on 5th bounce.

🛡️ 8️⃣ Recovery Strategy
If broken:

Check Heroku config vars (DATABASE_URL, STRIPE_SECRET_KEY etc.).

Run heroku restart --app the-phoenix-protocol.

Review logs for ❌ errors.

Check src/routes/webhooks.js and src/utils/payment.js for last updates.

✍️ 9️⃣ Notes for Future You
This SaaS is designed to run quietly in the background.

Aim for no direct support; automated refunds reduce complaints.

Any major refactors should maintain:

Determinism

Low complexity

Clean modular structure


