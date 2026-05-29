# Data parity audit — Outbound Studio

**Phase 4.5 Checkpoint 2 / Step 1**
**Per ADR-005 §"The 5-step per-room retrofit lifecycle"**
**2026-05-29**

Outbound Studio is the third room in the Tier 1 retrofit trio
(Signal Console → Deal Workspace → Outbound Studio). Like Deal
Workspace, its Step 4 must land BEFORE Signal Console's Step 4
because Signal Console reads `gtmos_outbound_touches` for the
execution-context temperature ladder (touches drive the `cool`
band).

---

## 1. Inventory of `gtmos_*` keys in `src/outbound-studio/`

| Key | Source(s) | Write side | Read side | Current state |
|---|---|---|---|---|
| `gtmos_outbound_touches` | `lib/persistence.ts` + `lib/cloud-persistence.ts` | Cloud canonical via `data.outbound_touches.*`; localStorage write-only legacy mirror so Signal Console + LinkedIn Playbook can still read | Boot reads cloud first; localStorage is migration-source fallback | **Dual-shape today.** Mirror retires at Step 5 once Signal Console + LinkedIn Playbook hit Step 5. |
| `gtmos_angles` | `lib/persistence.ts` + `lib/cloud-persistence.ts` | Cloud canonical via `data.outbound_angles.*`; localStorage mirror for legacy compat | Same boot pattern | **Dual-shape today.** Mirror has no current cross-room consumer — retires at Step 5. |
| `gtmos_sc_v4` | NOT written by Outbound Studio | READ-ONLY cross-room from Signal Console (`lib/account-loader.ts`) | Used in the rack autocomplete + heat-based suggestions | **Read-only cross-room.** Flips when Signal Console's Step 4 lands. |

**No health snapshot for Outbound Studio.** Unlike Signal Console + Deal Workspace, Outbound Studio doesn't publish a cross-room health snapshot — its data feeds Signal Console's execution-context computation directly (which has its own snapshot via `signal_console_health_snapshot()` RPC from PR #203).

---

## 2. Mapping localStorage keys to `data.<noun>.*` accessors

| `gtmos_*` key | Target accessor | Status |
|---|---|---|
| `gtmos_outbound_touches` | `data.outbound_touches.*` | **Exists.** Boot loads + writes + realtime. |
| `gtmos_angles` | `data.outbound_angles.*` | **Exists.** Same pattern. |

---

## 3. Schema deltas (Step 2 input)

**Surprise finding: no new schema needed.**

Outbound Studio has the simplest retrofit shape of the Tier 1 trio — it doesn't publish a health snapshot to other rooms, doesn't have dev overrides like Signal Console's `enrichment_base_url`, doesn't have UI dismissal state. Its two data tables (`outbound_touches`, `outbound_angles`) already exist and are already cloud-canonical. The legacy-mirror writes to localStorage are the only thing left.

Step 2 for Outbound Studio is **a no-op migration** — there's nothing to migrate. The audit doc + the Step 3 flag wiring are the next two PRs. Step 4 is the realtime + cross-room read flip. Step 5 retires the legacy-mirror.

This means Outbound Studio's Step 2 PR can be skipped entirely — there's no migration to apply. Step 3 (dual-write) is currently the case: the room writes to cloud AND localStorage. The retrofit's only real movement on Outbound Studio is **flipping cross-room consumers** (Signal Console + LinkedIn Playbook) to read from cloud, which is THEIR Step 4 work, not Outbound's.

**Outbound Studio's only ADR-005 work** reduces to:
- This audit (Step 1) ← current PR
- Step 5: drop the legacy-mirror writes once cross-room consumers have migrated

Steps 2, 3, 4 are no-ops because the desired end state is already in place. The two flags introduced reflect this: they only gate the legacy-mirror's retirement.

---

## 4. Cross-room handoff dependencies

| Reads | Currently from | Switches to |
|---|---|---|
| `data.signal_console_accounts.*` (via account-loader.ts) | `gtmos_sc_v4` localStorage | When Signal Console Step 4 lands |

**Writes consumed by other rooms:**
- Signal Console reads `gtmos_outbound_touches` for execution-context temperature ladder
- LinkedIn Playbook reads `gtmos_outbound_touches` for the air-cover motion branch (`add_air_cover`)

Both consumers retire their reads when their own Step 4 lands. Outbound Studio's legacy-mirror persists until then.

---

## 5. Existing test coverage

- `lib/persistence.test.ts` — localStorage round-trip
- `lib/cloud-persistence.ts` consumer tests — cloud + realtime
- `lib/outbound-bridge.test.ts` — row ↔ Touch / Angle coercion
- `lib/handoff.test.ts` — cross-room hrefs
- `lib/account-loader.test.ts` — cross-room read from Signal Console
- `lib/generator.test.ts` — send-line generator (no I/O)

---

## 6. Feature flags introduced

| Flag | Step | Purpose | Retired at |
|---|---|---|---|
| `outbound_studio_data_parity_write` | (skipped — see §3) | N/A — dual-write is already the case today | N/A |
| `outbound_studio_data_parity_read` | (skipped — see §3) | N/A — cloud-first read is already the case today | N/A |
| `outbound_studio_legacy_mirror_off` | Step 5 | Gates retirement of the localStorage legacy-mirror. Default off until Signal Console + LinkedIn Playbook hit Step 5. | Step 5 close |

Only ONE flag needed (Step 5 gate). The two standard flags from ADR-005 §"Feature-flag model" are skipped because there's no transitional state — the room is already at the desired end state minus the legacy-mirror.

**This deviation from ADR-005's per-room flag pattern is intentional** and documented in this audit; future audits for rooms in the same shape (already cloud-canonical) should follow the same simplification.

---

## 7. Step 2 PR scope

**Step 2 is skipped for Outbound Studio.** No migration needed. The next PR after this audit jumps to Step 5 (retire legacy-mirror) and waits to merge until Signal Console + LinkedIn Playbook have hit their Step 5.

In the meantime, Outbound Studio's parity flag (`outbound_studio_legacy_mirror_off`) lands in the data-parity-flags registry alongside the audit. That's the actual next PR.

---

## 8. Implications for Tier 1 Step 5 chain (revised)

With Outbound Studio's audit clarifying that no schema work is needed, the Tier 1 Step 5 sequence simplifies:

1. **Deal Workspace Steps 2 → 3 → 4 → 5**, in order
2. **Signal Console Steps 3 → 4 → 5**, after Deal Workspace Step 4
3. **Outbound Studio Step 5** (retire legacy-mirror), after Signal Console + LinkedIn Playbook Step 5

Outbound Studio's Step 5 is the LAST to merge in Tier 1, not the third. The two skipped intermediate steps shift the room's actual close to the end of the chain.

This also means Phase B unblocks earlier: per ADR-005 §"Room priority order — Tier 1", Phase B's gate is the trio's Step 5. With Outbound Studio collapsed to one step (Step 5 only), the chain is shorter than originally estimated.
