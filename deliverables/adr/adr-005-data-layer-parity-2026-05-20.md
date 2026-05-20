# ADR-005 — Data Layer Parity (Phase 4.5)

**Date:** 2026-05-20
**Status:** Approved
**Supersedes:** None
**Depends on:** ADR-001 (Foundation Stack), ADR-002 (Phase 2 Data Architecture), ADR-003 (Refacing Completion), ADR-004 (Orchestration Layer Foundation)

---

## Context

Phase A of the orchestration layer (ADR-004) shipped 2026-05-19 and went live in production 2026-05-20. The heartbeat is firing every 30 minutes. The observations ledger is ready to accept writes. The session model is wired for cross-room continuity.

But during the Phase B kickoff conversation on 2026-05-20, a gap surfaced that Phase A papered over: **the heartbeat lives server-side and can only see data in Supabase. Most of the data the heartbeat needs to think about still lives in operators' browsers.**

Specifically: Phase 4 (closed 2026-04-28) migrated 17 rooms onto the Preact+TS stack but kept their persistence in localStorage with cloud-sync gap-closers for a few keys. The Phase 2.2 data-client (`src/lib/data-client.ts`) exists with typed per-noun accessors and the per-noun Supabase tables exist (Phase 2.1 migrations). But rooms do not actually write through the data-client. The only Supabase rows for most nouns are the 2026-04-24 migration blob — a frozen jsonb snapshot under `data.migrated_from_localstorage` that is drifting further from reality every day.

This means an Edge Function generator running tonight can see the migration snapshot from a month ago, but cannot see the deal the operator advanced this morning. That breaks every meaningful generator.

The founder's call on 2026-05-20 was explicit: **take the long path that puts us in the best long-run position. We are not in a rush.** Three options were presented:

| | Option | What ships in Phase B | What's owed first |
|---|---|---|---|
| A | Build the generator against the Phase 2.3 migration blob | Generator reads `data.migrated_from_localstorage` jsonb on the per-noun pass-through tables | Nothing — the blob is already in production from the 2026-04-24 migration |
| B | Migrate Signal Console accounts to native Supabase rows first | Generator reads from native tables | A Phase 4 follow-up: Signal Console rewrites its persistence layer to use `data.accounts` / `data.signals` accessors |
| C | Build a different first generator that operates only on data already in Supabase | Generator reads `workspace_sessions.recent_actions` to find accounts the operator has touched repeatedly without follow-up | Nothing — but the observation is weaker because there's no signal-recency data |

Founder picked B but with the long-path framing — not "Signal Console only," but the full retrofit of every Phase 4 room onto native Supabase persistence before Phase B observable payoff lands.

---

## Decision

Adopt **Phase 4.5 — Data Layer Parity** as a foundation phase between Phase A (orchestration foundation, shipped) and Phase B (first observable generator + Dashboard "this week's reads" card, deferred).

Every Phase 4 room is retrofitted to read and write through `data.<noun>.*` accessors from `src/lib/data-client.ts` instead of `localStorage`. The retrofit is per-room, feature-flagged, follows a 5-step lifecycle (audit → schema → dual-write → flip-read → drop-legacy), and lands in priority order. The 2026-04-24 migration blob is archived but not deleted once every room reads native.

Phase B observable payoff (signal-decay generator + Dashboard card) waits for the minimum production-data trio (Signal Console + Deal Workspace + Outbound Studio) to complete parity. Phase A infrastructure sits dormant during 4.5 — that work is not wasted, it is the foundation that lights up with real data when 4.5 closes.

---

## What "parity" means

Three properties define a room being at parity:

1. **Source of truth is Supabase.** Every mutation goes through `data.<noun>.insert/update/remove`. localStorage is either gone or retained only as an offline-fallback cache.
2. **Reads use realtime subscriptions.** Rooms subscribe via `data.<noun>.subscribe(handler)` so any mutation from another tab, another device, or the heartbeat appears live without page reload.
3. **Cross-tab consistency holds without `storage` events.** The Phase 4 aggregator pattern (read localStorage on a 10s interval + listen for `storage` events) is removed. Realtime replaces it.

A room that still writes to localStorage as primary truth, or that reads from localStorage and only syncs to Supabase on save, is not yet at parity. Dual-write phases are explicitly intermediate.

---

## Per-room retrofit pattern (the 5-step lifecycle)

Every room follows the same five-step retrofit, each step its own PR with CI green before the next starts:

### Step 1 — Audit
- Map every `gtmos_*` localStorage key the room reads or writes
- Map each key to the corresponding `data.<noun>` accessor (existing or to-be-added)
- Identify schema deltas: columns that don't yet exist, columns whose types are wrong, columns whose semantics drifted from the legacy localStorage shape
- Write the audit as a `deliverables/audit/data-parity-<room>-<date>.md` doc

### Step 2 — Schema additions
- Migration file `supabase/migrations/<timestamp>_<room>_data_parity.sql` adds any new columns / new tables / FK constraints
- Columns added with `null`able defaults so existing rows (including the migration blob fallback) still parse
- RLS policies follow the workspace-membership pattern from migration `20260424170004`
- Realtime publication adds the table if not already present
- Database types regenerated: `supabase gen types typescript --linked > src/lib/database.types.ts`

### Step 3 — Dual-write
- Room is updated to write to BOTH localStorage AND `data.<noun>` accessor on every mutation
- Reads continue from localStorage (no behavior change yet for operators)
- Feature flag `<room>_data_parity_write` gates Supabase-write path so it can be toggled off if a regression surfaces
- New tests: assert that a localStorage write also produces a `data.<noun>.insert` call

### Step 4 — Flip-read
- Room is updated to read from Supabase first, fall back to localStorage on miss
- Realtime subscription wired: `data.<noun>.subscribe(handler)` replaces the `storage`-event listener
- Feature flag `<room>_data_parity_read` gates the new read path
- New tests: Playwright walk that mutates in tab A and asserts the mutation appears in tab B via realtime within 5 seconds
- Stable in production for 14 days minimum before Step 5

### Step 5 — Drop legacy
- localStorage writes removed
- `<room>_data_parity_write` and `<room>_data_parity_read` flags retired
- Legacy `gtmos_*` keys cleaned up from `js/demo-storage-bootstrap.js` and the data-migration tool's per-noun mappers
- Final test: room can be opened in a fresh browser, no localStorage seed, and renders correctly from Supabase

Each step is its own PR. A room is "at parity" only when Step 5 has merged.

---

## Schema design principles

Three principles for schema work in this phase:

### Additive over redesign
Every schema change is a column addition or a new table. No column drops, no type changes that aren't backward-compatible, no breaking renames. New columns ship with `null`able defaults so existing rows (including rows from the Phase 2.3 migration blob) continue to parse. If a generator needs a different shape than what the legacy column has, we add a new column rather than overwrite the old one.

This principle holds throughout Phase 4.5. After Phase 4.5 closes, a separate cleanup pass can drop columns the migration blob populated that no room reads anymore — but that pass is not in scope here.

### Foreign keys where references are real
The legacy localStorage shape often nested related objects (signals as a json array inside an account row). The Supabase shape should flatten — signals are their own table with `account_id` foreign key. This is a one-time correctness win + lets Postgres enforce referential integrity + lets generators query across nouns via SQL joins instead of in-memory cross-references.

FKs ship with `on delete cascade` for owned children (signals belong to an account; deleting the account cascades), `on delete set null` for soft references (a deal's `champion_id` points at a contact, but deleting the contact doesn't delete the deal).

### Defensive nullable columns at boundaries
Every column that an external source might populate (the migration blob, a future API import, a user-entered field) is nullable with a parser-side normalization layer. Defensive parsers in `src/lib/<room>/lib/types.ts` (per the Phase 4 pattern) handle missing / malformed / wrong-type values without throwing. RLS-policy columns (`workspace_id`, `created_by`) are `not null`.

---

## Feature-flag model

Two flags per room during retrofit:
- `<room>_data_parity_write` — Step 3 dual-write gate. Default off; founder enables for own user first, then widens.
- `<room>_data_parity_read` — Step 4 flip-read gate. Default off; founder enables for own user first, then widens.

Both flags retired at Step 5. Total flag count during peak retrofit: 17 rooms × 2 flags = 34 flags, on top of the existing `room_<room>_v2` Phase 4 cutover flags. Posthog should handle this fine but it's worth grouping with a folder convention (`data-parity/<room>`).

One master umbrella flag: `data_layer_parity_complete`. Default off until every room's Step 5 has merged. When this flag flips on, the migration blob is archived and any code path that still reads `data.migrated_from_localstorage` errors loudly (so we catch missed migrations).

---

## Room priority order

Production-data rooms first because that's what generators care about. Secondary rooms after.

