-- ============================================================
-- Antaeus GTM OS workspace persistence bootstrap
-- Run this in Supabase SQL Editor after the auth/profile scripts.
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Profiles legacy compatibility
alter table if exists public.profiles add column if not exists id uuid;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'user_id'
    ) then
        update public.profiles
        set id = user_id
        where id is null and user_id is not null;

        update public.profiles p
        set id = u.id
        from auth.users u
        where p.id is null
          and p.email is not null
          and lower(p.email) = lower(u.email);

        begin
            alter table public.profiles alter column user_id set default auth.uid();
        exception
            when others then
                raise notice 'Skipping profiles.user_id default update: %', sqlerrm;
        end;
    end if;
end;
$$;

create unique index if not exists profiles_id_key on public.profiles (id);

create table if not exists public.icps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name text,
    worked boolean not null default false,
    summary text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.icps add column if not exists name text;
alter table public.icps add column if not exists worked boolean not null default false;
alter table public.icps add column if not exists summary text;
alter table public.icps add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.icps add column if not exists created_at timestamptz not null default now();
alter table public.icps add column if not exists updated_at timestamptz not null default now();
alter table public.icps alter column user_id set default auth.uid();

create table if not exists public.deals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    account_name text,
    stage text not null default 'prospect',
    deal_value numeric not null default 0,
    close_date text,
    next_step_date text,
    forecast_category text default 'pipeline',
    loss_reason text,
    stage_history jsonb not null default '[]'::jsonb,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.deals add column if not exists account_name text;
alter table public.deals add column if not exists stage text not null default 'prospect';
alter table public.deals add column if not exists deal_value numeric not null default 0;
alter table public.deals add column if not exists close_date text;
alter table public.deals add column if not exists next_step_date text;
alter table public.deals add column if not exists forecast_category text default 'pipeline';
alter table public.deals add column if not exists loss_reason text;
alter table public.deals add column if not exists stage_history jsonb not null default '[]'::jsonb;
alter table public.deals add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.deals add column if not exists created_at timestamptz not null default now();
alter table public.deals add column if not exists updated_at timestamptz not null default now();
alter table public.deals alter column user_id set default auth.uid();

create table if not exists public.sequences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    sequence_key text not null,
    name text,
    title text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.sequences add column if not exists sequence_key text;
alter table public.sequences add column if not exists name text;
alter table public.sequences add column if not exists title text;
alter table public.sequences add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.sequences add column if not exists created_at timestamptz not null default now();
alter table public.sequences add column if not exists updated_at timestamptz not null default now();
alter table public.sequences alter column user_id set default auth.uid();
create unique index if not exists sequences_user_key_idx on public.sequences (user_id, sequence_key);

create table if not exists public.signal_console_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    account_key text not null,
    account_name text,
    domain text,
    ticker text,
    industry text,
    sector text,
    heat integer not null default 0,
    last_enriched_at timestamptz,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.signal_console_accounts add column if not exists account_key text;
alter table public.signal_console_accounts add column if not exists account_name text;
alter table public.signal_console_accounts add column if not exists domain text;
alter table public.signal_console_accounts add column if not exists ticker text;
alter table public.signal_console_accounts add column if not exists industry text;
alter table public.signal_console_accounts add column if not exists sector text;
alter table public.signal_console_accounts add column if not exists heat integer not null default 0;
alter table public.signal_console_accounts add column if not exists last_enriched_at timestamptz;
alter table public.signal_console_accounts add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.signal_console_accounts add column if not exists created_at timestamptz not null default now();
alter table public.signal_console_accounts add column if not exists updated_at timestamptz not null default now();
alter table public.signal_console_accounts alter column user_id set default auth.uid();
create unique index if not exists signal_console_accounts_user_key_idx on public.signal_console_accounts (user_id, account_key);

create table if not exists public.discovery_frameworks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    framework_key text not null,
    name text,
    category text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.discovery_frameworks add column if not exists framework_key text;
alter table public.discovery_frameworks add column if not exists name text;
alter table public.discovery_frameworks add column if not exists category text;
alter table public.discovery_frameworks add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.discovery_frameworks add column if not exists created_at timestamptz not null default now();
alter table public.discovery_frameworks add column if not exists updated_at timestamptz not null default now();
alter table public.discovery_frameworks alter column user_id set default auth.uid();
create unique index if not exists discovery_frameworks_user_key_idx on public.discovery_frameworks (user_id, framework_key);

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'discovery_frameworks'
          and column_name = 'framework_data'
    ) then
        execute '
            update public.discovery_frameworks
            set data = coalesce(nullif(data, ''{}''::jsonb), framework_data, ''{}''::jsonb)
            where framework_data is not null
        ';
        execute '
            alter table public.discovery_frameworks
            alter column framework_data drop not null
        ';
    end if;
end;
$$;

create table if not exists public.discovery_call_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    log_type text,
    summary text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.discovery_call_logs add column if not exists log_type text;
alter table public.discovery_call_logs add column if not exists summary text;
alter table public.discovery_call_logs add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.discovery_call_logs add column if not exists created_at timestamptz not null default now();
alter table public.discovery_call_logs add column if not exists updated_at timestamptz not null default now();
alter table public.discovery_call_logs alter column user_id set default auth.uid();

