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

---

## 2. The decision

Two decisions in this ADR.

### 2.1 Decision A: adopt the existing schema; extend rather than replace

The 10 tables already deployed to the production Supabase project are preserved. Phase 2 work adds to them rather than rebuilding from scratch.

**What we keep from the existing schema:**

- All 10 tables with their existing columns, primary keys, indexes, and per-user RLS policies
- The jsonb `data` column pattern used on every table (typed top-level columns for hot-access fields + flexible jsonb bag for everything else)
- The `updated_at` auto-update trigger pattern
- The existing SQL bootstrap files in the repo root
- The `js/supabase-config.js` client config (hardcoded URL + anon key)
- The 4 existing auth users

**What we add on top of the existing schema (Phase 2 work):**

1. **Two new tables for multi-workspace support** (per ADR-001 §9 Q1):
   - `workspaces` — id, name, owner_id, created_at, updated_at, data jsonb
   - `workspace_members` — workspace_id, user_id, role (owner / admin / member), invited_at, joined_at

2. **Four new tables for missing sacred nouns:**
   - `proofs` — PoC proof objects (claim, owner, metric, kill_rule, linked_deal_id, data jsonb)
   - `advisor_deployments` — backchannel asks (deal_id, advisor_id, ask_moment, stamp, data jsonb)
   - `readiness_snapshots` — multi-dimension readiness scores (overall, per-dimension, verdict, data jsonb)
   - `handoff_artifacts` — exportable package versions (sections jsonb, export_state, generated_at, data jsonb)

3. **Workspace-scoping retrofit on every existing table:**
   - Add `workspace_id uuid` column referencing `workspaces(id)` on: `icps`, `deals`, `sequences`, `signal_console_accounts`, `discovery_frameworks`, `discovery_call_logs`, `pipeline_settings`, `profiles`, `studio_artifacts`, plus the four new noun tables above
   - Backfill existing rows (currently zero rows, so backfill is trivial): each existing user gets a default workspace auto-created; their rows are assigned to it
   - Update RLS policies from `auth.uid() = user_id` to a workspace-membership check (pseudo: `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())`)
   - Keep `user_id` column as a convenience for "created by" tracking; the RLS gate moves to `workspace_id`

4. **Enable Realtime** on the tables the reactive data layer needs. Phase 2 initial enable: all 14 tables (10 existing + 4 new). Enabled at the Supabase dashboard per table.

5. **Client-side typed data layer** at `src/lib/data-client.ts`:
   - Generated TS types from the full schema (`supabase gen types typescript`)
   - Typed wrappers per noun exposing read / write / subscribe
   - Optimistic-update pattern with server-confirm reconciliation
   - Offline cache in localStorage (the existing localStorage becomes hydration cache, not primary store)

6. **One-way migration tool** (`src/migration/localstorage-to-supabase.ts`):
   - Read every known `gtmos_*` key from localStorage
   - Transform into rows scoped to the user's default workspace
   - Idempotent — rerunning produces zero duplicates (content-derived IDs where feasible; timestamp tie-breakers otherwise)
   - Dry-run mode for preview
   - Run once per user on first login post-Phase 2 deploy, behind a Posthog feature flag (`data_migration_live`), defaulting off until manually enabled per user or globally

**Signal and Motion stay as jsonb-inside-parent for now.**

- Signal is currently stored inside `signal_console_accounts.data` (the account record carries its signals as nested jsonb). Promoting to a standalone `signals` table is valuable for reactive "new signal just landed" updates but adds denormalization complexity. Deferred to a future ADR once we feel the pain.
- Motion is currently stored inside `sequences.data` (sequences are Motion-carriers). Same deferred-promotion rationale.

This is documented explicitly so a future session doesn't accidentally re-litigate the choice.

### 2.2 Decision B: Supabase Branches for staging (supersedes ADR-001 §9 Q2)

**What Supabase Branches are.** A production-ready Supabase feature (graduated from beta) that creates a fork of a project's schema into an isolated branch. The branch has its own database, its own data, and its own API endpoint but shares auth configuration with the parent. Schema migrations on production propagate to branches automatically; branch schema changes can be merged back into production. Branches can be short-lived (per-PR) or persistent (named staging environments).

**Why Branches beats a separate project for our use case:**

