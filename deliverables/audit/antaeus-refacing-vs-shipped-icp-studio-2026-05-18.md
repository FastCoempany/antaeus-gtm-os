# ICP Studio refacing audit — Program 6 / PR 5

**Audited:** 2026-05-18
**Winner:** `antaeus-icp-studio-triptych-2026-04-17.html` — variant "Variant 01 / Wedge Ledger"
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

### A. Canon-aligned evolution (KEEP)

| Wedge Ledger wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Dark hero band above bright work area | **Bright hero with orange left rule** (cream gradient + orange accent) | **Founder directive 2026-04-27 / ADR-002 retirement of dark exception.** The component is still called `DarkHero` for backwards-compat but renders bright per canon Part II §1. |
| Simple display-only state | **WorkArea with 7-input form + 4 build outputs + Save bar + AnalyticsPanel** | Phase 4 / Room 11 — the shipped is more concrete (actual inputs you can change) than the wireframe's display-only treatment. |

### B. Unforced drift (FIX)

| Wedge Ledger wireframe | Shipped | Severity |
|---|---|---|
| **7-row ledger** with mark/field/copy/state pill — the variant's signature visual ("Locked / Runnable / Tighten / Good / Thin / Missing / Clear") | **`icp-quality__checks` list** rendering quality engine `checks[]` as a flat tone-classed list (good/warn/risk) | 🔴 HIGH — the ledger treatment carries the variant's name. The shipped data IS the same ground but unstructured + missing the per-field naming. |
| **RunDocket aside** — right column with big score + weakest-field + broad-version-to-avoid + downstream-changes blocks | **`icp-quality__head`** carrying score + label + summary; no broad-version-to-avoid or downstream-changes affordance | 🟡 MED — the docket organizes the same data into operator-readable blocks. Without it the score reads as a chip; with it the score becomes a run-read. |
| **Active wedge statement** as a huge sentence-shaped line with colored spans (`<span class="hot">…</span>`) | `icp-hero__statement` paragraph in the hero — sentence-shaped but smaller/quieter visual treatment | 🟢 LOW — the shipped is sentence-shaped (canon-aligned); only the visual weight is less anchored. |

---

## Cross-cutting drift signals

- **Modal-overlay pattern** → ICP Studio has no modals/overlays. ✅ N/A.
- **Sentence-shaped thesis headers** → Hero H1 is sentence-shaped ✅; the "Active wedge" statement is sentence-shaped ✅.

---

## Fix scope — this PR

Bucket B drift gets these specific fixes:

1. **`WedgeLedger.tsx` (new)** — 7-row ledger derived from the draft inputs. Each row:
   - mark (number + tone-colored dot)
   - field name (Industry / Buyer / Size / Geo / Pain / Trigger / Proof window)
   - field copy (authored sentence describing the current shape; falls back to "Not set yet." when empty)
   - state pill (Locked / Runnable / Tighten / Good / Thin / Missing / Clear) — derived from input emptiness + a per-field specificity heuristic
   Doesn't reshape the quality engine; both surfaces consume the same draft inputs.

2. **`RunDocket.tsx` (new)** — right aside with:
   - Big score (delegates to `buildIcpQuality`) + tier label
   - "Weakest field" block — first empty/thin field
   - "Broad version to avoid" block — operator-voice anti-pattern
   - "Downstream changes" block — what Territory / Sourcing / Outbound / Discovery will adopt once the wedge is saved
   - Saved-count footer

3. **2-column work block layout** — WorkArea reflows. The existing form + build outputs stay; the QualityReadout's check-list display is replaced by a 2-col layout: `WedgeLedger` on the left + `RunDocket` on the right. The score chip + summary stay in the hero (no duplication).

### What this PR does NOT change

- The quality engine, persistence, handoff, cloud sync, AnalyticsPanel — all stay.
- The 7-input form + template panel + role toggle — all stay; the new ledger READS from the same `draft` signal.
- The hero (DarkHero) treatment — already bright per ADR-002.
- The save bar.

---

## Acceptance — Sarah refining the wedge

1. Sarah arrives at ICP Studio. Hero shows the kicker + serif title + the live statement.
2. Below: the 7-input form (Industry / Buyer / Size / Geo / Pain / Trigger / Proof window).
3. Below the form: **WedgeLedger** (7 rows, mark + field + copy + state pill) on the LEFT + **RunDocket** (score + weakest + broad-avoid + downstream) on the RIGHT.
4. As Sarah edits a field, both the ledger row and the docket update live.
5. The "Weakest field" callout in the docket names exactly which input to sharpen next.
6. When Sarah saves, the AnalyticsPanel surfaces the saved wedge + the cross-room outflow preview.
