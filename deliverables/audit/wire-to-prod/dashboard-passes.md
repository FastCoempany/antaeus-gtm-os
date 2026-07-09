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

## Fresh-reviewer pass: NO-GO → fixed → GO

The fresh adversarial reviewer returned **NO-GO** with one critical + several real findings — all fixed and re-verified.

- **FIXED [HIGH — the big one] The standing row read guessed snapshot shapes; 4 of 5 doors were false-green on real data.** `buildStanding` invented `topName` / `title`+`meta` / `onPace` / `readyCount` fields that no shipped publisher writes — so Hottest, Pace, Dying, and Handoff rendered empty or false-green (e.g. "On pace" for any workspace, worst deal never surfacing) — the exact "green unit test, broken live" trap (my test fed the guessed shapes). Now aligned to the **real** publishers: `topAccountName` (signal), `sections_ready` (founding), `top_pressure[].accountName`+`cause` (deal), and Pace is a **real coverage check** (pipeline vs `monthly_target × coverage_target`) instead of a nonexistent flag. The test now uses the real publisher shapes so it would catch a future drift.
- **FIXED [MED — §13 leak on the masthead] The next-stage line rendered raw `gateBlockers` from the readiness engine, which contained hard-bans** — "Cast a proof in PoC Framework." / "Deploy an advisor…" / the dimension label "Proof & memory". Scrubbed at the **engine source** (`src/lib/readiness/verdict.ts` + `types.ts`) → "Run a pilot that gives a buyer's boss a result they can act on." / "Call in a favor — a backchannel ask on a real deal." / "Pilot evidence". This fixes both the Dashboard masthead AND the future Readiness room; readiness tests still green.
- **FIXED [MED — voice] `cockpit.ts` bypassed `t()` entirely.** All gate labels, door keys, and value/sub copy now go through `t()` (voice gate covers them).
- Deferred (low): `nextTwo` repeats the current move at exactly board length 2; standing doors route to the room not the specific object.

## Reconcile with founder (Part IV §4 — capability-map vs the locked mockup)
The settled 2026-07-04 cockpit mockup (founder-locked) **does not** carry two things the 07-07 capability map lists under "must never be flatten":
1. The **Brief / Spotlight / Queue** density-mode switcher — the cockpit folds them into one surface (verdict read = Brief, the one move = Spotlight, skip-the-board = Queue) but has no explicit mode toggle.
2. The **"this week's reads"** workspace-observations surface (the prior today surface had it).

The wire-up matches the **locked mockup**. Whether the cockpit *supersedes* those primitives (update the capability map + canon §4.2) or should restore them is a founder call — flagged, not silently resolved.

## Ship state
Flipped to default with `room_dashboard_v4_off` kill-switch (reverts to the today surface, then legacy). Standing row verified against real publisher shapes; masthead §13-clean; 8/8 cockpit tests + readiness suite green.
