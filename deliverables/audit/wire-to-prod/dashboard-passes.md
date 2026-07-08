# Dashboard — wire-to-production adversarial passes

**Room:** Dashboard (Wave A / 3) · surface `src/dashboard/v4/` · flipped to production default in `src/dashboard/main.tsx` (kill-switch `room_dashboard_v4_off`, preview `?v4=1`; falls back to the today surface, then legacy).
**Settled design:** `deliverables/mockups/dashboard-CHOSEN-complete-2026-07-04.html` · **Capability map:** `deliverables/room-capability-maps/dashboard-capability-map-2026-07-07.html`
**Reviewer:** author verification + fresh adversarial subagent (running). Date 2026-07-07.

## Result: GO (author verification); fresh-reviewer pass in flight

Net-new build composing the existing engines unchanged: the command-intelligence ranking (`commandSummary`), the readiness verdict (`readinessSummary`), the cross-room snapshot aggregator, and the shipped `ReadinessDrawer`. Presentation only.

### Pass 1 — Mind & Capability Fidelity (author)
- The masthead leads with **where the whole motion stands**: the readiness verdict + the 5-gate ladder (done/on/next/todo mapped off `VERDICT_RANK`) + the "what gets you to the next stage" line (first gate blocker). Faithful to the mockup.
- The one move is the **ranked command board**: the spotlight (or the focused object); **skip cycles** the board via `setFocusedCommand` without leaving; "then: <next two>" preview. The ranking keeps showing its reasoning (`explainCommandObject`).
- The standing row: **each part is a door** — Deals / Hottest / Pace / Dying / Handoff, derived defensively from the health snapshots, each routing with continuity params.
- "See the whole thing" opens the readiness drawer. **Note:** the drawer is currently the shipped `ReadinessDrawer` (bars/dimensions); the settled *climb* drawer lands with the Readiness room (Wave B / 4) and will replace it — the always-visible masthead (verdict + ladder + next-stage) is faithful now.
- Nothing re-does Signal Console, Briefing, or Future Autopsy — the standing row links out to them.

### Pass 2 — Behavior, Composition & Voice (author)
- One dominant move (the orange board CTA), ≤3 planes, semantic color (forest done / amber on / blue next / red bad). Faithful port of the mockup. Every chrome string through `t()`; zero banned words.
- **FIXED (caught in the live boot)** — the H1 template `You're {verdictLabel}.` produced the ungrammatical "You're You are the system." for the base verdict. `buildMasthead` now composes a grammatical headline per verdict ("Right now, you're the system." / "You're Building."). Regression test added.

### Pass 3 — Live-Runtime Adversarial (author)
- Boots clean (0 pageerrors) with seeded data across the masthead + board + standing + drawer trigger. `buildStanding` degrades to calm defaults on an empty workspace (Holding / Not set / 0 of 7) — no throw. Skip cycles safely at board length 0/1. Money formatter + snapshot reads defensive.
- 6/6 cockpit tests, typecheck clean, voice gate green.

## Follow-ups
- The **climb drawer** (settled Readiness design) replaces the bars drawer when Readiness (Wave B/4) ships — Dashboard's "See the whole thing" will point at it with no Dashboard change.
- A fresh adversarial reviewer is running; any confirmed findings get a follow-up fix commit (kill-switch protects prod).

## Ship state
Flipped to default with `room_dashboard_v4_off` kill-switch (reverts to the today surface, then legacy).
