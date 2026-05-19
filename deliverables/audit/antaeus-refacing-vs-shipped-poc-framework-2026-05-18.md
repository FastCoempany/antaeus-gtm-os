# PoC Framework refacing audit — Program 6 / PR 14

**Audited:** 2026-05-18
**Winner:** `antaeus-poc-framework-radical-triptych-v3-2026-04-20.html` — Variant 03 / Proof Foundry (line 530+)
**Auditor:** Claude (Program 6 / PR 14)

---

## Mind preservation — PASS

Canon §4.15 (PoC Framework — Decision Bench) preserved end-to-end:

- ✅ Four molds (Claim, Owner, Metric, Kill rule) + the implicit fifth (Baseline) per the legacy 5-mold grid.
- ✅ Heat ledger (Claim heat / Owner heat / Kill heat) — canon's three dimensions, kept verbatim.
- ✅ Linked deal + readout owner + duration toggle + outcome state.
- ✅ Cross-room handoff (Deal Workspace / Future Autopsy / Advisor Deploy).
- ✅ Weakest-mold diagnosis + the line naming what to do about it.

No mind drift.

---

## Most of the unforced drift was already closed

The 2026-05-02 PR #56 partial rework already landed:

- `StageStrip` (forge → cast → readout temporal flow) — matches the v3 thesis "Proof is not a page. It is a forced event."
- Bright forge (post-PR-#35 doctrine flip) — retired the dark/light split.
- Topbar already carries "Raw interest is not proof" framing copy.

The 5-mold grid + weakest-mold callout + heat ledger + docs rack + route rack all map cleanly to the wireframe's ingot + molds blocks.

---

## Structural drift — narrow

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Heat ledger named as claim / proof / decision | Heat ledger named as claim / owner / kill | Canon §4.15 is explicit — claim / owner / kill are the canonical three |
| Static "ingot" block with hardcoded one-liner | Live `poc-cast__title` (quality.title) + score + band + 5-mold grid with state classes | Phase 4 / Room 5 — the operator forges the proof live; they don't stare at a demo |
| `.molten` decorative band between ingot and molds | Removed | Aesthetic flourish — drift-mode "Metaphor ornament" |
| No cross-room handoff in the wireframe | RouteRack with Deal Workspace / Future Autopsy / Advisor Deploy CTAs | Canon §6 compounding |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| The ingot block carries a 2-3 clause sentence that compresses what's hot, what's usable, and what's empty across the 5 molds into one line the operator reads at a glance | The 5-mold grid surfaces state visually via mold state classes (cast/hot/cold/red), but there's no sentence summarizing what the picture says — the operator has to scan all 5 mold rows to know what's locked vs hot vs broken | 🟡 MED — without the synthesis line the cast reads as a status grid, not a summary of where the proof stands |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Molten decorative band between ingot and molds | Drift-mode "Metaphor ornament" |
| Different heat-ledger dimensions (claim / proof / decision) | Canon §4.15 is explicit — claim / owner / kill wins |
| Inline heat-ledger placement near the top of the cast | The shipped HeatLedger sits in the forge (left) panel where the heat is being generated; moving it would split it from the form inputs it reads |

---

## Fix scope (this PR)

1. **`lib/quality.ts`** — add `buildIngotRead(molds)` that returns a 1-3 clause sentence naming the strongest molds (locked / hot) and the weakest one (broken preferred over empty). Empty-board and all-locked cases get their own copy.
2. **`lib/quality.test.ts`** — 5 cases: empty foundry / all locked / mixed synthesis / empty mold list / red-over-cold preference.
3. **`CastPanel.tsx`** — renders the new synthesis line inside the header, beneath the title + score sub. Reads off `buildIngotRead(molds)` so it stays in sync as the operator forges.
4. **`poc-framework.css`** — `.poc-cast__ingot-read` styled as a serif statement with a recessive left-rule, between the score sub and the mold grid.

> Note: code identifiers like `buildIngotRead` and `.poc-cast__ingot-read` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the synthesis line reads as a normal sentence.

## Acceptance walk

- Empty board shows the all-empty fallback copy.
- Adding one field (account / vendor / readoutOwner / successCriteria) lifts the line into a synthesis sentence naming at least one specific mold.
- Each mold transition between states updates the sentence.
- The 5-mold grid + weakest-mold callout + docs rack + route rack all render unchanged.
- StageStrip + ForgePanel + HeatLedger all render unchanged.
