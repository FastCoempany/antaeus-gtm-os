# Phase 46 - Cross-Module Compounding Rules

Date: 2026-03-26

## Objective
Make the app behave like one system by defining exactly how inputs, updates, suggestions, and quality signals should compound across modules.

## Why This Phase Exists
Phase 45 defined the automation dial:

- manual
- suggested
- inferred
- auto-generated

But the app still needs the next layer:

- what fills what
- what updates what
- what should trigger downstream guidance
- how confidence should travel

Without that, even good modules still risk feeling like tabs with light glue.

Phase 46 closes that gap by defining the compounding rules explicitly.

## Core Rule
No core module should only improve itself.

Every meaningful save should do at least one of these:

- strengthen a downstream suggestion
- update a shared operating summary
- change a quality or confidence read somewhere else
- make the handoff kit more complete

If it does none of those, it is not compounding enough.

## Compounding Layers

### Layer 1 - Activation Context
The app should not keep asking who the user is or what motion they are in.

The base context object is:

- `gtmos_activation_context`

It should influence:

- welcome
- dashboard
- settings
- quota framing
- ICP Studio framing
- discovery framing

This is the “who is using the system and what are they trying to do” layer.

### Layer 2 - Workspace Summary
The cross-module truth object is:

- workspace summary from `window.gtmPersistence.workspace.loadSummary(...)`

It should influence:

- nav nudges
- welcome action ranking
- dashboard command view
- readiness
- handoff kit completeness
- signal, outbound, and deal recommendations

This is the “what is already real” layer.

### Layer 3 - Module-Specific Handoffs
These are smaller state objects that should move between adjacent modules:

- `gtmos_call_handoff`
- `gtmos_readiness_snapshot`
- `gtmos_handoff_exported`
- `gtmos_demo_seed_meta`
- linked deal/account/advisor ids inside module-local records

This is the “what should happen next right now” layer.

### Layer 4 - Handoff Kit Completion
The supreme output remains:

- [app/founding-gtm/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)

So every compounding rule should be judged partly by:

- whether it improves handoff completeness
- whether it improves handoff credibility
- whether it reduces reliance on founder memory

## What Fills What

### Identity and activation
| Source | Fills / Influences | Rule |
|---|---|---|
| Onboarding | Welcome, Dashboard, Settings, ICP framing, Discovery framing, Quota framing | `gtmos_activation_context` should be read before asking the user to restate role, stage, category, or ACV context. |
| Welcome | Dashboard, first-week rhythm, top-module choice | Welcome should rank the next move from real workspace state instead of static copy. |
| First-week lifecycle | Welcome, Dashboard, Nav | The current milestone state should influence return nudges and first-session action priority. |

### Targeting and market intelligence
| Source | Fills / Influences | Rule |
|---|---|---|
| ICP Studio | Territory Architect, Sourcing Workbench, Signal Console, Outbound Studio, Discovery surfaces, Readiness, Handoff Kit | The best saved ICP should be the default targeting context everywhere else unless the user overrides it. |
| Territory Architect | Sourcing Workbench, Signal Console | Territory tiering and theses should shape sourcing and account-priority suggestions. |
| Sourcing Workbench | Signal Console, Territory Architect | Pushed prospects should arrive with tier recommendation and next Signal Console action, not as detached records. |
| Signal Console | Outbound Studio, LinkedIn Playbook, Dashboard, Readiness, Handoff Kit | Hottest accounts and strongest signals should become default outbound context and alter dashboard urgency. |

### Outbound and contact motion
| Source | Fills / Influences | Rule |
|---|---|---|
| Outbound Studio | Dashboard, LinkedIn Playbook, Signal Console, Readiness, Handoff Kit | Saved angles and logged touches should become shared motion truth, not page-local drafts. |
| LinkedIn Playbook | Dashboard, Handoff Kit | Logged LinkedIn actions should count as real motion and reuse account/signal context from outbound or signal surfaces. |
| Cold Call Studio | Dashboard, Deal Workspace, Handoff Kit, Readiness | Logged call outcomes should update motion truth and, when tied to a deal, push pressure back into the deal record. |

