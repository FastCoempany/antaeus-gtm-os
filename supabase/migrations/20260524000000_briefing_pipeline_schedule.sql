-- ============================================================
-- 20260524000000 — briefing-pipeline schedule (pg_cron)
--
-- Briefing build phase B.1a. Schedules the `briefing-pipeline` Edge
-- Function to run every Monday at 06:00 UTC via pg_cron +
-- net.http_post.
--
-- IMPORTANT: this migration is intentionally INACTIVE on first
-- apply. The actual `select cron.schedule(...)` call is COMMENTED
-- OUT. The founder uncomments + runs it in the SQL Editor AFTER:
--   1. Deploying the function:
--        supabase functions deploy briefing-pipeline --no-verify-jwt
--   2. Confirming the Vault secret exists. Phase A's heartbeat
--      already stored 'antaeus_service_role_key' — the same secret
--      is reused here. If for some reason it's missing:
--        select vault.create_secret(
--            '<service-role-key>',
--            'antaeus_service_role_key',
--            'Bearer token for antaeus pg_cron jobs'
--        );
--      (Save the returned uuid — it's how you rotate the key later
--      via vault.update_secret.)
--
-- The function URL is NOT a secret — it's publicly invokable;
-- authorization is what protects it — so it's hardcoded in the
-- cron call below rather than stored separately.
--
-- This two-step pattern matches the heartbeat schedule from Phase A
-- (supabase/migrations/20260519180002_heartbeat_schedule.sql). The
-- extensions block below is idempotent — pg_cron + pg_net are
-- already installed in production by that migration; the
-- IF NOT EXISTS guards make this re-apply cleanly.
--
-- See: deliverables/specs/briefing/01-build-phase-plan.md §B.1
-- See: supabase/functions/briefing-pipeline/README.md
-- ============================================================

-- pg_cron + pg_net are already enabled in production via migration
-- 20260519180002 (heartbeat schedule). Re-asserting them here makes
-- this migration self-contained — if a future environment is restored
-- from a clean snapshot in a different order, the extensions install
-- cleanly via the same path. The DO blocks tolerate the
-- insufficient-privilege case on Supabase preview branches.
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
-- Briefing-pipeline schedule (UNCOMMENT and run in the SQL Editor
-- after the function is deployed + the Vault secret is confirmed
-- per the comment block above).
--
-- Replace <project-ref> with the actual Supabase project ref
-- (e.g. wjdqmgxwulqxxxnyuzyl). The Vault secret name must match
-- whatever was passed to vault.create_secret.
--
-- Cadence: '0 6 * * 1' = Monday at 06:00 UTC (i.e. early Monday
-- morning Eastern, mid-morning UK, lunchtime in Europe). The first
-- briefing of the week lands in the operator's workspace before
-- they sit down for the working week.
-- ============================================================

-- select cron.schedule(
--     'antaeus-briefing-weekly',
--     '0 6 * * 1',
--     $$
--     select net.http_post(
--         url := 'https://<project-ref>.supabase.co/functions/v1/briefing-pipeline',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || (
--                 select decrypted_secret
--                 from vault.decrypted_secrets
--                 where name = 'antaeus_service_role_key'
--             )
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- ============================================================
-- Useful queries for verifying after enable:
--
--   -- Confirm the job exists + is active:
--   select jobid, jobname, schedule, active
--   from cron.job where jobname = 'antaeus-briefing-weekly';
--
--   -- Fire the pipeline manually (no need to wait for Monday):
--   select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/briefing-pipeline',
--       headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer ' || (
--               select decrypted_secret
--               from vault.decrypted_secrets
--               where name = 'antaeus_service_role_key'
--           )
--       ),
--       body := '{}'::jsonb
--   ) as request_id;
--
--   -- See the last 5 HTTP responses (status_code 200 + JSON body
--   -- in content = success):
--   select id, status_code, created, content::text
--   from net._http_response
--   order by created desc limit 5;
--
--   -- See the last 10 cron runs:
--   select start_time, end_time, status
--   from cron.job_run_details
--   where jobid in (
--       select jobid from cron.job where jobname = 'antaeus-briefing-weekly'
--   )
--   order by start_time desc
--   limit 10;
--
--   -- See the most recent pipeline runs:
--   select id, workspace_id, status, started_at, completed_at,
--          jsonb_array_length(stage_log) as stages_logged,
--          error
--   from public.briefing_runs
--   order by started_at desc
--   limit 10;
--
--   -- Disable + re-enable:
--   select cron.unschedule('antaeus-briefing-weekly');
--   -- ... then re-run the cron.schedule call above
-- ============================================================
