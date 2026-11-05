-- Prospecting Desk: automatic weekly re-checks of saved searches.
--
-- 1. A per-workspace switch, default OFF. Settings → "Re-check saved
--    searches automatically" writes it.
-- 2. A daily schedule that calls the prospecting-research function with
--    { action: "rerun_saved" }. The function only spends when BOTH:
--      - the server switch is on: `supabase secrets set PROSPECTING_AUTO_RERUN=on`
--        (leave it unset while building, so no paid calls are made), and
--      - the workspace switch below is on.
--    Each workspace's saved searches are re-checked at most once a week,
--    up to 3 searches per run, inside the existing $3/week cost ceiling.
--
-- To stop the schedule entirely:  select cron.unschedule('antaeus-prospecting-rerun');
-- Turning it back on: re-run the do-block below.

alter table public.workspace_profile
    add column if not exists prospecting_auto_rerun_enabled boolean not null default false;

comment on column public.workspace_profile.prospecting_auto_rerun_enabled is
    'Prospecting Desk: re-check this workspace''s saved searches automatically each week (default off).';

-- Schedule (idempotent). Skipped quietly where pg_cron / pg_net / Vault
-- aren't available (local + CI branches). Reads the service-role key from
-- the same Vault secret the heartbeat uses.
do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron')
       and exists (select 1 from pg_extension where extname = 'pg_net')
       and exists (select 1 from pg_namespace where nspname = 'vault') then
        if exists (select 1 from cron.job where jobname = 'antaeus-prospecting-rerun') then
            perform cron.unschedule('antaeus-prospecting-rerun');
        end if;
        perform cron.schedule(
            'antaeus-prospecting-rerun',
            '17 3 * * *',
            $cron$
            select net.http_post(
                url := 'https://wjdqmgxwulqxxxnyuzyl.supabase.co/functions/v1/prospecting-research',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || (
                        select decrypted_secret
                        from vault.decrypted_secrets
                        where name = 'antaeus_service_role_key'
                    )
                ),
                body := '{"action":"rerun_saved"}'::jsonb
            );
            $cron$
        );
    end if;
end
$$;
