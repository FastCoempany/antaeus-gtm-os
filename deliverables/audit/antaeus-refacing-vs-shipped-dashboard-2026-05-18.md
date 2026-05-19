# Dashboard refacing audit — Program 6 / PR 2

**Audited:** 2026-05-18
**Winner:** `dashboard-softcut-canonical.html` (Slice 01 Soft Cut, refined from `dashboard-systems-triptych-2026-04-04.html` System 01F / Command Docket)
**Auditor:** Claude (Program 6 / PR 2)

---

## Mind preservation — PASS

The shipped Dashboard preserves canon §4.2 (Command Chamber family) end-to-end:

- ✅ Three density modes (Brief / Spotlight / Queue per canon)
- ✅ The ranking engine (892-line port from legacy)
- ✅ Workspace-health snapshot consumption from sibling rooms (`gtmos_deal_workspace_health` / `gtmos_signal_room_health` / `gtmos_readiness_snapshot` / `gtmos_quota_targets`)
- ✅ EmptyDashboard orientation surface
- ✅ One dominant move per surface (FocalObject)
- ✅ Cross-room handoff URLs carrying continuity params

No mind drift. The room knows the right things; the question is structural fidelity.

---

## Structural drift — partial; some forced by canon evolution

Compared against the Slice 01 Soft Cut canonical wireframe, two distinct categories of drift:

### A. Things the shipped room evolved past the wireframe (KEEP — don't revert)

These deltas are deliberate, traceable to canon updates that post-date the Soft Cut wireframe (which was locked 2026-04-04):

| Soft Cut wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Huge hero (Outfit clamp 68–114px) | Compact serif H1 (clamp 22–32px) | **Phase 2.2 audit (PR #99)** — "thesis H1 demoted; the ranked spotlight is now the visual hero." Mind-correction landed 2026-05-XX. The triptych pre-dated this. |
| 3D perspective mode carousel | Flat 3-button ModeSwitcher | **Phase 2.2 audit (PR #99)** retired the carousel hint in favor of the simpler tab strip. Carousel was striking but reduced information density. |
| No Readiness affordance | ReadinessAnchor in topbar + ReadinessDrawer overlay | **Phase 5.A (PR #47)** added Readiness Score as the dashboard topbar anchor per canon §4.17 mind-rewrite. The triptych pre-dated this entirely. |
| Tone vocabulary (hot/warm/live/cold) | Family vocabulary (risk/move/advisor/opportunity/icp/system) | **Phase 2.2 audit** locked the family vocabulary as the canonical semantic spine for ranked items. Family carries operational meaning (which room family the item belongs to) where Soft Cut's tone vocabulary was sensory. |

These all stay.

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

These deltas have no canonical justification and represent honest structural drift from the picked winner:

| Soft Cut wireframe | Shipped | Severity |
|---|---|---|
| **2-column layout** (fluid main + fixed 520px rail) | Single-column with topbar above mode views | 🔴 HIGH — the rail-driven shape is Soft Cut's signature. Sarah scans the ranked items in her peripheral vision while the main column carries narrative + actions. |
| **Slice card shape** (left+right split with card-name + 3-row docket + footer / dollar amount + 3 tone rules + 6px left tone-color rule) | FocalObject (Spotlight) + flat QueueRail rows + Queue list items | 🔴 HIGH — the docket-with-tone-rules shape is the characteristic visual signature. Generic card patterns lose the "instrument-like" feel canon §4.2 requires. |
| **Signal-line chip row** (hot/warm/live/cold counts inline) | Absent — kicker tail only | 🟡 MED — the chip row gave Sarah a glanceable workspace-state read above the action set. Topbar kicker carries some of this but not visually. |
| **Meta-shelf** (small light card carrying "what changed since last open") | Absent | 🟢 LOW — useful but not signature. Can be deferred. |
| **No left wordmark in hero** (Soft Cut put it in the topline) | Wordmark in `ant-room-chrome` strip above the hero | ✅ ALIGNED — the canonical RoomChrome from Program 6 / PR 1 supersedes this. Same intent, different mounting point. |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

Checked against the two cross-cutting patterns the bootstrap flagged:

- **Modal-overlay pattern** → Dashboard's ReadinessDrawer IS an overlay, but it's a synthesis-layer overlay (verdict + math), not a structural surface drift. ✅ JUSTIFIED.
- **Sentence-shaped thesis headers** → The H1 "What is under the most pressure right now." IS sentence-shaped. Soft Cut's hero was sentence-shaped too but VISUALLY ANCHORED at much larger size. The shape is correct; the weight is demoted (per Phase 2.2 evolution). ✅ JUSTIFIED.

Neither bootstrap drift signal applies to Dashboard.

---

## Fix scope — this PR

Bucket B unforced drift gets these specific fixes:

1. **2-column layout** — Dashboard.tsx becomes `db-shell` with two grid columns: `db-shell__main` (fluid) + `db-shell__rail` (520px). The rail is always visible; mode views adapt their content within / above the rail.

2. **`Slice` component** — new component renders one ranked CommandObject in the Soft Cut slice shape:
   - Left panel: card-name (title) + 3 score-reason rows (mapped from `scoreReasons`) + footer (copy + family flag)
   - Right dock: `metricValue` (dollar amount when present) + 3 tone rules whose colors derive from `commandFamily`
   - 6px left tone-color rule on the left panel
   - Honest port — no Risk/Proof/Motion abstraction shoehorned in. Uses what the engine already produces.

3. **`SignalLine` component** — chip row above the rail showing ranked counts per family (e.g. "3 RISK / 2 MOVE / 1 ADVISOR"). Sits in the main column.

4. **Mode content adapts to the rail-driven layout:**
   - `BriefView` → renders the narrative paragraph in the main column above the SignalLine; the rail shows all ranked items as Slices.
   - `SpotlightView` → the first Slice in the rail is visually emphasized (focused state); secondary Slices render below at standard weight.
   - `QueueView` → all Slices render at equal weight (today's QueueView list is replaced by stacked Slices in the rail).

5. **Updated Playwright walk** — assert the new 2-column structure, Slice presence, SignalLine row, and that all three modes render Slices in the rail.

### What this PR does NOT change

- Mind layer (ranking engine, snapshot aggregation, EmptyDashboard, ReadinessAnchor + Drawer)
- Phase 2.2 H1 demote + family vocabulary + flat ModeSwitcher (canon evolution preserved)
- Cross-room handoff behavior
- `commandSummary` shape (consumed by the new components without changes)

---

## Acceptance — Sarah's Tuesday-morning walk after this PR

1. Sarah opens `/dashboard/` Tuesday at 8:47 AM.
2. Eye lands on the **rail** on the right — three Slices stacked, each with a card-name + 3-row docket + dollar amount on the right dock + tone-colored left rule.
3. Peripheral vision picks up the **signal-line** chip row in the main column: she sees "3 RISK / 2 MOVE" at a glance.
4. Mode switcher in topbar — she can switch between Brief (narrative summary appears above the rail) / Spotlight (first slice in rail enlarges) / Queue (all slices equal weight).
5. Click any Slice → routes via continuity params to the room that owns the underlying CommandObject.
6. The shape feels like an instrument, not a dashboard bundle. (Canon §1 emotional territory passes.)