| Dimension | Separate project (ADR-001 §9 Q2 original) | Supabase Branches |
|---|---|---|
| Schema isolation | ✓ complete | ✓ complete |
| Data isolation | ✓ complete | ✓ complete |
| Credentials separation | ✓ separate URL + anon key | ✓ separate URL + anon key per branch |
| Schema propagation | ✗ manual — must rerun every migration against both projects | ✓ automatic from main branch |
| Auth user sharing | ✗ separate user table per project | ✓ auth is branch-shared by default (configurable) |
| Operational overhead | moderate — two projects to monitor, two billing lines | low — one project |
| Cost | free tier covers pre-beta | free tier covers pre-beta |
| Per-PR previews | would require project-per-PR (not feasible) | ✓ branches are cheap enough for per-PR |
| GitHub integration | manual via CI | ✓ native — branches auto-created per PR if GitHub integration enabled |
| Production risk during schema migration | same — migrations must be tested first | lower — test on a branch, then merge to main |

For a single-founder pre-beta product scaling to ~2,500 concurrent users (per ADR-001 §9 Q3), Branches are materially better. The "separate project" answer was correct when ADR-001 was drafted (Branches were still in early beta at that time); by 2026-04-24 they're production-ready and widely adopted.

**Concrete plan for Supabase Branches on Antaeus:**

1. **Keep `main` branch as production** (already exists; visible in dashboard as `main` with PRODUCTION tag).
2. **Create a persistent `preview` branch** via Supabase dashboard → Branches → Create branch. Forks current prod schema; starts with empty data.
3. **Add CF Workers Builds variables:**
   - Existing (main branch = production builds): keep `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` pointing at the production branch's endpoint (what `js/supabase-config.js` already hardcodes).
   - Since CF Workers Builds variables don't have per-environment scoping, dynamic branch detection happens in the build command: the Version command (for feature branches) overrides `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` with the preview-branch values. The Deploy command (for main) leaves them at production values.
   - Implementation: extend the npm scripts with a tiny helper that reads `CF_PAGES_BRANCH` (or equivalent) and exports the right URL/key before `vite build`. Or: add both sets as CF variables with distinct names (`VITE_SUPABASE_URL_PROD`, `VITE_SUPABASE_URL_PREVIEW`, same for ANON_KEY) and let the helper pick.
4. **Per-PR branches (optional Phase 2 extension)** — Supabase's GitHub integration auto-creates a branch per PR, destroyed on merge. If founded budget and surface area allow, enable this in Phase 2 Subphase 2.3.
5. **Schema migrations flow:** author locally → push to a feature branch → CI deploys to a Supabase branch (or to `preview` for simplicity) → review → merge PR → schema propagates to main branch via Supabase merge.

