-- scripts/prune_old_logs.sql
-- Removes log entries older than 90 days

-- Delete old daily guides
DELETE FROM daily_guides
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old delivery logs
DELETE FROM delivery_log
WHERE sent_at < NOW() - INTERVAL '90 days';

-- Delete old retry queue entries
DELETE FROM email_retry_queue
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old fallback logs
DELETE FROM fallback_logs
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Delete old guide generation logs
DELETE FROM guide_generation_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete testimonials older than 90 days and not published
DELETE FROM testimonials
WHERE created_at < NOW() - INTERVAL '90 days' AND status != 'published';

-- Delete old used prompt tracking (optional, if table grows large)
DELETE FROM used_prompts
WHERE date < NOW() - INTERVAL '90 days';

-- Delete old cron failure entries
DELETE FROM cron_failures
WHERE last_failed < NOW() - INTERVAL '90 days';
