# Deal Workspace re-audit — Program 6 / PR 6

**Audited:** 2026-05-18
**Winner:**
1. `antaeus-deal-workspace-variant-02-selected-2026-04-08.html` (overall variant lock)
2. `antaeus-deal-workspace-board-area-triptych-v2-2026-04-08.html` — variant "Intervention Rail" (founder lock: "lower board rebuilt from Intervention Rail")

**Auditor:** Claude (Program 6 / PR 6)

**Status of 2026-05-01 bootstrap punch list:**

| Bootstrap finding | Status (this audit) |
|---|---|
| Vertical stack of sections | ✅ **Closed** — Phase 2.6 audit added the 2-col `dw-stage-grid` (Hero + TargetFolio); MicroGrid + LaneGrid + controls remain stacked but match the wireframe's same below-stage-grid arrangement. |
| Overlay modal where wireframe wanted inline tabbed detail | ✅ **Closed** — Phase 6 polish (post-PR-#63) replaced the residual DealHealthModal overlay with inline DealHealthForm rendered inside the TargetFolio. `dw-target-folio--editing` swaps the dock+panel area in place. |
| Spine missing | ✅ **Closed by retirement** — Phase 2.6 explicitly retired the spine rail as "decoration without operating value." Wordmark in `ant-room-chrome` provides brand presence. |
| Lower board rebuild from Intervention Rail | 🔴 **OPEN** — the lower board is still the Phase 2.6 LaneGrid (summary cards) + FilterBar + DealList (table) trio. The founder's lock note says "lower board rebuilt from Intervention Rail." This is the one piece of the 2026-04-08 lock that hasn't shipped. **This PR closes it.** |

---

## Mind preservation — PASS

Canon §4.13 (Deal Workspace — Diagnosis Table) preserved end-to-end:

- ✅ Recovery board with intervention-first posture ("not a Kanban").
- ✅ 9-field deal-health detail (champion, EB, use case, pain, competition, process, notes, forecast, momentum).
- ✅ Recovery queue + deal-health panel.
- ✅ Cross-room flows: deal pressure into Future Autopsy, PoC, Advisor; loss patterns into Founding GTM §6.

No mind drift.

---

## Structural drift — only one item remains

### A. Things the shipped room evolved past the wireframe + already-closed (KEEP)

| Variant 02 / Intervention Desk wireframe | Shipped | Justifying evolution |
|---|---|---|
| 2-col stage-grid (Hero + TargetFolio) | ✅ `.dw-stage-grid` | Phase 2.6 audit |
| Target-folio with signal-grid + folio-dock 4 tabs + inline tabbed detail | ✅ `dw-target-folio` + signal-grid + FolioDock + DealHealthForm inline | Phase 2.6 + Phase 6 polish |
| 3-button hero-actions (Run intervention / Open at-risk only / New deal) | ✅ Demoted to one quiet "Find weakest →" button | Phase 2.6 — the wireframe's 3 buttons overlapped with the new FilterBar + FolioDock affordances |
| Hero sub paragraph | ✅ Retired | Phase 2.6 — "design documentation that competed with the work" |
| Spine left rail | ✅ Retired | Phase 2.6 — "decoration without operating value" |
| MicroGrid (3 stat tiles) | ✅ Matches wireframe |
| Lane summary (Now / Next / Keep honest with state + headline + copy + meta) | ✅ Matches wireframe Variant 02's `lane-grid` |
| Controls strip with filter + actions | ✅ FilterBar |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Intervention Rail wireframe (founder-locked lower board) | Shipped | Severity |
|---|---|---|
| **Single Intervention Rail** combining toolbar + Now/Next/Keep honest rows with **actual deal tickets** (edge color + name + detail + value + action button per ticket) + reserve tags | LaneGrid (summary cards, no actual tickets) + FilterBar (filter chips, separate) + DealList (separate searchable table) | 🟡 MED — three components doing what the wireframe accomplishes in one. The Intervention Rail surfaces individual deals INSIDE the lanes, not as a separate table below. |

---

## Fix scope — this PR

1. **`InterventionRail.tsx`** (new) — single component replacing LaneGrid + FilterBar + DealList with the Intervention Rail composition:

   - **Toolbar at top:**
     - Search input ("Search intervention docket")
     - Pill counts: [Now N] [Next N] [Reserve N] — clicking a pill scopes the rail (replaces FilterBar chips)
     - Primary action button: "Run intervention" → routes Sarah to the first Now-lane ticket's recovery move
   - **Rail layout (3 rows):**
     - **Now** — full deal tickets (edge color = lane tone; name + 3 signal details + value + action button "Recover now" / "Stress-test")
     - **Next** — full deal tickets
     - **Keep honest** — compact reserve tags (signal label + account name), not full tickets — the wireframe pattern for "65 deals don't need 65 cards"

2. **Refactor `DealWorkspace.tsx`** — mount `<InterventionRail />` in place of `<LaneGrid />`, `<FilterBar />` (its standalone position retired; chips moved into rail toolbar), and `<DealList />`.

3. **Retire orphaned components** — `LaneGrid.tsx`, `FilterBar.tsx`, `DealList.tsx` deleted with their CSS. The new InterventionRail handles all three jobs.

4. **State adapter** — the `dealFilter` signal stays (rail toolbar pills bind to it); the `focusedDealId` signal stays (clicking a ticket pins it as the focal case in TargetFolio).

### What this PR does NOT change

- TargetFolio, FolioDock, DealHealthForm, MicroGrid, Hero, HandoffStrip, LossReasonModal — all stay.
- Recovery ranking engine (`rankRecovery`, `assessDeal`) — InterventionRail consumes the same output.
- `dealFilter`, `focusedDealId`, `editingDeal`, `folioTab` signals.

---

## Acceptance — Sarah running the recovery rail

1. Sarah lands on `/deal-workspace/`. Eye lands on the **2-col stage-grid** at top: Hero on left, TargetFolio (Northstar Health, the focal case) on right.
2. Below the MicroGrid: the **InterventionRail**.
3. The rail toolbar shows: search input, three pill counts ([Now 3] [Next 1] [Reserve 65]), and "Run intervention" primary CTA.
4. **Now row** carries the 3 active drags as full tickets — each with a risk-edge color, deal name, 3 signal details, value, and action button ("Recover now").
5. **Next row** carries the one Next-lane ticket (the top-valued live deal worth tightening).
6. **Keep honest row** shows the remaining 65 deals as compact reserve tags ("Thin proof · Meridian", "7d stale · Cascadia", etc.) — Sarah scans for any she should reclassify, doesn't drown in cards.
7. Clicking a ticket → pins the deal as the focal case in TargetFolio at the top of the room.
8. Clicking a pill (e.g. "Reserve 65") filters the rail to show ONLY that lane.
9. Search box scopes by account name across all lanes.