### Discovery and deal execution
| Source | Fills / Influences | Rule |
|---|---|---|
| Call Planner | Discovery Studio, Deal Workspace | `gtmos_call_handoff` should carry agenda quality, linked deal, and next move into Discovery Studio and deal review. |
| Discovery Studio | Deal Workspace, Handoff Kit, Readiness | Worked moves and current-call truth should affect whether the deal looks prepared versus thin. |
| Deal Workspace | Future Autopsy, PoC Framework, Advisor Deploy, Dashboard, Readiness, Handoff Kit | Deal stage, next-step quality, and pressure should be the main control plane for downstream execution modules. |
| Future Autopsy | Deal Workspace, Call Planner, Discovery Studio, PoC Framework | Failure-pattern diagnosis should route the user into the exact surface most able to change the outcome. |
| PoC Framework | Deal Workspace, Dashboard, Handoff Kit | Linked proof state should sync back into the deal record and affect handoff and dashboard trust. |
| Advisor Deploy | Deal Workspace, Dashboard, Handoff Kit | Advisor usage should not live in a side log; it should update the linked deal’s pressure and history. |

### Planning and synthesis
| Source | Fills / Influences | Rule |
|---|---|---|
| Quota Workback | Dashboard, Outbound Studio, Cold Call Studio, Deal Workspace, Readiness | Quota math should become execution pressure and weekly targets, not isolated planning math. |
| Readiness | Dashboard, Welcome, Handoff Kit | `gtmos_readiness_snapshot` should be reusable system truth for guidance and handoff credibility. |
| Founding GTM / Handoff Kit | Readiness, Dashboard, future launch readiness | Export history and section completeness should affect how “ready” the system claims to be. |

## What Updates What

### Save events that should update shared state immediately
| Event | Should Update |
|---|---|
| save ICP | workspace summary, welcome action ranking, dashboard stage, readiness, handoff completeness |
| save / push prospect | Signal Console recommendations, territory state, welcome ranking when no live account exists |
| save signal research | dashboard urgency, outbound defaults, readiness, handoff source depth |
| save outbound angle / touch | dashboard motion count, readiness, week-one milestone state |
| save LinkedIn action | dashboard motion count, handoff operating evidence |
| log cold call outcome | dashboard motion truth, linked deal history when present, handoff evidence |
| save call agenda | discovery handoff, linked deal preparation state, discovery default context |
| save discovery run | deal preparation truth, readiness, handoff evidence |
| save deal / change deal stage | dashboard, future autopsy, PoC, advisor deploy, readiness, handoff |
| save PoC | linked deal proof state, dashboard, handoff |
| log advisor deployment | linked deal pressure/history, dashboard, handoff |
| apply quota workback | dashboard pressure, outbound expectations, readiness |
| export handoff kit | readiness, dashboard trust state |

## Downstream Suggestion Triggers

### Suggestion triggers that should exist system-wide
| Trigger | Downstream Suggestion |
|---|---|
| no ICP exists | Welcome, Dashboard, Nav, Tour all push ICP Studio first |
| ICP exists but no live account/signal | Suggest Signal Console / Sourcing next |
| live account exists but no deal exists | Suggest Deal Workspace or Outbound next depending on motion state |
| deal exists with no next step | Suggest Deal Workspace or Call Planner depending on stage |
| agenda exists with linked deal | Suggest Discovery Studio next |
| discovery run exists but deal is thin | Suggest Deal Workspace qualification or Future Autopsy |
| deal enters PoC stage | Suggest PoC Framework |
| deal pressure rises and advisor fit exists | Suggest Advisor Deploy |
| quota entered but motion thin | Suggest Outbound / Calls |
| handoff export missing and readiness high | Suggest Founding GTM export |

### Trigger priority rule
When multiple suggestions are possible, rank them in this order:

1. unblock a missing prerequisite
2. rescue a live deal
3. create the next piece of operating truth
4. deepen planning or synthesis

