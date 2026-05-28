-- ============================================================
-- 20260528170000 — briefing pipeline weekly schedule (pg_cron)
--
-- Mirrors the heartbeat schedule pattern from
-- 20260519180002_heartbeat_schedule.sql. Schedules the
-- `briefing-pipeline` Edge Function to run weekly via pg_cron +
-- net.http_post, so the briefing arrives every Monday instead of
-- requiring a manual curl.
--
-- IMPORTANT: this migration is intentionally INACTIVE on first
-- apply. The actual `select cron.schedule(...)` call is COMMENTED
-- OUT. The founder uncomments + runs it in the SQL Editor AFTER:
--   1. Confirming the briefing-pipeline function is deployed (it is,
--      as of this PR's predecessor — B.6a / PR #190 was the last
--      function change).
--   2. Confirming the `antaeus_service_role_key` Vault secret exists
--      (it does, from heartbeat setup; same secret powers both
--      cron jobs).
--
-- Why this is its own migration rather than tagged onto the heartbeat
-- schedule: the briefing is a different cadence (weekly vs every
-- 30 min), a different LLM cost profile (~$0.50-$1 per run vs ~$0
-- for the heartbeat), and a different operator-facing payoff. Worth
-- the separate enable + revoke surface.
--
-- See: deliverables/specs/briefing/01-build-phase-plan.md (post-B.6
-- production cron — small infrastructure PR adjacent to B.7-B.9)
-- See: supabase/migrations/20260519180002_heartbeat_schedule.sql
--      (heartbeat — same shape)
-- ============================================================

-- Idempotent extension installs. The heartbeat migration already
-- ran these, but we repeat the guarded creates so this migration is
-- self-sufficient if it's ever applied to a fresh database that
-- doesn't yet have the heartbeat layer. CREATE EXTENSION IF NOT EXISTS
-- is a no-op when the extension is already installed.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when insufficient_privilege or feature_not_supported then
    raise notice 'pg_cron extension not available on this database — skipping (expected on Supabase preview branches where superuser is unavailable).';
end $$;

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception
  when insufficient_privilege or feature_not_supported then
    raise notice 'pg_net extension not available on this database — skipping (expected on Supabase preview branches where superuser is unavailable).';
end $$;

-- ============================================================
-- Briefing weekly schedule (UNCOMMENT + run in the SQL Editor
-- after this migration applies to main).
--
-- Schedule: Monday 14:00 UTC = 10:00 AM US Eastern / 7:00 AM US
-- Pacific. Reasonable "Monday morning briefing" arrival. Adjust
-- the cron expression to suit your timezone before running the
-- block — pg_cron uses the database server timezone, which on
-- Supabase is UTC.
--
-- Replace <project-ref> with the actual Supabase project ref
-- (wjdqmgxwulqxxxnyuzyl). The Vault secret name must match what
-- was passed to vault.create_secret during heartbeat setup
-- (antaeus_service_role_key).
-- ============================================================

-- select cron.schedule(
--     'antaeus-briefing-weekly',
--     '0 14 * * MON',  -- Monday 14:00 UTC (10:00 AM ET / 7:00 AM PT)
--     $$
--     select net.http_post(
--         url := 'https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/briefing-pipeline',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || (
--                 select decrypted_secret
--                 from vault.decrypted_secrets
--                 where name = 'antaeus_service_role_key'
--             )
--         ),
--         body := '{}'::jsonb,
--         -- The briefing pipeline can take 100-150s per workspace.
--         -- Give pg_net's underlying HTTP client enough room to
--         -- collect the response before timing out (default is
--         -- typically 5s; we want 5 minutes). 300_000ms = 5min.
--         timeout_milliseconds := 300000
--     );
--     $$
-- );

-- ============================================================
-- Useful queries for verifying after enable:
--
--   -- Confirm the job exists + is active:
--   select jobid, jobname, schedule, active, command
--   from cron.job
--   where jobname = 'antaeus-briefing-weekly';
--
--   -- Fire the briefing manually (no need to wait until Monday):
--   select net.http_post(
--       url := 'https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/briefing-pipeline',
--       headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer ' || (
--               select decrypted_secret
--               from vault.decrypted_secrets
--               where name = 'antaeus_service_role_key'
--           )
--       ),
--       body := '{}'::jsonb,
--       timeout_milliseconds := 300000
--   ) as request_id;
--
--   -- See the most recent cron runs for the briefing job specifically:
--   select start_time, end_time, status, return_message
--   from cron.job_run_details
--   where jobid in (
--       select jobid from cron.job where jobname = 'antaeus-briefing-weekly'
--   )
--   order by start_time desc
--   limit 10;
--
--   -- See the matching HTTP responses (the cron triggers
--   -- net.http_post which collects the response asynchronously
--   -- into net._http_response):
--   select id, status_code, created, content::text
--   from net._http_response
--   where created > now() - interval '30 days'
--   order by created desc
--   limit 20;
--
--   -- See briefing runs that landed from the cron (cross-reference
--   -- by start time within ~15 min of the cron schedule):
--   select id, started_at, completed_at, status,
--          total_cost, jsonb_array_length(stage_log) as stages
--   from public.briefing_runs
--   where started_at > (now() - interval '30 days')
--     and extract(dow from started_at) = 1  -- Monday
--     and extract(hour from started_at at time zone 'UTC') between 13 and 15
--   order by started_at desc
--   limit 10;
--
--   -- PAUSE the weekly briefing (e.g. before a cost-tracker /
--   -- B.8 deploy, or during vacation):
--   select cron.unschedule('antaeus-briefing-weekly');
--
--   -- RESUME — re-run the cron.schedule block above.
--
--   -- ADJUST timezone — unschedule + re-schedule with a different
--   -- cron expression:
--   --   '0 12 * * MON'  → Monday 12:00 UTC (8:00 AM ET / 5:00 AM PT)
--   --   '0 15 * * MON'  → Monday 15:00 UTC (11:00 AM ET / 8:00 AM PT)
--   --   '0 14 * * FRI'  → Friday 14:00 UTC (end-of-week recap shape)
-- ============================================================

-- A schema-level comment helps a future operator orient: which jobs
-- live in pg_cron, what schedules, where to look. Wrapped defensively
-- because the postgres role doesn't always own the extensions schema
-- on Supabase — the comment fails silently if so.
do $$
begin
  comment on schema extensions is
    'pg_cron + pg_net live here. Two scheduled jobs as of B.6: antaeus-heartbeat (every 30 min, observations layer) and antaeus-briefing-weekly (Monday 14:00 UTC, briefing-pipeline). See supabase/migrations/20260519180002_heartbeat_schedule.sql and 20260528170000_briefing_weekly_schedule.sql for the schedule + verification queries.';
exception
  when insufficient_privilege then
    raise notice 'Could not comment on schema extensions — insufficient privilege. Non-fatal; the schedule itself works.';
end $$;
