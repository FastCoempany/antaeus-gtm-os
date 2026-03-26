# Phase 48 - Launch Agent Product Strategy

Date: 2026-03-26

## Objective
Decide how the standalone launch agent relates to the main app so it stops being strategically strong but product-boundary ambiguous.

## Why This Phase Exists
The launch agent is real.

It has:

- a standalone runtime
- its own dashboard
- its own local data model
- its own workflows for scouting, composing, mapping, qualifying, and reporting

That makes it powerful.

It also makes it dangerous to position loosely.

If the boundary stays vague, three bad things happen:

1. the core app starts feeling incomplete without it
2. the launch agent starts getting mistaken for a default product layer
3. pricing, activation, and demo story all get blurrier instead of cleaner

Phase 48 exists to stop that.

## Product Decision
The launch agent should **stay separate** from the core app.

It should **not** be part of:

- default onboarding
- welcome
- demo lane
- tour
- self-serve first-session activation
- the base product promise

Its role should be:

- a separate operator sidecar
- for advanced sourcing / warm-outreach workflows
- used in guided-beta, operator-heavy, or founder-led execution contexts

## What The Launch Agent Is
The launch agent is:

- a local operator workstation
- for prospect-universe building
- persona-aware outreach drafting
- warm-path / advisor-path mapping
- reply qualification
- weekly reporting on that workflow

It is best understood as:

- an outbound execution sidecar
- not the core GTM operating system

## What The Launch Agent Is Not
The launch agent is not:

- the main app
- the primary onboarding corridor
- the explanation of the product
- the product new users should hit first
- the default path to value
- the product's system of record

It should also not become:

- a hidden dependency for the main app to feel useful
- a reason the core app starts feeling half-built without Browserbase or Anthropic keys

## Why "Keep Separate" Is The Right Call

### 1. Runtime complexity is too high for core activation
The launch agent depends on:

- Node
- local files
- Browserbase
- Anthropic
- separate environment setup

That is incompatible with the current best self-serve app path.

### 2. It solves a narrower job than the main app
The main app is the broader operating system:

- targeting
- signals
- motion
- calls
- discovery
- deals
- proof
- advisors
- readiness
- handoff

The launch agent is much narrower:

- prospecting and outreach operations

That is valuable, but it is not the same product layer.

### 3. The launch agent is advanced, not foundational
A new user should not need:

- local dashboard setup
- Browserbase research configuration
- separate review queues

before the main app makes sense.

### 4. It weakens the public story if merged too early
Right now, the main app story is becoming clearer:

- demo
- activation
- execution modules
- handoff kit

If the launch agent gets merged too early, the public story gets noisier:

- is Antaeus a browser app
- a local agent
- an outbound research bot
- a founder operating system
- or all of them at once

That ambiguity is not worth it right now.

## Why "Internal-Only" Is Too Narrow
The launch agent should not be treated as purely internal forever.

Why not:

- it already has real user-facing workflow value
- it fits a specific advanced user type
- it could become a premium or guided-beta sidecar later

So the right position is not:

- hide it forever

It is:

- keep it separate now
- use it in guided or advanced contexts
- commercialize only once the boundary is clearer

## Why "Bundle As Premium Now" Is Too Early
Do not position it as a premium upsell yet.

Why not:

- the main app boundary is still becoming more explicit
- the launch agent still depends on a setup burden most buyers will not want in their first evaluation
- a premium layer should feel like acceleration, not like another product to configure

A premium offer could exist later, but only after:

- the core app is fully legible on its own
- the launch agent has proven repeatable demand
- the setup/runtime burden is lower or more managed

## Why "Integrate Partially" Still Matters
The right answer is not "fully separate and never touch."

Partial integration should exist, but only as a shallow bridge.

That means:

- shared language
- shared recommendations
- optional exports
- optional imports of useful summaries

Not:

- merged activation
- merged shell
- merged pricing
- merged runtime dependency

## Recommended Boundary

### Current role
Separate operator sidecar for advanced outbound execution.

### Current audience
Best fit today:

- founder-led teams doing high-discipline outbound
- operators running warm-outreach campaigns
- guided-beta users who need prospecting/research leverage
- internal/operator workflows

### Current commercial status
Not part of the base self-serve promise.

### Current activation rule
Do not mention it in the default activation corridor.

### Current demo rule
Do not make it part of the public demo lane.

## Allowed Bridges To The Main App

### Allowed now

- mention in internal/operator docs
- mention in guided-beta workflows
- export useful outputs back into the main app
- use shared terminology so the workflows do not feel disconnected

### Good future bridges

- push approved prospect/account summaries into Signal Console or Territory logic
- push qualified outreach insights into Dashboard or Handoff Kit
- export weekly launch-agent reports into the main app as a reference artifact

### Not allowed yet

- launch-agent step inside onboarding
- launch-agent CTA inside welcome as a default next move
- launch-agent as a required step for handoff quality
- launch-agent on the main public pricing path

## Commercial Recommendation

### Now
Keep separate.

### Near future
Use as:

- guided-beta sidecar
- operator workflow layer
- possibly founder-plus-operator power tool

### Later
Only if proven, position as one of:

- premium outbound sidecar
- operator edition
- concierge-assisted workflow layer

But not before the core app no longer needs boundary protection.

## Positioning Sentence
If the product needs one sentence internally, it is:

Antaeus Launch Agent is an advanced outbound execution sidecar for founder/operator workflows, not the core Antaeus app.

## Decision Summary

### Resolved
- keep separate: yes
- bundle as premium now: no
- integrate partially: yes, but only shallowly
- internal/operator only: not permanently, but effectively yes for now in go-to-market terms

### Final call
Keep separate now, allow shallow bridges, and treat it as an advanced operator sidecar until the core app and launch-agent demand both justify a stronger commercial link.

## What This Phase Unlocks Next
Phase 48 gives later work a real boundary for:

- Phase 49 team / advisor / seat model
- Phase 50 automation quality controls
- future product packaging decisions
- future launch-agent export/import bridges

Without this phase, launch-agent work would keep creating ambiguity in the main app story.

## Exit Criteria Read

### Met locally
- the launch agent role is explicit
- the default product boundary is protected
- current commercialization stance is explicit
- partial integration is defined without runtime confusion

### Still requires later implementation
- if shallow bridges are chosen later, implement them explicitly
- if commercialization changes later, update pricing and packaging surfaces explicitly

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-48-launch-agent-product-strategy-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-48-launch-agent-product-strategy-2026-03-26.md)

## Status
`local-patch`
