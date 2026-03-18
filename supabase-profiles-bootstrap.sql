-- ============================================================
-- Supabase bootstrap spine for Antaeus GTM OS
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- Creates a durable per-user profiles table used for:
--   - post-login routing
--   - onboarding persistence
--   - first-device / next-device workspace bootstrap
-- ============================================================

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

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text,
    role text,
    company_name text,
    startup_stage text,
    buyer_persona text,
    product_category text,
    quota numeric,
    average_deal_size numeric,
    acv_band text,
    onboarding_completed boolean not null default false,
    onboarding_completed_at timestamptz,
    onboarding_answers jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists startup_stage text;
alter table public.profiles add column if not exists buyer_persona text;
alter table public.profiles add column if not exists product_category text;
alter table public.profiles add column if not exists quota numeric;
alter table public.profiles add column if not exists average_deal_size numeric;
alter table public.profiles add column if not exists acv_band text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists onboarding_answers jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'user_id'
    ) then
        execute 'update public.profiles set id = user_id where id is null and user_id is not null';
        execute 'update public.profiles set user_id = id where user_id is null and id is not null';

        begin
            execute 'alter table public.profiles alter column user_id set default auth.uid()';
        exception
            when others then
                raise notice 'Skipping profiles.user_id default update: %', sqlerrm;
        end;

        if not exists (
            select 1
            from pg_constraint con
            join pg_attribute att
              on att.attrelid = con.conrelid
             and att.attnum = any(con.conkey)
            where con.conrelid = 'public.profiles'::regclass
              and con.contype = 'p'
              and att.attname = 'user_id'
        ) then
            begin
                execute 'alter table public.profiles alter column user_id drop not null';
            exception
                when others then
                    raise notice 'Skipping profiles.user_id drop not null: %', sqlerrm;
            end;
        else
            raise notice 'profiles.user_id remains not null because it is still part of the primary key.';
        end if;
    end if;
end;
$$;

update public.profiles p
set id = u.id
from auth.users u
where p.id is null
  and p.email is not null
  and lower(p.email) = lower(u.email);

create unique index if not exists profiles_id_key on public.profiles (id);
create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

insert into public.profiles (
    id,
    email,
    full_name,
    role
)
select
    u.id,
    u.email,
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'role', '')
from auth.users u
where not exists (
    select 1 from public.profiles p where p.id = u.id
);

update public.profiles p
set
    email = coalesce(p.email, u.email),
    full_name = coalesce(p.full_name, nullif(u.raw_user_meta_data ->> 'full_name', '')),
    role = coalesce(p.role, nullif(u.raw_user_meta_data ->> 'role', ''))
from auth.users u
where p.id = u.id;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.profiles'::regclass
          and conname = 'profiles_id_fkey'
    ) then
        begin
            alter table public.profiles
            add constraint profiles_id_fkey
            foreign key (id) references auth.users(id) on delete cascade;
        exception
            when others then
                raise notice 'Skipping profiles_id_fkey creation: %', sqlerrm;
        end;
    end if;
end;
$$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.profiles'::regclass
          and contype = 'p'
    ) then
        if exists (select 1 from public.profiles where id is null) then
            raise notice 'public.profiles still has rows with null id; leaving primary key unset for now.';
        else
            alter table public.profiles alter column id set not null;
            alter table public.profiles add constraint profiles_pkey primary key (id);
        end if;
    end if;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles
for delete
using ((select auth.uid()) = id);

grant select, insert, update, delete on public.profiles to authenticated;
