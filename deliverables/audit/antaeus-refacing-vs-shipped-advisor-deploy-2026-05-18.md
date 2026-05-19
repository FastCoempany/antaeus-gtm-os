# Advisor Deploy refacing audit — Program 6 / PR 15

**Audited:** 2026-05-18
**Winner:** `antaeus-advisor-deploy-radical-triptych-v2-2026-04-20.html` — Variant 01 / Backchannel Desk (line 706+)
**Auditor:** Claude (Program 6 / PR 15)

---

## Mind preservation — PASS

Canon §4.16 (Advisor Deploy — Live Instrument, "private influence desk") preserved end-to-end:

- ✅ Deal × advisor × ask-moment routing.
- ✅ 10 ask-moments + tier table + cooldown engine.
- ✅ Outcome stamps (Send / Hold / Reroute).
- ✅ Spend-read score band.
- ✅ Cross-room handoff (Deal Workspace / Future Autopsy / PoC).
- ✅ Advisor effect writes back into `gtmos_deal_workspaces`.

No mind drift.

---

## Most of the refacing is already in

Advisor Deploy is the most-faithful-to-winner room in the set. Phase 4 / Room 10 shipped the desk with every wireframe surface mounted: hero + spend-read score + 3-cell route bar + proof blotter + rolodex + ask sheet + 3 outcome stamps + 4-cell desk-edge footer. Visually + structurally the room already reads as the Backchannel Desk.

---

## Structural drift — narrow

### A. Canon-aligned evolution (KEEP)

| Backchannel Desk wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Static example tabs ("Maya Chen", "Rafi Mehta", "Elena Park") | **Live rolodex of top-4 registered advisors, ranked by exact-match** | Phase 4 / Room 10 — the room must work over the operator's actual advisor registry |
| Static "82" spend-read number | **Live `computeSpendRead` 30-92 score with band** | Decision-grade signal, not display |
| No URL inbound | **`?deal=` inbound + auto-select by id or accountName** | Cross-room handoff plumbing per canon §6 |

### B. Unforced drift (FIX in this PR)

| Backchannel Desk wireframe | Shipped | Severity |
|---|---|---|
| **Rolodex carries an explicit "Do not use" anti-tab** ("Board member is too expensive for this ask.") | The rolodex surfaces top-4 advisors but never makes COST visible. A T1 board member shown alongside a T3 angel reads as equally available — no warning that deploying the T1 burns capital that should be saved for a higher-stakes signal | 🟡 MED — canon §4.16's "trust is spent, not spent" is invisible at the routing surface; the anti-tab is the discipline cue the wireframe specifically calls out |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rotated paper sheets / textured surfaces | Already shipped — the cream ask-sheet + dark blotter give the tactile feel |
| Multiple "Do not use" cards | The wireframe shows a single anti-tab; one cost cue is enough discipline |

---

## Fix scope (this PR)

1. **`lib/deploy-cost.ts`** (new) — pure `deployCost(advisor, momentId)` returning `"too-expensive"` (T1 on low-stakes intro/reference/renewal) | `"underpowered"` (T4 on high-stakes board_decision/eb_bridge/budget_kill) | `null`. Plus `findDoNotUseCandidate(advisors, momentId, activeAdvisorId)` that picks the single most relevant cost-flagged advisor for the current moment (prefers too-expensive over underpowered; skips the active advisor since the operator picked them deliberately).
2. **`lib/deploy-cost.test.ts`** (new) — covers both branches + middle-tier null + registry candidate selection + active-advisor skip + preference order + reason copy.
3. **`DeskBoard.tsx`** — computes `doNotUse` candidate and renders an `.ad-rolodex__antitab` article at the end of the rolodex grid when a cost flag fires.
4. **`advisor-deploy.css`** — full `.ad-rolodex__antitab*` styling: dashed red border (too-expensive) or dashed orange border (underpowered), strike-through advisor name, `DO NOT USE` kicker. Anti-tab is intentionally NOT a button so the operator can't accidentally deploy it.

## Acceptance walk

- With a T1 advisor in the registry and `intro` selected as ask moment, an anti-tab renders naming the T1 advisor with "Save board capital" reason copy.
- Switching to `board_decision` (high-stakes) hides the anti-tab on T1 (no longer too-expensive) and shows it on T4 instead if a T4 is registered.
- The anti-tab is NOT clickable (no `<button>`).
- The 4 active rolodex tabs still render and remain clickable.
- The hero + 3-cell route + blotter + ask sheet + stamps + desk edge all render unchanged.
