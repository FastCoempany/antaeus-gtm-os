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

### A. Things the shipped room evolved past the wireframe (KEEP)

| Backchannel Desk wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Static example tabs ("Maya Chen", "Rafi Mehta", "Elena Park") | **Live rolodex of top-4 registered advisors, ranked by exact-match** | Phase 4 / Room 10 — the room must work over the operator's actual advisor registry |
| Static "82" spend-read number | **Live `computeSpendRead` 30-92 score with band** | The score has to react to the deal + advisor + ask the operator is actually routing, not a static number |
| No URL inbound | **`?deal=` inbound + auto-select by id or accountName** | Cross-room handoff plumbing per canon §6 |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Backchannel Desk wireframe | Shipped | Severity |
|---|---|---|
| **Rolodex carries an explicit "Do not use" card** ("Board member is too expensive for this ask.") | The rolodex shows the top-4 advisors but never tells the operator that one of them would be wrong to use. A T1 board member sits next to a T3 angel as if they're equivalent — the cost of pulling the T1 (which is meant for higher-stakes asks) isn't visible | 🟡 MED — canon §4.16 says "trust is spent, not spent." If the operator can't see when they're about to waste a board favor on a routine intro, that principle is invisible. The wireframe's "do not use" card is what makes the cost legible. |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rotated paper sheets / textured surfaces | Already shipped — the cream ask-sheet on top of the dark blotter does the "this is a desk, not a CRM" work without the rotations |
| Multiple "Do not use" cards | The wireframe shows a single card; one is enough — more would clutter without adding signal |

---

## Fix scope (this PR)

1. **`lib/deploy-cost.ts`** (new) — pure `deployCost(advisor, momentId)` returning `"too-expensive"` (T1 on low-stakes intro/reference/renewal), `"underpowered"` (T4 on high-stakes board_decision/eb_bridge/budget_kill), or `null` when the match is fine. Plus `findDoNotUseCandidate(advisors, momentId, activeAdvisorId)` picking the single advisor most worth warning about (prefers too-expensive over underpowered; skips the currently-active advisor since the operator picked them deliberately).
2. **`lib/deploy-cost.test.ts`** (new) — covers both branches + middle-tier null + registry candidate selection + active-advisor skip + preference order + reason copy.
3. **`DeskBoard.tsx`** — computes the `doNotUse` candidate and renders an `.ad-rolodex__antitab` article at the end of the rolodex grid when the helper returns a candidate.
4. **`advisor-deploy.css`** — full `.ad-rolodex__antitab*` styling: dashed red border (too-expensive) or dashed orange border (underpowered), strike-through advisor name, "DO NOT USE" kicker. The card is intentionally not a button so the operator can't accidentally deploy it.

> Note: the CSS class name `.ad-rolodex__antitab` was authored under the old voice and stays as a code identifier per canon Part III §11. In the audit prose the element is called "the do-not-use card" to match the wireframe.

## Acceptance walk

- With a T1 advisor in the registry and `intro` selected as the ask moment, the do-not-use card renders naming the T1 advisor with a "Save board capital" reason line.
- Switching to `board_decision` (high-stakes) hides the card on T1 (no longer too-expensive) and shows it on T4 instead if a T4 is registered.
- The card is not clickable (no `<button>`).
- The 4 active rolodex tabs still render and remain clickable.
- The hero + 3-cell route + blotter + ask sheet + stamps + desk edge all render unchanged.
