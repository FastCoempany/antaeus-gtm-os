# Migrations index

This directory carries the canonical SQL migration history for Antaeus.
Migration filenames must use the Supabase CLI format
`<14-digit-timestamp>_<name>.sql`. The Supabase CLI tracks applied
migrations in the `supabase_migrations.schema_migrations` table; use
`supabase migration repair --status applied <version>` to sync the
tracker if a migration was applied outside the CLI (e.g. via the
SQL Editor).

## How migrations land in production

1. Author the migration locally with the `<timestamp>_<name>.sql` shape.
2. Apply to the linked project via `supabase db push --linked`.
3. The Supabase CLI updates the migration tracker automatically.
4. If the tracker drifts from reality (schema applied outside the CLI),
   use `supabase migration repair --status applied <version>` to sync.

## Layered authorities

- **ADR-002** — initial schema rescope (workspaces + workspace_members
  + 4 missing noun tables + workspace_id retrofit + workspace-scoped
  RLS). See `deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md`.
- **ADR-004** — orchestration layer (workspace_sessions + observations
  + heartbeat schedule). See `deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md`.
- **ADR-005** — Phase 4.5 data layer parity retrofit. Each room's Step 2
  ships a migration here. See
  `deliverables/adr/adr-005-data-layer-parity-2026-05-20.md`.

## Demo mode boundary

Per ADR-005 §"Demo mode boundary", demo workspaces stay localStorage-only
via the `createDataClient({ mode: "demo-local" })` path. No migrations
in this directory touch demo data.
