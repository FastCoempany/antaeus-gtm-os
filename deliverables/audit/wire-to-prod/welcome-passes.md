# Welcome — wire-to-production adversarial passes

**Room:** Welcome (Wave A / 2) · surface `src/welcome/v4/` · flipped to production default in `src/welcome/main.tsx` (kill-switch `room_welcome_v4_off`, preview `?v4=1`).
**Settled design:** `deliverables/mockups/welcome-flow-landing-2026-07-07.html` · **Capability map:** `deliverables/room-capability-maps/welcome-capability-map-2026-07-07.html`
**Reviewer:** fresh adversarial subagent (did not build the room). Date 2026-07-07.

## Result: GO (after fixes)

Net-new build. The adversarial pass returned **NO-GO** with 2 SEVERE + several moderate findings — all real, all fixed and re-verified. Final: **6/6 landing tests, typecheck clean, voice gate green, boots clean, renders faithful.**

### Pass 1 — Mind & Capability Fidelity
- Verified: the move comes from the same command-intelligence engine the Dashboard uses; the "what the system saw" read never repeats the one move (filters spotlight.id); operating line from counts + pipeline; day-one vs re-entry reuse one shape.
- **FIXED [SEVERE 1.1]** — the day-one headline hardcoded "the one **deal**", but on the canonical onboarding→Welcome path the seed writer writes `gtmos_signal_room_health` (not `gtmos_deal_workspace_health`), so the pick was always an Outbound *move* and the headline lied. Now (a) `buildLanding` calls `warmUpMissingSnapshots` (same as the Dashboard) so a deal risk card can win, and (b) the headline noun is **family-aware** — "the one deal" only when the spotlight is a risk/deal, else "the first move that needs you."
- **FIXED [SEVERE 1.2]** — Welcome skipped `warmUpMissingSnapshots`, so it could disagree with the Dashboard's pick. Now both warm the same snapshots → same board. The false "never disagree" comment is now true.

### Pass 2 — Behavior, Composition & Voice
- One dominant move, ≤3 planes, no progress bar / no "all done" — the "never gamified, no finish line" guardrail holds. Faithful port of the settled mockup.
- **FIXED [2.1]** — the highest-visibility copy (kicker/headline/sub/pick noun) was raw string literals bypassing the voice gate. Now routed through `t()` so the gate covers the vocabulary. Zero banned words.
- Deferred (low): the saw "time" column defaults to "now" on most rows (mockup shows varied 2w/now/today) — cosmetic, follows a future richer-observation pass.

### Pass 3 — Live-Runtime Adversarial
- No throw path: defensive reads for deal-health JSON, missing/zero/negative pipeline, absent activation context; lifecycle marks seen AFTER capturing the lifecycle (first visit day-one).
- **FIXED [SEVERE 3.1]** — the day-one sub fabricated "You seeded 0 deals and 0 accounts… the dividend the setup promised" on a thin workspace (reachable via kill-switch / preview / re-run). Now guarded: on 0 counts the sub degrades honestly and never claims a dividend. Regression test asserts the sub contains no "dividend" / "0 deals" / "0 accounts".
- Deferred (cosmetic): money formatter `[999.5k–999.9k]` renders "$1000k"; the dead `variant !== ghost` filter (engine never sets variant) — harmless.

## Ship state
Boots clean (0 pageerrors), renders faithful to the mockup. Flipped to default with `room_welcome_v4_off` kill-switch.
