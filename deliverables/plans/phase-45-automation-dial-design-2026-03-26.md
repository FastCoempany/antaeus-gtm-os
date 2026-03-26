# Phase 45 - Automation Dial Design

Date: 2026-03-26

## Objective
Deliberately decide what should remain manual, what should be suggested, what should be inferred, and what should be auto-generated across the app.

## Why This Phase Exists
The product is now much stronger end to end, but it still leans heavily on disciplined operator behavior.

That is not automatically bad. The problem is when the manual burden is accidental instead of intentional.

Phase 45 exists to stop that drift.

The point is not:

- automate everything
- make the app feel magical
- hide all judgment behind AI

The point is:

- keep high-judgment decisions manual
- convert repetitive friction into suggestions or inference
- auto-generate only where trust stays intact
- make the burden model explicit before more automation gets added

## The Dial

### 1. Must Remain Manual
Use this when:

- the input is strategic
- the user is asserting intent
- the input is irreversible or commercially sensitive
- the system cannot infer it without quietly lowering trust

Examples:

- choosing the real ICP wedge
- deciding whether a deal is actually real
- selecting a proof boundary in PoC
- confirming destructive workspace actions

### 2. Should Be Suggested
Use this when:

- the user still should decide
- the system can rank likely options credibly
- the app already has enough context to narrow the field

Examples:

- suggested next motion
- suggested deal tier
- suggested advisor deployment moment
- suggested call outcome follow-up

### 3. Should Be Inferred
Use this when:

- the value already exists somewhere else in the workspace
- asking again would be redundant
- the user should only override it when the inference is wrong

Examples:

- role context from onboarding
- product category in discovery surfaces
- linked account/deal/persona context across connected modules
- current stage / pressure from the deal record

### 4. Should Be Auto-Generated
Use this when:

- the output is a transformation or synthesis of already-known inputs
- quality can be explained
- the user can still inspect or override the result

Examples:

- score bands
- readiness unlocks
- motion briefs
- handoff exports
- worked-move summaries

## Global Rules

1. Never ask for a known value twice.
2. Do not make the user type ids, labels, or categories already stored elsewhere.
3. Manual input is acceptable only when it carries real judgment.
4. Suggested input must say why it was suggested.
5. Inferred input must remain overrideable.
6. Auto-generated output must expose its source logic.
7. Destructive actions always stay manual and explicit.
8. The app should infer first, suggest second, ask manually third.

## Module-by-Module Automation Dial

