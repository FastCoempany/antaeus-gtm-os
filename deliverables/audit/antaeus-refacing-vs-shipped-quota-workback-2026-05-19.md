# Quota Workback refacing audit — Program 6 / PR 17

**Audited:** 2026-05-19
**Winner:** `antaeus-quota-workback-variant-01-ai-selected-2026-05-01.html` — Variant 01 (AI-selected)
**Auditor:** Claude (Program 6 / PR 17)

> **Note on the winner.** Quota Workback has no founder-hand-picked triptych. AI-generated Variant 01 was retrospectively elevated as canonical (same PR #56 as Signal Console). Thesis: "Make the math feel daily."

---

## Mind preservation — PASS

Canon §4.18 (Quota Workback — System Ledger) preserved end-to-end:

- ✅ Quota math turned into weekly + daily execution pressure.
- ✅ Live pipeline coverage drawn from `gtmos_deal_workspaces` mirror.
- ✅ System-health pulse (compounding vs still weak).
- ✅ Cross-room handoff (Outbound / Dashboard / Founding GTM).
- ✅ Bright field per Part II §1 (the §4.6 dark exception is retired).

No mind drift.

---

## Most of the refacing is already in

Phase 4 / Room 14 shipped against the winner's thesis directly. The Topbar already carries the winner's H1 verbatim ("Make the math feel daily.") + the touches/day hero number + the planning-quality posture pill. The CoveragePanel / SystemHealth / InputForm / PlanReadout below all map to the winner's expanded operating surfaces.

---

## Structural drift — narrow

### A. Canon-aligned evolution (KEEP)

| Variant 01 wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Static example "12 touches/day across 23 accounts to hit $500K/month" | **Live `metrics.touchesDay` hero** computed from the operator's inputs | Phase 4 / Room 14 — operator builds the math live |
| Single coverage bar with hardcoded 62%/2.5x | **`CoveragePanel` reading `gtmos_deal_workspaces` mirror** with live ratio + raw + weighted + gap copy | Cross-room compounding per canon §6 |
| Wireframe lacks downstream handoff | **HandoffStrip with 4 destinations** | Canon §6 compounding |
| Rationale callout below grid | Not surfaced (wireframe annotation) | Correct |

### B. Unforced drift (FIX in this PR)

| Variant 01 wireframe | Shipped | Severity |
|---|---|---|
| **4-stat row of PLAN INPUTS** — Annual quota / Avg ACV / Win rate / Cycle, each with an interpretive sub-note ("75 deals to hit number", "~340 opps needed", "Mid-market enterprise") | The shipped Topbar surfaces 3 DERIVED OUTPUTS — Monthly target / Touches/week / Coverage goal. These duplicate the hero + CoveragePanel + PlanReadout below | 🟡 MED — duplicate-output stats add visual noise without adding signal; the wireframe's input-anchor stats let the operator see WHAT produced the hero number at a glance |
| Each stat has a sub-note context line | No sub-notes on the shipped stats | 🟢 LOW — interpretive context per stat |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rationale callout below the grid | Wireframe annotation, not operator surface |
| Hardcoded numbers in the wireframe example | Live derivation already wired |

---

## Fix scope (this PR)

1. **`components/Topbar.tsx`** — replaces the 3 derived-output stats (Monthly target / Touches/week / Coverage goal) with the wireframe's 4 plan-input anchors:
   - **Annual quota** (`inputs.quota`) with sub "Set in onboarding" or "Not set"
   - **Avg ACV** (`inputs.acv`) with sub showing annualized deals-to-hit-number
   - **Win rate** (`inputs.win` %) with sub showing annualized opps needed
   - **Cycle** (`inputs.cycle`d) with sub showing the ACV-band label (e.g., "Mid-market enterprise")
   
   Each stat handles the empty-state (input not yet set) by showing "—" and a soft "Not set" / "Set X to see Y" sub.

2. **`Stat` component** — extended with a `sub?: string` prop. Drops the old `accent` prop (it was unused after the change since plan-inputs all sit at equal hierarchy — the touches/day hero is the dominant pressure number, not any individual input).

3. **`formatMoney(n)`** helper — compresses large quota / ACV numbers into the `$6M` / `$80K` shapes the wireframe shows.

4. **`quota-workback.css`** — adds `.qw-stat__sub` (11.5px / soft ink) for the sub-note line. The existing `.qw-topbar__stats` grid already has `repeat(4, …)` so no grid changes required.

## Acceptance walk

- Topbar surfaces 4 stats: Annual quota / Avg ACV / Win rate / Cycle.
- Each stat carries a sub-note below its value.
- With default inputs (quota = 0), the stats render "—" with "Not set" / "Set X to see Y" subs instead of erroring.
- With realistic inputs ($6M / $80K / 22% / 62d), the stats show formatted values + their interpretive sub-notes.
- "Make the math feel daily." H1 still renders verbatim.
- The hero touches/day number + posture pill still render.
- The CoveragePanel / SystemHealth / InputForm / PlanReadout / HandoffStrip below all render unchanged.
- Mobile width still collapses the stats grid (existing breakpoint).
