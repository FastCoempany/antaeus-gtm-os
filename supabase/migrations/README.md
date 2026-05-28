# Supabase migrations

Schema migrations for the Antaeus production project, applied in
timestamp order (`<14-digit-ts>_<name>.sql`). The Supabase CLI tracks
applied migrations; `supabase db push --linked` applies any not yet on
the linked project.

See `supabase/README.md` for the founder handoff + CLI conventions, and
`deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md`
for the schema's governing decision.

> This file also serves as the smoke-test target for the Data Parity CI
> workflow (`.github/workflows/data-parity-ci.yml`): a PR touching
> anything under `supabase/migrations/` exercises the per-PR ephemeral
> Supabase branch end-to-end (provision → apply migrations → realtime →
> teardown).