drop trigger if exists icps_set_updated_at on public.icps;
create trigger icps_set_updated_at
before update on public.icps
for each row execute function public.update_updated_at_column();

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
before update on public.deals
for each row execute function public.update_updated_at_column();

drop trigger if exists sequences_set_updated_at on public.sequences;
create trigger sequences_set_updated_at
before update on public.sequences
for each row execute function public.update_updated_at_column();

drop trigger if exists signal_console_accounts_set_updated_at on public.signal_console_accounts;
create trigger signal_console_accounts_set_updated_at
before update on public.signal_console_accounts
for each row execute function public.update_updated_at_column();

drop trigger if exists discovery_frameworks_set_updated_at on public.discovery_frameworks;
create trigger discovery_frameworks_set_updated_at
before update on public.discovery_frameworks
for each row execute function public.update_updated_at_column();

drop trigger if exists discovery_call_logs_set_updated_at on public.discovery_call_logs;
create trigger discovery_call_logs_set_updated_at
before update on public.discovery_call_logs
for each row execute function public.update_updated_at_column();

alter table public.icps enable row level security;
alter table public.deals enable row level security;
alter table public.sequences enable row level security;
alter table public.signal_console_accounts enable row level security;
alter table public.discovery_frameworks enable row level security;
alter table public.discovery_call_logs enable row level security;

drop policy if exists "icps_select_own" on public.icps;
drop policy if exists "icps_insert_own" on public.icps;
drop policy if exists "icps_update_own" on public.icps;
drop policy if exists "icps_delete_own" on public.icps;

create policy "icps_select_own" on public.icps for select using ((select auth.uid()) = user_id);
create policy "icps_insert_own" on public.icps for insert with check ((select auth.uid()) = user_id);
create policy "icps_update_own" on public.icps for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "icps_delete_own" on public.icps for delete using ((select auth.uid()) = user_id);

drop policy if exists "deals_select_own" on public.deals;
drop policy if exists "deals_insert_own" on public.deals;
drop policy if exists "deals_update_own" on public.deals;
drop policy if exists "deals_delete_own" on public.deals;

create policy "deals_select_own" on public.deals for select using ((select auth.uid()) = user_id);
create policy "deals_insert_own" on public.deals for insert with check ((select auth.uid()) = user_id);
create policy "deals_update_own" on public.deals for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "deals_delete_own" on public.deals for delete using ((select auth.uid()) = user_id);

drop policy if exists "sequences_select_own" on public.sequences;
drop policy if exists "sequences_insert_own" on public.sequences;
drop policy if exists "sequences_update_own" on public.sequences;
drop policy if exists "sequences_delete_own" on public.sequences;

create policy "sequences_select_own" on public.sequences for select using ((select auth.uid()) = user_id);
create policy "sequences_insert_own" on public.sequences for insert with check ((select auth.uid()) = user_id);
create policy "sequences_update_own" on public.sequences for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sequences_delete_own" on public.sequences for delete using ((select auth.uid()) = user_id);

drop policy if exists "signal_console_accounts_select_own" on public.signal_console_accounts;
drop policy if exists "signal_console_accounts_insert_own" on public.signal_console_accounts;
drop policy if exists "signal_console_accounts_update_own" on public.signal_console_accounts;
drop policy if exists "signal_console_accounts_delete_own" on public.signal_console_accounts;

create policy "signal_console_accounts_select_own" on public.signal_console_accounts for select using ((select auth.uid()) = user_id);
create policy "signal_console_accounts_insert_own" on public.signal_console_accounts for insert with check ((select auth.uid()) = user_id);
create policy "signal_console_accounts_update_own" on public.signal_console_accounts for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "signal_console_accounts_delete_own" on public.signal_console_accounts for delete using ((select auth.uid()) = user_id);

drop policy if exists "discovery_frameworks_select_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_insert_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_update_own" on public.discovery_frameworks;
drop policy if exists "discovery_frameworks_delete_own" on public.discovery_frameworks;

create policy "discovery_frameworks_select_own" on public.discovery_frameworks for select using ((select auth.uid()) = user_id);
create policy "discovery_frameworks_insert_own" on public.discovery_frameworks for insert with check ((select auth.uid()) = user_id);
create policy "discovery_frameworks_update_own" on public.discovery_frameworks for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "discovery_frameworks_delete_own" on public.discovery_frameworks for delete using ((select auth.uid()) = user_id);

drop policy if exists "discovery_call_logs_select_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_insert_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_update_own" on public.discovery_call_logs;
drop policy if exists "discovery_call_logs_delete_own" on public.discovery_call_logs;

create policy "discovery_call_logs_select_own" on public.discovery_call_logs for select using ((select auth.uid()) = user_id);
create policy "discovery_call_logs_insert_own" on public.discovery_call_logs for insert with check ((select auth.uid()) = user_id);
create policy "discovery_call_logs_update_own" on public.discovery_call_logs for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "discovery_call_logs_delete_own" on public.discovery_call_logs for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.icps to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert, update, delete on public.sequences to authenticated;
grant select, insert, update, delete on public.signal_console_accounts to authenticated;
grant select, insert, update, delete on public.discovery_frameworks to authenticated;
grant select, insert, update, delete on public.discovery_call_logs to authenticated;
