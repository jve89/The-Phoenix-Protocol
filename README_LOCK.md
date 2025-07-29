# 🔐 Phoenix Protocol – Locked Version `v1.0.0`

**Status:** Production-ready, fully audited  
**Commit Tag:** `v1.0.0`  
**Date:** 2025-07-27

---

## ✅ System Scope

This version of *The Phoenix Protocol* is a **stable, self-sustaining automation build** that handles:

- 💔 Daily AI guide generation (OpenAI GPT-based)
- 📬 Email delivery to paid users (SendGrid)
- 💾 Daily guide backups (Markdown + JSON via email)
- 🔁 Automatic retry system for failed emails
- 🎉 Farewell messages when plan is complete
- 🧹 Log pruning after 90 days
- 🛡️ All critical operations run via secure `cron` schedules
- 🧠 Validation layer flags low-quality or missing content

---

## 🧱 Key Design Goals Met

- 100% deterministic job scheduling
- Built for **10+ years unattended operation**
- Zero runtime assumptions
- All external dependencies checked at boot
- No duplicate sends or hidden side effects
- Modular, testable, and auditable codebase

---

## 🧪 Testing Status

All runtime files audited and confirmed functional:
- `cron.js`
- `content.js`
- `email.js`
- `backup.js`
- `validateGuide.js`
- `loadTemplate.js`

Heroku logs show successful deploy and zero runtime errors.

All flows manually tested:
- ✅ Signup
- ✅ Daily email
- ✅ Guide delivery
- ✅ Stripe checkout
- ✅ Farewell
- ✅ Retry logic
- ✅ CSP-compliant frontend

---

## 🔒 Stability Policy

This version is **immutable**. No edits, no hotfixes.  
Revisit only if:
- OpenAI, SendGrid, or Heroku APIs break
- External dependencies change format or pricing
- Business logic changes

If modified, bump to `v1.0.1` or `v2.0.0` with a new lock summary.

---

## 🚀 Git Tag Instructions

git tag -a v1.0.0 -m "🚀 Phoenix Protocol v1.0.0 — stable, production-grade autopilot build"
git push origin v1.0.0

---

## 🗂️ DB Schema Audit & Pruning Policy (2025-07-29)

**All major tables are production-aligned. Pruning, retention, and type usage have been checked for long-term automation.**

---

### **Current Table Coverage**

| Table                    | Purpose                                      | Pruning?       | Notes / Audit Result                |
|--------------------------|----------------------------------------------|----------------|-------------------------------------|
| `users`                  | All user state & meta                        | ❌ Never       | Retained for lifetime, not pruned.  |
| `daily_guides`           | Generated guide JSON per day                 | ✅ 90 days     | Pruned by `created_at`.             |
| `delivery_log`           | All email send/attempt logs                  | ✅ 90 days     | Pruned by `sent_at`.                |
| `email_retry_queue`      | Transient email retry queue                  | ✅ 90 days     | Pruned by `created_at`.             |
| `fallback_logs`          | Fallback delivery/guide failures             | ✅ 90 days     | Pruned by `timestamp`.              |
| `guide_generation_logs`  | Cron/process logs                            | ✅ 90 days     | Pruned by `created_at`.             |
| `testimonials`           | User feedback/testimonials                   | ✅ 90 days     | Pruned if not published.            |
| `used_prompts`           | Tracks which prompts have been used          | ✅ 90 days     | Pruned by `date`.                   |

**Keys:**
- **✅ Pruned:** Table is automatically cleaned by slot-based cron and/or manual SQL.
- **❌ Never:** Table is permanent or only pruned manually.

---

### **Type and Logic Consistency**

- `plan` is stored as **integer** in DB but compared as string in logic.<br>
  **All core flows now cast to string at comparison points.**<br>
  No logic bugs observed; recommend standardising to string in a future schema version for zero ambiguity.
- No tables are dropped or truncated by accident.
- All pruning is non-destructive to critical business/user data.

---

### **Retention Policy**

- **User rows:** Retained permanently, even after cancellation (audit and compliance).
- **Logs and ephemeral tables:**  
  - Cleared every 90 days via cron or `scripts/prune_old_logs.sql`.
  - No uncontrolled data growth.
  - Pruning logic matches DB columns and types.

---

### **Audit Status**

- ✅ **Schema and code are fully aligned as of `v1.0.0`**
- No destructive or accidental deletes.
- Slot-based cron jobs guarantee retries and idempotency for all guide and email operations.

---

**If future migrations are needed:**  
- Run manual SQL migrations and update this audit block.
- Bump `v1.x.x` tag if _any_ table, column, or field handling changes.

---

_Audit by ChatGPT, 2025-07-29  
Author: Johan (@vanerkel)_
