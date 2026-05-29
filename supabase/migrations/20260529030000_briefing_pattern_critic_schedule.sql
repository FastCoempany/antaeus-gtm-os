-- ============================================================
-- 20260529030000 — briefing pattern critic weekly schedule (pg_cron)
--
-- Mirrors the briefing-pipeline weekly schedule pattern from
-- 20260528170000_briefing_weekly_schedule.sql, but for the
-- briefing-pattern-critic Edge Function (B.7 follow-up).
--
-- Cadence: weekly, midweek (Wednesday 14:00 UTC), so the critic
-- scores Patterns that landed in Monday's pipeline run without
-- competing with the pipeline for budget or attention.
--
-- IMPORTANT: this migration is intentionally INACTIVE on first
-- apply. The cron.schedule call is COMMENTED OUT. The founder
-- uncomments + runs it in the SQL Editor AFTER:
--   1. Confirming the briefing-pattern-critic function is deployed
--      (lands with this PR's auto-deploy chain).
--   2. Confirming the `antaeus_service_role_key` Vault secret is
--      still valid (same secret as briefing-pipeline + heartbeat).
--
-- Cost ceiling: bounded per-fire by CRITIC_BATCH_SIZE inside the
-- function (default 10 patterns × ~$0.005 each = ~$0.05 per
-- workspace per week). Even with 100 active workspaces that's
-- ~$5/week — well under any reasonable Anthropic budget. Unlike
-- the briefing pipeline, the critic has no per-workspace cost gate
-- because the per-call cost is so low and the batch is hard-capped.
-- ============================================================

-- Idempotent extension installs. Both pg_cron + pg_net are already
-- live from the heartbeat + briefing-pipeline schedules; we repeat
-- the guarded creates so this migration is self-sufficient on a
-- fresh database.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when insufficient_privilege or feature_not_supported then
    raise notice 'pg_cron extension not available — skipping (expected on Supabase preview branches).';
end $$;

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception
  when insufficient_privilege or feature_not_supported then
    raise notice 'pg_net extension not available — skipping (expected on Supabase preview branches).';
end $$;

-- ============================================================
-- Pattern critic weekly schedule (UNCOMMENT + run in the SQL
-- Editor after the briefing-pattern-critic function deploys).
--
-- Schedule: Wednesday 14:00 UTC = 10:00 AM US Eastern. The Monday
-- pipeline fires Patterns at 14:00 UTC Monday; by Wednesday the
-- gate verdict + pattern row are in place and the critic can score
-- them with two clear days of separation from the production write.
--
-- Verification queries (run after activating):
--
--   -- Confirm the job exists + is active:
--   select * from cron.job where jobname = 'antaeus-pattern-critic-weekly';
--
--   -- Fire manually without waiting for Wednesday:
--   select net.http_post(
--       url := 'https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/briefing-pattern-critic',
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
--   );
--
--   -- Inspect the most recent response:
--   select id, status_code, content_type, content
--     from net._http_response
--     order by created desc
--     limit 5;
--
--   -- See which Patterns now have critic scores:
--   select id, anchor, critic_score, scored_at, critic_model
--     from briefing_pattern_eval
--     where critic_score is not null
--     order by scored_at desc
--     limit 20;
--
--   -- Pause the schedule:
--   select cron.unschedule('antaeus-pattern-critic-weekly');
-- ============================================================

-- select cron.schedule(
--     'antaeus-pattern-critic-weekly',
--     '0 14 * * WED',  -- Wednesday 14:00 UTC (10:00 AM ET / 7:00 AM PT)
--     $$
--     select net.http_post(
--         url := 'https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/briefing-pattern-critic',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || (
--                 select decrypted_secret
--                 from vault.decrypted_secrets
--                 where name = 'antaeus_service_role_key'
--             )
--         ),
--         body := '{}'::jsonb,
--         -- Per-workspace batch of up to 10 Patterns × ~10s per
--         -- Sonnet call ≈ 100s per workspace upper bound. 5 min total
--         -- gives headroom for ~3 workspaces and the network round-
--         -- trips. The function's per-row failure isolation means a
--         -- timeout on row N+1 doesn't lose rows 1..N.
--         timeout_milliseconds := 300000
--     );
--     $$
-- );

-- ============================================================
-- Why the schedule is inactive on apply:
--
--   The Supabase SQL Editor's `postgres` role doesn't always have
--   the cron-write grant needed to schedule jobs from a migration.
--   The founder runs the (uncommented) cron.schedule call from the
--   SQL Editor under their own session, which has the right perms.
--   This is the same pattern the heartbeat + briefing-pipeline
--   schedules use; see those migrations + the session log entry
--   for the original Vault setup.
-- ============================================================
