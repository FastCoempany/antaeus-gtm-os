-- ============================================================
-- Migration: 20260504182500
-- Add default auth.uid() to user_id on the two passthrough tables.
-- ============================================================
--
-- Context: every other user-owned table in the schema (icps, deals,
-- sequences, signal_console_accounts, discovery_*) declares
-- `user_id uuid not null default auth.uid()`. The two passthrough
-- jsonb-bag tables — pipeline_settings + studio_artifacts — were
-- created with NOT NULL but no default, so any insert that doesn't
-- explicitly set user_id fails with constraint 23502.
--
-- This was hidden during Phase 2.3 because the data-migration tool
-- detected the gap and injected user_id manually (see
-- src/lib/data-migration.ts → MigratorConfig.requiresUserId). The
-- per-room cloud-persistence layers (Quota Workback, Territory
-- Architect, Sourcing Workbench, Future Autopsy, Advisor Deploy)
-- inherited the data-client's generic insert which doesn't inject
-- user_id, so they hit the NOT NULL constraint at runtime.
--
-- First Sentry hit:
--   "null value in column \"user_id\" of relation \"pipeline_settings\"
--    violates not-null constraint (code: 23502)"
--   from src/quota-workback/lib/cloud-persistence.ts:100
--
-- Fix: align these two tables with the rest of the schema. Existing
-- rows are unaffected (defaults only fill on insert when the column
-- is omitted).
-- ============================================================

alter table public.pipeline_settings
    alter column user_id set default auth.uid();

alter table public.studio_artifacts
    alter column user_id set default auth.uid();