That keeps the app from recommending nice-to-have work ahead of urgent real work.

## Confidence and Quality Flow

### Rule 1 - Quality should move downstream, not restart at zero
If one module already knows something is thin, the next module should inherit that doubt.

Examples:

- a broad ICP should weaken sourcing confidence
- a thin agenda should weaken discovery confidence
- a weakly qualified deal should weaken PoC confidence
- a sparse handoff kit should weaken readiness confidence

### Rule 2 - Confidence should be contextual, not universal
Do not invent one mega score.

Instead, preserve local quality reads and let them influence nearby modules:

- ICP quality
- sourcing readiness
- signal heat
- outbound quality
- agenda quality
- qualification quality
- proof quality
- readiness score

### Rule 3 - Downstream modules should explain inherited weakness
If a module is weaker because of upstream truth, it should say so plainly.

Examples:

- “This deal is thin because qualification is still weak.”
- “This motion is still forming because account signal depth is low.”
- “This handoff section is partial because discovery evidence is sparse.”

## Concrete Confidence Flow Map

| Upstream Quality | Downstream Consumer | Effect |
|---|---|---|
| ICP quality | Territory, Sourcing, Signals, Outbound, Discovery | sharper ICP raises confidence; broad ICP lowers recommendation confidence |
| Sourcing readiness | Signal Console, Outbound | stronger sourcing evidence raises suggested tier and next move confidence |
| Signal heat / freshness | Outbound, LinkedIn, Dashboard | hotter and fresher signals increase motion urgency |
| Agenda quality | Discovery Studio, linked deal prep | thinner agenda should reduce discovery confidence and push stronger prep language |
| Deal qualification quality | Future Autopsy, PoC, Advisor Deploy, Dashboard, Readiness | weak qualification should raise risk and reduce readiness confidence |
| PoC proof quality | Deal Workspace, Dashboard, Handoff Kit | stronger proof raises handoff credibility and proof-readiness |
| Handoff completeness | Readiness, Dashboard | richer handoff sections should increase final “ready to hire” confidence |

## Rules For Shared Objects

### `gtmos_activation_context`
Should be treated as:

- default framing
- not final operating evidence
- safe to infer from
- always overrideable

### Workspace summary
Should be treated as:

- the system’s primary cross-module read model
- the input to welcome, dashboard, nav, and tour logic
- the preferred source for ranking suggestions

### `gtmos_call_handoff`
Should be treated as:

- short-lived but durable enough to bridge planner into discovery and deals
- replaced by fresher handoff state when a newer call is prepared

### `gtmos_readiness_snapshot`
Should be treated as:

- reusable synthesis
- not source truth
- safe to consume in dashboard, welcome, and handoff framing

## Highest-Priority Compounding Gaps Still To Implement

### 1. Context carryover is still too light
The app still does not infer enough:

- current best ICP
- current hottest account
- linked deal context
- role/category/stage framing

### 2. Downstream suggestions are not consistently ranked
Some modules now hand off well, but the app still lacks a truly unified suggestion layer.

### 3. Quality inheritance is still patchy
Many modules now show local quality, but that quality does not always travel far enough downstream.

## Immediate Design Consequences

### Consequence 1
Future UI work should prefer:

- reading shared context
- explaining inherited context
- ranking the next module

over adding fresh empty forms.

### Consequence 2
Every save path should now be judged by:

- what shared state changed
- what downstream recommendation changed
- whether handoff completeness improved

### Consequence 3
Phase 47 and later integration work should align to this map instead of inventing a second system of truth.

## Exit Criteria Read

### Met locally
- what fills what is now explicit
- what updates what is now explicit
- downstream suggestion triggers are now explicit
- confidence and quality flow are now explicit
- the app has a real compounding rulebook instead of general handshake language

### Still requires later implementation
- stronger shared recommendation engine
- richer quality inheritance in runtime
- more consistent cross-module defaulting
- event-based compounding beyond local save flows

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-46-cross-module-compounding-rules-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-46-cross-module-compounding-rules-2026-03-26.md)

## Status
`local-patch`
