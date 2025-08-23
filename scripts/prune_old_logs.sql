-- scripts/prune_old_logs.sql
-- Prune rows older than a retention window. Safe if tables/columns are absent.
-- Default retention: 90 days.

DO $prune$
DECLARE
  v_keep interval := '90 days';

  -- helper: delete rows older than v_keep if table and column exist
  PROCEDURE prune_if_exists(p_table regclass, p_col text) LANGUAGE plpgsql AS $$
  DECLARE
    v_exists boolean;
  BEGIN
    -- table present?
    SELECT to_regclass(p_table::text) IS NOT NULL INTO v_exists;
    IF NOT v_exists THEN
      RAISE NOTICE 'skip prune: table % not found', p_table;
      RETURN;
    END IF;

    -- column present?
    PERFORM 1
    FROM information_schema.columns
    WHERE table_schema = split_part(p_table::text, '.', 1)
      AND table_name   = split_part(p_table::text, '.', 2)
      AND column_name  = p_col;
    IF NOT FOUND THEN
      RAISE NOTICE 'skip prune: column %.% not found', p_table, p_col;
      RETURN;
    END IF;

    EXECUTE format('DELETE FROM %s WHERE %I < NOW() - $1', p_table, p_col)
    USING v_keep;
  END;
  $$;

BEGIN
  -- Current tables in your schema (as verified):
  PERFORM prune_if_exists('public.daily_guides',          'created_at');
  PERFORM prune_if_exists('public.delivery_log',          'sent_at');
  PERFORM prune_if_exists('public.guide_generation_logs', 'created_at');

  -- Future/optional tables (no-ops if absent):
  PERFORM prune_if_exists('public.email_retry_queue', 'created_at');
  PERFORM prune_if_exists('public.fallback_logs',     'timestamp');
  PERFORM prune_if_exists('public.testimonials',      'created_at');
  PERFORM prune_if_exists('public.used_prompts',      'date');
  PERFORM prune_if_exists('public.cron_failures',     'last_failed');

  -- Special case: testimonials keep published; treat NULL as not published
  IF to_regclass('public.testimonials') IS NOT NULL THEN
    PERFORM 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='testimonials' AND column_name='created_at';
    IF FOUND THEN
      EXECUTE $SQL$
        DELETE FROM public.testimonials
        WHERE created_at < NOW() - $1
          AND (status IS DISTINCT FROM 'published')
      $SQL$ USING v_keep;
    END IF;
  END IF;
END
$prune$;
