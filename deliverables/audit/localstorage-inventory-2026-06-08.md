# localStorage inventory audit — ADR-005 Phase 4.5 retrofit gate

**Status:** RECEIVED from background-task agent transcript. Findings adopted; punch list folded into the Dashboard pre-build sequence (deployment scoping doc Part IX).
**Date:** 2026-06-08 (audit run; transcript captured 2026-06-12).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Provenance:** This is the output of a long-running background-task Agent the founder spawned in an earlier session ("localStorage inventory audit," Agent type, ~13.6 days elapsed when the founder captured the transcript on 2026-06-12). The Agent inventoried every `gtmos_*` localStorage key across the repo, mapped writers/readers/snapshot dependencies, and flagged the orphans. Captured here verbatim so the work is not lost when the background task is closed.
**Why this lives in `deliverables/audit/`:** the findings affect the pre-Dashboard build sequence (the deployment scoping doc's Part IX execution order). Keeping the full audit alongside the design-system deliverables means a future session inherits the punch list, not just the summary.

---

## 0. The headline

**localStorage is still the canonical connective tissue between rooms** — 16 rooms write 13 sacred-noun keys, 4 snapshot keys are the cross-room communication mechanism, and the Supabase tables exist but are not yet the authoritative reads. ADR-005's Step-3 dual-write retrofit has only landed on Signal Console (Step 5 complete 2026-05-23); every other room is at Step 0.

**Five concrete consequences** the new Dashboard inherits if nothing is fixed first:

1. **16 rooms haven't started the per-room dual-write migration** ADR-005 specified.
2. **The snapshot pattern is broken in three ways** — two snapshots are orphaned (writer/reader), one is never written to localStorage, one is dual-write but the localStorage writer is missing.
3. **The demo-seed pipeline has a 4-key gap** — the Dashboard's command engine reads four snapshot keys that aren't seeded, so until each producing room boots and publishes, the Dashboard reads empty/stale state.
4. **`gtmos_activation_context`** is read by Onboarding and Welcome but never written in active code — likely migrated to cloud without a localStorage cleanup pass.
5. **Real ordering risk:** if Deal Workspace, Signal Console, or Quota Workback doesn't boot before the Dashboard bootstrap, the Dashboard's summaries render stale or empty.

---

## 1. Inventory — all `gtmos_*` keys in active use

Total unique keys: **55** (excluding test-only keys like `gtmos_a`, `gtmos_b`).

### 1.1 Sacred-noun data (13 keys)

| Key | Purpose | Writers | Readers | Retrofit status | Supabase table |
|---|---|---|---|---|---|
| `gtmos_icp_analytics` | ICP Studio artifact | ICP Studio | ICP Studio, Welcome, Onboarding (loader) | localStorage-canonical | `icps` |
| `gtmos_deal_workspaces` | Deal Workspace array | Deal Workspace | Deal Workspace, Dashboard (readiness-agg), Founding GTM (cross-room), Quota Workback (coverage), Negotiation, Signal Console (exec-ctx) | localStorage-canonical | `deals` |
| `gtmos_sc_v4` | Signal Console accounts | Signal Console | Signal Console, Dashboard (readiness-agg), Onboarding (loader), Welcome (loader) | **Cloud-canonical (Step 5: 2026-05-23)** | `signal_console_accounts` |
| `gtmos_outbound_touches` | Sequence touches array | Outbound Studio | Outbound Studio, Dashboard (readiness-agg), Founding GTM, Signal Console (exec-ctx), Welcome (loader) | localStorage-canonical | `sequences` |
| `gtmos_linkedin_log` | LinkedIn Playbook log | LinkedIn Playbook | LinkedIn Playbook, Dashboard (readiness-agg), Onboarding (loader), Welcome (loader) | localStorage-canonical | `sequences` |
| `gtmos_outbound_seed` | Seed plan for QW | Onboarding, Quota Workback | Quota Workback (`persistence.loadInputs`, L39), Founding GTM (cross-room) | localStorage-canonical | `sequences` |
| `gtmos_discovery_stats` | Call counts + advanced calls | Call Planner, Discovery Studio | Call Planner (state.test, L356), Dashboard (readiness-agg), Cold Call Studio (state.test, L252), Onboarding (loader) | localStorage-canonical | `discovery_call_logs` |
| `gtmos_discovery_agenda` | Discovery call plan | Call Planner, Discovery Studio | Call Planner (state.test, L347), Dashboard (readiness-agg), `js/supabase-config.js` L1557 | localStorage-canonical | `discovery_call_logs` |
| `gtmos_call_handoff` | Call handoff artifact | Call Planner | Call Planner (state.test, L348), Dashboard (readiness-agg) | localStorage-canonical | `discovery_call_logs` |
| `gtmos_cold_call_log` | Cold call log array | Cold Call Studio | Cold Call Studio, Dashboard (readiness-agg) | localStorage-canonical | `discovery_call_logs` |
| `gtmos_poc_data` | PoC Framework data | PoC Framework | PoC Framework, Dashboard (readiness-agg) | localStorage-canonical | `studio_artifacts` |
| `gtmos_autopsy_log_v1` | Future Autopsy log | Future Autopsy | Future Autopsy, Dashboard (readiness-agg), Founding GTM (cross-room) | localStorage-canonical | `studio_artifacts` |
| `gtmos_advisor_deployments` | Advisor Deploy registry | Advisor Deploy | Advisor Deploy, Dashboard (readiness-agg), Founding GTM (cross-room) | localStorage-canonical | `advisor_deployments` |

### 1.2 Snapshot / derived state (4 keys)

| Key | Purpose | Writers | Readers | Retrofit status | Supabase table |
|---|---|---|---|---|---|
| `gtmos_deal_workspace_health` | Deal health snapshot (5 top at-risk + counts) | Deal Workspace (`publishHealthSnapshot`) | Dashboard (`snapshot-aggregator.ts` L205), Readiness (via healthSummaries) | Dual-write (Phase 4 Room 1) | `deal_workspace_health_snapshot` |
| `gtmos_signal_room_health` | Signal room health (hot accounts) | Signal Console (`publishHealthSnapshot`) | Dashboard (L206), Readiness | Cloud-canonical (Step 5) | `signal_console_accounts.health` (migrated blob) |
| `gtmos_readiness_snapshot` | Readiness verdict + score | **ORPHANED READER — no writer found** | Dashboard (L207), Readiness Score (reads own output) | **Orphaned (readable but never written)** | `readiness_snapshots` |
| `gtmos_quota_targets` | Monthly/weekly/daily quota targets | Quota Workback (`saveOutputs`, L91) | Quota Workback (persistence.test, L149), Dashboard (L208), Founding GTM | localStorage-canonical | `pipeline_settings` |

### 1.3 Activation / onboarding (3 keys)

| Key | Writers | Readers | Status |
|---|---|---|---|
| `gtmos_activation_context` | **ORPHANED WRITER — no active `setItem` found** | Onboarding (`seed.ts` L100), Welcome (`loader.ts` L118) | **Orphaned (readers exist, no writer)** — no Supabase table yet |
| `gtmos_onboarding` | Onboarding, `js/supabase-config.js` L123 (reads only) | Onboarding, Analytics (`js/analytics.js` L123) | localStorage-canonical → `profiles` (already tracks) |
| `gtmos_onboarding_completed_at` | Onboarding (`main.tsx` L48) | Onboarding (`seed.ts` L258, reads for Signal health seeding) | localStorage-canonical → implicit in `profiles` |

### 1.4 Analytics / observability (5 keys)

`gtmos_ga4_measurement_id`, `gtmos_ga4_debug`, `gtmos_posthog_key`, `gtmos_posthog_host`, `gtmos_enrichment_base_url` — all UI preference / config, **not sacred data, not in Supabase**, safe to leave on localStorage.

### 1.5 Demo / QA flags (8 keys)

`gtmos_env_mode` (sessionStorage not localStorage), `gtmos_demo_scenario`, `gtmos_demo_seeded_at`, `gtmos_demo__*` (prefixed shadow values for demo mode) — **demo environment only, not canonical, not applicable to migration**.

### 1.6 Legacy / session / auth (4 keys)

| Key | Status |
|---|---|
| `gtmos_noauth_mode` | Deprecated (Wave 1); `removeItem` only on logout |
| `gtmos_noauth_email` | Deprecated (Wave 1); `removeItem` only on logout |
| `gtmos_product_category` | UI state / onboarding; not in Supabase |
| `gtmos_migrated_to_supabase_v1` | Legacy migration completion marker |

### 1.7 Others (14 keys, abbreviated)

`gtmos_readiness_last_verdict` (ORPHANED WRITER — reads imply Supabase table writes only), `gtmos_founding_gtm_health` (canonical; Dashboard reads), `gtmos_ta_accounts`, `gtmos_qw_inputs`, `gtmos_sw_prospects`, `gtmos_sw_query_cards`, `gtmos_ta_focuses`, `gtmos_ta_theses`, `gtmos_industries`, `gtmos_discovery_worked` (no active readers), `gtmos_playbook` / `gtmos_playbook_notes` (localStorage reads removed post-migration), `gtmos_cfo_worked_moves`, `gtmos_deal_links` / `gtmos_sw_persona_maps` (seeded only, no active readers), `gtmos_deal_stage_history` / `gtmos_deal_outcomes` / `gtmos_deal_room_health`, the 6 TA keys, the 4 Signal Console operational keys (`gtmos_sc_usage_v4`, `gtmos_sc_morning_v4`, `gtmos_sc_batches_v4`, `gtmos_sc_guide_v1` — cloud-canonical via Step 5), `gtmos_ta_signals` (no active readers), `gtmos_advisor_registry`, `gtmos_handoff_exported` (ORPHANED — no writer or reader found).

---

## 2. Retrofit status by room (ADR-005 step)

| Room | Sacred-noun key(s) | Step | Notes |
|---|---|---|---|
| Signal Console | `gtmos_sc_v4` + 4 ops keys | **Step 5** (cloud-canonical) | Migrated 2026-05-23; localStorage reads removed |
| Deal Workspace | `gtmos_deal_workspaces` | Step 0 | `deals` table scaffolded; no parity flag |
| Outbound Studio | `gtmos_outbound_touches`, `gtmos_outbound_seed` | Step 0 | `sequences` table scaffolded |
| Discovery Studio | `gtmos_discovery_agenda`, `gtmos_discovery_stats`, `gtmos_call_handoff` | Step 0 | `discovery_call_logs` scaffolded |
| ICP Studio | `gtmos_icp_analytics`, `gtmos_sw_prospects`, `gtmos_sw_query_cards` | Step 0 | `icps` scaffolded |
| LinkedIn Playbook | `gtmos_linkedin_log`, `gtmos_playbook*` | Step 0 | `sequences` + `studio_artifacts` scaffolded |
| Future Autopsy | `gtmos_autopsy_log_v1` | Step 0 | `studio_artifacts` scaffolded |
| Advisor Deploy | `gtmos_advisor_deployments` | Step 0 | `advisor_deployments` scaffolded |
| Territory Architect | 11 TA keys | Step 0 | `pipeline_settings` scaffolded |
| PoC Framework | `gtmos_poc_data` | Step 0 | `studio_artifacts` scaffolded |
| Quota Workback | `gtmos_qw_inputs`, `gtmos_quota_targets` | Step 0 | `pipeline_settings` scaffolded |
| Negotiation | `gtmos_cfo_worked_moves` | Step 0 | `proofs` scaffolded |
| Onboarding | `gtmos_onboarding`, `gtmos_activation_context`, `gtmos_onboarding_completed_at` | Step 0 | `gtmos_activation_context` orphaned |

**13 of 17 active rooms are at Step 0.** Only Signal Console has reached Step 5.

---

## 3. Cross-room snapshot dependencies (the connective-tissue graph)

The Dashboard's command engine reads **4 snapshot keys** on a 10-second interval loop (`snapshot-aggregator.ts`):

```
Dashboard (consumer) ← 10s intervals ← [4 snapshots from sibling rooms]
  ├─ gtmos_deal_workspace_health   ← Deal Workspace publishHealthSnapshot() [L130]
  ├─ gtmos_signal_room_health      ← Signal Console publishHealthSnapshot()
  ├─ gtmos_quota_targets           ← Quota Workback saveOutputs() [L91]
  └─ gtmos_readiness_snapshot      ← ORPHANED (no writer found)
```

The demo-seed pipeline does NOT write these 4 keys. New-user impact: Dashboard renders empty/stale until each producing room boots and publishes, in an order nothing guarantees.

**Additional consumers:**

- **Readiness Score** reads `gtmos_founding_gtm_health` (Founding GTM `section_ready` count).
- **Founding GTM** reads 9 sacred-noun keys for cross-room context aggregation (`readiness-agg.ts`, `cross-room.ts`).
- **Welcome** reads 6 sacred-noun keys to compute activation counts for the milestone ladder (`loader.ts` L50–108).

---

## 4. Orphans and divergences

| Key | Issue | Action |
|---|---|---|
| `gtmos_readiness_snapshot` | **Orphaned reader** — Dashboard reads it; nothing writes it to localStorage. Cloud writes exist (`readiness_snapshots` table) but localStorage sync is missing. | Flip Readiness Score to read the `readiness_snapshots` table; stop publishing to localStorage. |
| `gtmos_activation_context` | **Orphaned writer** — Onboarding (`seed.ts`) and Welcome (`loader.ts`) READ it; no `setItem` found. Activation context likely flows through `profiles` now. | Migrate activation context to `profiles`; stop reading localStorage. (ADR-007.) |
| `gtmos_readiness_last_verdict` | **Dual-write mismatch** — Founding GTM (`main.tsx` L31) reads it; the cloud write goes to `readiness_snapshots`, the localStorage write is not in current code. | Flip Founding GTM to read the cloud table directly. |
| `gtmos_deal_room_health` | **Aliased** — appears in deal-migration config separately from `gtmos_deal_workspace_health`; only one is actively written (`health-snapshot.ts` L84). | Verify alias; drop if legacy. |
| `gtmos_handoff_exported` | **Both orphaned** — in migration config; no reader or writer in active code. | Drop from migration config. |

---

## 5. The pre-Dashboard punch list

Before the new Dashboard ships against this `localStorage` substrate, three classes of fix:

**A — Fix the four snapshot pathologies (gates the Dashboard's correctness):**

1. Write a `gtmos_readiness_snapshot` from Readiness Score, OR flip Readiness's reader to the `readiness_snapshots` cloud table and have the Dashboard read from the same place.
2. Fix the `gtmos_activation_context` writer gap — either restore the localStorage write at end-of-Onboarding, or migrate the readers (Onboarding `seed.ts`, Welcome `loader.ts`) to read `profiles` directly.
3. Resolve `gtmos_readiness_last_verdict` — Founding GTM should read whichever surface is canonical (cloud table preferred).
4. Drop or clarify `gtmos_handoff_exported` and the `gtmos_deal_room_health` alias.

**B — Guarantee boot ordering for the demo-seed path:**

The demo-seed pipeline needs to either write the four Dashboard-consumed snapshots directly, OR boot Deal Workspace + Signal Console + Quota Workback synchronously before the Dashboard renders, so the snapshots exist by the time the Dashboard polls. Otherwise every fresh demo session starts with an empty Dashboard.

**C — Optional but recommended: Start the Tier-1 Step-3 dual-writes on the three rooms the Dashboard ranks from (Deal Workspace, Signal Console-already-done, Quota Workback) before the Dashboard build.**

This is the ADR-005 plan that exists but hasn't started. Doing the first two rooms makes the new Dashboard's reads cloud-canonical from day one, instead of perpetuating the localStorage substrate the audit just documented.

---

## 6. What this changes about the Dashboard build sequence

The deployment scoping doc (`deliverables/plans/design-system-deployment-and-brand-scoping-2026-06-07.md`) locked the pre-Dashboard execution order on 2026-06-08 as: deployment infrastructure → lexicon enforcement → brand pass → icon production → Dashboard. **This audit inserts a step between brand+icons and Dashboard:**

**Step 4.5 — Fix the localStorage substrate** (Part A of the punch list above; Part B as a sanity-check on demo bootstrap; Part C optional but recommended). Without it, the new Dashboard rebuilds the same empty-state bug at a prettier surface.

The scoping doc's Part IX execution order needs a small amendment to add Step 4.5 before the Dashboard build. That's a one-paragraph edit, deferred until the founder confirms this audit is adopted as the basis.

---

## 7. Provenance and how to verify

The audit's tool calls are listed in the transcript: `grep -r "gtmos_"` across `src/`, `js/`, and `app/`, plus targeted reads of `data-migration.ts`, `data-parity-flags.ts`, `snapshot-aggregator.ts`, `readiness-aggregator.ts`, `cross-room.ts`, `loader.ts`, `seed.ts`, `health-publisher.ts`, `health-snapshot.ts`. Every claim in this document is derivable from a `grep` over the repo at the audit's run date; a future session that wants to verify (or re-run as the codebase evolves) has the commands above as a starting point.

The Tier-1 retrofit state has changed since the audit ran. Per canon Part V §1's 2026-05-29 correction note, Signal Console reached Step 5 on 2026-05-23 (#142/#147/#149); Deal Workspace was cloud-native from Phase 4 Room 1 (PR #8) but kept a `mirrorToLegacyStorage` for not-yet-migrated cross-room consumers; Outbound Studio was cloud-resident via `bootCloudPersistence`. **The audit's "Step 0" reading for Deal Workspace and Outbound is reconcilable with that correction:** the canon's note clarifies that the formal ADR-005 5-step lifecycle is unreferenced in production code; the audit measured what the code actually does (still write localStorage as the canonical reads), which is consistent. The substrate is what it is; the punch list stands.

---

## 8. Verification pass + fix record — 2026-06-12 (substrate fix PR)

Every §4/§5 finding was re-verified against the codebase before fixing (per the 2026-06-02 lesson: grep what you cite). Result: **two findings real and fixed, two findings stale, one finding already resolved by an earlier PR.**

| Finding | Verdict | Evidence / action |
|---|---|---|
| 1. `gtmos_readiness_snapshot` orphaned reader | **REAL — FIXED** | Confirmed: only `data-migration.ts` config + the aggregator read referenced the key; no writer since the legacy `/app/readiness/` room retired (2026-05-01). The engine's readiness condition flags (`signal-profile.ts` L199-230) read empty for six weeks. Fix: new `src/dashboard/lib/readiness-snapshot-publisher.ts` — the Dashboard already computes the live verdict (`state.ts` `readinessSummary`); the publisher projects it into the legacy snapshot shape (`score` / `fragilityScore` / `weakestDimension` / `icpWeak` / `discoveryWeak` / `outreachWeak` / `dealsWeak` / `playbookWeak`, weak = dimension < 14/20 matching the verdict engine's hire-ready gate; `proof` maps to the legacy `playbookWeak` name) and writes the key on every summary change, skip-if-unchanged. Booted in `main.tsx` BEFORE the snapshot aggregator so the key exists by the first read. |
| 2. `gtmos_activation_context` orphaned writer | **STALE — NO FIX NEEDED** | The writer exists: `src/onboarding/lib/seed.ts` L98-100 WRITES the key via the `trySet` helper (the audit's `setItem` grep missed the indirection). Welcome's `loader.ts` reads it. The flow works as canon §4.3 specifies. |
| 3. `gtmos_readiness_last_verdict` cloud-write-only | **STALE — NO FIX NEEDED** | The localStorage write exists: `src/dashboard/lib/readiness-history.ts` `writeLastVerdict` (L223), wired via `bootReadinessHistory()` in Dashboard `main.tsx`. Founding GTM's read works once the Dashboard has booted at least once in the browser; before that it degrades to no verdict label, which is honest. |
| 4. `gtmos_handoff_exported` + `gtmos_deal_room_health` vestigial | **REAL — FIXED** | Confirmed: neither key has a writer or reader in active code (`js/supabase-config.js` L1747 is inert legacy config). Both dropped from `src/lib/data-migration.ts` (the `handoff_artifacts` migrator entry removed whole; `gtmos_deal_room_health` removed from the `deals` keys). The one-shot production migration already ran 2026-04-24, so this only affects fresh runs, which would have migrated nothing for these keys. The raw-string preservation test that used `gtmos_handoff_exported` as its fixture now exercises the same behavior through `gtmos_deal_stage_history`. |
| 5. Demo-seed 4-key gap + boot ordering | **ALREADY RESOLVED (#213) + CLOSED BY FINDING-1 FIX** | PR #213 (2026-05-29, before this audit's transcript was captured) added `warmUpMissingSnapshots()` to Dashboard boot — it self-heals `gtmos_deal_workspace_health` + `gtmos_signal_room_health` from raw nouns when the producing rooms never booted. Readiness is now covered by the finding-1 publisher (computed + written at Dashboard boot). Quota targets' absence stays meaningful by design (only exists after the operator saves in Quota Workback) — not a bug. No demo-seed change needed. |

**Punch-list status after this PR:** Part A — items 1 (fixed), 2 (stale), 3 (stale), 4 (fixed). Part B — resolved (#213 + finding-1 fix). Part C (ADR-005 Step-3 dual-writes on Deal Workspace + Quota Workback) — still open, optional, recommended before the Dashboard build.

**Part C verification — 2026-06-12 (same day, follow-up pass):** Part C is ALSO already in place; the audit's "Step 0" reading for these two rooms repeated the stale-canon failure mode the 2026-05-29 correction note warned about. Evidence: **Quota Workback** — `src/quota-workback/lib/cloud-persistence.ts` maps `PlanInputs` to a `pipeline_settings` row (`kind='quota.inputs'`), `saveInputsToCloud` (L109) upserts it, `startCloudAutoSave` (L206) mirrors every input mutation debounced, `subscribeRealtime` (L166) applies cross-device updates; all wired in `src/quota-workback/main.tsx` L66-77 (`bootCloudPersistence` + `startCloudAutoSave`, with graceful degrade when Supabase env is absent). The Future-Autopsy-style "machinery present but write path unwired" failure (#233) was checked for explicitly and is NOT present. **Deal Workspace** — cloud-native since Phase 4 Room 1 (PR #8): boot reads `data.deals.list()`, saves go through `data.deals.update`/`insert` (`src/deal-workspace/lib/persistence.ts`), realtime via `client.deals.subscribe` (L221); `mirrorToLegacyStorage` keeps `gtmos_deal_workspaces` deliberately for not-yet-migrated cross-room readers (Step-5 gated, not incomplete). The derived `gtmos_quota_targets` snapshot stays localStorage-only by design — it is recomputed from inputs on every QW save, and cloud-synced inputs hydrate on boot, so cross-device consistency holds. **Nothing left to build for the new Dashboard's data substrate.**

**The pre-Dashboard substrate gate (scoping doc Part IX step 5) is closed.**
