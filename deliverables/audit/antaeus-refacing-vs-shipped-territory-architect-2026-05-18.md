# Territory Architect refacing audit — Program 6 / PR 12

**Audited:** 2026-05-18
**Winner:** `antaeus-territory-architect-signal-field-refinement-2026-04-17.html` (supersedes the V02 triptych panel per the canonical-winners doc)
**Auditor:** Claude (Program 6 / PR 12)

---

## Mind preservation — PASS

Canon §4.5 (Territory Architect — Decision Bench) preserved end-to-end:

- ✅ Theses as strategic bets (`title` + `pressure` + `segment` + `whyUs`).
- ✅ Approach ledger per thesis (talk-track + trigger + bridge).
- ✅ 4-tier model with TIER_DEFAULTS allocation.
- ✅ 300-account ceiling with headroom / at-cap / over status.
- ✅ Per-account disposition state (active / paused / closed-won / closed-lost / reroute).
- ✅ Cross-room handoff (ICP / Sourcing / Signal Console).

No mind drift.

---

## Structural drift — partial

### A. Canon-aligned evolution (KEEP)

| Signal Field wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Static example nodes ("Meridian Industrial", "VoltWorks") on a 3-ring map | **Editable thesis / approach / account forms + ranked table** | Canon §4.5 — operator must build the territory, not look at a demo of one |
| Ring metaphor (core / watch ring / false territory) | **4-tier model (T1/T2/T3/T4) per canon §4.5** | Tiers are the canonical resource-allocation commitment; ring labels are a visual conceit on top of tiers |
| 5 named account nodes scattered in space | **Allocation table with retier + disposition selectors** | Operator action surface, not display |
| Three doctrine "bottom strips" (Signal rule / Replacement queue / Downstream effect) | Doctrine lives in canon + the operating laws, not surfaced as static cards | Phase 4 / Room 12 — doctrine moved out of the visible surface so the working area dominates |

### B. Unforced drift (FIX in this PR)

| Signal Field wireframe | Shipped | Severity |
|---|---|---|
| **Read-dock surfaces score + 3 interpretive lines** (Main risk / Replacement pressure / Operator move) | The hero shows tier counts + allocation status but does not INTERPRET the territory — operator gets numbers, not a read | 🟠 HIGH — this is the wireframe's most distinctive substantive contribution; without it the room reads as a CRUD table instead of a strategic instrument |
| **Field read score with a band label** (Runnable / Tight / Loose / Empty) | No score surface; only `at-cap` / `over` / `headroom` ceiling status | 🟡 MED — the score gives the operator a single-glance posture |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Signal-map ring visualization (3 concentric rings + scattered named nodes) | Drift-mode "Metaphor ornament" — the tier model + disposition state already encodes the same information without theater |
| Bottom strips (3 doctrine cards) | Per Phase 4 / Room 12 doctrine sweep, doctrine was moved out of the visible surface; re-adding it would revive Part IV §3 "Doctrine in the first fold" drift |
| Decorative "trace" lines + "ring" rings | Aesthetic flourish; no functional value |
| Hero kicker pill row (5 in core / 8 in watch ring / 3 false positives) | Tier stats already surface this information per-tier; pill row would be a redundant summary |

---

## Fix scope (this PR)

1. **`lib/field-read.ts`** (new) — pure function `computeFieldRead({accounts, theses, approaches, allocation})` returning `{score, band, bandLabel, mainRisk, replacement, operatorMove}`. Score is a 0-92 derived posture; band is one of `empty / loose / tight / runnable`. Priority chains for mainRisk + operatorMove so the prescription is always specific.
2. **`lib/field-read.test.ts`** (new) — covers empty board / operator-move priority / main-risk priority / replacement pressure / score bands.
3. **`TerritoryArchitect.tsx`** — wraps the hero in a 2-col `ta-hero__grid` (lead + Field Read aside); the aside surfaces score + 3 interpretive lines via a `computed` over the existing state signals.
4. **`territory-architect.css`** — `.ta-hero__grid` 2-col layout (collapses single-col at < 1080px) + full `.ta-field-read*` aside with band-tinted left rule + orange-accented Operator move line (the prescribed next action gets the dominant treatment).

## Acceptance walk

- Empty room shows `EMPTY` band with the "Start with one thesis" operator move.
- Adding a thesis lifts mainRisk off the no-theses copy.
- The aside renders all four lines (score / risk / replacement / move) and the operator-move line carries the orange accent variant.
- Existing HeroBand stats (theses count + 4 tier counts + ceiling status) still render unchanged.
- Mobile width (< 1080px) collapses the 2-col hero to a single column.
