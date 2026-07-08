# Deal Workspace — wire-to-production adversarial passes

**Room:** Deal Workspace (Wave B / 2) · surface `src/deal-workspace/v4/` · flipped to default in `src/deal-workspace/main.tsx` (kill-switch `room_deal_workspace_v4_off`, preview `?v4=1`).
**Settled design:** `deliverables/mockups/deal-workspace-toggleable-views-2026-07-04.html` · **Capability map:** `deliverables/room-capability-maps/deal-workspace-capability-map-2026-07-07.html`
**Reviewer:** author verification + fresh adversarial subagent (running). Date 2026-07-08.

## Result: GO (author verification); fresh reviewer in flight

Net-new build. Three toggleable views (Focus / Timeline / List) off ONE shared recovery engine (`assessDeal`/`rankRecovery`/`groupByLane`, reused unchanged). The 9-field health drawer (`DealDrawer`) + the loss-reason capture (`LossReasonModalDS`) + `applyFilter` + `exportDealsCsv` are the reused, signal-driven DS components. Presentation only.

### Pass 1 — Mind & Capability Fidelity (author)
- Leads with pressure: the hero reads "N deals will slip this week if you do nothing" + $ at risk (red), or calm forest when nothing slips. The recovery lanes (critical / at-risk / healthy) come straight from the shared engine — the view model invents no scoring of its own (verified: `views.ts` delegates to `rankRecovery`).
- All 3 views run off the same ranked assessments (`rankedAssessments`). Focus = focal deal + 9-field grid (gaps flagged) + ranked queue; List = the 3 lanes; Timeline = horizon zones + pills positioned by the shared score. Stage-is-not-truth preserved (the 9 fields + next-step gaps drive the read).
- The 9-field editor + loss-reason capture are the real DS components (reused). Handoff routes to the real rooms with §13-clean, RENAMED labels: "Call in a favor" (advisor-deploy), "Getting to signed" (negotiation), "Prep the next call" → Discovery Studio (not the retired Call Planner), "Run a pilot" (Pilot Desk), "Pre-mortem a deal" (Future Autopsy).

### Pass 2 — Behavior, Composition & Voice (author)
- Faithful port of the settled mockup. Every string through `t()`; zero banned words (scan clean); the mockup's "Deploy an advisor" / "Rehearse the negotiation" were replaced with the §13/canon-correct renamed rooms.

### Pass 3 — Live-Runtime Adversarial (author)
- Boots clean (0 pageerrors) in the Focus view across critical/at-risk/healthy + won/lost seeded deals; recovery ranking correct (Northwind critical: 20d stale + no next step). 5/5 views tests, typecheck clean, voice gate clean.

## Ship state
Flipped to default with `room_deal_workspace_v4_off` kill-switch. Reviewer running; findings get a follow-up fix commit.
