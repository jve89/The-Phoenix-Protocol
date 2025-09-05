# 🔐 Phoenix Protocol – Locked Version `v1.0.0`

Status: Production-ready, fully audited  
Commit Tag: v1.0.0  
Date: 2025-07-27

---

## ✅ System Scope

This stable build handles:

- Daily AI guide generation (OpenAI) for six variants
- Email delivery for trial and paid users (SendGrid)
- Admin daily summary email (HTML) with guide preview
- Farewell messages when plan limit is reached
- Log pruning after 90 days
- All critical operations via cron (UTC)
- Content validation layer with warnings

---

## 🧱 Design Goals Met

- Deterministic job scheduling (12:00 generate, 13:00 trial, 14:00 paid, 03:00 maintenance UTC)
- Built for long-term unattended operation
- Boot-time env checks; fail fast on missing secrets
- Idempotent webhook processing and delivery guards
- Minimal shared state; explicit DB writes; no hidden side effects
- Conservative dependencies pinned in `package.json`

---

## 🧪 Operational Verification

Audited runtime modules:

- `src/server.js`
- `src/routes/{routes,webhooks,unsubscribe,feedback}.js`
- `src/utils/{cron,content,email,backup,validateGuide,loadTemplate,db_logger,payment,loadEnv}.js`
- `src/db/db.js`
- Templates in `templates/` loaded via `loadTemplate`

Manual smoke flows validated:

- Signup (trial and paid)
- Stripe checkout session creation
- Trial and paid sends
- Farewell sends
- Unsubscribe flow
- Webhook signature verification and dedupe

---

## 🔒 Stability Policy

This version is locked. No edits or hotfixes.  
Revisit only if an external API or business rule changes.  
Any modification requires a new tag (e.g., `v1.0.1` or `v2.0.0`) and an updated lock note.

---

## 🚀 Git Tag Instructions

git tag -a v1.0.0 -m "Phoenix Protocol v1.0.0 — stable, production-grade autopilot build"  
git push origin v1.0.0

---

## 🗂️ DB Schema Audit & Pruning Policy (2025-07-29)

Core tables are aligned with code. Retention:

| Table                   | Purpose                                | Pruning |
|-------------------------|----------------------------------------|---------|
| users                   | User state & counters                  | Never   |
| daily_guides            | Generated guide JSON per day           | 90 days |
| delivery_log            | Send outcomes                          | 90 days |
| guide_generation_logs   | Operational logs                       | 90 days |
| testimonials            | User feedback                          | 90 days if not published (per SQL) |

Pruning is performed by `scripts/prune_old_logs.sql`. No destructive operations on core user data.

---

## ⚙️ Notes

- Cron assumes a single running instance to avoid duplicate sends. Keep one process for cron.
- Webhooks are idempotent via `processed_webhooks(event_id UNIQUE)`.
- Email bounces increment `users.bounces`; after threshold, latest Stripe charge is refunded with idempotency.
- Admin summary email requires `ADMIN_EMAIL`.

---

## ✅ Audit Status

- Schema and code aligned at tag `v1.0.0`.
- No accidental deletes or truncations.
- Catch-up on boot prevents missed daily operations.

---

Audit by ChatGPT, 2025-07-29  
Author: Johan (@vanerkel)
