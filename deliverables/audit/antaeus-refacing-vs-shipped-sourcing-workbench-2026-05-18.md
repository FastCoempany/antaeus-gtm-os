# Sourcing Workbench refacing audit — Program 6 / PR 13

**Audited:** 2026-05-18
**Winner:** `antaeus-sourcing-workbench-triptych-2026-04-17.html` — Variant 02 / Ticket Loom (line 278+)
**Auditor:** Claude (Program 6 / PR 13)

---

## Mind preservation — PASS

Canon §4.6 (Sourcing Workbench — Decision Bench) preserved end-to-end:

- ✅ Query cards drive prospect capture (QueryStudio shipped).
- ✅ Prospect records with leverage / entry-point / approach.
- ✅ Research surface (ProspectComposer shipped).
- ✅ Pipeline tabs (5-stage Kanban shipped: captured → researched → ready → pushed → dropped).
- ✅ Discipline: a prospect must pass thesis match before reaching Signal Console (HandoffStrip CTAs respect quality band).

No mind drift.

---

## Structural drift — partial

### A. Canon-aligned evolution (KEEP)

| Ticket Loom wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| 3-state tickets (green Ready / orange Needs one pass / red Sagging) hanging in space | **5-stage Kanban (captured → researched → ready → pushed → dropped)** | Canon §4.6 explicit on the 5-state lifecycle; wireframe's 3-state is a visual hook |
| Static hanging tickets at scattered absolute positions with rotation tilts | **Editable cards in ordered columns with NEXT/PREV stage navigation + quality score per card** | Phase 4 / Room 13 — operator must drive prospects forward, not arrange them spatially |
| Single example ticket per state ("Meridian", "Northstar", "VoltOps", "Beacon", "Apex") | **Live prospect list with per-card quality band + gap copy** | Operational surface, not demo |
| No cross-room handoff in wireframe | **HandoffStrip with Territory / Signal / Outbound CTAs** | Canon §6 compounding |

### B. Unforced drift (FIX in this PR)

| Ticket Loom wireframe | Shipped | Severity |
|---|---|---|
| **Loom-dock aside surfaces 3 interpretive lines** (Loom law / Week read / Operator move) so the operator sees what the workbench is saying | The Topbar surfaces 5 numeric stats (captured / researched / ready / pushed / total) but the workbench INTERPRETS nothing — operator gets counts, not a posture | 🟠 HIGH — same problem as Territory Architect pre-PR-12: the room counts but doesn't read |
| **Loom score** with a band label (e.g. "Shipping", "Working") | No posture score; only individual quality bands per card | 🟡 MED — workbench-level posture is the at-a-glance summary the operator needs |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Tactile hanging-ticket metaphor (absolute positioning + rotation tilts) | Drift-mode "Metaphor ornament" (CLAUDE.md Part IV §3) — aesthetic flourish, no functional value over a clean kanban |
| Loom-rail decorative line at the top | Aesthetic flourish — the column headers already group prospects |
| Hero pill row (3 ready / 4 under review / 5 sagging) | Topbar already surfaces these 5 stats numerically; a pill row would be a redundant summary |
| "Loom law" doctrine line | Doctrine moved out of visible surfaces per Phase 4 doctrine sweep — re-adding would revive "Doctrine in the first fold" drift |

---

## Fix scope (this PR)

1. **`lib/loom-read.ts`** (new) — pure `computeLoomRead({prospects, stats})` returning `{score, band, bandLabel, weekRead, operatorMove}`. Score is a 0-92 derived posture; band is one of `empty / loose / working / shipping`. Priority chains for weekRead + operatorMove so the prescription is always specific.
2. **`lib/loom-read.test.ts`** (new) — covers empty board / operator-move priority / week-read priority / score bands.
3. **`components/LoomRead.tsx`** (new) — mounts beneath the Topbar and above the bench grid. Reads off a `computed` over the existing `prospects` + `stats` signals so it re-renders on every push, drop, or stage change.
4. **`SourcingWorkbench.tsx`** — mounts `<LoomRead />` between Topbar and the bench grid.
5. **`sourcing-workbench.css`** — full `.sw-loom-read*` aside with band-tinted left rule (green shipping / blue working / orange loose / amber empty) + orange-accent Operator move line.

## Acceptance walk

- Empty room shows `EMPTY` band with "Capture the first name" operator move.
- Adding 5+ captured prospects with 0 researched flips week-read to "Names are piling up" + operator move to "Research one captured prospect."
- A board with 3+ ready prospects lifts band to `SHIPPING`.
- The operator-move line carries the orange-accent variant class.
- Existing Topbar stats + QueryStudio + ProspectComposer + Kanban + HandoffStrip all render unchanged.
- Mobile width (< 880px) collapses the 2-col aside grid to a single column.
