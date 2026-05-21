-- ============================================================
-- 20260519180002 — heartbeat schedule (pg_cron)
--
-- Phase A of the orchestration layer (ADR-004). Schedules the
-- `heartbeat` Edge Function to run every 30 minutes via pg_cron +
-- net.http_post.
--
-- IMPORTANT: this migration is intentionally INACTIVE on first
-- apply. The actual `select cron.schedule(...)` call is COMMENTED
-- OUT. The founder uncomments + runs it in the SQL Editor AFTER:
--   1. Deploying the function: `supabase functions deploy heartbeat
--      --no-verify-jwt`
--   2. Storing the service-role key in Supabase Vault:
--        select vault.create_secret(
--            '<service-role-key>',
--            'antaeus_service_role_key',
--            'Bearer token for the antaeus-heartbeat pg_cron job'
--        );
--      (Save the returned uuid — it's how you rotate the key
--      later via vault.update_secret.)
--
-- The function URL is NOT a secret — it's publicly invokable;
-- authorization is what protects it — so it's hardcoded in the
-- cron call below rather than stored separately.
--
-- This two-step pattern prevents the cron from invoking a missing
-- function during initial rollout. The migration itself can be
-- applied as-is at any time — it only enables the extensions; it
-- does not schedule anything until the cron.schedule call is
-- uncommented.
--
-- Note on `alter database postgres set app.*`: an earlier draft of
-- this migration used `current_setting('app.heartbeat_url')` +
-- `current_setting('app.service_role_key')` and relied on the
-- founder running `alter database postgres set app.* = ...` from
-- the SQL Editor. That doesn't work on Supabase — the postgres role
-- exposed via the SQL Editor lacks the superuser privilege required
-- to alter database-level parameters (error 42501: permission
-- denied to set parameter). Vault is Supabase's canonical pattern
-- for a secret a pg_cron job needs to read at execution time.
--
-- See: deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md
-- See: supabase/functions/heartbeat/README.md
-- ============================================================

-- Enable pg_cron + pg_net extensions if not already enabled. Both
-- are part of Supabase's default extension set on the main project,
-- but preview branches don't grant the superuser privilege required
-- to install them. We wrap each CREATE EXTENSION in a DO ... EXCEPTION
-- block so the migration succeeds on branches even when the
-- extensions can't be installed; main + persistent branches still
-- get them via the underlying CREATE EXTENSION IF NOT EXISTS.
--
-- This is idempotent on main: if the extension is already installed,
-- CREATE EXTENSION IF NOT EXISTS is a no-op. If a future production
-- environment is restored from a clean snapshot, the extensions
-- install cleanly via the same path.
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
-- Heartbeat schedule (UNCOMMENT and run in the SQL Editor after
-- the function is deployed + the Vault secret is created per the
-- comment block above).
--
-- Replace <project-ref> with the actual Supabase project ref
-- (e.g. wjdqmgxwulqxxxnyuzyl). The Vault secret name must match
-- what was passed to vault.create_secret.
-- ============================================================

-- select cron.schedule(
--     'antaeus-heartbeat',
--     '*/30 * * * *',  -- every 30 minutes
--     $$
--     select net.http_post(
--         url := 'https://<project-ref>.supabase.co/functions/v1/heartbeat',
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
--   from cron.job where jobname = 'antaeus-heartbeat';
--
--   -- Fire the heartbeat manually (no need to wait 30 min):
--   select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/heartbeat',
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
--       select jobid from cron.job where jobname = 'antaeus-heartbeat'
--   )
--   order by start_time desc
--   limit 10;
--
--   -- Rotate the service-role key (Vault picks up the new value
--   -- on the next fire — no need to re-schedule the cron):
--   select vault.update_secret(
--       '<secret-uuid-from-vault.create_secret>',
--       '<new-service-role-key>'
--   );
--
--   -- Disable + re-enable:
--   select cron.unschedule('antaeus-heartbeat');
--   -- ... then re-run the cron.schedule call above
--
--   -- Verify the function ran by checking the observations table:
--   select count(*), max(written_at) from public.observations;
-- ============================================================

-- Comment on the extension — only valid when pg_cron actually got
-- installed (i.e. on main + persistent branches). Wrapped in a guard
-- so the migration still succeeds on preview branches where pg_cron
-- isn't present.
do $$
begin
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    execute $cmt$
      comment on extension pg_cron is
        'Used by ADR-004 orchestration layer to schedule the heartbeat Edge Function. See supabase/migrations/20260519180002_heartbeat_schedule.sql for the (commented-out) schedule call + deployment notes.'
    $cmt$;
  end if;
end $$;
