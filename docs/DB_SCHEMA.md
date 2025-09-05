# 📦 PostgreSQL Database Schema — The Phoenix Protocol
_Last updated: 2025-09-05_

This file mirrors the schema used by the code in `src/`. Verify in your DB before changes:

\d+ users  
\d+ daily_guides  
\d+ delivery_log  
\d+ guide_generation_logs  
\d+ testimonials  
\d+ processed_webhooks

---

## Table: `users`
Purpose: user identity, plan state, usage counters, unsubscribe status.  
Used in: `routes.js`, `cron.js`, `webhooks.js`, `unsubscribe.js`

| Column                    | Type      | Notes |
|---------------------------|-----------|------|
| id                        | serial    | PK |
| email                     | text      | UNIQUE, required |
| name                      | text      | optional |
| gender                    | text      | required (`male` \| `female` \| `neutral`) |
| goal_stage                | text      | required (`moveon` \| `reconnect`) |
| plan                      | integer   | 0 = none/expired, >0 = active |
| plan_limit                | integer   | total allowed sends for current plan |
| is_trial_user             | boolean   | TRUE for trial |
| trial_usage_count         | integer   | incremented on trial sends |
| paid_usage_count          | integer   | incremented on paid sends |
| created_at                | timestamp | default NOW() |
| last_trial_sent_at        | timestamp | last trial send |
| last_paid_sent_at         | timestamp | last paid send |
| trial_started_at          | timestamp | trial start |
| paid_started_at           | timestamp | paid start |
| trial_farewell_sent_at    | timestamp | when trial farewell sent |
| paid_farewell_sent_at     | timestamp | when paid farewell sent |
| unsubscribed              | boolean   | TRUE if manually unsubscribed |
| session_id                | text      | Stripe checkout session |
| bounces                   | integer   | email bounce counter |

---

## Table: `daily_guides`
Purpose: generated AI guide content per calendar date.  
Used in: `cron.js`, `content.js`, `email.js`

| Column     | Type      | Notes |
|------------|-----------|------|
| date       | date      | PK |
| guide      | jsonb     | full structured guide (all variants) |
| created_at | timestamp | default NOW() |

---

## Table: `delivery_log`
Purpose: records sends and outcomes for trial and paid.  
Used in: `cron.js`, `db_logger.js`

| Column        | Type      | Notes |
|---------------|-----------|------|
| id            | serial    | PK |
| user_id       | integer   | FK → users(id), ON DELETE CASCADE |
| email         | text      | recipient |
| variant       | text      | e.g. `female_moveon` |
| status        | text      | `success` \| `failed` |
| error_message | text      | optional |
| delivery_type | text      | `trial` \| `paid` |
| sent_at       | timestamp | default NOW() |

---

## Table: `guide_generation_logs`
Purpose: operational logs for generation, backups, and cron.  
Used in: `db_logger.js`, `cron.js`, `content.js`, `webhooks.js`

| Column     | Type      | Notes |
|------------|-----------|------|
| id         | serial    | PK |
| source     | text      | e.g. `cron`, `content`, `webhook` |
| level      | text      | `info` \| `warn` \| `error` |
| message    | text      | log message (truncated in code at 2000 chars) |
| created_at | timestamp | default NOW() |

---

## Table: `testimonials`
Purpose: user-submitted testimonials via feedback endpoint.  
Used in: `routes/feedback.js`

| Column      | Type      | Notes |
|-------------|-----------|------|
| id          | serial    | PK |
| first_name  | text      | optional |
| age         | integer   | 12–100 or NULL |
| gender      | text      | optional |
| testimonial | text      | sanitized text |
| photo_url   | text      | `/uploads/...` or NULL |
| permission  | boolean   | required TRUE to accept |
| status      | text      | `pending` \| `published` (inserted as `pending`) |
| created_at  | timestamp | default NOW() |

---

## Table: `processed_webhooks`
Purpose: idempotency guard for Stripe webhooks.  
Used in: `routes/webhooks.js`

| Column   | Type | Notes |
|----------|------|------|
| event_id | text | UNIQUE, insert-on-conflict to dedupe |

---

## Retention
- `daily_guides.created_at`, `delivery_log.sent_at`, and `guide_generation_logs.created_at` are pruned after ~90 days by `scripts/prune_old_logs.sql`.

---

## Notes
- Local dev auto-creates core tables via `src/db/db.js` init SQL (skipped in `NODE_ENV=production`; use migrations in prod).
- Columns and names here reflect the code paths currently in use. If a mismatch is discovered in production, update this file after verifying with `\d`.
