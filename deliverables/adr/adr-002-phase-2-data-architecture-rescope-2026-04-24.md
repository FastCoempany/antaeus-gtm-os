# ADR-002 — Phase 2 Data Architecture Rescope: Supabase Branches + Existing Schema Adoption

- **Status:** APPROVED
- **Date drafted:** 2026-04-24
- **Date approved:** 2026-04-24
- **Authors:** Claude (Anthropic) with Founder direction
- **Approvers:** Founder
- **Supersedes:** ADR-001 §9 Q2 (separate-Supabase-project-for-staging answer); rescopes ADR-001 §6 Phase 2
- **Superseded by:** None
- **Related:** `CLAUDE.md` (canon) Part II.5 + Part V §1, `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md`

---

## 0. Executive summary

ADR-001's Phase 2 plan assumed a greenfield Supabase setup: design schema from scratch, provision a separate staging project, write RLS policies, build client-side data layer. When we actually audited the Supabase dashboard on 2026-04-24, roughly **40–50% of that work was already done** from earlier-in-the-year development: one production Supabase project exists (`antaeus-gtm-os` at `wjdqmgxwulqxxxnyuzyl.supabase.co`), 10 tables are deployed, RLS policies are in place on 8 of them, 4 real user accounts exist in auth, and 5 SQL bootstrap files are committed to the repo at root level (`supabase-*.sql`).

This ADR rescopes Phase 2 against that reality and captures two decisions:

1. **Adopt the existing schema as the foundation.** The existing tables (`icps`, `deals`, `sequences`, `signal_console_accounts`, `discovery_frameworks`, `discovery_call_logs`, `pipeline_settings`, `profiles`, `studio_artifacts`, `waitlist_signups`) are preserved. Phase 2 extends the schema rather than replacing it. Every existing table gets the workspace-scoping retrofit required by ADR-001 §9 Q1 (multi-workspace from day one), plus 4 missing sacred-noun tables get added (`proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts`). Signal and Motion remain jsonb-inside-parent until a future ADR promotes them to standalone tables.

2. **Use Supabase Branches for staging, not a separate Supabase project.** ADR-001 §9 Q2's original answer ("separate project for staging") was correct for the tooling available when ADR-001 was written but is no longer optimal. Supabase Branches (now production-ready) provide the same isolation with less operational overhead, automatic schema propagation from production, per-branch data isolation, and built-in GitHub-PR integration. This ADR formally supersedes that Q2 answer.

Phase 2's estimated calendar cost drops from 3–4 weeks (per ADR-001) to ~2 weeks (per this ADR) because schema design + RLS + auth are already done.

This ADR is binding once approved. Future changes require a superseding ADR.

---

## 1. Context

### 1.1 What ADR-001 Phase 2 assumed

From ADR-001 §6 Phase 2, the subphases were:

- **2.1 Schema design (4–6 days)** — model every sacred noun as a Postgres table; design `workspaces` + `workspace_members` for multi-user; generate TS types.
- **2.2 RLS policies (3–5 days)** — write per-workspace RLS, test isolation, document the policy model.
- **2.3 Migration from localStorage to Postgres (5–7 days)** — build one-way idempotent migration tool; run on first login; preserve localStorage as rollback source.
- **2.4 Realtime subscriptions + offline cache (4–6 days)** — typed data client over supabase-js; Postgres changefeeds subscribed per workspace; optimistic updates with rollback.

Total: 3–4 weeks. The plan assumed a clean slate.

### 1.2 What actually exists in production Supabase (as of 2026-04-24)