**Tier 1 — production data (required for Phase B)**
1. **Signal Console** — accounts + signals. Required for signal-decay generator.
2. **Deal Workspace** — deals. Required for cross-reference (does the account have an active deal?).
3. **Outbound Studio** — touches. Required for execution-context temperature ladder + outreach-recency generators.

Phase B can unblock as soon as these three are at parity. The minimum trio is the gate.

**Tier 2 — supporting production data**
4. **Discovery Studio** — call sessions, learned facts, next-step locks. Generators about discovery quality + stalled deals need this.
5. **PoC Framework** — proofs, kill rules. Generators about proof-decay need this.
6. **Cold Call Studio** — call logs. Generators about call-cadence need this.
7. **LinkedIn Playbook** — cue actions. Generators about LinkedIn-channel coverage need this.

**Tier 3 — strategic shaping**
8. **ICP Studio** — icps. Generators about ICP-fit drift need this.
9. **Territory Architect** — focuses + approaches. Generators about territory coverage need this.
10. **Sourcing Workbench** — query cards + prospects. Generators about sourcing-pipeline depth need this.
11. **Call Planner** — agendas + handoff payloads. Generators about call-prep quality need this.

**Tier 4 — system + utility**
12. **Advisor Deploy** — deployments, registry. Generators about advisor-coverage gaps need this.
13. **Future Autopsy** — task log. Mostly reads from Deal Workspace mirror — minimal own state.
14. **Quota Workback** — inputs. Mostly reads from Deal Workspace + Outbound mirrors.
15. **Welcome** — milestone reads, minimal own state.
16. **Onboarding** — activation context. One-shot at signup; minimal ongoing state.
17. **Settings** — trust annex, mostly utility. localStorage-only is acceptable for some keys (UI prefs); only data-bearing keys retrofit.

Tier 1 is the gate for Phase B. Tier 2 unblocks the second wave of generators. Tiers 3-4 round out the matrix.

---

## Session focus tracking (parallel workstream)

Phase A shipped a session model (`workspace_sessions` table + `src/lib/session/*`) but no room writes to it yet. As a lightweight parallel workstream that does NOT block on the Tier-1 retrofit, every room can be updated to call `setFocusedObject({ type, id, name, room })` when the operator focuses an object, and `clearFocus()` when they leave.

This is one small PR per room — ~5-10 lines each — and lights up the session model immediately. The heartbeat's active-workspace filter (currently checks `workspace_sessions.updated_at`) starts seeing real activity. Cross-room continuity (the eventual "birdseye strip") gets its data source.

Order: Signal Console, Deal Workspace, Discovery Studio, then the rest in any order. Can run in parallel with the data-parity retrofit.

---

## Demo mode boundary

Demo workspaces stay localStorage-only. Generators only run on real workspaces.

Reasoning: demo data is for screenshots, QA, the `?demo=1` escape hatch, and the demo-seed bootstrap. It is not data the system should "think about." Generators producing observations on demo data would muddy the ledger and produce noise in the Dashboard "this week's reads" card.

Implementation: the demo-seed bootstrap (`js/demo-storage-bootstrap.js`) namespaces every key with `gtmos_demo__*`. After Phase 4.5, the data-parity layer respects this — when `sessionStorage.gtmos_env_mode === "demo"`, the data-client falls back to a localStorage-backed in-memory store with the same NounAccessor shape but no network writes. Mutations stay local; subscriptions are no-ops; the heartbeat never sees the workspace.

This adds a small abstraction (`createDataClient({ mode: "supabase" | "demo-local" })`) but keeps demo flows working unchanged and prevents the heartbeat from observing demo data.

---

## CI gate

Per-PR ephemeral Supabase branches.

Each CI run:
1. Provisions a fresh Supabase branch from `main` via the Supabase CLI + a service account PAT stored as a GitHub Actions secret
2. Applies all migrations against the new branch
3. Runs the test suite (typecheck + vitest + Playwright + Vite build) against that branch as the test target
4. Tears down the branch on completion (success or failure)

Cost: each PR run adds ~30-60s for branch provisioning and ~30-60s for teardown. Worst-case ~2 minutes added to CI wall-clock per PR. Money: Supabase Pro tier includes branch usage; per-PR branches are well within budget at the current PR rate.

Why per-PR branches instead of the persistent `preview` branch:
- True isolation — no cross-PR contamination from concurrent test runs
- No accumulated test data needing nightly cleanup
- Realtime tests don't race against each other
- Forces the migrations to apply cleanly from scratch on every run (catches "works on my machine" migration bugs)

