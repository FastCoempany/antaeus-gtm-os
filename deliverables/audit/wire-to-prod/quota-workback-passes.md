# Quota Workback — wire-to-production adversarial passes

**Room:** Quota Workback (Wave B / 3) · surface `src/quota-workback/v4/` · default via `room_quota_workback_v4` (kill-switch `room_quota_workback_v4_off`, preview `?v4=1`).
**Settled design:** `deliverables/mockups/quota-workback-pace-strands-2026-07-07.html` · **Capability map:** `deliverables/room-capability-maps/quota-workback-capability-map-2026-07-07.html`
**Reviewer:** author verification + wave-batch adversarial reviewer (queued). Date 2026-07-08.

## Result: GO (author verification)

Net-new build. The calc engine (`computeMetrics`/`benchmarkFor`), coverage (`computeCoverage` via state's `refreshCoverage`), persistence, and handoff builders are reused unchanged. New v4 lib (`pace.ts`): actuals read (outbound + linkedin + cold-call logs + the deal mirror, month/YTD windows, working-day math), the believability judgment (names the ONE optimistic assumption vs the benchmark + its cost, with a set-it-and-re-run fix), and the pace projection (closed-won YTD + weighted pipeline at stage odds — never a fabricated trend).

### Pass 1 — Mind & Capability (author)
- The two reads: **plan** (no quota → the number + typical-deal form; no fake pace) and **pace** (verdict headline "you finish the year around $X — $Y short", the target track, the two fused strands: what-your-number-needs ⟷ where-you-actually-are, believability + coverage welded into each column). The daily habit is the dominant state; the believability honesty (the room's soul) names the stretch + cost; coverage is live from Deal Workspace.
- §13-clean face: messages & calls a day / real opportunities / first meetings — no touches/opps/m2o rendered (scan clean).

### Pass 3 — Live-runtime (author)
- Boots clean (0 pageerrors) in pace mode with seeded logs + deals; strands + judgments + back-on-pace + handoff all live. 5/5 pace tests + engine suite untouched; typecheck clean.

## Flagged (pre-existing engine behavior, NOT changed)
The shipped calc engine (legacy-faithful port) treats touch→meeting as a percent with default **0.7%**, which makes the derived daily number very large (e.g. ~200/day for a $1.2M number at benchmark rates). The v4 surface renders the engine's truth faithfully; changing the math or default is a mind/engine change requiring founder sign-off — flagged for a founder look, not silently altered.
