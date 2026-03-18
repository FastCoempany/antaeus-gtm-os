-- ============================================================
-- Supabase RLS policies for Antaeus GTM OS data tables
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- Assumes each table exists and includes a user_id UUID column.
-- ============================================================

alter table public.pipeline_settings enable row level security;
alter table public.icps enable row level security;
alter table public.sequences enable row level security;
alter table public.deals enable row level security;
alter table public.discovery_frameworks enable row level security;
alter table public.discovery_call_logs enable row level security;

drop policy if exists "pipeline_settings_select_own" on public.pipeline_settings;
drop policy if exists "pipeline_settings_insert_own" on public.pipeline_settings;
drop policy if exists "pipeline_settings_update_own" on public.pipeline_settings;
drop policy if exists "pipeline_settings_delete_own" on public.pipeline_settings;

create policy "pipeline_settings_select_own"
on public.pipeline_settings for select
using ((select auth.uid()) = user_id);

create policy "pipeline_settings_insert_own"
on public.pipeline_settings for insert
with check ((select auth.uid()) = user_id);

create policy "pipeline_settings_update_own"
on public.pipeline_settings for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "pipeline_settings_delete_own"
on public.pipeline_settings for delete
using ((select auth.uid()) = user_id);

drop policy if exists "icps_select_own" on public.icps;
drop policy if exists "icps_insert_own" on public.icps;
drop policy if exists "icps_update_own" on public.icps;
drop policy if exists "icps_delete_own" on public.icps;

create policy "icps_select_own"
on public.icps for select
using ((select auth.uid()) = user_id);

create policy "icps_insert_own"
on public.icps for insert
with check ((select auth.uid()) = user_id);

create policy "icps_update_own"
on public.icps for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "icps_delete_own"
on public.icps for delete
using ((select auth.uid()) = user_id);

drop policy if exists "sequences_select_own" on public.sequences;
drop policy if exists "sequences_insert_own" on public.sequences;
drop policy if exists "sequences_update_own" on public.sequences;
drop policy if exists "sequences_delete_own" on public.sequences;

create policy "sequences_select_own"
on public.sequences for select
using ((select auth.uid()) = user_id);

create policy "sequences_insert_own"
on public.sequences for insert
with check ((select auth.uid()) = user_id);

create policy "sequences_update_own"
on public.sequences for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "sequences_delete_own"
on public.sequences for delete
using ((select auth.uid()) = user_id);

drop policy if exists "deals_select_own" on public.deals;
drop policy if exists "deals_insert_own" on public.deals;
drop policy if exists "deals_update_own" on public.deals;
drop policy if exists "deals_delete_own" on public.deals;

create policy "deals_select_own"
on public.deals for select
using ((select auth.uid()) = user_id);

create policy "deals_insert_own"
on public.deals for insert
with check ((select auth.uid()) = user_id);

create policy "deals_update_own"
on public.deals for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "deals_delete_own"
on public.deals for delete
using ((select auth.uid()) = user_id);

drop policy if exists "discovery_frameworks_select_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_insert_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_update_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_delete_own" on public.discovery_frameworks;

create policy "discovery_frameworks_select_own"
on public.discovery_frameworks for select
using ((select auth.uid()) = user_id);

create policy "discovery_frameworks_insert_own"
on public.discovery_frameworks for insert
with check ((select auth.uid()) = user_id);

create policy "discovery_frameworks_update_own"
on public.discovery_frameworks for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "discovery_frameworks_delete_own"
on public.discovery_frameworks for delete
using ((select auth.uid()) = user_id);

drop policy if exists "discovery_call_logs_select_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_insert_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_update_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_delete_own" on public.discovery_call_logs;

create policy "discovery_call_logs_select_own"
on public.discovery_call_logs for select
using ((select auth.uid()) = user_id);

create policy "discovery_call_logs_insert_own"
on public.discovery_call_logs for insert
with check ((select auth.uid()) = user_id);

create policy "discovery_call_logs_update_own"
on public.discovery_call_logs for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "discovery_call_logs_delete_own"
on public.discovery_call_logs for delete
using ((select auth.uid()) = user_id);