Cancelled PRs and abandoned branches need a janitor. Daily cron job (separate GitHub Action) walks Supabase branches whose linked PR is closed-merged or closed-not-merged, and tears them down if still alive.

Service account: a dedicated `ci@antaeus.app` Supabase account with permission to create/delete branches within the project. PAT stored in GitHub Actions secrets as `SUPABASE_CI_PAT`. Rotation pattern: every 6 months or on any team change.

---

## Migration blob deprecation timeline

The Phase 2.3 migration blob in `data.migrated_from_localstorage` (under per-noun pass-through tables) is the lossless 2026-04-24 snapshot. It is preserved during Phase 4.5 as a read-fallback for Step 4 (flip-read) — if a row hasn't been written through the new data-parity path yet, the room falls back to the blob.

After every room hits Step 5 (drop legacy):
1. Master flag `data_layer_parity_complete` flips on
2. Code paths that read from `data.migrated_from_localstorage` are removed
3. The blob columns are NOT dropped from the schema — they stay as historical audit trail
4. A note added to canon Part II.5 §6 documenting that the blob is archived

The blob itself is never deleted. Disk is cheap; the audit trail of "what data existed on 2026-04-24" is valuable.

---

## Test discipline

Three test categories per retrofit PR:

### Unit tests (vitest)
- Parser correctness — defensive parsing of legacy localStorage shapes + Supabase row shapes + migration-blob fallback shapes
- Schema mapping — `legacyToRow` + `rowToView` + `viewToInsert` transformations are pure and round-trip
- Engine logic preserved verbatim — every Phase 4 engine port test continues to pass

### Component tests (vitest + @testing-library/preact)
- Room renders correctly with empty Supabase + empty localStorage
- Room renders correctly with populated Supabase + empty localStorage (the post-Step-5 case)
- Room renders correctly with empty Supabase + populated localStorage (the pre-Step-3 case + offline-fallback case)

### E2E tests (Playwright)
- **Step 3 (dual-write):** Mutate in the room, verify both localStorage AND a `data.<noun>.insert` call fired
- **Step 4 (flip-read):** Open two tabs of the room, mutate in tab A, assert mutation appears in tab B within 5 seconds via realtime (no manual refresh)
- **Step 5 (drop legacy):** Open the room in a clean browser context with no localStorage seed, assert it renders correctly from Supabase alone

The realtime assertion in Step 4 is the discipline that prevents regression to the legacy aggregator pattern. Every room's retrofit PR must pass it.

---

## Risks

### Schema design ossifies the legacy shape
The "additive over redesign" principle preserves backward compatibility but risks ossifying suboptimal legacy structures. Mitigation: each room's audit doc explicitly calls out where the legacy shape was wrong and proposes the correct shape; the new shape ships as additive columns; a separate Phase 4.6 cleanup pass (post-4.5) can drop the legacy columns after every consumer has migrated.

### Per-PR Supabase branches are slow
CI wall-clock grows by ~2 minutes per PR. Mitigation: only the data-parity retrofit PRs need the branch — other PRs (copy fixes, doc updates, room face changes) can skip the branch provisioning step via a GitHub Actions conditional. Worst case during peak Phase 4.5: ~17 rooms × 5 steps = 85 retrofit PRs, each adding 2 min CI. That's ~3 hours of total compute over months of work.

### Realtime assertion is flaky
Realtime sometimes takes longer than 5 seconds to propagate, especially on cold connections. Mitigation: assertion waits up to 10 seconds with a retry; if it still fails, the test reports the actual elapsed time so we can tune the threshold per-room.

### Operators with offline cached data lose state mid-retrofit
If an operator has localStorage data that hasn't been dual-written to Supabase yet (e.g. they were offline during a dual-write window), Step 4's flip-read might surface empty rooms. Mitigation: Step 4 reads Supabase first, falls back to localStorage on miss — so offline data still renders. Only Step 5 removes the localStorage fallback, and only after 14 days of stable dual-write production data.

### Demo mode abstraction leaks
The `createDataClient({ mode })` abstraction adds a code path that could drift from production reality. Mitigation: a small contract test asserts the demo-local NounAccessor shape matches the Supabase NounAccessor shape exactly — every method present, every signature identical.

### Feature flag sprawl
34 retrofit flags + 17 v2 flags + existing flags = ~70 active flags during peak. Mitigation: Posthog folder convention groups them; retirement is mandatory at Step 5; quarterly flag audit catches any that escaped retirement.

---

## What's NOT in scope

