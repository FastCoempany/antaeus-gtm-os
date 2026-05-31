-- 20260531000000_founding_gtm_shares.sql
--
-- Founding GTM share-link mechanic per canon §4.19.
--
-- One row per active share — operator generates a long random URL token
-- in the room, recipient opens `/founding-gtm/share/<token>` and sees a
-- read-only render of the seven authored sections frozen at link-
-- creation time.
--
-- Locked design decisions (founder, 2026-05-31):
--   Auth model    : anonymous URL token (no recipient email, no signup)
--   Scope         : Founding GTM only (other rooms not exposed)
--   Manage UI     : in the Founding GTM room (not Settings)
--   Snapshot path : frozen JSONB written at create-time; regeneration
--                   is a separate write. Anonymous reads NEVER touch
--                   live workspace tables.
--
-- The snapshot is the entire seven-section authored output as JSONB.
-- Anonymous resolution goes through resolve_founding_gtm_share(token),
-- a SECURITY DEFINER function that gates on (token match + not revoked)
-- and returns NULL otherwise. anon + authenticated may both call it; the
-- table itself stays under workspace-scoped RLS so operators only see
-- their own workspace's shares.
--
-- Ref: deliverables/audit/sarah-three-walks-2026-05-29.md §"Recommended next moves" #3
-- Ref: CLAUDE.md §4.19 "share-link mechanic (read-mode workspace access)"

create table if not exists public.founding_gtm_shares (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default auth.uid() references auth.users(id) on delete set null,
    -- URL token. Long unguessable random string (client-generated via
    -- crypto.getRandomValues; ~256 bits of entropy). UNIQUE prevents
    -- the astronomically improbable collision. The operator sees this
    -- only inside the share URL; the row in the manage panel shows the
    -- label + age, not the raw token.
    token text not null unique,
    -- Optional label so the operator recognizes which link is which
    -- ("Sarah, week 12", "Q3 board prep"). NOT shown to the recipient.
    label text,
    -- Frozen authored-sections output at link-creation time. Shape is
    -- whatever the SectionsAuthoringResult schema renders client-side
    -- — kept opaque here because that schema evolves with §4.19, and
    -- anonymous reads just return the blob verbatim.
    snapshot jsonb not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.founding_gtm_shares is
    'Founding GTM share-link mechanic per canon §4.19. One row per active share. Anonymous reads via resolve_founding_gtm_share(token).';

alter table public.founding_gtm_shares enable row level security;

create policy founding_gtm_shares_select_workspace
    on public.founding_gtm_shares for select
    using (public.is_workspace_member(workspace_id));

create policy founding_gtm_shares_insert_workspace
    on public.founding_gtm_shares for insert
    with check (public.is_workspace_member(workspace_id));

create policy founding_gtm_shares_update_workspace
    on public.founding_gtm_shares for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy founding_gtm_shares_delete_workspace
    on public.founding_gtm_shares for delete
    using (public.is_workspace_member(workspace_id));

create index if not exists founding_gtm_shares_workspace_idx
    on public.founding_gtm_shares (workspace_id, revoked_at);

create index if not exists founding_gtm_shares_token_idx
    on public.founding_gtm_shares (token) where revoked_at is null;

-- updated_at trigger so revoke + regenerate keep the timestamp fresh.
create or replace function public.touch_founding_gtm_shares_updated_at()
    returns trigger
    language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists founding_gtm_shares_touch_updated_at on public.founding_gtm_shares;
create trigger founding_gtm_shares_touch_updated_at
    before update on public.founding_gtm_shares
    for each row execute function public.touch_founding_gtm_shares_updated_at();

-- Anonymous resolver. Returns the snapshot for a valid (unrevoked)
-- token; returns NULL otherwise. SECURITY DEFINER bypasses RLS because
-- the function body itself IS the gate (token match + not revoked).
-- Returns only the snapshot — never workspace_id, never created_by,
-- never any other identifying column. The recipient learns nothing
-- about the operator beyond what the snapshot itself contains.
create or replace function public.resolve_founding_gtm_share(p_token text)
    returns jsonb
    language sql
    stable
    security definer
    set search_path = public
as $$
    select snapshot
    from public.founding_gtm_shares
    where token = p_token
      and revoked_at is null
    limit 1;
$$;

comment on function public.resolve_founding_gtm_share(text) is
    'Anonymous resolver for Founding GTM share-link. Returns NULL if token is unknown or revoked.';

grant execute on function public.resolve_founding_gtm_share(text) to anon, authenticated;
