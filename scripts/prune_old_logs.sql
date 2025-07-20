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