- **Phase B observable payoff.** The signal-decay generator + Dashboard "this week's reads" card stay deferred until Tier 1 (Signal Console + Deal Workspace + Outbound Studio) hits Step 5.
- **Phase C skills layer.** Deterministic markdown recipes (ADR-004 §Architecture) wait until Phase 4.5 is complete + Phase B has shipped.
- **Migration blob deletion.** Archived, not deleted.
- **Schema redesign.** Additive only. A separate Phase 4.6 cleanup pass can drop legacy columns post-parity, but that's a future ADR.
- **Demo data observability.** Demo workspaces stay invisible to generators by design.
- **Mobile / offline-first.** This ADR doesn't change the offline story. Offline writes still go to localStorage; the cloud sync happens when connectivity returns. PWA / offline-first is a separate future arc.

---

## Implementation order

Three checkpoints, each gated on the previous:

### Checkpoint 1 — Setup (1 PR)
- Per-PR Supabase branch CI workflow lands in `.github/workflows/`
- `SUPABASE_CI_PAT` secret created + populated
- Janitor cron action for stranded branches
- `createDataClient({ mode })` abstraction lands with the demo-local shape
- Master flag `data_layer_parity_complete` created (off)
- This ADR's status flipped to APPROVED

### Checkpoint 2 — Tier 1 retrofit (~15 PRs)
- Signal Console: 5 steps × 1 PR each = 5 PRs
- Deal Workspace: 5 PRs
- Outbound Studio: 5 PRs

When all three Tier 1 rooms hit Step 5, Phase B begins. Phase B itself is a separate ADR (ADR-006 — signal-decay generator + Dashboard "this week's reads" card).

### Checkpoint 3 — Tier 2-4 retrofit (~70 PRs)
- The remaining 14 rooms × 5 steps each
- Runs in parallel with Phase B and any subsequent generator work
- When the last room hits Step 5, `data_layer_parity_complete` flips on, the migration blob is archived, and the data-parity arc closes

Parallel workstream throughout: session focus tracking (`setFocusedObject` calls) lands per-room as separate small PRs, not gated on the retrofit checkpoints.

---

## Approval

**Status:** Approved 2026-05-20.

### Resolutions on the four open questions

1. **Tier 1 ordering inside the trio.** Approved as proposed: Signal Console → Deal Workspace → Outbound Studio. Signal Console first to derisk the most complex schema (accounts + nested signals) early; Deal Workspace second because Future Autopsy + Quota Workback both read from it, so its retrofit unlocks indirect benefits even before Phase B; Outbound Studio third.

2. **Schema-types regeneration cadence.** Locked as machine-generated only. Every Step 2 regenerates `src/lib/database.types.ts` via `supabase gen types typescript --linked > src/lib/database.types.ts` and commits the output verbatim. No hand-edits. The Phase 2.2 bootstrap hand-edit pattern (see CLAUDE.md Part II.5 §2) is retired going forward.

3. **Service account email.** `ci@antaeus.app` confirmed. Founder owns Supabase account creation + initial PAT generation. PAT stored in GitHub Actions secrets as `SUPABASE_CI_PAT`. Rotation pattern: every 6 months or on any team change.

4. **PRs #43 + #44 (2026-05-01 cloud-sync gap-closers) and the retrofit.** Resolved to **option (a) — fresh, complete dual-write pass.** Each affected room (Outbound Studio, Advisor Deploy, Signal Console) gets a full ADR-005-conformant Step 3 covering all of the room's state. The legacy PR #43 + #44 code paths get retired during Step 5 (drop legacy). Rationale:
   - **Clean code.** PR #43 + #44 were gap-closers, not designed against a per-room lifecycle. Mixed code paths (PR #43 patterns alongside ADR-005 patterns) would be harder to reason about and test.
   - **Audit clarity.** Step 1 (audit) produces a clean shape — "every mutation in the room and where it lands." Crediting partial coverage muddies that doc.
   - **The work isn't wasted.** PR #43 + #44 proved the patterns work end-to-end against production Supabase, surfaced the offline retry queue as a real-world resilience need, and validated the per-noun table schemas. That foundation knowledge informs the ADR-005 retrofit even when the specific code gets replaced.
   - **Cost:** roughly one extra PR per affected room (~3 PRs total) covering the slice PR #43 already handled. Acceptable for the clarity gain.

### Founder approval block

- Date approved: 2026-05-20
- Conditions / amendments: none beyond the four resolutions above
- Signed: founder (mrcoe7@gmail.com)

---

---
