# 📦 PostgreSQL Database Schema — The Phoenix Protocol
> Last updated: 2025-07-31  
> This document outlines all tables in the `public` schema of the production PostgreSQL database. Each entry includes its purpose, key fields, and usage in the codebase.  

⚠️ Note: This file is manually maintained and may fall out of sync. Always confirm schema using `\d table_name` before making DB changes.

---

## Table: `users`
**Purpose:** Stores user details, subscription state, and tracking data  
**Used in:** `routes.js`, `db.js`, `cron.js`, `email.js`

| Column            | Type      | Description                                  |
|-------------------|-----------|----------------------------------------------|
| id                | integer   | Primary key                                  |
| email             | text      | User email address                           |
| name              | text      | Display name                                 |
| gender            | text      | male/female/neutral                          |
| goal_stage        | text      | moveon / reconnect                           |
| is_trial_user     | boolean   | Whether user is on free trial                |
| plan              | integer   | 0 = expired/unpaid, 1 = active plan          |
| plan_limit        | integer   | Max number of content emails                 |
| usage_count       | integer   | Number of guides received so far             |
| farewell_sent     | boolean   | Whether farewell was sent                    |
| is_subscriber     | boolean   | Whether user is/was a paying subscriber      |
| unsubscribed      | boolean   | Whether user unsubscribed manually           |
| last_trial_sent_at| timestamp | Last trial email sent (for 3-day window)     |
| created_at        | timestamp | Signup time                                  |
| updated_at        | timestamp | Auto-managed by DB trigger                   |

---

## Table: `daily_guides`
**Purpose:** Stores generated guide objects per day.  
**Used in:** `loadGuideByDate()`, `cron.js`, `email.js`

| Column   | Type   | Description             |
|----------|--------|-------------------------|
| date     | date   | Primary key             |
| guide    | jsonb  | Full structured guide   |

---

## Table: `used_prompts`
**Purpose:** Tracks which prompt index was used per variant per day. Prevents repeats.  
**Used in:** `generateTip()` in `cron.js`

| Column     | Type     | Description             |
|------------|----------|-------------------------|
| date       | date     | Guide date              |
| variant    | text     | e.g. male_moveon        |
| prompt_idx | integer  | Index used in prompt[]  |

---

## Table: `generated_guides`
**Purpose:** Prevents AI duplicate content by storing content hashes.  
**Used in:** `generateTip()` in `cron.js`

| Column      | Type    | Description                   |
|-------------|---------|-------------------------------|
| date        | date    | Guide creation date           |
| variant     | text    | Variant key (e.g. female_reconnect) |
| prompt_idx  | integer | Which prompt index was used   |
| content_hash| text    | SHA256 of full content string |

---

## Table: `guide_generation_logs`
**Purpose:** Records logs from cron job attempts to generate content.  
**Used in:** `cron.js`, admin backups, retry logic

| Column   | Type     | Description               |
|----------|----------|---------------------------|
| id       | serial   | Primary key               |
| timestamp| timestamptz | Log time             |
| source   | text     | e.g. 'cron' or 'manual'   |
| level    | text     | info, warn, error         |
| message  | text     | Log message               |
| created_at| timestamp | Record creation time    |

---

## Table: `delivery_log`
**Purpose:** Tracks all sent emails (both trial and paid).  
**Used in:** `email.js`, `cron.js`

| Column   | Type     | Description              |
|----------|----------|--------------------------|
| id       | serial   | Primary key              |
| email    | text     | Recipient email          |
| subject  | text     | Email subject            |
| variant  | text     | Variant sent (if guide)  |
| plan     | integer  | Trial (0) or Paid (1)    |
| success  | boolean  | Delivery status          |
| created_at | timestamp | Send time             |

---

## Table: `email_retry_queue`
**Purpose:** Stores failed email deliveries for retry.  
**Used in:** `retryFailedEmails()` job

| Column     | Type     | Description            |
|------------|----------|------------------------|
| id         | serial   | Primary key            |
| email      | text     | Email to retry         |
| subject    | text     | Email subject          |
| payload    | jsonb    | Full SendGrid body     |
| retries    | integer  | Number of attempts     |
| max_retries | integer | Max allowed attempts   |
| last_attempt | timestamp | Last try time       |

---

## Table: `cron_failures`
**Purpose:** Logs general cron execution errors.  
**Used in:** `cron.js`, especially `generateDailyGuidesSlot`

| Column     | Type     | Description             |
|------------|----------|-------------------------|
| id         | serial   | Primary key             |
| job        | text     | Job name (e.g. deliverTrial) |
| error      | text     | Error message           |
| timestamp  | timestamp | Time of failure        |

---

## Table: `fallback_logs`
**Purpose:** Optional — may have been used for GPT fallback validation layer.  
**Used in:** (Unknown — possibly deprecated or optional)

| Column   | Type     | Description           |
|----------|----------|-----------------------|
| id       | serial   |                       |
| variant  | text     |                       |
| input    | text     |                       |
| output   | text     |                       |
| valid    | boolean  |                       |

---

## Table: `testimonials`
**Purpose:** Stores user testimonials for use in landing page or sales copy.  
**Used in:** (Possibly not yet integrated)

| Column   | Type     | Description             |
|----------|----------|-------------------------|
| id       | serial   | Primary key             |
| name     | text     | Person's name           |
| quote    | text     | Testimonial             |
| variant  | text     | Gender/goal segment     |
| created_at | timestamp | When submitted       |

---

## ✅ Audit Summary

| Table Name         | Type        | Usage Status |
|--------------------|-------------|--------------|
| `users`            | core        | ✅ active     |
| `daily_guides`     | core        | ✅ active     |
| `used_prompts`     | core        | ✅ active     |
| `generated_guides` | core        | ✅ active     |
| `guide_generation_logs` | core   | ✅ active     |
| `delivery_log`     | core        | ✅ active     |
| `email_retry_queue`| support     | ✅ active     |
| `cron_failures`    | support     | ✅ active     |
| `fallback_logs`    | legacy(?)   | ⚠️ unclear    |
| `testimonials`     | optional    | ⚠️ optional   |

---

## View: `user_delivery_view`  
**Purpose:** Provides a unified overview of each user’s subscription state and delivery activity  
**Used in:** DB inspection, future admin dashboards, enforcement logic audits

| Column         | Type      | Description                                       |
|----------------|-----------|---------------------------------------------------|
| id             | integer   | User ID                                           |
| email          | text      | User email address                               |
| plan           | integer   | Plan type (0 = expired/unpaid, 1 = paid)         |
| plan_limit     | integer   | Max number of emails allowed                     |
| usage_count    | integer   | Number of guides received                        |
| has_hit_limit  | boolean   | True if `usage_count >= plan_limit`              |
| is_trial_user  | boolean   | True if user is on free trial                    |
| farewell_sent  | boolean   | Whether farewell was already sent                |
| is_subscriber  | boolean   | Whether user was ever a paying subscriber        |
| unsubscribed   | boolean   | True if user manually unsubscribed               |
| is_downgraded  | boolean   | True if `plan = 0` and not a subscriber anymore  |
| total_sent     | integer   | Total emails logged (from `delivery_log`)        |
| failed_count   | integer   | Number of failed sends                           |
| last_sent      | timestamp | Timestamp of most recent sent email              |
