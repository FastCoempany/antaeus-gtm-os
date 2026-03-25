-- ============================================================
-- Antaeus public waitlist bootstrap
-- Run this in Supabase SQL Editor once.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    source text not null default 'coming-soon',
    page_path text,
    referrer text,
    user_agent text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.waitlist_signups add column if not exists email text;
alter table public.waitlist_signups add column if not exists source text not null default 'coming-soon';
alter table public.waitlist_signups add column if not exists page_path text;
alter table public.waitlist_signups add column if not exists referrer text;
alter table public.waitlist_signups add column if not exists user_agent text;
alter table public.waitlist_signups add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.waitlist_signups add column if not exists created_at timestamptz not null default now();

create unique index if not exists waitlist_signups_email_lower_idx
    on public.waitlist_signups (lower(email));

create index if not exists waitlist_signups_created_at_idx
    on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from public;
revoke all on public.waitlist_signups from anon;
revoke all on public.waitlist_signups from authenticated;

grant usage on schema public to anon, authenticated;
grant insert on public.waitlist_signups to anon, authenticated;

drop policy if exists "waitlist_signups_insert_public" on public.waitlist_signups;

create policy "waitlist_signups_insert_public"
on public.waitlist_signups
for insert
to anon, authenticated
with check (
    email is not null
    and length(trim(email)) >= 5
    and position('@' in email) > 1
);