**Projects (Supabase dashboard → FastCoempany's Org):**

| Project | Status | Role |
|---|---|---|
| `aesdr-course` | Active (NANO) | Unrelated — course platform |
| `antaeus-career-files` | Paused | Old; not current |
| `antaeus-gtm-os` | Active (NANO) | **Production for Antaeus GTM OS** |

Only one project actively serves Antaeus. No staging project.

**Production Supabase project: `antaeus-gtm-os` at `wjdqmgxwulqxxxnyuzyl.supabase.co`:**

Tables currently in the public schema (10 tables + 2 views):

| Table / View | Columns | Rows | RLS | Realtime | Notes |
|---|---|---|---|---|---|
| `deals` | 31 | 0 | ✓ | ✗ | account_name, stage, deal_value, close_date, next_step_date, forecast_category, loss_reason, stage_history jsonb, data jsonb |
| `discovery_analytics` | 9 | — | n/a | n/a | view |
| `discovery_call_logs` | 13 | 0 | ✓ | ✗ | log_type, summary, data jsonb |
| `discovery_frameworks` | 11 | 0 | ✓ | ✗ | framework_key, name, category, data jsonb; unique on (user_id, framework_key) |
| `icps` | 18 | 0 | ✓ | ✗ | name, worked bool, summary, data jsonb |
| `pipeline_settings` | 12 | 0 | ✓ | ✗ | user-scoped pipeline config |
| `profiles` | 18 | 0 | ✓ | ✗ | email, full_name, role, company_name, startup_stage, buyer_persona, product_category, quota, etc. |
| `sequences` | 20 | 0 | ✓ | ✗ | sequence_key, name, title, data jsonb; unique on (user_id, sequence_key) |
| `signal_console_accounts` | 13 | 0 | ✓ | ✗ | account_key, account_name, domain, ticker, industry, sector, heat int, last_enriched_at, data jsonb |
| `studio_artifacts` | 12 | 0 | ? | ✗ | not in the checked-in SQL files; origin to verify |
| `top_worked_items` | 5 | — | n/a | n/a | view |
| `waitlist_signups` | 8 | 0 | ✓ | ✗ | public waitlist for coming-soon page |

**Every table has 0 rows.** The schema is deployed but no application data flows through it yet. Rooms still read/write localStorage.

**Authentication:** 4 real users in `auth.users` (including founder's `mrcoe7@gmail.com`, created 2026-01-20). Auth integration via Supabase works.

**Client config:** `js/supabase-config.js` hardcodes the project URL + anon publishable key. All HTML pages load this file.

**SQL bootstrap files checked into repo root:**

- `supabase-profiles-bootstrap.sql` (205 lines) — profiles table + onboarding-state support
- `supabase-workspace-persistence.sql` (313 lines) — icps, deals, sequences, signal_console_accounts, discovery_frameworks, discovery_call_logs + triggers + RLS
- `supabase-rls-policies.sql` (144 lines) — RLS for pipeline_settings, icps, sequences, deals, discovery_frameworks, discovery_call_logs
- `supabase-security-fixes.sql` (58 lines) — Security Definer view fixes, function search_path fix
- `supabase-public-waitlist.sql` (52 lines) — waitlist table

Each file is self-describing; they've been applied to production already (confirmed by table existence in dashboard).

### 1.3 Gap between ADR-001's Phase 2 plan and reality

| Phase 2 subphase (per ADR-001) | Status as of 2026-04-24 |
|---|---|
| 2.1 Schema design | **Partially done.** 10 tables + 2 views exist. 4 of 10 canon sacred nouns still need tables (proofs, advisor_deployments, readiness_snapshots, handoff_artifacts). Signal + Motion exist only as jsonb inside parent tables. |
| 2.2 RLS policies | **Partially done.** RLS is in place on every existing table. Pattern: `user_id uuid` column + `auth.uid() = user_id` policy check. Per-user isolation works. Per-workspace does not exist yet. |
| 2.3 Migration from localStorage | **Not started.** No migration tool exists. Rooms still read/write localStorage as primary. |
| 2.4 Realtime subscriptions | **Not started.** Realtime is disabled on every table. Client subscription code doesn't exist. |
| Multi-workspace scoping | **Not started.** Existing tables are user-scoped (`user_id`), not workspace-scoped. No `workspaces` or `workspace_members` tables exist. |
| Separate staging project | **Not created.** |
| Typed data client (`src/lib/data-client.ts`) | **Not started.** |

### 1.4 What forced this rescope

The discovery happened while the founder was walking through ADR-001's Phase 1 external-setup checklist. The Supabase step (§6 in the walkthrough) directed the founder to create a staging project. The founder asked whether earlier development had already done some of this work. Claude audited the Supabase dashboard (via founder screenshots) and the repo's SQL files and found the substantial pre-existing state documented above.

Rather than silently compress Phase 2's timeline or silently adopt the existing schema, the correct response was: document the new reality in an ADR, get founder approval on the rescope, and proceed.

### 1.5 What this ADR does NOT change

- Stack decisions from ADR-001 §2: Preact + TypeScript + Vite + Supabase (extended) + Vitest + Playwright + Sentry + Posthog + GitHub Actions — all preserved.
- Canon Parts I–IV (mind / face / behavior / integration) — untouched.
- Phase 1 completion status — foundation stays as shipped.
- Phases 3–5 — unchanged.
- Multi-workspace-from-day-one direction (ADR-001 §9 Q1) — preserved; this ADR adds the concrete retrofit path for existing user-scoped tables.
- Desktop-only posture (§9 Q5) — preserved.
- Row-level-security-at-DB-layer principle — preserved; existing per-user policies extend to per-workspace policies.
