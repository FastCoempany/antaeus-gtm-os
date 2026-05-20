-- ============================================================
-- 20260519180002 — heartbeat schedule (pg_cron)
--
-- Phase A of the orchestration layer (ADR-004). Schedules the
-- `heartbeat` Edge Function to run every 30 minutes via pg_cron +
-- net.http_post.
--
-- IMPORTANT: this migration is intentionally INACTIVE on first
-- apply. The actual `select cron.schedule(...)` call is COMMENTED
-- OUT. The founder uncomments + re-applies AFTER:
--   1. Deploying the function: `supabase functions deploy heartbeat
--      --no-verify-jwt`
--   2. Setting the runtime config:
--        alter database postgres set
--            app.heartbeat_url = 'https://<ref>.supabase.co/functions/v1/heartbeat';
--        alter database postgres set
--            app.service_role_key = '<service-role-key>';
--
-- This two-step pattern prevents the cron from invoking a missing
-- function during initial rollout. The migration itself can be
-- applied as-is at any time — it only enables the extensions; it
-- does not schedule anything until the cron.schedule call is
-- uncommented.
--
-- See: deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md
-- See: supabase/functions/heartbeat/README.md
-- ============================================================

-- Enable pg_cron + pg_net extensions if not already enabled. Both
-- are part of Supabase's default extension set; this is idempotent.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ============================================================
-- Heartbeat schedule (UNCOMMENT after function is deployed + config
-- is set per the comment block above).
-- ============================================================

-- select cron.schedule(
--     'antaeus-heartbeat',
--     '*/30 * * * *',  -- every 30 minutes
--     $$
--     select net.http_post(
--         url := current_setting('app.heartbeat_url'),
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- ============================================================
-- Useful queries for verifying after enable:
--
--   -- Confirm the job exists:
--   select * from cron.job where jobname = 'antaeus-heartbeat';
--
--   -- See the last 10 runs:
--   select start_time, end_time, status
--   from cron.job_run_details
--   where jobid in (
--       select jobid from cron.job where jobname = 'antaeus-heartbeat'
--   )
--   order by start_time desc
--   limit 10;
--
--   -- Disable + re-enable:
--   select cron.unschedule('antaeus-heartbeat');
--   -- ... then re-run the cron.schedule call above
--
--   -- Verify the function ran by checking the observations table:
--   select count(*), max(written_at) from public.observations;
-- ============================================================

comment on extension pg_cron is
    'Used by ADR-004 orchestration layer to schedule the heartbeat Edge Function. See supabase/migrations/20260519180002_heartbeat_schedule.sql for the (commented-out) schedule call + deployment notes.';
