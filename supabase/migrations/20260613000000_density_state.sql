-- Density gradient (design-system spec 02 §2.5).
--
-- Adds the per-workspace density state and extends the Phase F
-- proposal kinds with `density_change` so the gradient can be changed
-- both from Settings and through an accepted Phase F proposal.
--
-- Ref: deliverables/design-system/02-density-gradient-2026-06-05.md §2.5, §2.3

-- 1. The per-workspace density state. New workspaces walk the operator
--    through (show_me_how); the operator switches when ready (spec §2.2).
alter table public.workspace_profile
    add column if not exists density_state text not null default 'show_me_how'
        check (density_state in ('show_me_how', 'step_back'));

comment on column public.workspace_profile.density_state is
    'Density gradient state (spec 02). show_me_how = walked-through (day-one); step_back = fluent (dense). Written by Settings + the Phase F density_change apply path.';

-- 2. One-time backfill: every workspace that exists at migration time
--    has acclimated to the current single-state product, which
--    approximates Step back (spec §2.2 existing-workspace default).
--    New rows after this migration keep the show_me_how column default.
update public.workspace_profile
    set density_state = 'step_back'
    where density_state = 'show_me_how';

-- 3. Extend the Phase F proposal kinds (ADR-017) with density_change
--    (spec §2.3). The payload carries from_state / to_state / milestone;
--    the apply path writes to_state to workspace_profile.density_state.
alter table public.proposed_modifications
    drop constraint if exists proposed_modifications_kind_check;

alter table public.proposed_modifications
    add constraint proposed_modifications_kind_check
        check (kind in ('skill_default', 'observation_generator', 'density_change'));
