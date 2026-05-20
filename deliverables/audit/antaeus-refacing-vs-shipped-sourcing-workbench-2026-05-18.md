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
- ✅ Discipline: a prospect must pass focus match before reaching Signal Console (HandoffStrip CTAs respect quality band).

No mind drift.

---

## Structural drift — partial

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| 3-state tickets (green Ready / orange Needs one pass / red Sagging) hanging in space | 5-stage Kanban (captured → researched → ready → pushed → dropped) | Canon §4.6 is explicit on the 5-state lifecycle; the wireframe's 3 was a visual hook |
| Static hanging tickets at scattered absolute positions with rotation tilts | Editable cards in ordered columns with NEXT/PREV stage navigation + a quality score per card | Phase 4 / Room 13 — the operator moves prospects forward; they don't arrange them spatially |
| Single example ticket per state | Live prospect list with per-card quality band + gap copy | The room exists to work on real prospects, not show a demo |
| No cross-room handoff in the wireframe | HandoffStrip with Territory / Signal / Outbound CTAs | Canon §6 compounding |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| A right-side panel that names what shape the workbench is in this week and what to do today (a score + two plain-language lines) | The Topbar shows 5 numeric stats (captured / researched / ready / pushed / total) but doesn't say whether the workbench is producing or stalling — the operator gets counts, not a sense of where the work stands | 🟠 HIGH — same problem Territory Architect had before PR 12: the room counts but doesn't say anything about what the counts mean |
| The same panel also names a score and a band label (e.g. "Shipping", "Working") so the operator gets a one-second read of how the workbench is doing | No board-level read; only individual quality bands per card | 🟡 MED — the score gives a one-second read |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Tactile hanging-ticket metaphor (absolute positioning + rotation tilts) | Drift-mode "Metaphor ornament" (CLAUDE.md Part IV §3) — aesthetic flourish, no functional value over a clean kanban |
| Loom-rail decorative line at the top | Aesthetic flourish — the column headers already group prospects |
| Hero pill row (3 ready / 4 under review / 5 sagging) | The Topbar already surfaces these counts numerically |
| The wireframe's "law of the loom" doctrine line | Doctrine moved out of visible surfaces per the Phase 4 doctrine sweep — adding it back would revive "Doctrine in the first fold" drift |

---

## Fix scope (this PR)

1. **`lib/loom-read.ts`** (new) — pure `computeLoomRead({prospects, stats})` returning `{score, band, bandLabel, weekRead, operatorMove}`. Score is a 0-92 derived posture; band is one of `empty / loose / working / shipping`. Priority chains for both lines so the wording stays specific to the state.
2. **`lib/loom-read.test.ts`** (new) — covers an empty board, the priority chain for next-action, the priority chain for the week read, and the score bands.
3. **`components/LoomRead.tsx`** (new) — mounts beneath the Topbar and above the bench grid. Reads a `computed` over the existing `prospects` + `stats` signals so it re-renders on every push, drop, or stage change.
4. **`SourcingWorkbench.tsx`** — mounts `<LoomRead />` between Topbar and the bench grid.
5. **`sourcing-workbench.css`** — full `.sw-loom-read*` aside with a band-tinted left rule (green shipping / blue working / orange loose / amber empty) + an orange-accent line for the prescribed next action.

> Note: code identifiers like `computeLoomRead`, `LoomRead.tsx`, and `.sw-loom-read*` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the panel reads as plain sentences.

## Acceptance walk

- An empty room shows the `EMPTY` band with a "Capture the first name" next-action line.
- Adding 5+ captured prospects with 0 researched flips the week read to "Names are piling up" and the next-action line to "Research one captured prospect."
- A board with 3+ ready prospects lifts the band to `SHIPPING`.
- The next-action line carries the orange-accent variant class.
- Existing Topbar stats + QueryStudio + ProspectComposer + Kanban + HandoffStrip all render unchanged.
- Mobile width (< 880px) collapses the 2-col aside grid to a single column.
