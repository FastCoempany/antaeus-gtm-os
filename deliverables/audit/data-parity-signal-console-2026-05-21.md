# Data Parity Audit — Signal Console (Step 1)

**Date:** 2026-05-21
**Phase:** 4.5 / Tier 1 / Room 1 of 17 (per ADR-005 §"Room priority order")
**Step:** 1 — Audit (per ADR-005 §"Per-room retrofit pattern")
**Status:** Approved 2026-05-21

This is the Step 1 deliverable that ADR-005 requires before any code lands. It maps every legacy `gtmos_*` localStorage key the Signal Console reads or writes to the corresponding `data.<noun>` accessor, identifies schema deltas that Step 2 will need to ship, and documents the existing partial cloud-sync (PR #43 from 2026-05-01) that Step 3+ will supersede.

Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md
Ref: CLAUDE.md Part I §4.7 (Signal Console mind)

---

## TL;DR

Signal Console is the **least-greenfield Tier 1 room** because PR #43 (2026-05-01) already shipped a partial dual-write implementation. The cloud-persistence layer exists (`src/signal-console/lib/cloud-persistence.ts` + `src/signal-console/lib/sc-bridge.ts`), accounts can be added via the cloud path, and realtime subscriptions are wired. But three persistence surfaces still write to localStorage only:

1. **Bulk array writes from state mutations** — every time `allAccounts` changes (heat edits, signal additions, account deletions outside the AddAccountForm path), `saveAccounts()` writes to `gtmos_sc_v4` localStorage. No corresponding cloud write happens for those code paths.
2. **Health snapshot publishing** — `gtmos_signal_room_health` is written on every state change. The Dashboard's command-intelligence aggregator reads it via cross-tab `storage` events. After Step 5, this localStorage hop should be replaced by Supabase Realtime delivering Account-table changes directly to the Dashboard.
3. **Cross-room readers** — Signal Console reads `gtmos_deal_workspaces`, `gtmos_outbound_touches`, `gtmos_icp_analytics` from localStorage to compute execution-context temperature and ICP match. Those are *other* rooms' data; they'll be cleaned up when Deal Workspace + Outbound Studio + ICP Studio themselves hit Step 5.

Schema-side: the `signal_console_accounts` table already exists (Phase 2.1 migrations). It's mostly right but has two real shape issues for generator queries that Step 2 needs to address — signals are nested in a `data` jsonb blob (should be a proper child table with FK), and the `heat` column is a stored snapshot that drifts from the always-computed in-memory value.

**Per-step plan estimates** (informed by what's already done):
- Step 2 (schema) — 1 migration adding a `signals` table + FK index; preserve `signal_console_accounts.heat` column but mark it informational
- Step 3 (dual-write) — small; mostly already done by PR #43, fills gaps for state-array mutations + delete path
- Step 4 (flip-read) — small; cloud-canonical boot already works, just need to add `signals` table reads + retire `gtmos_signal_room_health` consumers
- Step 5 (drop legacy) — coordinated with Dashboard Step 5 (the `gtmos_signal_room_health` consumer)

---

## What the room owns + what it borrows

### Owns (writes)
- **`gtmos_sc_v4`** — primary persistence; shape `{accounts: Account[], lastSavedAt?: string}`
- **`gtmos_signal_room_health`** — health snapshot for Dashboard; written via `publishHealthSnapshot()`
- **`gtmos_sc_heat_bands_dismissed`** — UI dismissal state for the heat-bands banner

### Borrows (reads only)
- **`gtmos_deal_workspaces`** — read by `lib/execution-context.ts` to compute execution-context temperature. Owned by Deal Workspace.
- **`gtmos_outbound_touches`** — read by `lib/execution-context.ts` for the same temperature calculation. Owned by Outbound Studio.
- **`gtmos_icp_analytics`** — read by `lib/icp-match.ts` to display ICP match scores on account cards. Owned by ICP Studio.

---

## Full localStorage → Supabase mapping

### `gtmos_sc_v4` → `data.signalConsoleAccounts` ✅ partial dual-write exists

**Current storage shape** (from `lib/persistence.ts` lines 24-30):

```typescript
const STORAGE_KEY = "gtmos_sc_v4";
interface PersistedShape {
    accounts?: ReadonlyArray<Account>;
    lastSavedAt?: string;
}
```

**Account shape** (from `lib/types.ts` lines 67-85):

```typescript
interface Account {
    id: string;
    name: string;
    ticker?: string;
    domain?: string;
    industry?: string;
    hq?: string;
    employees?: string;
    focus?: string;
    tier?: 1 | 2 | 3 | 4;
    approach?: string;
    persona?: string;
    enrichedAt?: string;
    notes?: string;
    signals: ReadonlyArray<Signal>;
    created_at?: string;
    updated_at?: string;
}
```

**Existing target table** (from `src/lib/database.types.ts`):

```typescript
signal_console_accounts: {
    Row: {
        id: string;            // uuid
        user_id: string;       // auth.uid()
        workspace_id: string | null;
        account_key: string;   // slug, derived from account_name
        account_name: string | null;
        domain: string | null;
        ticker: string | null;
        industry: string | null;
        sector: string | null;
        heat: number;          // stored, but always computed in-memory
        last_enriched_at: string | null;
        data: Json;            // signals[] + hq + employees + focus + tier + approach + persona + notes
        created_at: string;
        updated_at: string;
    };
}
```

**Bridge** (already exists at `lib/sc-bridge.ts`): `rowToAccount` / `accountToInsert` / `accountToUpdate` / `extractDataBlob`. Handles the column ↔ jsonb-blob split.

**Existing write paths to Supabase** (PR #43):
- `AddAccountForm.tsx` → `saveAccount()` in `lib/cloud-persistence.ts` → `data.signalConsoleAccounts.insert/update`
- Boot-time first-sync migration: if localStorage has accounts but Supabase is empty, push all up

**Missing write paths** (Step 3 gap):
- State-array mutations triggered by anything other than AddAccountForm. Specifically:
  - `state.ts` → `setAllAccounts()` writing on any external state replacement
  - `state.ts` → `removeAccount()` not propagating to `data.signalConsoleAccounts.remove()`
  - Signal additions (which mutate `data.signals[]` jsonb) currently only hit localStorage
  - Heat recomputes don't hit Supabase (and shouldn't, see "Drift" below)
- The `enrich-all` flow (currently deferred per CLAUDE.md §V — "enrich-all flow deferred to a follow-up")

### `gtmos_signal_room_health` → no direct Supabase counterpart, **retire after Dashboard Step 5**

**Current storage shape** (from `lib/health-snapshot.ts`):

```typescript
const HEALTH_SNAPSHOT_KEY = "gtmos_signal_room_health";
interface HealthSnapshot {
    capturedAt: string;
    accountCount: number;
    signalCount: number;
    readyCount: number;
    topAccount: {...};
    hot_accounts: Array<{...}>;
}
```

This snapshot is a *derived view* over `gtmos_sc_v4` data, written to a separate localStorage key so the Dashboard can read it via `storage` events without re-running the heat engine. **It's a cross-room communication channel that exists only because both rooms were localStorage-only.**

**Target after Step 5:** Dashboard reads `data.signalConsoleAccounts` directly via realtime subscription. The Dashboard's command-intelligence aggregator (`src/dashboard/lib/snapshot-aggregator.ts`) computes its own health summary from the Account rows. The `gtmos_signal_room_health` key is deleted.

**Cross-room coordination:** this is the first instance of a pattern that recurs across the retrofit — pairs of rooms that publish derived snapshots to localStorage for the other to consume. After both rooms hit Step 5, the snapshot key is retired. ADR-005 §"Migration blob deprecation timeline" extends to these inter-room snapshot keys too.

### `gtmos_sc_heat_bands_dismissed` → **stays localStorage** (UI prefs)

**Current shape** (from `components/HeatBandBanner.tsx` lines 16-28): a single boolean (`"1"` or unset). Tracks whether the operator dismissed the heat-bands explainer banner. Per-device UI preference.

**Decision:** stays local. UI prefs don't belong in Supabase. The flag is one-shot per device — moving it to Supabase would surface as cross-device unwanted side-effects (dismiss on laptop, see it again on phone). Confirmed pattern with founder-doc precedent: Settings room §V keeps device-local UI prefs out of cloud sync.

### Cross-room readers (other rooms own these keys)

- **`gtmos_deal_workspaces`** (Deal Workspace) — read by `lib/execution-context.ts`. Step 5 cleanup will replace this with `data.deals.list({where: {workspace_id, account_name}})` when Deal Workspace hits Step 5. **No action in Signal Console's retrofit; wait for Deal Workspace.**
- **`gtmos_outbound_touches`** (Outbound Studio) — read by `lib/execution-context.ts`. Same pattern. **Wait for Outbound Studio Step 5.**
- **`gtmos_icp_analytics`** (ICP Studio) — read by `lib/icp-match.ts` to compute ICP match scores. Same pattern. **Wait for ICP Studio Step 5** (Tier 3, not blocking Phase B).

---

## Schema deltas Step 2 must ship

### Delta 1 — `signals` table with FK to `signal_console_accounts`

**Current shape:** Signals live inside `signal_console_accounts.data.signals[]` as a jsonb array.

**Problem:** generators want to query signals across accounts (e.g. "all accounts whose signals have all decayed past 14 days"). Against the jsonb array shape, this requires a recursive jsonb scan per account. Against a proper table with `account_id` FK + `published_date` indexed, it's one SQL filter.

**Proposed schema:**

```sql
create table public.signals (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.signal_console_accounts(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id(),
    signal_type text,
    headline text,
    source text,
    url text,
    published_date timestamptz,
    fetched_at timestamptz,
    captured_at timestamptz default now(),
    confidence numeric(3,2),       -- 0.00-1.00; gets +5 heat bonus when ≥ 0.9
    is_ai boolean default false,
    flagged boolean default false,
    note text,
    data jsonb default '{}'::jsonb, -- forward-compat blob for fields that come later
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index signals_account_id_idx on public.signals(account_id);
create index signals_workspace_id_idx on public.signals(workspace_id);
create index signals_published_date_idx on public.signals(published_date desc nulls last);
create index signals_flagged_idx on public.signals(flagged) where flagged = false;
-- ^ partial index — heat engine excludes flagged signals; most queries
-- want only un-flagged rows, so a partial index is more efficient.

-- Workspace-scoped RLS following the pattern from migration 0005.
-- Members of the workspace can read; service role writes; members can
-- update note/flagged (the operator-controlled fields).
alter table public.signals enable row level security;
create policy signals_select_workspace on public.signals for select using (
    public.is_workspace_member(workspace_id)
);
create policy signals_insert_workspace on public.signals for insert with check (
    public.is_workspace_member(workspace_id)
);
create policy signals_update_workspace on public.signals for update using (
    public.is_workspace_member(workspace_id)
) with check (
    public.is_workspace_member(workspace_id)
);
create policy signals_delete_workspace on public.signals for delete using (
    public.is_workspace_member(workspace_id)
);

alter publication supabase_realtime add table public.signals;
```

**Bridge updates** (Step 2 follow-up in `lib/sc-bridge.ts`):
- `rowToAccount` continues to read `data.signals[]` for legacy rows (back-compat)
- New helper `loadSignalsForAccount(accountId)` reads from the signals table when present
- `accountToInsert/Update` continues to write `data.signals[]` for back-compat during Step 3 dual-write
- A new `saveSignal(accountId, signal)` path lands signals in the table
- Step 5 deletes the `data.signals[]` jsonb path and all rows are inserted into the table

### Delta 2 — `signal_console_accounts.heat` becomes informational

**Current state:** `heat` is a `number` column on the table. The in-memory engine recomputes heat from the signals every render — the column is a stale snapshot at-time-of-last-save.

**Problem:** drift. The column shows whatever heat was when the account was last saved. The in-memory value is the true-now value. Generators reading from the column see stale heat.

**Proposed:** keep the column (back-compat for any external SQL consumers), but annotate it as informational/snapshot-only in canon. Add a comment to the column. Add a `heat_computed_at` companion column so consumers know when the snapshot was last refreshed.

```sql
-- Optional additive
alter table public.signal_console_accounts add column if not exists heat_computed_at timestamptz;
comment on column public.signal_console_accounts.heat is
    'Snapshot value at last save. Authoritative heat is computed in-memory from the signals table (see src/signal-console/lib/heat.ts). Heat-decay generators should query signals.published_date directly, not this column.';
```

Step 3 dual-write updates `heat_computed_at = now()` each save. Step 5 might eventually drop the `heat` column entirely (post-4.5 cleanup), but in scope: just annotate.

### Delta 3 — RLS policies on `signal_console_accounts` for member writes

**Current state:** I haven't read every existing policy line, but the migration 0005 pattern (workspace-scoped RLS) should apply. Step 2 verifies + adjusts policies if needed.

### Delta 4 — no schema change for `gtmos_signal_room_health`

The health snapshot is computed-on-the-fly, not stored. After Dashboard Step 5, the consumer reads `data.signalConsoleAccounts.list()` + computes its own snapshot. No new table needed.

---

## Existing partial cloud-sync (PR #43 from 2026-05-01)

PR #43 shipped a "best-effort cloud sync" wave for Signal Console as part of the 2026-05-01 cloud-sync gap-closer. What's already there:

1. **`src/signal-console/lib/cloud-persistence.ts`** — full boot-time path:
   - `bootCloudPersistence(client)` decides cloud-canonical vs first-sync-migrate vs offline-fallback
   - `saveAccount(account)` does cloud insert/update via `data.signalConsoleAccounts`
   - `deleteAccountInCloud(id)` does cloud delete (called from state.ts removal path? — to verify)
   - `subscribeRealtime(client)` wires postgres_changes subscription with workspace-scoped delivery via RLS
   - `applyRealtimePayload(payload)` — pure function for cross-tab realtime mutations

2. **`src/signal-console/lib/sc-bridge.ts`** — the row-to-Account translation layer (Account ↔ row):
   - `rowToAccount` / `rowsToAccounts` — read path
   - `accountToInsert` / `accountToUpdate` — write paths
   - `looksLikePersistedId` — uuid-vs-legacy detection (legacy "acc_…" ids vs Supabase uuids)
   - `accountKeyFromName` — slug derivation for `account_key` column
   - `extractDataBlob` — packs hq/employees/focus/tier/approach/persona/notes/signals[] into the data jsonb

3. **Caller integration:**
   - `main.tsx` calls `bootCloudPersistence` async-after-first-paint (doesn't block render)
   - `AddAccountForm.tsx` calls `saveAccount` on submit
   - `startExternalPublishing` in `state.ts` keeps writing localStorage for legacy consumers

**Per ADR-005 §"Approval" resolution 4:** PR #43's partial dual-write **does NOT count as Step 3 done.** The retrofit lifecycle requires a fresh, complete dual-write pass covering every mutation. Step 3 of Signal Console's retrofit will:
- Audit every mutation site (already done in this doc — see "Missing write paths" above)
- Layer Supabase writes onto every site that doesn't yet have one
- The PR #43 code paths are kept until Step 5, then retired

The clarity benefit of the rewrite outweighs the ~1 PR cost of re-doing what PR #43 partially did. Mixed code paths (PR #43 patterns + ADR-005 patterns) would be harder to reason about and harder to test.

---

## Mutation site inventory (Step 3 prep)

Every place in `src/signal-console/` that mutates state and needs a corresponding cloud write. Order matches the Step 3 PR plan.

| # | Site | Mutation | Cloud path today | Step 3 owes |
|---|---|---|---|---|
| 1 | `AddAccountForm.tsx` line 81 | Insert new account | ✅ `saveAccount()` calls `data.signalConsoleAccounts.insert` | Nothing — already wired |
| 2 | `state.ts:upsertAccount(account)` | Update existing or add | ❌ localStorage only | Wire `saveAccount(account)` → cloud upsert |
| 3 | `state.ts:removeAccount(id)` | Delete | ❌ localStorage only | Wire `deleteAccountInCloud(id)` from cloud-persistence (exists, not called) |
| 4 | `state.ts:setAllAccounts(...)` | Bulk replace (rare; used in boot + import flows) | ❌ localStorage only | Decide: cloud bulk-insert OR refuse (this is a destructive op) |
| 5 | Signal additions (currently only via `data.signals[]` mutation through `upsertAccount`) | Add signal to account | ❌ localStorage only | Cleanest path: write to new `signals` table (Delta 1) directly, not as part of the account's data blob |
| 6 | Heat recomputes | Update `signal_console_accounts.heat` snapshot | ❌ localStorage only (and not really needed — see Delta 2) | Optional: write `heat` + `heat_computed_at` on save |
| 7 | Enrichment results (enrich-all flow) | Add new signals + enriched account fields | ❌ legacy room is currently the only path; new room doesn't have it wired | **IN SCOPE.** Wire the enrich-all flow into the new room as part of Step 3. Enrichment results write signals to the new `signals` table (Delta 1) and update account fields (last_enriched_at, ticker, domain, etc.) via `data.signalConsoleAccounts.update`. The external enrichment service itself stays where it is (`enrichment-server/`); only the persistence path changes. |

---

## Step ordering recommendation

Refining the ADR-005 5-step lifecycle for Signal Console specifically, plus a prerequisite workflow-hardening PR per founder direction:

### Step 0 — Workflow hardening (separate PR, lands before Step 2)
**Why this is now its own PR:** PR #137 verification surfaced four real bugs in `data-parity-ci.yml` that we patched on a throwaway branch. Those fixes weren't merged to main. The first retrofit PR to land a real migration (Step 2 below) would re-discover all of them. Better to land the resilience fixes once, on their own focused PR, and have Step 2 be the first PR that exercises a *working* workflow.

**Scope:**
- Carry forward from the test-branch fixes (preserved in this session's history):
  - `data-parity-ci.yml`: accept `MIGRATIONS_FAILED` as a "proceed past polling" state (with workflow-level warning)
  - `data-parity-ci.yml`: connection-details extraction is non-fatal — emit `::warning::` listing which fields are missing, continue
  - `data-parity-ci.yml`: Apply migrations step is a documented no-op with three candidate paths called out in inline comments (link-with-password / db-url / Management API)
  - `supabase/migrations/20260519180002_heartbeat_schedule.sql`: wrap `create extension pg_cron / pg_net` in `DO ... EXCEPTION` blocks that catch `insufficient_privilege` / `feature_not_supported` and emit a notice instead of failing (preview branches lack superuser)

**Not in scope (deferred to Signal Console Step 2 when it's actually needed):**
- Solving the "how do we actually apply migrations to a branch" problem. Step 2 picks one of the three candidate paths and ships it.

**Estimated PR size:** small (workflow YAML + one migration file edit + commit).

### Step 1 — Audit (this doc)
**Status:** approved 2026-05-21. PR-only doc deliverable.

### Step 2 — Schema additions
**Scope:**
- New migration `<timestamp>_signal_console_signals_table.sql` adding the `signals` table + indexes + RLS policies + realtime publication (per Delta 1)
- Optional companion column `heat_computed_at` on `signal_console_accounts` with comment annotation (per Delta 2)
- New view `signals_with_account` joining account context inline (per "deliberately doesn't decide" §3 — approved)
- Regenerate `src/lib/database.types.ts` via `supabase gen types typescript --linked > src/lib/database.types.ts` (machine-generated only per ADR-005 resolution 2)
- Update `lib/sc-bridge.ts` to handle the new `signals` table shape (back-compat reads from data.signals[] AND new table; writes still go to data.signals[] during Step 3 dual-write)
- This PR is the first one that actually exercises the data-parity workflow end-to-end with real schema changes. With Step 0 already landed, this PR's workflow run should green out at the new "MIGRATIONS_FAILED accepted + Apply migrations no-op" state and the founder confirms the workflow is now durable.
- Decide and ship the actual Apply migrations strategy (one of the three candidate paths from Step 0's comment block). Most likely: pass `DB_URL_PASSWORD` as a GitHub Actions secret + run `supabase link --project-ref <branch_ref> --password $DB_URL_PASSWORD` before `db push --linked --yes`.

**Estimated PR size:** medium (migration + schema-types regen + bridge update + 3-5 tests + Apply migrations strategy).

### Step 3 — Dual-write
**Scope:**
- Layer cloud writes onto every mutation site in the inventory above:
  - Site 2 (state.ts `upsertAccount`) → `data.signalConsoleAccounts` upsert
  - Site 3 (state.ts `removeAccount`) → call `deleteAccountInCloud` (already exists in cloud-persistence.ts, just not wired)
  - Site 4 (state.ts `setAllAccounts`) → decision point (cloud bulk-insert OR refuse; see audit "Mutation site inventory")
  - Site 5 (signal additions) → `data.signals.insert` to the new table from Step 2 Delta 1
  - Site 7 (**enrich-all flow**) → folded in per founder direction: wire enrich-all results into the new room, write enriched signals to `data.signals.insert` + account fields via `data.signalConsoleAccounts.update`. The external enrichment service (`enrichment-server/`) stays as-is; only the persistence destination changes.
- Feature flag `signal_console_data_parity_write` from `data-parity-flags.ts` registry gates the new write path
- New tests assert that every localStorage write also produces a `data.signalConsoleAccounts.*` or `data.signals.*` call
- Health snapshot publishing continues to write to `gtmos_signal_room_health` (Dashboard Step 5 retires this)

**Estimated PR size:** medium-large (enrich-all wiring adds material complexity vs. a bare retrofit).

### Step 4 — Flip-read
**Scope:**
- Boot reads from Supabase first (already done by `bootCloudPersistence`)
- Realtime subscriptions wired for both `signal_console_accounts` and the new `signals` table
- Feature flag `signal_console_data_parity_read` gates the new read path
- Playwright walk tagged `@realtime`: mutate in tab A, assert mutation visible in tab B within 5 seconds
- localStorage stays as offline fallback

**Estimated PR size:** small.

### Step 5 — Drop legacy
**Scope:**
- localStorage writes removed (`saveAccounts` from `lib/persistence.ts` retires; `loadAccounts` stays only as offline-fallback recovery for users with no cloud data)
- `cloud-persistence.ts` keeps its name but is no longer "cloud" — it's the only persistence
- Coordinate with Dashboard Step 5 to retire `gtmos_signal_room_health` (or land Signal Console's Step 5 first and have Dashboard's snapshot-aggregator gracefully tolerate the key going away)
- Both retrofit flags retired from Posthog
- Update `data-parity-flags.ts` registry to mark Signal Console at parity
- Retire `gtmos_sc_v4` mapping from the data-migration tool's per-noun mappers (per "deliberately doesn't decide" §4 — approved)

**Estimated PR size:** small.

**Total estimated retrofit:** ~6 PRs over ~2-3 weeks of founder-paced shipping (Step 0 + 5 steps; enrich-all wiring in Step 3 adds material complexity vs. the original ~5-PR / 2-week estimate). PR #43's prior work still shaves ~2-3 days off vs. starting greenfield.

---

## What this audit deliberately doesn't decide

The following are intentionally left for the founder to confirm before Step 2 lands, not for Step 1 to assume:

1. **Whether to make `heat` a generated column** (Postgres `generated always as`) reading from a computed expression. The trade-off: simpler client code at the cost of moving heat-formula coupling into Postgres. My recommendation: NO — keep heat in `lib/heat.ts` where it can evolve with the product. The Delta 2 annotation handles drift documentation.

2. **Whether the `signals` table needs an `archive` column** for soft-delete vs hard-delete on signal dismissal. Currently dismissal flips `flagged: true` and the heat engine excludes those signals. Hard delete loses operator-flagged history. Soft delete is more conservative. My recommendation: keep `flagged` as-is; no separate archive column.

3. **Whether to compose a `signals_with_account` view** in Postgres so generator queries (e.g. signal-decay) join account context inline. My recommendation: YES, ship the view as part of Step 2 because the signal-decay generator's first read against `signals` will want `account_name` and `workspace_id` together. Keeps the generator code simple.

4. **Whether Step 5 also retires the `gtmos_sc_v4` key from the data-migration tool's `gtmos_*` mappings** (so demo workspaces never seed signal-console data from the migration blob). My recommendation: YES, but document as a Step 5 cleanup item.

These four questions need a sentence-each answer from the founder before Step 2 PR opens. If the recommendations look right, just say "all approved" and Step 2 starts.

---

## Approval

**Status:** Approved 2026-05-21.

### Resolutions on the four open questions

1. **"Deliberately doesn't decide" items.** All four recommendations approved as proposed:
   - Heat stays in `lib/heat.ts` (no Postgres generated column).
   - `signals` table uses `flagged: boolean` for soft dismissal (no separate archive column).
   - Ship `signals_with_account` Postgres view as part of Step 2 so generators query joined context inline.
   - Retire `gtmos_sc_v4` from the data-migration tool's `gtmos_*` mappings during Step 5 cleanup.

2. **Workflow hardening location.** Separate PR (Step 0 above) lands BEFORE Step 2. Resilience fixes get their own focused PR; Step 2 inherits a working workflow and only has to solve the still-open "actually apply migrations" question.

3. **`signals` table at scale.** Confirmed fine within the Supabase Pro tier budget. Proceed.

4. **`enrich-all` migration.** Folded into Signal Console's per-room retrofit (Step 3), NOT a separate future ADR. Enrich-all wiring lands when Step 3's cloud writes ship, with enrichment results writing signals to the new `signals` table from Step 2. The external enrichment service (`enrichment-server/`) stays where it is; only the persistence destination changes.

### Founder approval block

- Date approved: 2026-05-21
- Conditions / amendments: none beyond the four resolutions above
- Signed: founder (mrcoe7@gmail.com)

---

Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
Ref: src/signal-console/lib/cloud-persistence.ts (PR #43 existing partial dual-write)
Ref: src/signal-console/lib/sc-bridge.ts (existing row↔Account bridge)
Ref: src/lib/database.types.ts (existing signal_console_accounts schema)
Ref: CLAUDE.md Part I §4.7 (Signal Console mind protections)