**`js/supabase-config.js` change:** switch from hardcoded values to reading `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `import.meta.env`. This way the same code points at prod in production builds and preview in feature-branch builds. Backwards compatible: if env vars are unset (local dev without `.env.local`), fall back to the hardcoded prod values so the app still runs.

---

## 3. Alternatives considered

### 3.1 Alternative: replace the existing schema from scratch

**What it would look like:** Drop all existing tables in the production Supabase project. Author new migrations from first principles per ADR-001's original plan. Write RLS from scratch. Migrate the 4 real users out and back in if needed.

**Why rejected:**
- Destroys 40–50% of already-correct work for no capability gain.
- Risk of auth/user-data regression during a reset.
- Breaks the working login/signup pages without a clear upside.
- The existing schema is genuinely well-structured (typed top-level cols + jsonb bag pattern is the right shape).
- Founder directive: no clock pressure, but also no reason to redo correct work.

### 3.2 Alternative: keep existing schema as-is, skip the workspace retrofit

**What it would look like:** Add the 4 missing noun tables but leave every existing table user-scoped. Punt multi-workspace to a future ADR.

**Why rejected:**
- Explicitly violates ADR-001 §9 Q1 founder answer ("multi-workspace from day one to avoid expensive retrofit later").
- Retrofitting workspace scoping once real data is flowing is materially more expensive than doing it while tables are empty.
- With 0 rows in every table, the retrofit is trivial right now.

### 3.3 Alternative: separate Supabase project for staging (ADR-001 §9 Q2 original answer)

**What it would look like:** Create `antaeus-gtm-os-staging` as a new Supabase project. Manually mirror schema. Set staging credentials in CF for feature-branch builds.

**Why rejected:**
- Higher operational cost than Supabase Branches (see §2.2 table).
- Manual schema sync is error-prone; a drifting staging schema makes PR previews unreliable.
- Per-PR branches are cheap on Branches; infeasible on projects.
- The Supabase Branches feature has matured since ADR-001 was written.

Keeping the decision open in this ADR so a future contributor understands the path not taken.

### 3.4 Alternative: defer workspace-scoping retrofit to a post-Phase-2 ADR

**What it would look like:** Phase 2 focuses on the 4 new tables + data client + migration + Branches. Workspace retrofit is a separate ADR-003 later.

**Why rejected:**
- While technically viable, splitting the retrofit out means the client-side data layer built in Phase 2 is written against user-scoped tables, then rewritten in Phase 3 against workspace-scoped tables. Double work.
- Better to do the retrofit while the client is being built so they align from day one.

### 3.5 Alternative: move Signal and Motion to their own tables now

**What it would look like:** Add `signals` table (referencing `signal_console_accounts.id`) and `motions` table (referencing `sequences.id` or a different parent). Denormalize out of the jsonb bag.

**Why rejected:**
- The rooms currently render signal and motion data directly from the parent objects' jsonb. Promoting to standalone tables requires rewriting that rendering path in every affected room.
- The denormalized shape is desirable for Realtime ("new signal arrived on account X → update view"), but the jsonb-inside-parent shape is adequate for most current use cases.
- Deferring preserves the schema's working shape. When the first real need for standalone Signal/Motion tables appears (likely during Phase 4 room migration), a future ADR makes the call with concrete justification.

---

## 4. Consequences

### 4.1 Positive

- **Phase 2 calendar cost drops from 3–4 weeks to ~2 weeks.** Schema design + RLS + auth are already done.
- **Zero data loss risk during schema extension.** Existing tables have 0 rows; adding `workspace_id` + updating RLS happens before any real data arrives.
- **Preserves existing auth.** 4 real users keep their accounts; no forced re-signup.
- **Multi-workspace-ready from the moment data starts flowing.** UI stays single-workspace-per-user (per §9 Q1 answer), but the data model supports team-style expansion later without migration pain.
- **Supabase Branches give per-PR isolation for free.** Every feature branch can point at a fresh DB copy; preview deploys show real workflows without touching production.
- **Less operational overhead than separate-project staging.** One Supabase project to monitor, one billing line, schema propagation automatic.
- **Schema migrations are testable end-to-end.** Author migration → apply to a Supabase branch → verify in preview CF deploy → merge to main → schema propagates to main Supabase branch (production). This replaces the "write SQL, hope it works on first production apply" pattern.

### 4.2 Negative

- **Workspace retrofit adds one migration step that has to be authored carefully.** Changing RLS policies mid-lifecycle has failure modes (lock-outs if a policy is mis-written). Mitigation: Phase 2 Subphase 2.2 includes a dedicated test-in-preview-branch step before any production change.
- **Client-side data layer is more complex than single-user-scoped would have been.** Every query has to go through workspace-membership resolution. One extra join or filter per operation. Mitigation: wrap in the typed client (`src/lib/data-client.ts`) so individual rooms never see the complexity.
- **CF Workers Builds variable-per-branch limitation adds a small build-script complication.** The script that picks prod-vs-preview Supabase credentials based on build branch is custom code the team owns. Not hard, but is a new component.
- **Supabase Branches is a newer feature than separate projects.** If it has a surprise failure mode, we discover it. Mitigation: Branches has been GA since late 2024; well-tested in production elsewhere. The `main` branch is always a fallback.

### 4.3 Neutral

- **Stack from ADR-001 unchanged.** Preact + TS + Vite + Vitest/Playwright + Sentry + Posthog + GHA + Cloudflare Workers Builds — all the same.
- **Canon Parts I–IV unchanged.** Mind / face / behavior / integration doctrine is stack-independent.
- **Existing SQL files in repo stay in place.** They're the historical record of the initial bootstrap. New migrations land in `supabase/migrations/` (new directory, standard Supabase CLI layout) going forward.

### 4.4 Risks

- **Workspace-scoping RLS could lock out existing users during the retrofit.** Mitigation: retrofit runs in the `preview` branch first, verified with a test query from each existing user's session token, then merged to main.
- **Supabase Branches has rate limits / connection-pool nuances we haven't hit yet.** Mitigation: start with `main` + one `preview` branch. Don't enable per-PR branch creation until Phase 3+ when we actually benefit from it.
- **Signal/Motion stay as jsonb longer than optimal for reactivity.** Mitigation: when a room needs fine-grained Signal reactivity, a targeted ADR-003 promotes Signal to its own table. Not a Phase 2 blocker.
- **4 existing real users might have localStorage data that needs to survive workspace-retrofit migration.** Mitigation: the localStorage-to-Supabase migration tool runs AFTER workspace retrofit is in place. Each user's migration writes their rows into their default (auto-created) workspace.

---

## 5. Non-goals

This ADR does NOT:

- **Redesign any existing table's columns.** Column additions are fine; deletions or type changes are out of scope for Phase 2.
- **Touch auth providers or user records.** 4 users keep their accounts and sessions.
- **Change `js/supabase-config.js`'s hardcoded fallback values.** The env-var read is additive; the hardcoded URL + anon key remain as the fallback for local dev without `.env.local`.
- **Build team collaboration features.** Schema supports multi-workspace; UI remains single-workspace-per-user per §9 Q1. Collaboration features are a separate future ADR.
- **Migrate existing localStorage data across all 4 existing users automatically.** The migration tool runs behind a feature flag, opt-in per-user initially.
- **Promote Signal or Motion to standalone tables.** Explicitly deferred to a future ADR when justified by Phase 3+ room needs.
- **Deprecate the existing `js/` runtime files.** They continue serving unmigrated rooms through Phase 4. Only rooms that migrate to Preact stop using them.
- **Adopt Supabase Edge Functions.** No server-side JS is planned for Phase 2. If a feature genuinely requires server code (e.g., cross-workspace aggregation for Readiness), a future ADR evaluates Edge Functions vs. alternatives.

---

## 6. Revised Phase 2 implementation plan

Phase 2 subphases are rewritten below to reflect the existing-schema-adoption approach and Supabase Branches.

### Phase 2 overall scope

- **Estimated calendar cost:** ~2 weeks (down from 3–4 weeks in ADR-001).
- **Gate to start:** ADR-002 approved (this doc's §11 signed).
- **Gate to proceed to Phase 3:** all four subphases below green.

### Subphase 2.1 — Supabase Branches setup + schema extension (est. 3–4 days)

**Tasks:**

1. **Create `preview` branch in Supabase dashboard.** `Branches` → `Create branch` → name: `preview` → source: `main` (production). Schema forks; data is empty.
2. **Add a `supabase/` directory** to the repo with the standard CLI layout. Run `supabase init` (CLI).
3. **Capture the existing state as migration zero.** Dump current production schema via `supabase db dump --schema public --data-only=false` into `supabase/migrations/0000_initial_schema_snapshot.sql`. This gives the CLI a baseline to diff against.
4. **Author migration 0001: `workspaces` + `workspace_members` tables.** Schema:
   - `workspaces` (id uuid pk, name text, owner_id uuid references auth.users, data jsonb, created_at, updated_at)
   - `workspace_members` (workspace_id uuid, user_id uuid, role text check in ('owner','admin','member'), invited_at, joined_at, primary key (workspace_id, user_id))
   - RLS on both: members can read their workspaces; owners can update/delete.
5. **Author migration 0002: backfill default workspaces for existing users.** For each of the 4 existing auth users, insert a `workspaces` row owned by them (name: `<email> workspace`) and a `workspace_members` row linking them as `owner`.
6. **Author migration 0003: `workspace_id` column retrofit on existing tables.** Add `workspace_id uuid not null default (select id from workspaces where owner_id = auth.uid() limit 1) references workspaces(id) on delete cascade` to: `icps`, `deals`, `sequences`, `signal_console_accounts`, `discovery_frameworks`, `discovery_call_logs`, `pipeline_settings`, `profiles`, `studio_artifacts`. (Tables with 0 rows take the column trivially; default gets resolved on next insert.)
7. **Author migration 0004: `proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts` tables.** Follow the existing pattern: id uuid pk + workspace_id uuid + user_id uuid (created-by) + typed top-level cols + data jsonb + timestamps + trigger.
8. **Author migration 0005: update RLS policies on all data tables** from `user_id`-based to `workspace_id`-based. Policy pattern: `(select auth.uid()) in (select user_id from workspace_members where workspace_id = <this row's workspace_id>)`.
9. **Apply all migrations to `preview` branch first.** Verify via test queries from each of the 4 existing users' sessions that they can still read/write their data.
10. **Merge `preview` → `main` in Supabase dashboard.** Schema propagates to production. Zero row changes in production (all existing tables are 0 rows; backfill migrations for workspaces + workspace_members insert 4+4 rows).

**Gate:**
- Preview branch has all 14 tables (10 existing + 4 new) with RLS enabled and workspace-scoping active.
- Production branch has the same after merge.
- A test query from each of the 4 existing users succeeds (reads 0 rows, writes new rows into their default workspace).
- Zero production downtime.

**Rollback:**
- If `preview` branch reveals a problem: don't merge; fix migrations in `preview`; re-apply.
- If production merge breaks something (unlikely given preview verification): rollback via Supabase branch operations (Branches support rollback to pre-merge state).

### Subphase 2.2 — Typed data client (est. 3–4 days)

**Tasks:**

1. **Generate TS types from the extended schema.** `supabase gen types typescript --linked > src/lib/db-types.ts`. Commit generated file.
2. **Build `src/lib/data-client.ts`:**
   - Exports a typed client wrapping supabase-js
   - One namespace per noun: `dataClient.icps.read()`, `.write()`, `.subscribe()`, etc.
   - Reads current workspace from auth context (`auth.uid()` → their primary workspace)
   - Optimistic update pattern: write to local state + issue server request in parallel; reconcile on success; rollback on failure with user-visible notification
   - Offline-first: reads from localStorage cache first, then revalidates from server
   - Realtime subscription wrapper: per-noun subscribe that yields inserts/updates/deletes for the current workspace's rows
3. **Enable Realtime on all 14 tables** via Supabase dashboard (Replication → toggle each table on).
4. **Update `js/supabase-config.js`:** read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`; fall back to hardcoded production values if unset (for local-dev-without-env-file safety).
5. **Unit tests for the data client** (Vitest): happy path, optimistic-update rollback, offline behavior, realtime event dispatch.

**Gate:**
- `src/lib/db-types.ts` compiles with strict TS; every existing jsonb `data` column gets a typed interface.
- `npm test` passes with data-client tests.
- Integration test: two browser tabs on the same account. Tab A writes an ICP; Tab B receives it via Realtime within 1 second.

### Subphase 2.3 — localStorage-to-Supabase migration tool (est. 3–4 days)

**Tasks:**

1. **Build `src/migration/localstorage-to-supabase.ts`:**
   - Reads every known `gtmos_*` localStorage key
   - For each key, transforms the stored value into Supabase-insert-ready rows, scoped to the user's default workspace
   - Idempotent: content-derived IDs where feasible (e.g., hash of ICP name + user_id); timestamp tie-breakers otherwise
   - Dry-run mode: reports what WOULD be written without writing
   - Preserves localStorage source until server confirmation; deletes from localStorage only after successful write
2. **Wire behind a Posthog feature flag `data_migration_live`.** Default: OFF. Manually enabled per user or globally when ready.
3. **Build a migration-status UI component** (in `src/components/MigrationStatus.tsx`): shows migration progress when the flag is on; allows user to opt out and keep localStorage as source of truth if they prefer.
4. **Test against an existing user's real localStorage data.** Use the founder's account as the pilot. Dry-run first. If dry-run output looks correct, live-run. Verify in Supabase that rows landed correctly.

**Gate:**
- Dry-run against the founder's account produces a correct diff.
- Live-run against one user successfully migrates their data.
- Rerunning the migration produces 0 duplicate rows.
- Rollback path tested: if migration is flipped off after running, user keeps Supabase + localStorage copies; nothing is destroyed.

### Subphase 2.4 — CF Workers Builds branch-aware credentials (est. 1–2 days)

**Tasks:**

1. **Add four new CF Workers Builds variables:**
   - `VITE_SUPABASE_URL_PROD` = production branch URL (same as current hardcoded URL)
   - `VITE_SUPABASE_ANON_KEY_PROD` = production anon key
   - `VITE_SUPABASE_URL_PREVIEW` = preview branch URL (from Supabase dashboard after Subphase 2.1 creates the preview branch)
   - `VITE_SUPABASE_ANON_KEY_PREVIEW` = preview anon key
2. **Update the build/deploy/version commands in CF Workers Builds:**
   - Deploy command (runs on main-branch pushes): `export VITE_SUPABASE_URL="$VITE_SUPABASE_URL_PROD" VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY_PROD" && npm run build && npx wrangler deploy`
   - Version command (runs on feature-branch pushes): `export VITE_SUPABASE_URL="$VITE_SUPABASE_URL_PREVIEW" VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY_PREVIEW" && npm ci && npm run build && npm run build:cloudflare && npx wrangler versions upload`
3. **Verify:** feature-branch build logs show the PREVIEW values being exported; main-branch build logs show PROD values. A deployed preview points at the Supabase preview branch (zero rows initially); a deployed production points at the Supabase main branch.

**Gate:**
- Main-branch deploy reads/writes from production Supabase.
- Feature-branch preview reads/writes from preview Supabase.
- No cross-contamination (a preview insert does not appear in production).

---

## 7. Acceptance criteria + success metrics

Phase 2 is accepted as complete when all are true:

**Schema correctness:**
- All 14 tables exist in both `main` and `preview` Supabase branches with identical structure.
- Every existing table has a `workspace_id` column referencing `workspaces(id)`.
- Every data table has RLS policies that check workspace membership via `workspace_members`.
- Every one of the 4 existing auth users has a default workspace with them as `owner`.

**Isolation verification:**
- RLS integration test: a user in workspace A cannot read rows belonging to workspace B under any tested attack path.
- Cross-branch isolation test: a write to the `preview` branch's tables does not appear in `main`.

**Client integration:**
- `src/lib/data-client.ts` compiles under strict TypeScript with zero `any`.
- Two-tab realtime test: Tab A writes, Tab B sees the update within 1 second (same workspace).
- Optimistic-update rollback test: a server error triggers local-state rollback + user-visible error.
- Offline cache test: disable network, make changes, re-enable, changes sync to server.

**Migration tool:**
- Dry-run against founder's account produces correct diff.
- Live-run migrates data successfully.
- Rerunning produces zero duplicate rows (idempotency).
- Rollback: migration flipped off after run leaves Supabase + localStorage in non-destroyed state.

**Branch-aware builds:**
- Main-branch production build reads from production Supabase.
- Feature-branch preview build reads from preview Supabase.
- CF Workers Builds logs show correct variable export.

**Observability:**
- Sentry captures any migration errors at the `data_migration` breadcrumb category.
- Posthog tracks `data_migration_started` / `data_migration_completed` / `data_migration_error` events.

**Canon alignment:**
- CLAUDE.md Part II.5 updated with Phase 2 completion state.
- CLAUDE.md Part V §6 gets a new session-log entry.
- No sacred-noun substance (Part I) was changed.

---

## 8. Rollback / unwind protocol

Phase 2 is designed to be reversible at every subphase.

**Subphase 2.1 rollback (schema extension):**
- Migrations tested against `preview` branch before merging to `main`.
- If preview reveals a problem, fix migrations in preview; don't merge until verified.
- If production merge unexpectedly breaks: Supabase Branches support rollback to pre-merge state via the dashboard.

**Subphase 2.2 rollback (data client):**
- Data client is a new file (`src/lib/data-client.ts`) not consumed by any existing room yet.
- Rolling back = deleting the file + reverting generated types + reverting `js/supabase-config.js` env-var read.
- No user impact because no room uses it yet.

**Subphase 2.3 rollback (migration tool):**
- Migration is behind a Posthog feature flag; default OFF until explicitly enabled.
- Flip the flag OFF; no user's localStorage is touched again.
- Already-migrated users retain both Supabase + localStorage copies (migration does not delete source until confirmed).
- Reverse migration possible via a companion `src/migration/supabase-to-localstorage.ts` that can be authored if ever needed.

**Subphase 2.4 rollback (branch-aware builds):**
- Revert the CF Workers Builds commands to their pre-Phase-2 values (`npx wrangler deploy` and `npm ci && npm run deploy:cloudflare` without the env-var export prefixes).
- Delete the PROD and PREVIEW Supabase variables (keep `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` pointing at production).
- Feature-branch builds start pointing at production again (pre-Phase-2 state).

**Full Phase 2 unwind:**
- Revert all migration files and schema changes via `supabase db reset` on preview branch + manual schema revert on main (more invasive; only in extreme scenarios).
- Delete `preview` branch.
- Remove `src/lib/data-client.ts`, `src/lib/db-types.ts`, `src/migration/`.
- Revert `js/supabase-config.js`.
- Canon update reversed.

Rollback is most painful after migration tool has run on real users. Mitigation: feature flag gates that behavior; default off until each user is explicitly opted in.

---

## 9. Open questions — resolved

1. **Should the migration tool run automatically on first login post-deploy, or require explicit user opt-in?**
   - **Decision:** explicit opt-in via Posthog feature flag `data_migration_live`. Default: OFF for all users. Founder opts themselves in first as pilot. After pilot is stable, enable globally. Rationale: a silent auto-migration on first login is a better user experience but a worse risk posture for pre-beta. Explicit opt-in trades convenience for reversibility.
2. **Should we enable per-PR Supabase branches (auto-created per PR, destroyed on merge)?**
   - **Decision:** defer to Phase 3. Phase 2 uses only `main` + persistent `preview`. Per-PR branches are valuable when multiple rooms migrate concurrently in Phase 3+ and feature branches need isolated data shapes. Not worth the extra setup in Phase 2.
3. **Should `js/supabase-config.js` be removed or kept?**
   - **Decision:** keep through Phase 2 and Phase 3. Unmigrated rooms (anything not yet on Preact) still load it via `<script>` tag. Phase 3 rooms use `import { supabaseClient } from '@/lib/data-client'` instead. When all rooms migrate (Phase 4 complete), `js/supabase-config.js` can be deleted.
4. **Should the four new noun tables (`proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts`) include any columns beyond the standard pattern?**
   - **Decision:** Phase 2 adds them with the minimum viable column set (id, workspace_id, user_id, timestamps, trigger, data jsonb, one or two typed top-level cols per table as needed — e.g., `proofs.kill_rule text`, `readiness_snapshots.overall_score numeric`). Column expansion is per-room-migration in Phase 3+; each room migration can add columns its UI needs via additive migrations.

---

## 10. Canon references + canon updates

This ADR supersedes:
- ADR-001 §9 Q2 (separate-Supabase-project-for-staging answer)
- ADR-001 §6 Phase 2 subphase structure (rescoped in §6 above)

This ADR preserves:
- ADR-001 §2 stack decisions
- ADR-001 §9 Q1 (multi-workspace from day one)
- ADR-001 §9 Q3 (~2,500 concurrent users scale target)
- All other ADR-001 answers and decisions

Canon updates triggered by this ADR:
- **`CLAUDE.md` Part II.5** gets a note pointing at ADR-002 for the revised Phase 2 plan.
- **`CLAUDE.md` Part V §1** "Foundation migration in progress" section updated: Phase 2 subphases renumbered per this ADR; Supabase state acknowledged as substantially pre-built.
- **`CLAUDE.md` Part V §6 session log** gets a new entry for 2026-04-24 covering: (a) discovery of existing Supabase state, (b) ADR-002 approval, (c) switch to Supabase Branches, (d) revised Phase 2 scope.
- **`deliverables/adr/README.md`** gets a new row in the Current ADRs table.

No doctrine (canon Parts I–IV) is touched.

---

## 11. Founder approval block

- [x] I have read this ADR in full.
- [x] I have resolved the open questions in §9 (or accepted Claude's recommendations where not otherwise specified).
- [x] I approve Decision A: adopt existing schema; extend rather than replace; workspace-scoping retrofit while tables are empty; 4 new sacred-noun tables (`proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts`); Signal + Motion stay as jsonb-inside-parent for now.
- [x] I approve Decision B: Supabase Branches for staging (supersedes ADR-001 §9 Q2). Persistent `preview` branch in Phase 2; per-PR branches deferred to Phase 3.
- [x] I approve the revised Phase 2 implementation plan in §6.
- [x] I approve the rollback/unwind protocol in §8.
- [x] I approve the canon updates described in §10.

**Approved by:** Founder
**Date of approval:** 2026-04-24
**Notes / conditions:**
- Phase 2 starts when founder gives explicit go-ahead on a subsequent session.
- Migration tool default-OFF via Posthog flag; founder opts in first.
- Per-PR Supabase branches deferred to Phase 3.
- `js/supabase-config.js` preserved through Phase 3; removed only when Phase 4 completes.