| Surface | Key Inputs | Must Remain Manual | Should Be Suggested | Should Be Inferred | Should Be Auto-Generated |
|---|---|---|---|---|---|
| Onboarding | role, company, category, buyer, stage, quota, ACV | role, buyer, stage, quota, ACV | category choices, benchmark framing | company/profile context if known | activation preview, benchmark band, seeded-state summary |
| Welcome | first move selection, orientation | none | top-ranked next actions | activation context, week-one state, role, current maturity | milestone map, action ranking, workspace focus summary |
| Dashboard | none in normal use | none | next action emphasis, recovery queue order | workspace summary, active stage, risk pressure, readiness snapshot | command brief, maturity stage, Monday view, weak-source warnings |
| Settings | export/import/delete intent, category change | export/import/delete confirmation, role-reset confirmation | safer recovery path, next backup timing | current sync source, backup status, current mode | trust grid, scope labeling, source-state readout |
| ICP Studio | industry, size, geo, primary buyer, pain, trigger, proof window | final wedge choice, primary pain, primary trigger | standardized option sets, next ICP refinement | role/category/stage context, company, quota band | ICP quality score, ambiguity warnings, sharp-vs-broad contrast, downstream impact |
| Territory Architect | thesis, account grouping, territory edits | thesis edits, intentional tier changes | next thesis to build, account clustering, tier recommendation | best saved ICP, current territory gaps | territory bridge, object-model guidance, next-output logic |
| Sourcing Workbench | prospect seed, account choice, manual notes | final prospect inclusion, confidence override | first approach, territory tier, push-to-territory recommendation | ICP fit, account context, contact context when available | sourcing score, readiness band, research summary, next move |
| Signal Console | account to research, account keep/discard | final keep/discard decision | next account to research, suggested play | linked ICP, territory tier, recent signals, related account context | heat score, research state, next-move explanation, freshness logic |
| Outbound Studio | account/contact choice, temperature override, final message edits | final send/log intent, custom nuance | motion type, trigger framing, next action | linked account, persona, trigger, stage, signal context | motion brief, quality band, drafted angle, persistence summary |
| Cold Call Studio | call notes, objection capture, outcome | live notes, objection truth, outcome truth | callback timing, follow-up lane, stage transition suggestion | linked account, contact, prior touch context | mode framing, script adaptation, call stats, outcome feedback loop |
| LinkedIn Playbook | actual action taken, note text | actual action log | recommended play, next touch, sequence order | best ICP, hottest account, recent outbound context | play rationale, prefilled action flow, channel brief |
| Discovery Agenda | agenda edits, contact truth, linked deal override | final agenda content, real stakeholder truth | next questions, gate priorities, deal link suggestion | linked account, role, product category, active deal stage | agenda quality score, gate checklist, handoff path |
| Discovery Studio | live notes, marked worked moves | live call truth, manual worked/not-worked judgment | framework lane, next exploration move, objection lane | agenda context, product category, linked deal, stakeholder context | worked-loop summary, current call context, framework guidance |
| Deal Workspace | new deal creation, stage truth, next-step truth | stage, close judgment, next-step ownership | next-step date, close date, qualification focus | linked account, category, ICP, prior touches, advisor history | qualification score, recovery queue, stale pressure, stage-aware defaults |
| Future Autopsy | run choice, task completion truth | whether the failure pattern is real | next module to visit, top failure pattern | deal stage, elapsed time, missing next step, qualification weakness | timing label, pattern summary, routed action cards |
| PoC Framework | success criteria, proof boundaries, readout owner | final proof standard, boundaries, owner | linked deal, proof structure, next proof checkpoint | linked deal stage, account context, current risk pressure | proof quality score, stage bridge, export packages |
| Advisor Deploy | advisor choice, ask nuance, outcome truth | final ask, final advisor usage, outcome | recommended moment, ask structure, escalation lane | deal stage, pressure, cooldown, existing advisor coverage | deployment recommendation, deal-linked ask scaffold, next-step sync |
| Quota Workback | quota, ACV, win rate, cycle | final planning assumptions | benchmark posture, weekly targets, handoff route | current pipeline state, role, stage | operating plan, quality read, math summary, downstream pressure |
| Founding GTM / Handoff Kit | optional edits before export | final export decision, optional founder edits | weak-section priority, section clean-up order | all module outputs, readiness snapshot, dashboard state | handoff-readiness summary, section states, export package |
| Readiness | no direct inputs beyond optional action clicks | none | biggest unlock priority | all durable module evidence, stage, quota context | score, verdict, dimension breakdown, unlocks, action list |

## Highest-Priority Burden Reductions

These are the burden cuts this phase says should happen next:

### 1. Stop Re-Asking for Context
The app should infer and carry forward:

- product category
- role
- best ICP
- linked account
- linked deal
- current stage
- recent signal pressure

This is the biggest single manual-burden reducer across discovery, outbound, deal, and proof surfaces.

### 2. Turn Static Recommendations into Ranked Suggestions
The app should not merely say “go here next.”

It should rank suggestions using:

- stage
- missing evidence
- signal heat
- stale pressure
- current lifecycle milestone

### 3. Auto-Generate More Synthesis, Not More Truth
The app should auto-generate:

- summaries
- scores
- next-move candidates
- export bundles
- comparison views

It should not auto-generate:

- fake deal truth
- final proof standards
- final buyer commitment
- destructive control decisions

### 4. Keep Channel Logging Human
Cold call, LinkedIn, outbound, and discovery still need manual truth capture.

The system can help frame and prefill, but the actual operating truth should remain human-entered unless and until real integrations exist.

## What This Phase Intentionally Leaves Manual

These should stay manual even after later automation phases:

- destructive actions in Settings
- final ICP wedge choice
- final deal stage truth
- proof boundaries in PoC
- advisor ask nuance
- call notes and objection capture
- final handoff export decision

## What This Phase Unlocks Next

Phase 45 gives later work a hard policy for:

- Phase 46 compounding rules
- Phase 47 integration decisions
- Phase 48 launch-agent boundary decisions
- Phase 50 automation quality controls

Without this, later automation would be opportunistic and inconsistent.

## Exit Criteria Read

### Met locally
- every core surface now has an explicit automation posture
- manual burden is now classified instead of accidental
- the system has a written rule for when to ask, suggest, infer, or generate
- high-risk manual areas are intentionally preserved

### Still requires later implementation
- reduce repeated context entry across modules
- implement more inference where the policy now says it belongs
- implement stronger ranked suggestions
- enforce quality and explainability rules in future automation work

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-45-automation-dial-design-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-45-automation-dial-design-2026-03-26.md)

## Status
`local-patch`
