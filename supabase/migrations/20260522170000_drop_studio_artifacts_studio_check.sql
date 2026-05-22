-- ============================================================================
-- 20260522170000_drop_studio_artifacts_studio_check.sql
--
-- Phase 4.5 — Data Layer Parity (ADR-005)
--
-- Drops the legacy CHECK constraint on `studio_artifacts.studio` that
-- restricted it to a frozen set of pre-Phase-2 studio names:
--   'discovery', 'sequence_composer', 'trigger_angle', 'asset_builder',
--   'conversion', 'cfo_negotiation', 'reply_engine', 'outbound_os',
--   'quota_workback', 'thin_icp'.
--
-- Background: studio_artifacts was created in the pre-Phase-2 setup with a
-- studio column that referenced the legacy studio taxonomy. Phase 4 rooms
-- that hadn't existed yet — Sourcing Workbench, Territory Architect,
-- Negotiation, Future Autopsy, Advisor Deploy's profile bridge — all want
-- to use studio_artifacts to persist their state, but their semantic
-- studio values ("sourcing", "territory", "negotiation", "autopsy",
-- "advisor") aren't in the legacy set. Mapping them to closest legacy
-- values (e.g. negotiation → "cfo_negotiation") would document the wrong
-- intent forever; the constraint isn't carrying useful invariants here.
--
-- Discovered: 2026-05-22 during ADR-005 database.types.ts regen-flip. The
-- regen-flip surfaced that 5 bridges (sourcing × 2, territory × 3,
-- negotiation × 1, autopsy × 1, advisor-profile × 1) were emitting
-- InsertRow<"studio_artifacts"> objects without artifact_type / studio /
-- title at all — the inserts would have failed at runtime against the
-- CHECK constraint AND the NOT NULL constraints. The feature flags
-- gating those write paths have been off in production, hiding the bug.
--
-- After this migration drops the constraint, the bridges in the same PR
-- start providing artifact_type / studio / title with semantically
-- meaningful values per room. Existing rows (all currently studio =
-- "discovery" via the data-migration tool's blob row) continue to work.
--
-- No data is touched. Constraint drop is idempotent via IF EXISTS.
--
-- Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
-- Ref: src/lib/data-migration.ts (PASSTHROUGH_CONFIGS for studio_artifacts —
--      the comment block there documenting the constraint will be updated
--      in the same PR)
-- ============================================================================

alter table public.studio_artifacts
    drop constraint if exists studio_artifacts_studio_check;

comment on column public.studio_artifacts.studio is
    'Free-form room/studio identifier. Drops the pre-Phase-2 CHECK constraint that limited this to a legacy taxonomy. Rooms own their own studio value (e.g. sourcing/territory/negotiation/autopsy/advisor); generators that filter on it can group by this column without any constraint enforcement.';
