# Territory Architect refacing audit — Program 6 / PR 12

**Audited:** 2026-05-18
**Winner:** `antaeus-territory-architect-signal-field-refinement-2026-04-17.html` (supersedes the V02 triptych panel per the canonical-winners doc)
**Auditor:** Claude (Program 6 / PR 12)

---

## Mind preservation — PASS

Canon §4.5 (Territory Architect — Decision Bench) preserved end-to-end:

- ✅ Focuses as strategic bets (`title` + `pressure` + `segment` + `whyUs`).
- ✅ Approach ledger per focus (talk-track + trigger + bridge).
- ✅ 4-tier model with TIER_DEFAULTS allocation.
- ✅ 300-account ceiling with headroom / at-cap / over status.
- ✅ Per-account disposition state (active / paused / closed-won / closed-lost / reroute).
- ✅ Cross-room handoff (ICP / Sourcing / Signal Console).

No mind drift.

---

## Structural drift — partial

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Static example nodes ("Meridian Industrial", "VoltWorks") on a 3-ring map | Editable focus / approach / account forms + ranked table | Canon §4.5 — the operator builds the territory; they don't look at a demo of one |
| Ring metaphor (core / watch ring / false territory) | 4-tier model (T1/T2/T3/T4) per canon §4.5 | Tiers are the canonical resource-allocation commitment; ring labels were a visual conceit on top of tiers |
| 5 named account nodes scattered in space | Allocation table with retier + disposition selectors | The room exists for the operator to act, not display |
| Three doctrine "bottom strips" | Doctrine lives in canon and the operating laws, not as static cards in the surface | Phase 4 / Room 12 — doctrine moved out of the visible surface so the working area dominates |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| A right-side panel in the hero that names what shape the territory is in right now and what to do about it (a score + three plain-language lines) | The hero shows tier counts and the ceiling status, but it doesn't say what the picture means or what to do next — the operator gets numbers, not a sense of where the territory stands | 🟠 HIGH — without this the room is a table of rows, not a place that tells the operator anything |
| The same panel also names a score and a band label (Runnable / Tight / Loose / Empty) so the operator gets a one-second read of where the territory stands | No score; only `at-cap` / `over` / `headroom` ceiling status | 🟡 MED — the score gives a one-second read |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Signal-map ring visualization (3 concentric rings + scattered named nodes) | Drift-mode "Metaphor ornament" — the tier model + disposition state already carries the same information without theater |
| Bottom doctrine strips | Per the Phase 4 / Room 12 doctrine sweep, doctrine was moved out of the visible surface; adding it back here would revive Part IV §3 "Doctrine in the first fold" drift |
| Decorative "trace" lines and ring outlines | Aesthetic flourish; no functional value |
| Hero kicker pill row (5 in core / 8 in watch ring / 3 false positives) | Tier stats already carry this; a pill row would be a redundant summary |

---

## Fix scope (this PR)

1. **`lib/field-read.ts`** (new) — pure function `computeFieldRead({accounts, focuses, approaches, allocation})` returning `{score, band, bandLabel, mainRisk, replacement, operatorMove}`. Score is a 0-92 derived posture; band is one of `empty / loose / tight / runnable`. Priority chains for the risk and the next-action line so the wording is always specific.
2. **`lib/field-read.test.ts`** (new) — covers the empty board, the priority chains for next-action and risk, the backfill counter, and the score bands.
3. **`TerritoryArchitect.tsx`** — wraps the hero in a 2-col `ta-hero__grid` (lead + the new right-side aside); the aside reads off a `computed` over the existing state signals and renders the score + the three plain-language lines.
4. **`territory-architect.css`** — `.ta-hero__grid` 2-col layout (collapses to single column under 1080px) + full `.ta-field-read*` aside with band-tinted left rule + an orange-accented line for the prescribed next action (the dominant treatment goes to "what to do today").

> Note: code identifiers like `computeFieldRead` and `.ta-field-read` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the panel itself reads as plain sentences.

## Acceptance walk

- An empty room shows the `EMPTY` band with a "Start with one focus" next-action line.
- Adding a focus lifts the risk line off the no-focuses copy.
- The aside renders all four lines (score / risk / backfill / next action) and the next-action line carries the orange accent variant.
- Existing HeroBand stats (focuses count + 4 tier counts + ceiling status) still render unchanged.
- Mobile width (< 1080px) collapses the 2-col hero to a single column.
