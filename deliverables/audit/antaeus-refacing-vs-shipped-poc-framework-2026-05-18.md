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
- ✅ Weakest-mold diagnosis + next-move prescription.

No mind drift.

---

## Most of the unforced drift was already closed

The 2026-05-02 PR #56 partial rework already landed:
- `StageStrip` (forge → cast → readout temporal flow) — matches the v3 thesis "Proof is not a page. It is a forced event."
- Bright forge (post-PR-#35 doctrine flip) — retired the dark/light split.
- Topbar already carries "Raw interest is not proof" framing copy.

The 5-mold grid + weakest-mold callout + heat ledger + docs rack + route rack all map cleanly to the Proof Foundry wireframe's ingot + molds blocks.

---

## Structural drift — narrow

### A. Canon-aligned evolution (KEEP)

| Proof Foundry wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Heat ledger: claim / **proof** / **decision** heat | Heat ledger: claim / **owner** / **kill** heat | Canon §4.15 explicit — claim / owner / kill are the canonical dimensions |
| Static "ingot" block with hardcoded "buyer pain is hot, metric usable, authority empty" line | Live `poc-cast__title` (quality.title) + score + band + 5-mold grid with state classes | Phase 4 / Room 5 — operator builds the proof live, not stares at a demo |
| `.molten` decorative band between ingot and molds | Removed | Aesthetic flourish — drift-mode "Metaphor ornament" |
| No cross-room handoff in wireframe | RouteRack with Deal Workspace / Future Autopsy / Advisor Deploy CTAs | Canon §6 compounding |

### B. Unforced drift (FIX in this PR)

| Proof Foundry wireframe | Shipped | Severity |
|---|---|---|
| **Ingot block carries a synthetic 2-3 clause read** ("The buyer pain is hot. The metric mold is usable. The authority mold is empty.") compressing the 5-mold state into one line | The 5-mold grid surfaces state visually via mold state classes (cast/hot/cold/red) but there is no synthesizing sentence — operator scans all 5 mold rows to know what's locked vs hot vs broken | 🟡 MED — the wireframe's synthesis is what makes the ingot read as an OUTPUT, not just a status grid |
| Cast kicker reads "CAST" | "OUTPUT INGOT" framing makes the artifact-as-output more explicit (matches the wireframe's `.ingot` block label) | 🟢 LOW — copy-level signature |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Molten decorative band between ingot and molds | Drift-mode "Metaphor ornament" |
| Different heat-ledger dimensions (claim / proof / decision) | Canon §4.15 explicit — claim / owner / kill wins |
| Inline heat-ledger placement near the top of the cast | The shipped HeatLedger sits in the forge (left) panel where the heat is being generated; moving it would split it from the form inputs it reads |

---

## Fix scope (this PR)

1. **`lib/quality.ts`** — add `buildIngotRead(molds)` synthesizer. Returns 1-3 clauses naming the strongest molds (locked / hot) and the weakest mold (broken preferred over empty). Empty-board + all-locked fallbacks have dedicated copy.
2. **`lib/quality.test.ts`** — 5 cases: empty foundry / all locked / mixed synthesis / empty mold list / red-over-cold preference.
3. **`CastPanel.tsx`** — renders the ingot-read line inside the header beneath the title + quality sub. Reads off `buildIngotRead(molds)` so it stays in sync as the operator forges. Kicker renamed from `CAST` to `OUTPUT INGOT` to match the wireframe's artifact-as-output framing.
4. **`poc-framework.css`** — `.poc-cast__ingot-read` styled as a serif statement with a recessive left-rule, sitting between the score sub and the mold grid.

## Acceptance walk

- Empty board shows "All five molds are still empty. The proof has not been forged yet."
- Adding one field (account / vendor / readoutOwner / successCriteria) lifts the read into a synthesis sentence naming at least one specific mold.
- Each mold transition between states updates the synthesis sentence.
- The OUTPUT INGOT kicker is present.
- The 5-mold grid + weakest-mold callout + docs rack + route rack all render unchanged.
- StageStrip + ForgePanel + HeatLedger all render unchanged.
