> ⚠️ **CORRECTION (2026-05-29):** This audit was written against a stale canon row and is **largely redundant**. Deal Workspace was built **cloud-native as Phase 4 Room 1** (PR #8, 2026-04-25): `data.deals` reads/writes + realtime + `mirrorToLegacyStorage`. It never needed a greenfield ADR-005 Step 1/2 retrofit for its core deals data. Only the Step-5 mirror-drop genuinely remains (gated on cross-room consumers migrating). The `deals.recovery_rank` column + `deal_workspace_health_snapshot()` RPC added in #206 are net-new, additive, and **unwired**. Full root-cause + catalog: `deliverables/adr/adr-008-orchestration-doctrine-2026-05-29.md` §"Correction note." Kept for the audit trail; do not act on it as a live plan.

# Data parity audit — Deal Workspace

**Phase 4.5 Checkpoint 2 / Step 1**
**Per ADR-005 §"The 5-step per-room retrofit lifecycle"**
**2026-05-29**

Deal Workspace is the second room in the Tier 1 retrofit trio
(Signal Console → Deal Workspace → Outbound Studio). Per the
Tier 1 ordering rule documented in Signal Console's audit, Deal
Workspace's Step 4 must land BEFORE Signal Console's Step 4
because Signal Console reads `gtmos_deal_workspaces` for its
execution-context temperature ladder.

---

## 1. Inventory of `gtmos_*` keys in `src/deal-workspace/`

| Key | Source(s) | Write side | Read side | Current state |
|---|---|---|---|---|
| `gtmos_deal_workspaces` | `lib/legacy-mirror.ts` (writes) + `lib/persistence.ts` (reads + writes) | `persistence.ts` writes via `data.deals.*` accessor (cloud canonical) + `legacy-mirror.ts` also writes the localStorage shape for downstream consumers (Signal Console + Future Autopsy) | Boot reads cloud first; localStorage is a migration-source fallback when cloud returns empty | **Dual-shape today** — cloud is canonical, localStorage is a write-only legacy mirror for unmigrated cross-room consumers. Mirror retires when Signal Console's Step 5 lands. |
| `gtmos_deal_workspace_health` | `lib/health-snapshot.ts` | Written on every deal mutation as a snapshot for cross-room readers (Dashboard's command-intelligence rail reads this for its risk cards) | Dashboard reads; Deal Workspace itself does not | **localStorage only.** Same shape as the Signal Console health snapshot situation (PR #203's §3.2). Graduates to a Postgres function returning jsonb. |
| `gtmos_signal_room_health` | NOT written by Deal Workspace | READ-ONLY cross-room from Signal Console | Wired for any future need that pulls Signal Console heat into Deal Workspace risk math | **Read-only cross-room.** Flips when Signal Console's Step 4 lands (Tier 1 internal sequencing). Currently no Deal Workspace consumer pulls this — the dependency is forward-compatible. |

---

## 2. Mapping localStorage keys to `data.<noun>.*` accessors

| `gtmos_*` key | Target accessor | Status |
|---|---|---|
| `gtmos_deal_workspaces` (deals) | `data.deals.*` | **Exists.** Boot loads + writes through it; realtime subscribed via `data.deals.subscribe`. legacy-mirror.ts writes the localStorage shape too — retires at Step 5 once cross-room consumers (Signal Console + Future Autopsy) have migrated. |
| `gtmos_deal_workspace_health` | (new) `deal_workspace_health_snapshot()` RPC | **Missing.** Same shape as Signal Console's `signal_console_health_snapshot()` from PR #203. Postgres function returning jsonb that aggregates per-workspace deal metrics (active deals, pipeline value, top 5 by recovery-rank, lane counts). |

---

## 3. Schema deltas (Step 2 input)

One concrete addition for the Step 2 migration:

### 3.1 New SQL function `deal_workspace_health_snapshot(p_workspace_id uuid default null)`

Returns jsonb matching the `DealWorkspaceHealthSnapshot` shape from `src/deal-workspace/lib/health-snapshot.ts`:

```
{
  capturedAt: timestamptz,
  workspaceId: uuid,
  activeCount: integer,        -- deals with stage NOT IN ('closed_won','closed_lost')
  wonCount: integer,
  lostCount: integer,
  pipelineValue: numeric,      -- sum of value across active deals
  laneCounts: {
    critical: integer,         -- recovery rank ≥ 70
    at_risk: integer,          -- recovery rank 40-69
    healthy: integer           -- recovery rank < 40
  },
  topPressure: [
    {
      id: uuid,
      account_name: text,
      stage: text,
      value: numeric,
      recovery_rank: integer,
      cause: text
    }
    -- top 5 by recovery_rank desc
  ]
}
```

The recovery-rank math mirrors `src/deal-workspace/lib/recovery.ts` (staleness + next-step pressure + close-date pressure). To compute server-side I'd need to either (a) port the math to PL/pgSQL, or (b) cache the `recovery_rank` column on every deal row update.

**Recommendation:** (b) cache the column. Lower complexity, adds one nullable int column to `deals`, the JS write-path computes it on every save. Defensive default of 0 so unset rows sort to the bottom. Step 3 (dual-write) gets the column populated.

So actually **two** schema deltas:

### 3.1a New column `deals.recovery_rank integer not null default 0`
Cached recovery rank. Written by the JS save-path on every mutation.

### 3.1b New SQL function `deal_workspace_health_snapshot(uuid)`
Reads from the cached column. SECURITY INVOKER so RLS scopes.

### 3.2 No-op for `profiles.ui_preferences`
No UI-dismissal state in Deal Workspace today; nothing to graduate. Documented for completeness.

---

## 4. Cross-room handoff dependencies

| Reads | Currently from | Switches to |
|---|---|---|
| `data.signals.*` indirectly (heat readings) | `gtmos_signal_room_health` localStorage | When Signal Console Step 4 lands. Deal Workspace doesn't pull this today but the wiring exists for future risk-math features. |

**Writes consumed by other rooms:**
- Signal Console reads `gtmos_deal_workspaces` for its execution-context temperature ladder. **Deal Workspace's Step 4 must land before Signal Console's Step 4.**
- Future Autopsy reads `gtmos_deal_workspaces` for deal lookup. Future Autopsy is Tier 2-4 (not yet retrofitted), so the legacy-mirror in Deal Workspace stays until Future Autopsy's own Step 5.

This means Deal Workspace's Step 5 (drop legacy-mirror) waits until BOTH Signal Console + Future Autopsy have hit their Step 5. The Tier 1 trio's Step 5 dependency chain is:
1. Deal Workspace + Outbound Studio Step 5 in parallel (their consumers have all migrated)
2. Signal Console Step 5 (after Deal Workspace + Outbound Studio Step 5)
3. Future Autopsy and other Tier 2-4 rooms can then drop their reads of gtmos_deal_workspaces

---

## 5. Existing test coverage

These tests existed pre-retrofit and the retrofit must keep them green:

- `lib/persistence.test.ts` — cloud persistence + realtime
- `lib/legacy-mirror.test.ts` — localStorage mirror write
- `lib/health-snapshot.test.ts` — health snapshot shape
- `lib/deal-bridge.test.ts` — row ↔ Deal coercion
- `lib/handoff.test.ts` — cross-room hrefs
- `lib/export-csv.ts` consumer — CSV export

Step 4's new test: a Playwright walk asserting a mutation in tab A propagates to tab B via realtime within 5 seconds. The data-parity-ci workflow handles the Supabase branch + RLS scope.

---

## 6. Feature flags introduced

| Flag | Step | Purpose | Retired at |
|---|---|---|---|
| `deal_workspace_data_parity_write` | Step 3 | Gates the dual-write of `recovery_rank` + the new RPC call. Default off; founder enables for own account first. | Step 5 |
| `deal_workspace_data_parity_read` | Step 4 | Gates the flip-read for cross-room consumers (Dashboard's risk cards switch from `gtmos_deal_workspace_health` to the RPC). Default off. Stable 14 days before Step 5. | Step 5 |

Both flags need to land in `data-parity-flags.ts`.

---

## 7. Step 2 PR scope (next)

Single migration file `supabase/migrations/<timestamp>_deal_workspace_data_parity.sql`:

1. `alter table deals add column recovery_rank integer not null default 0`
2. `create function deal_workspace_health_snapshot(uuid) ...`
3. Front-end: extend `src/lib/database.types.ts` for both

Estimated lines: ~120 SQL + ~30 types. Tight.
