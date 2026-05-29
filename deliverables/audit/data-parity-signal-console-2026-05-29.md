# Data parity audit — Signal Console

**Phase 4.5 Checkpoint 2 / Step 1**
**Per ADR-005 §"The 5-step per-room retrofit lifecycle"**
**2026-05-29**

Signal Console is the first room in the Tier 1 retrofit trio (Signal
Console → Deal Workspace → Outbound Studio). Phase B unblocks once
all three hit Step 5.

This audit catalogs what's already cloud-resident (via the PR #43 +
#44 gap-closer work + the May 2026 cloud-persistence layer) and what
still lives in localStorage. Step 2 (schema additions) graduates
from this list.

---

## 1. Inventory of `gtmos_*` keys in `src/signal-console/`

| Key | Source(s) | Write side | Read side | Current state |
|---|---|---|---|---|
| `gtmos_sc_v4` | `lib/persistence.ts` | Wave 4 wrote here; cloud-persistence layer writes here too via `setAllAccounts`-driven persist effect | Boot reads this on cold start as fallback when cloud returns empty | **Dual-shape today** — cloud is canonical, localStorage is a migration-source fallback. Retires at Step 5. |
| `gtmos_signal_room_health` | `lib/health-snapshot.ts` | Written on every account/signal mutation as a snapshot for cross-room readers (Dashboard's command-intelligence rail) | Dashboard reads this; not read by Signal Console itself | **localStorage only.** Cross-room health snapshots haven't yet migrated to a cloud table. Needs a new `signal_console_health_snapshots` table or a view aggregating from accounts + signals at query time. |
| `gtmos_enrichment_base_url` | `lib/enrichment.ts` | Operator-set override for the enrichment service URL (developer setting, not user-facing) | Enrichment client reads it before falling back to env default | **localStorage only.** Operator override — fits the `workspace_profile` table or a new `user_settings` row better. Retire at Step 5 with a workspace-level config column. |
| `gtmos_sc_heat_bands_dismissed` | `components/HeatLegend.tsx` (or similar) | Set when operator dismisses the heat-bands legend | Read on each render to decide whether to show the legend | **Per-user UI dismissal.** Belongs in `profiles.ui_preferences` jsonb (existing column) rather than localStorage. Retire at Step 5. |
| `gtmos_icp_analytics` | `lib/icp-match.ts` | NOT written by Signal Console — read-only ingest from ICP Studio | Read on boot to compute ICP-match overlays per account | **Read-only cross-room.** ICP Studio's own ADR-005 retrofit (a later tier) puts ICP analytics in `icps` table. Signal Console's read flips when ICP Studio hits Step 4. Not in scope here. |
| `gtmos_deal_workspaces` | `lib/execution-context.ts` | NOT written by Signal Console — read-only cross-room | Read on boot + on storage events to compute per-account execution-context temperature (ice_cold / cool / warm / hot) | **Read-only cross-room.** Flips when Deal Workspace (next room in Tier 1) hits Step 4. Tier 1 ordering matters here — Signal Console's Step 4 should NOT flip until Deal Workspace's Step 4 has merged, so the execution-context loader has a real source to read. |
| `gtmos_outbound_touches` | `lib/execution-context.ts` | NOT written by Signal Console — read-only cross-room | Same temperature computation; touches drive the `cool` band | **Read-only cross-room.** Flips when Outbound Studio (third Tier 1 room) hits Step 4. |

---

## 2. Mapping localStorage keys to `data.<noun>.*` accessors

| `gtmos_*` key | Target accessor | Status |
|---|---|---|
| `gtmos_sc_v4` (accounts) | `data.signal_console_accounts.*` | **Exists.** Boot loads + writes through it. Realtime subscribed. |
| `gtmos_sc_v4` (signals embedded in accounts) | `data.signals.*` | **Exists.** Separate table per migration `20260522120000`. Boot rehydrates account.signals[] from joined query. |
| `gtmos_signal_room_health` | (new) `data.signal_console_health_snapshots.*` OR a view | **Missing.** Two options: (a) a new write-only snapshot table the room appends to on every state change; (b) a Postgres view that computes the snapshot at query time from accounts + signals. **(b) is cleaner** — no write traffic, always fresh, no staleness window — and ADR-005's "FKs where references are real" principle prefers no new owned data. |
| `gtmos_enrichment_base_url` | `data.workspaces.*` extension OR `data.profiles.*` extension | **Missing.** Workspace-level config more accurate than per-user (the URL is a property of the workspace's enrichment service deployment, not the operator). Extend `workspaces` with a `gtm_config` jsonb column. |
| `gtmos_sc_heat_bands_dismissed` | `profiles.ui_preferences` jsonb (existing column) | **No-op migration.** Just write/read the existing column key. Schema unchanged. |

---

## 3. Schema deltas (Step 2 input)

Three concrete additions for the Step 2 migration:

### 3.1 New view `signal_console_health_snapshot`
Replaces the `gtmos_signal_room_health` write. Aggregates per-workspace:
- Total active accounts
- Hottest 5 accounts (id, name, heat, signal count, high-confidence count)
- Active signal count last 7 days
- Per-band counts (Hot / Active / Watch / Low)
- `motion_ready_posture`: true when top account heat ≥ 75

`security_invoker=true` so authenticated readers see only their workspace. Service-role reads see all (heartbeat / Dashboard generator path).

### 3.2 New column `workspaces.gtm_config jsonb`
Workspace-level configuration jsonb. `gtm_config.enrichment_base_url` replaces the per-user-localStorage override. Other rooms can add their config keys to the same column over Phase 4.5 lifecycle.

### 3.3 No-op for `profiles.ui_preferences`
Already exists. `ui_preferences.signal_console.heat_bands_dismissed: boolean` replaces `gtmos_sc_heat_bands_dismissed`. Schema unchanged; just a new key under existing jsonb.

---

## 4. Cross-room handoff dependencies

The audit catches these to inform the Tier 1 ordering rule:

| Reads | Currently from | Switches to |
|---|---|---|
| `data.deals.*` (Deal Workspace data) | `gtmos_deal_workspaces` localStorage | When Deal Workspace's Step 4 merges |
| `data.outbound_touches.*` (Outbound Studio data) | `gtmos_outbound_touches` localStorage | When Outbound Studio's Step 4 merges |
| `icps` (ICP Studio data) | `gtmos_icp_analytics` localStorage | When ICP Studio's Step 4 merges (Tier 2-4 later) |

**Tier 1 ordering rule reinforced:** Signal Console's Step 4 (flip-read) should land AFTER Deal Workspace + Outbound Studio's Step 4 have merged, so the execution-context loader has cloud sources to read. Sequencing within Tier 1:

1. Deal Workspace Step 1 → 4
2. Outbound Studio Step 1 → 4
3. Signal Console Step 1 → 4 (Signal Console's Step 5 + the other two's Step 5 happen in parallel)

This audit ships first because Signal Console is the cross-room hub; its complete read/write surface drives the schema for the other two rooms. Cataloging it first prevents back-and-forth on Tier 1's shape.

---

## 5. Tests already in place (existing test coverage maps)

These tests existed pre-retrofit and the retrofit must keep them green:

- `lib/persistence.test.ts` — localStorage round-trip
- `lib/cloud-persistence.test.ts` — Supabase + realtime + first-sync migration
- `lib/health-snapshot.test.ts` — `gtmos_signal_room_health` write shape
- `lib/heat.test.ts` — heat engine (no I/O)
- `lib/execution-context.test.ts` — cross-room temperature ladder
- `lib/icp-match.ts` (consumer) — ICP overlay
- `lib/sc-bridge.test.ts` — row ↔ Account coercion
- `lib/signals-bridge.test.ts` — row ↔ Signal coercion

Step 4's new test: a Playwright walk asserting a mutation in tab A propagates to tab B via realtime within 5 seconds. The data-parity-ci workflow handles the ephemeral Supabase branch + RLS scope.

Step 5's new test: room renders in a fresh browser with no localStorage seed, populated from Supabase only.

---

## 6. Feature flags introduced by this retrofit

| Flag | Step | Purpose | Retired at |
|---|---|---|---|
| `signal_console_data_parity_write` | Step 3 | Gates the dual-write path. Default off; founder enables for own account first, then widens once cloud-sync errors are absent for 7+ days. | Step 5 |
| `signal_console_data_parity_read` | Step 4 | Gates the flip-read path. Default off. Stable for 14 days before Step 5 per ADR-005. | Step 5 |

Both flags need to land in the `data-parity-flags.ts` registry (`src/lib/data-parity-flags.ts` from the Checkpoint 1 setup).

---

## 7. What this audit does NOT decide

- The exact Posthog rollout schedule for the two flags (founder decides per ADR-005 §"Feature-flag model").
- Whether the `gtm_config` jsonb on `workspaces` should be its own column or stuffed into an existing `data` blob. **Recommendation:** dedicated column for queryability + Postgres-side defaults; the existing `data` blob is a catch-all and would force per-key parsing.
- Whether `signal_console_health_snapshot` should be a view or a materialized view. **Recommendation:** plain view first; promote to materialized only if queries get slow at production scale (10K+ accounts/workspace). Today's volume doesn't justify the refresh cost.

---

## 8. Step 2 PR scope (next)

Single migration file `supabase/migrations/<timestamp>_signal_console_data_parity.sql`:

1. `alter table workspaces add column gtm_config jsonb not null default '{}'`
2. `create view signal_console_health_snapshot ...` (security_invoker=true; grant select)
3. Front-end: extend `src/lib/database.types.ts` (hand-edit for the view; the column is regen-friendly but I'll hand-edit too since I can't run `supabase gen types` from the sandbox)

No new tables. No FK changes. Additive only.

Estimated lines: ~80 SQL + ~40 types. Tight.
