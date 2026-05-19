# Future Autopsy re-audit — Program 6 / PR 7

**Audited:** 2026-05-18
**Winner:** `antaeus-future-autopsy-variant-01-selected-2026-04-09.html` — Variant 01 / Forensic Light Table
**Auditor:** Claude (Program 6 / PR 7)

**Status of 2026-05-01 bootstrap punch list:**

| Bootstrap finding | Status (this audit) |
|---|---|
| Tabbed forensic sheets where variant 01 called for stacked sentence-titled sheets | ✅ **Closed (Phase 2 rework, pre-PR-#74).** `ForensicSheets.tsx` renders 3 stacked sheets simultaneously (Risk / Proof / Motion) with sentence-shaped titles derived from `sentenceTitlesFor(doc)`. The legacy 3-tab rack is retired. |
| Variant 01's distinctive visual treatment (tilted sheets, tone-colored tab pills, 2-col stack + route layout) | 🟡 **Open — closes in this PR.** The structure is right but the "lit evidence surface, not a page" tactility is missing. |

---

## Mind preservation — PASS

Canon §4.14 (Future Autopsy — Diagnosis Table, protected room) preserved:

- ✅ The deal is pinned as evidence (PinnedCase header surfaces the focal case).
- ✅ The "forensic light-table" feel from canon — sheets stacked simultaneously, not hidden behind tabs.
- ✅ Six-pinned-case ledger (Ledger component selects which case to autopsy).
- ✅ Verdict toggle (left-alone / corrected).
- ✅ Countermeasure docket with task-completion log persistence.
- ✅ Kill-switch line when present.
- ✅ Route rack via `buildActionPlan(doc)`.

No mind drift.

---

## Structural drift — only Variant 01's distinctive visual treatment remains

### A. Things the shipped room evolved past the wireframe (KEEP)

| Variant 01 wireframe | Shipped | Why the evolution is right |
|---|---|---|
| Single pinned case ("Meridian Logistics Global · $280k") | Multi-case Ledger below the pinned case lets Sarah switch | Wave 1 / canon §4.14 — Ledger is one of the 7 required global rails |
| Static 3 route cards | Dynamic `buildActionPlan(doc)` → primary/secondary/tertiary derived from autopsy data | Wave 5 — engine-driven routing is canon evolution |
| Sentence-shaped concept-meaning paragraph | Topbar carries the kicker + thesis; not the full "concept-meaning" treatment | Topbar shape is the canon room pattern |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Variant 01 wireframe | Shipped | Severity |
|---|---|---|
| **Slight rotation per sheet** — sheet-a tilted -2.8°, sheet-b tilted +1.9°, sheet-c tilted -1.1°; absolute-positioned in a relative stack-zone | Three sheets rendered in a clean vertical stack (no rotation) | 🟡 MED — the tilt is the "lit evidence surface, not a page" tactility the variant is named after. Without it the sheets read as a list. |
| **Tone-colored tab pills** — `sheet-tab.orange` ("Visible symptom"), `sheet-tab.blue` ("What sits underneath"), `sheet-tab.green` ("Failure pattern") with semantic-tone backgrounds + matching text color | `fa-stack-sheet__label` renders as a flat uppercase mono kicker (no pill, no tone color) | 🟡 MED — the tone pills carry the semantic differentiation between the three sheets (symptom / underlying / pattern). Without them the three sheets look identical. |
| **2-col layout: stack-zone (left) + route-rack (right)** at `light-grid` level | Sheets + RouteRack stack vertically (RouteRack below the sheets) | 🟢 LOW — the wireframe's 2-col layout keeps the corrective route visible while Sarah reads the sheets. Currently RouteRack is below the fold; she scrolls. |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

- **Modal-overlay pattern** → Future Autopsy uses NO modals. ✅ N/A.
- **Sentence-shaped thesis headers** → Sheet titles ARE sentence-shaped per `sentenceTitlesFor` (Phase 2 rework). ✅ JUSTIFIED.

---

## Fix scope — this PR

Bucket B unforced drift gets these specific fixes:

1. **Tone-colored tab pills** on each sheet — rename `fa-stack-sheet__label` (or layer on it) to render as a pill with semantic background + text color:
   - Risk sheet → orange pill ("Visible symptom" vocabulary from wireframe; using "Risk" for consistency with shipped data flow)
   - Proof sheet → blue pill
   - Motion sheet → green pill

2. **Slight rotations** on each sheet via CSS — `transform: rotate(-2.8deg)` / `rotate(1.9deg)` / `rotate(-1.1deg)` applied to the `:nth-child` of each `fa-stack-sheet` inside `fa-sheet--stacked`. Wraps don't affect layout flow; only visual presentation. Disabled on `@media (max-width: 1160px)` so mobile/narrow keeps clean stacking.

3. **2-col layout** — PinnedCase's bottom section (sheets + RouteRack + Docket) reflows. The sheets stay in the left column; RouteRack moves to the right column at desktop widths so Sarah sees the corrective route alongside the evidence. Docket stays in the left column below the sheets.

### What this PR does NOT change

- The mind layer: autopsy generator, vitals computation, action-plan router, verdict toggle, task-completion log, ledger case selector, RouteRack content all stay.
- `sentenceTitlesFor(doc)` — the titles are already sentence-shaped per Phase 2 rework.
- Ledger or Stage Strip (the canonical winners note mentions Hanging Ledger refinement + Stage Strip lower half; those are separate sub-rooms — could be a follow-up PR but the bootstrap audit didn't name them).

---

## Acceptance — Sarah pinning a case for autopsy

1. Sarah pins Meridian Logistics from the Ledger below.
2. Pinned-case header surfaces: account name, stage, value, days stale, risk, qual.
3. **Three sheets stacked with slight tilt** — each carries a tone-colored tab pill (Risk orange / Proof blue / Motion green) and a sentence-shaped title. The tilt reads as "evidence pinned to a light table," not "three identical content cards."
4. On the right column (desktop): **RouteRack** is visible alongside the sheets — Sarah doesn't have to scroll to see the corrective route.
5. Countermeasure docket renders below the sheets in the left column.
6. Verdict toggle on the pinned-case header allows left-alone / corrected.
