# ICP Studio refacing audit — Program 6 / PR 5

**Audited:** 2026-05-18
**Winner:** `antaeus-icp-studio-triptych-2026-04-17.html` — Variant 01
**Auditor:** Claude (Program 6 / PR 5)

---

## Mind preservation — PASS

Canon §4.4 (ICP Studio — Decision Bench family) preserved end-to-end:

- ✅ The ICP object is the thing being sharpened; central authored surface.
- ✅ "Thin means fewer assumptions, fewer personas, fewer use cases."
- ✅ Quality engine produces score / tier / checks (Phase 4 / Room 11 port from legacy).
- ✅ Saved-ICP analytics feeds downstream rooms (Territory / Sourcing / Signal / Outbound) via `gtmos_icp_analytics`.
- ✅ Role-aware form (founder / first AE) with template prefills.

No mind drift.

---

## Structural drift — partial; one canon-aligned evolution + targeted unforced drift

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Dark hero band above a bright work area | Bright hero with an orange left rule (cream gradient + orange accent) | Founder directive 2026-04-27 / ADR-002 retirement of the dark exception. The component is still called `DarkHero` for backwards-compat but renders bright per canon Part II §1. |
| Simple display-only state | WorkArea with 7-input form + 4 build outputs + Save bar + AnalyticsPanel | Phase 4 / Room 11 — the shipped is more concrete (actual inputs you can change) than the wireframe's display-only treatment. |

### B. Where the shipped room is still drifting from the wireframe (FIX)

| Wireframe | Shipped | Severity |
|---|---|---|
| A 7-row ledger panel — one row per ICP input, each showing a mark + field name + a sentence about the current shape + a state pill (Locked / Runnable / Tightening / Good / Thin / Missing / Clear). This row-by-row treatment is what makes the variant feel like a ledger you can read. | `icp-quality__checks` list rendering the quality engine's `checks[]` as a flat tone-classed list (good/warn/risk) | 🔴 HIGH — the underlying data is the same; what's missing is the per-field naming and the structured row shape that makes the variant feel like what it's named after. |
| A right-side aside with a big score + a "weakest field" block + a "broad version to avoid" block + a "downstream changes" block | `icp-quality__head` carrying score + label + summary; no broad-version-to-avoid or downstream-changes affordance | 🟡 MED — the aside organizes the same data into blocks the operator can read at a glance. Without it the score reads as a chip; with it the score reads as a summary of where the work stands. |
| The ICP statement rendered as a huge sentence-shaped line with colored spans | `icp-hero__statement` paragraph in the hero — sentence-shaped but smaller / quieter visual treatment | 🟢 LOW — the shipped is sentence-shaped (canon-aligned); only the visual weight is less anchored. |

---

## Cross-cutting drift signals

- **Modal-overlay pattern** → ICP Studio has no modals/overlays. ✅ N/A.
- **Sentence-shaped thesis headers** → Hero H1 is sentence-shaped ✅; the ICP statement is sentence-shaped ✅.

---

## Fix scope — this PR

Bucket B drift gets these specific fixes:

1. **`WedgeLedger.tsx` (new)** — 7-row panel derived from the draft inputs. Each row:
   - mark (number + tone-colored dot)
   - field name (Industry / Buyer / Size / Geo / Pain / Trigger / Proof window)
   - sentence describing the current shape (falls back to "Not set yet." when empty)
   - state pill (Locked / Runnable / Tightening / Good / Thin / Missing / Clear) — derived from input emptiness + a per-field specificity heuristic
   Doesn't reshape the quality engine; both surfaces consume the same draft inputs.

2. **`RunDocket.tsx` (new)** — right aside with:
   - Big score (delegates to `buildIcpQuality`) + tier label
   - A "weakest field" block — names the first empty / thin field
   - A "broad version to avoid" block — operator-voice anti-pattern
   - A "downstream changes" block — what Territory / Sourcing / Outbound / Discovery will adopt once the work is saved
   - Saved-count footer

3. **2-column work block layout** — WorkArea reflows. The existing form + build outputs stay; the QualityReadout's check-list display is replaced by a 2-col layout: `WedgeLedger` on the left + `RunDocket` on the right. The score chip + summary stay in the hero (no duplication).

> Note: code identifiers like `WedgeLedger.tsx` and `RunDocket.tsx` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; each row + block reads as plain sentences.

### What this PR does NOT change

- The quality engine, persistence, handoff, cloud sync, AnalyticsPanel — all stay.
- The 7-input form + template panel + role toggle — all stay; the new panel READS from the same `draft` signal.
- The hero (DarkHero) treatment — already bright per ADR-002.
- The save bar.

---

## Acceptance walk — Sarah sharpening the ICP

1. Sarah arrives at ICP Studio. The hero shows the kicker + serif title + the live ICP statement.
2. Below: the 7-input form (Industry / Buyer / Size / Geo / Pain / Trigger / Proof window).
3. Below the form: the new 7-row panel (mark + field + sentence + state pill) on the LEFT + the new right-side aside (score + weakest field + broad-version-to-avoid + downstream changes) on the RIGHT.
4. As Sarah edits a field, both the row and the aside update live.
5. The "weakest field" callout names exactly which input to sharpen next.
6. When Sarah saves, the AnalyticsPanel surfaces the saved ICP + the cross-room outflow preview.
