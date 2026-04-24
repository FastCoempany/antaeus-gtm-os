-- ============================================================================
-- Migration 0002 — backfill default workspaces for existing auth users
-- ============================================================================
-- Every existing user in auth.users (currently 4 users as of 2026-04-24) gets
-- a default workspace owned by them, with themselves as the sole `owner`
-- member. This ensures that after 0003 adds a workspace_id column to every
-- data table, every user has a workspace to assign their data to.
--
-- Idempotent: re-running does not create duplicate workspaces. If a user
-- already has at least one owned workspace, this migration skips them.
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.1
-- ============================================================================

do $$
declare
    u record;
    new_workspace_id uuid;
    default_name text;
    default_slug text;
begin
    for u in
        select id, email, raw_user_meta_data
        from auth.users
        where id not in (
            select owner_id from public.workspaces
        )
    loop
        -- Default workspace naming: prefer full_name from metadata, fall back
        -- to the local-part of the email. Slug is derived from the email
        -- for uniqueness.
        default_name := coalesce(
            u.raw_user_meta_data->>'full_name',
            split_part(u.email, '@', 1),
            'Workspace'
        ) || '''s workspace';

        default_slug := lower(regexp_replace(
            coalesce(split_part(u.email, '@', 1), u.id::text),
            '[^a-z0-9]+',
            '-',
            'g'
        )) || '-' || substr(u.id::text, 1, 8);

        insert into public.workspaces (name, slug, owner_id)
        values (default_name, default_slug, u.id)
        returning id into new_workspace_id;

        insert into public.workspace_members (workspace_id, user_id, role, joined_at)
        values (new_workspace_id, u.id, 'owner', now())
        on conflict (workspace_id, user_id) do nothing;

        raise notice 'Backfilled workspace % for user %', new_workspace_id, u.email;
    end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Verification helper (safe to run after migration; does not modify data)
-- ----------------------------------------------------------------------------
-- Uncomment and run ad-hoc to confirm every auth user has exactly one owned
-- workspace and is a member of it:
--
-- select u.email,
--        count(w.id) as owned_workspaces,
--        count(wm.user_id) as memberships
-- from auth.users u
-- left join public.workspaces w on w.owner_id = u.id
-- left join public.workspace_members wm on wm.user_id = u.id and wm.workspace_id = w.id
-- group by u.id, u.email
-- order by u.email;
