# ADR-019 — Onboarding rebuild: the Earned Depth seeding flow

**Status:** Approved (founder-directed); build in progress
**Date:** 2026-06
**Governs:** the rebuild of onboarding (Phase 4 / Room 17) into the
Earned Depth seeding flow (canon Part III §12)

---

## Context

The shipped onboarding (7 steps: intro → company → role → category → ICP
→ one account → quota) seeds a thin workspace — one ICP, one account, a
quota. The founder reframed what onboarding should be: not a low-friction
form, but a deliberate **seeding** of the workspace deep enough that the
app "rises up to greet" the operator on the Dashboard — and honest about
the work that takes. That doctrine is canonized as **Earned Depth**
(canon Part III §12): we ask for heavy, judgment-laden work up front that
no automation can do, frame it as capitalizing an asset that pays a daily
dividend, and never apologize for it — we make it obviously worth it, in
real time.

The design was validated across a series of clickable prototypes (the
three cinematic "what it becomes" demos, the seed-to-alive "reveal," the
front-half flow, the heavy-middle deal flow, and the full stitched
walkthrough at `/seeding-flow.html`). This ADR is the build that turns
those prototypes into the real product.

## Decision

Rebuild onboarding as the **seeding flow** — a guided, payoff-gated,
interview-style flow that writes real data into the living rooms:

```
doorway → ICP (real choosing) → accounts → wake-up → live deals → quota → landing
```

Anchored on three things:

1. **The tier model (Earned Depth #6).** Required = ICP + the account
   list + **live deals (≥ 10, a hard floor with an honest edge case —
   fewer is allowed but the app says plainly it stays thin under ten)**.
   Invited (not gated), post-landing: proof, advisors, win/loss history.
2. **They bring judgment, the app brings depth.** Account *names* only
   (breadth is cheap); the enrichment finds the triggers/firmographics/
   heat. The heavy, only-they-know judgment lives at the *deal* level.
3. **The evidence margin.** Every ask carries a recessive, blue (system-
   intelligence role) "why we ask" note that opens to a **real, citable
   source** — never assertion. Sources are sourced, not blog-grade; where
   only secondary figures exist, the note stays directional.

### What it writes (the real integration surface)

The flow writes the same `gtmos_*` shapes the current `seedFromDraft`
uses, richer: `gtmos_icp_analytics` (sharpened ICP), `gtmos_sc_v4` +
`gtmos_signal_room_health` (the account list), `gtmos_deal_workspaces`
(the live deals), `gtmos_qw_inputs` + `gtmos_outbound_seed` (quota),
`gtmos_onboarding` (completion). Cloud mirror via the existing ADR-007
path. The living rooms (ICP Studio, Signal Console, Deal Workspace,
Quota Workback) are the durable home — onboarding seeds them; the
operator returns to them for the life of the account.

### Flag strategy

Opt-in, so the shipped onboarding is untouched until the new flow is
done: renders only behind `room_onboarding_seeding` (Posthog) or the
`?seeding=1` preview hatch (`?seeding=0` forces off). When complete, flip
the flag to default-on and retire the old surface (same pattern as the
v3 design-system flip).

### The enrichment dependency

The wake-up and the deal diagnoses depend on the enrichment backend (the
web-search-grounded trigger-finder — the same pattern as Outdoors Events
discovery + the Briefing pipeline). That's a separate engineering track;
the seeding flow stubs the reads until it's wired, and the honest "quiet
— nothing fresh yet" read covers genuine coverage gaps.

## Build slices

- **Slice 1 (this ADR):** the flow shell + the sourced evidence margin
  (`src/onboarding/seeding/`) + the doorway, flag-gated. ✅
- **Slice 2:** ICP real-choosing → writes the sharpened ICP.
- **Slice 3:** accounts paste → Signal Console.
- **Slice 4:** the wake-up (enrichment reads; stubbed → wired).
- **Slice 5:** live deals → Deal Workspace, the diagnosis per deal.
- **Slice 6:** quota → Quota Workback.
- **Slice 7:** landing → Dashboard + the invited-tail handoff.

## Consequences

- The new flow lives behind a flag; zero blast radius on the shipped
  onboarding until cutover.
- The evidence margin is a reusable, sourced, voice-gated module — the
  "harder to fool than I am" principle made physical at setup.
- The heavy lift happens once; new deals after onboarding come one at a
  time, half-filled from in-app work (cold call → deal, discovery → deal
  state). The integration-driven auto-capture (Gmail/Outlook/CRM) is
  parked per founder direction.
