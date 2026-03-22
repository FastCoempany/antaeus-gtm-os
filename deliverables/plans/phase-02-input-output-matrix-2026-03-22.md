# Phase 2 - Surgical Input / Output Matrix

Date: 2026-03-22  
Companion to: [phase-01-promise-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-01-promise-matrix-2026-03-22.md)

## Why Phase 2 Exists
Phase 1 defined what every surface promises.

Phase 2 defines how the product actually has to work if every surface is going to deliver on that promise and also handshake with the rest of the system.

This is not a page-by-page feature list. It is the operating specification for:
- what must go in
- what must come out in one session
- what must persist
- what must feed something downstream
- what the demo seed must simulate
- what the handoff kit must eventually inherit

## Core Product Doctrine

### 1. The handoff kit is the supreme output
The product is not done when a user has clicked around modules.

The product is done when the workspace can produce a believable GTM operating system that another human could inherit. In the repo today, that supreme output lives in [app/founding-gtm/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html) and pulls from:
- `gtmos_playbook`
- `gtmos_outbound_seed`
- `gtmos_deal_outcomes`
- `gtmos_cold_call_log`
- `gtmos_advisor_registry`
- `gtmos_advisor_deployments`
- `gtmos_playbook_notes`
- `gtmos_handoff_exported`
- `gtmos_autopsy_log_v1`
- plus ICP, signals, deals, discovery stats, touches, LinkedIn log, and readiness metrics

Every meaningful module must do one of four things:
- create operating context
- create execution evidence
- create decision quality
- create handoff-safe institutional memory

If a module does none of those, it is ornamental.

### 2. Demo seed is not a side feature
Demo seed is the explainer engine, the tour engine, and the trust engine.

If a module cannot look good and make sense under demo seed, then:
- the tour will feel empty
- the explainer video will feel fake
- the welcome corridor will not convert
- the module will read as conceptual instead of operational

### 3. Every module must handshake
No module should feel like a dead-end worksheet.

Every module should clearly answer:
- what upstream state it expects
- what downstream surfaces consume its output
- what the user should do next
- what demo data must exist so the module feels real on first load

### 4. One-session value is mandatory
A module does not get credit for "could be useful later."

Within one session, it must produce:
- a saved artifact
- a decision
- a prioritized list
- a score
- a plan
- a message draft
- a risk callout
- or some other durable, inspectable output

## Canonical Workspace Spine

### Core durable tables / state
- Profile / onboarding
- ICPs
- Deals
- Signal Console accounts
- Discovery frameworks
- Discovery call logs
- Sequences / docs store

### Durable docs store already in use
- `gtmos_playbook`
- `gtmos_qw_inputs`
- `gtmos_outbound_seed`
- `gtmos_deal_quals`
- `gtmos_deal_outcomes`
- `gtmos_discovery_links`
- `gtmos_deal_reviews`
- `gtmos_account_planning`
- `gtmos_playbook_notes`
- `gtmos_handoff_exported`
- `gtmos_asset_builder_analytics`
- `gtmos_qual_texts`
- `gtmos_demo_seed_meta`
- `gtmos_advisor_registry`
- `gtmos_advisor_deployments`
- `gtmos_autopsy_log_v1`
- `gtmos_poc_data`
- `gtmos_cold_call_log`
- territory documents
- sourcing documents

### Local/demo state still important to experience
- `gtmos_onboarding`
- `gtmos_product_category`
- `gtmos_icp_analytics`
- `gtmos_deal_workspaces`
- `gtmos_deal_stage_history`
- `gtmos_sc_v4`
- `gtmos_discovery_stats`
- `gtmos_discovery_agenda`
- `gtmos_call_handoff`
- `gtmos_angles`
- `gtmos_outbound_touches`
- `gtmos_linkedin_log`
- `gtmos_tour_completed`
- `gtmos_demo_seed_meta`

## System Handshake Map

### Stage 0 - Identity and activation
`signup -> onboarding -> welcome -> dashboard`

Outputs that must exist before the app feels real:
- account
- onboarding answers
- product category
- outbound seed baseline
- initial playbook scaffold
- welcome guidance state

### Stage 1 - Who to target
`ICP Studio -> Territory Architect -> Sourcing Workbench -> Signal Console`

Outputs that must exist:
- named ICPs
- scored or tiered targeting logic
- sourced accounts or account universe
- signal-backed priority

### Stage 2 - How to contact them
`Outbound Studio -> LinkedIn Playbook -> Cold Call Studio`

Outputs that must exist:
- message angles
- touch strategy
- channel-specific moves
- logged touches/calls

### Stage 3 - How to run the conversation
`Discovery Studio -> Call Planner -> Deal Workspace`

Outputs that must exist:
- discovery framework
- call agenda
- buyer intelligence
- next-step discipline
- deal state

### Stage 4 - How to win without lying to yourself
`PoC Framework -> Advisor Deploy -> Future Autopsy`

Outputs that must exist:
- proof plan
- advisor deployment moments
- named kill risks

### Stage 5 - Can this motion scale
`Quota Workback -> Readiness Score -> Dashboard`

Outputs that must exist:
- quota math
- readiness judgment
- top risks / next moves

### Stage 6 - Can another human inherit this
`Founding GTM / Playbook -> Handoff export`

Outputs that must exist:
- coherent operating narrative
- evidence-backed playbook
- export history

## Demo-Seed Doctrine

Every module should be tagged one of:
- `demo-critical`: cannot be shown empty in a guided tour or explainer
- `demo-supported`: can be shown with light seeded context
- `demo-optional`: does not need deep seed to prove value

### Demo-critical modules
- Dashboard
- Welcome
- ICP Studio
- Signal Console
- Deal Workspace
- Discovery Studio
- Call Planner
- Outbound Studio
- Cold Call Studio
- PoC Framework
- Future Autopsy
- Readiness
- Quota Workback
- Founding GTM / Handoff Kit

### Seed payload already written by demo seed
The current [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html) writes:
- onboarding
- outbound seed
- playbook
- product category
- ICP analytics
- Signal Console accounts
- deals and stage history
- deal outcomes
- advisor registry and deployments
- outbound touches
- cold call log
- LinkedIn log
- angles
- discovery stats and agenda
- autopsy log
- PoC data
- playbook notes
- quota workback inputs
- demo seed metadata

This is good. The rule going forward is: if a module depends on a data shape not touched by demo seed, that module is at risk of failing during tour, welcome, or explainer use.

## Surface Matrix

### Public / Acquisition Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Landing page | convert attention into account creation or demo entry | none | click intent | analytics attribution | understanding + credible CTA choice | analytics events only | signup, login, demo seed | must explain the whole system in under 90 seconds | visitor still does not know what Antaeus actually does |
| Sign up | create account | Supabase Auth | name, email, password, role | auth routing | account created or confirmation state | auth user + analytics | onboarding | must feel safe and fast in live demo | crashes or opaque auth errors |
| Sign in | recover workspace access | existing auth user | email, password | route resolver | valid session + correct route | auth session | onboarding, welcome, dashboard | must route correctly in every explainer flow | user logs in and lands in wrong place |
| Forgot password | recover access | auth email flow | email | none | reset initiation | auth provider state | login | low demo priority, high trust priority | user cannot tell if reset worked |
| Demo seed | create believable first-use workspace | none | mode choice | demo dataset, return target | seeded workspace and redirect into app | seeded local/demo workspace | dashboard, tour, welcome, all demo-critical modules | must be rock-solid | demo feels fake, thin, or broken |
| Terms | legal trust | none | none | none | readable legal baseline | none | purchase trust | must not embarrass the brand | placeholders / malformed legal copy |
| Privacy | privacy trust | none | none | none | readable privacy posture | none | purchase trust | must not embarrass the brand | placeholders / malformed privacy copy |

### Activation / Shell Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Onboarding | initialize workspace spine | auth, noauth/demo allowance | company, stage, quota, ACV, category, persona inputs | seed builders and benchmarks | seeded workspace with playbook + quota + category baseline | onboarding, product category, outbound seed, playbook, sometimes demo workspace | welcome, dashboard, readiness, playbook | must create visible forward motion | user finishes onboarding with no obvious workspace |
| Welcome | orient and route first-session user | onboarding completed, workspace summary, welcome unseen | click next action | summary counts, quick links | user understands where to start and can choose a first move | welcome seen state | dashboard, ICP Studio, demo seed, settings | must be explainer-friendly and revisitable | generic copy or no clear next move |
| Dashboard | synthesize whole workspace | workspace summary, deals, signals, quota, advisor data | optional actions | briefings, deal-health computations | ranked next moves, risk view, coverage view | local UI state only | every major module | must show the product's "OS" nature in one screen | looks like vanity metrics or wrong numbers |
| Settings | workspace durability and control | existing workspace | export, import, reset actions | backup metadata | safe workspace ops | backup metadata, resets, imports | trust, recovery, launch ops | should prove durability | dangerous or untrustworthy reset/import behavior |
| Nav / shell | maintain continuity and wayfinding | app auth state, workspace summary | clicks only | summary, guided state, tour state | user can move between modules without losing context | local UI state | every app module | must never fight navigation | nav resets, scrolls badly, hides context |

### Targeting / Intelligence Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| ICP Studio | define who matters | onboarding category helps but not required | ICP hypotheses, fit logic, worked/not-worked judgment | scoring / summary logic | at least one saved ICP or scored ICP state | `gtmos_icp_analytics` and/or cloud ICP rows | Signal Console, territory, dashboard, readiness, playbook, proof | demo-critical | user leaves with generic personas, not enforceable ICPs |
| Signal Console | prioritize accounts by signal | ICP helps, sourcing helps | account additions, signal confirmations, research edits | enrichment, scoring, heat sorting | at least one saved account with signal context and priority | `gtmos_sc_v4` / cloud signal accounts | dashboard, outbound, readiness, playbook | demo-critical | output is just a noisy account list |
| Territory Architect | define territory strategy | ICP strongly recommended | territory theses, account tiering, calibration decisions | state history and calibration logic | territory structure, tiering, account state | `gtmos_territory` and TA sequence docs | sourcing, outbound, playbook | demo-supported | still feels like abstract planning with no account consequences |
| Sourcing Workbench | create prospectable lists | ICP and territory recommended | query cards, prospect additions, persona maps | source organization logic | saved prospect list or sourcing map | sourcing sequence docs | Signal Console, outbound, playbook | demo-supported | still too manual to materially reduce sourcing effort |

### Outbound / Contact Execution Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Outbound Studio | define contact motion | ICP, signals, seeded quota context help | sequence choices, angle choices, target selection | angle/touch summaries | saved outbound angle or touch strategy | `gtmos_angles`, `gtmos_outbound_touches`, `gtmos_outbound_seed` | dashboard, proof, playbook, readiness | demo-critical | user still has to invent the motion alone |
| LinkedIn Playbook | turn LinkedIn into a real channel | ICP and target logic help | action logging, message choices | channel heuristics | LinkedIn-specific actions or plan | `gtmos_linkedin_log` | playbook, proof, readiness | demo-supported | channel still feels like advice, not a working motion |
| Cold Call Studio | make cold calling executable | ICP, account context, angle context help | script choices, call notes, objections, outcomes | stage-machine framing | saved call log and call-ready flow | `gtmos_cold_call_log` | playbook, proof, readiness, dashboard | demo-critical | module is just content, not call execution support |

### Discovery / Deal / Proof Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Discovery Studio | structure discovery intelligence | category, account/deal context, existing framework library | framework selection, notes, hypotheses | discovery frameworks, saved state, handoff stats | saved discovery framework or plan | discovery frameworks rows, discovery call logs, discovery stats, agenda, handoff | Call Planner, Deal Workspace, proof, readiness, playbook | demo-critical | load failure, swallowed errors, or no saved discovery output |
| Call Planner | prepare one live call | discovery state or deal/account context | agenda goals, stakeholder context, notes | linked deal/category context | concrete call agenda | `gtmos_discovery_agenda`, `gtmos_discovery_links` | discovery, deals, playbook, proof | demo-critical | agenda is generic and not tied to live motion |
| Deal Workspace | make deal motion legible | account and discovery context help | deal creation, stage, notes, next step, stakeholders | stage-history calculations | one inspectable deal with explicit next step and risk posture | `gtmos_deal_workspaces`, `gtmos_deal_stage_history`, cloud deal rows | dashboard, autopsy, PoC, readiness, playbook | demo-critical | deal stays as unsystematic notes |
| PoC Framework | define proof-of-concept motion | deal context strongly recommended | success metrics, scope, stakeholders, timeline | none or light defaults | saved PoC plan | `gtmos_poc_data` | proof, readiness, playbook | demo-critical | duplicate chrome, weak clarity, no proof-operating output |
| Future Autopsy | pre-mortem deal risk | deal context recommended | named failure hypotheses, risk notes | loss-pattern framing | named kill-risk record | `gtmos_autopsy_log_v1` | dashboard, readiness, playbook | demo-critical | module does not sharpen real decision quality |
| Advisor Deploy | map advisor leverage moments | deal/account context and advisor roster | advisor info, target moment, deployment objective | timing frameworks | saved advisor deployment recommendation | `gtmos_advisor_registry`, `gtmos_advisor_deployments` | dashboard, playbook, proof, readiness | demo-supported | user leaves with no concrete advisor move |

### Planning / Synthesis / Handoff Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Quota Workback | quantify pipeline need | onboarding or user-entered quota assumptions | quota, ACV, win-rate, cycle assumptions | benchmarks and seeded defaults | visible activity / coverage model | `gtmos_qw_inputs`, `gtmos_outbound_seed` | dashboard, readiness, playbook | demo-critical | user still cannot tell what it takes to hit plan |
| Readiness Score | judge scale / hire readiness | ICP, outbound, discovery, deals, playbook, proof artifacts | optional adjustments only | computed readiness summary | explicit readiness judgment with reasons | summary state only; derived from workspace | dashboard, playbook, hiring decision | demo-critical | score feels unsupported or arbitrary |
| Playbook / Founding GTM | assemble the operating system another human can run | almost every upstream execution surface | optional notes edits, export action | assembly logic pulls from many docs and logs | coherent playbook sections and exportable handoff kit | `gtmos_playbook_notes`, `gtmos_handoff_exported`, plus all upstream docs remain source of truth | external handoff, internal alignment, readiness | demo-critical and supreme output | playbook feels disconnected from lived workspace evidence |

### Methodology Content Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Methodology index | content cluster entrance | none | article click | none | reader chooses a relevant methodology path | analytics only | article pages, product consideration | must make the content system legible | index feels like orphan content |
| Hire-first-salesperson page | top-of-funnel trust builder | none | read | none | reader leaves with a decision framework | analytics only | product consideration, launch assets | demo-optional | content too abstract to motivate product click |
| Founder-led-sales-process page | top-of-funnel trust builder | none | read | none | reader leaves with a systems view | analytics only | product consideration | demo-optional | content does not point naturally into product |
| Enterprise-discovery page | trust builder for discovery promise | none | read | none | reader leaves with a discovery frame | analytics only | Discovery Studio credibility | demo-optional | content and module feel disconnected |
| Cold-call-script page | trust builder for cold-call promise | none | read | none | reader leaves with a call model | analytics only | Cold Call Studio credibility | demo-optional | content reads better than module works |
| First-AE-playbook page | trust builder for handoff promise | none | read | none | reader understands inheritance logic | analytics only | Playbook credibility | demo-optional | article overpromises relative to product output |
| Sales-handoff-kit page | trust builder for supreme output | none | read | none | reader sees why handoff kit matters | analytics only | Founding GTM / handoff credibility | demo-optional | handoff output in app is weaker than article claim |
| Sales-kill-switch page | trust builder for autopsy / deal hygiene | none | read | none | reader leaves with kill-switch logic | analytics only | Future Autopsy, deal hygiene credibility | demo-optional | article outclasses in-app behavior |
| Sales-champion page | trust builder for deal judgment | none | read | none | reader leaves with champion rubric | analytics only | Deal Workspace / discovery credibility | demo-optional | no clear product bridge |
| Portfolio-GTM-assessment page | investor-facing trust builder | none | read | none | investor reads Antaeus as a serious assessment system | analytics only | investor/platform use cases | demo-optional | portfolio use case remains underproductized |
| VC-platform-tools page | investor-facing trust builder | none | read | none | platform operator understands the offer | analytics only | investor/platform use cases | demo-optional | article describes a product tier that does not yet exist |

### Standalone Launch-Agent Surfaces
| Surface | Role In System | Upstream Dependencies | Manual Input Required | Auto / Inferred Input | One-Session Output Required | Persisted Output | Downstream Consumers | Demo / Explainer Obligation | Failure Mode |
|---|---|---|---|---|---|---|---|---|---|
| Launch-Agent dashboard | review whole warm-outreach engine | local data, configured keys, chosen mode runs | run actions and review queue | mode results, summaries | visible prospect universe, queue, engagement, weekly view | local JSON state | founder/operator workflow | must make the standalone tool feel controlled, not opaque | dashboard says work happened but user cannot trust what changed |
| Scout | create prospect universe | Browserbase, source packs, validation config | persona, focus, limit | source pack routing, extraction, heat scoring | new or updated live prospects in one run | `data/universe.json` | mapper, composer, dashboard | must look impressive in demos | session works but app returns zero usable prospects |
| Composer | create drafts | prospect universe, messaging matrix, asset URLs | choose cohort / review queue | prompt logic, persona rules | queued drafts that are review-worthy | `data/outreach-queue.json` | dashboard, manual send | demo-supported | drafts are bland or unsafe |
| Network Mapper | create warm-path suggestions | prospects plus validation network | run action | overlap scoring, advisor opportunities | warm path suggestions attached to prospects | `data/universe.json` / mapped metadata | dashboard, manual outreach | demo-supported | warm mapping stays theoretical |
| Qualifier | classify replies | prospect records and response text | response text | reply classification logic | clear reply category and next-touch recommendation | engagement / queue state | dashboard, operator follow-up | demo-supported | response remains ambiguous after qualification |

## Handoff-Kit Dependency Matrix

### The handoff kit must eventually answer
- Who do we sell to?
- How do we know they are a fit?
- Which accounts matter now?
- What outbound motions work?
- How are we running discovery?
- What does healthy deal motion look like?
- Where do deals die?
- When do we deploy advisors?
- What does proof look like?
- What quota math are we running against?
- Are we actually ready to hire?

### Which surfaces feed that output directly
| Handoff Question | Source Surfaces |
|---|---|
| Who do we sell to | ICP Studio, onboarding, playbook seed |
| Which accounts matter now | Signal Console, Territory Architect, Sourcing Workbench |
| What outbound motions work | Outbound Studio, Cold Call Studio, LinkedIn Playbook, touches, angles |
| How do we run discovery | Discovery Studio, Call Planner, discovery stats |
| How do we manage deals | Deal Workspace, Future Autopsy, deal reviews, deal outcomes |
| What proof do we use | PoC Framework, Advisor Deploy, proof-layer-consumed artifacts |
| What does the pipeline demand | Quota Workback, dashboard, deal-health summaries |
| Are we ready to hire | Readiness Score, playbook completeness, handoff export history |

If any one of these questions cannot be answered credibly, the handoff kit is not ready, and therefore the app is not done.

## Demo / Explainer Requirements By Surface Type

### Must open already populated
- Dashboard
- Welcome
- ICP Studio
- Signal Console
- Deal Workspace
- Discovery Studio
- PoC Framework
- Future Autopsy
- Readiness
- Quota Workback
- Playbook

### Must have a 30-60 second explainable transformation
- ICP Studio: vague target -> explicit ICP
- Signal Console: account list -> prioritized signal-backed targets
- Deal Workspace: notes -> risk-managed deal
- Discovery Studio: vague meeting -> structured discovery
- PoC Framework: pilot talk -> scoped proof plan
- Readiness: gut feel -> evidence-backed readiness call
- Playbook: scattered actions -> inherit-ready operating system

### Must clearly show what changed after the session
- every core module above
- Settings after export/import
- Launch Agent after Scout / Composer / Mapper / Qualifier

## Minimum Successful Session Definitions

### A successful first product session
- user can sign up or sign in
- onboarding produces real workspace seed
- welcome explains the landscape
- dashboard shows believable seeded or real data
- user can enter one execution module and save an artifact

### A successful first execution session
- user can define at least one ICP
- prioritize at least one account
- create at least one outbound angle or touch
- produce either a discovery plan or a deal record
- see that the playbook is getting smarter from these actions

### A successful "I could buy this" session
- the product feels like one connected system
- not a pile of worksheets
- demo seed proves the modules with believable data
- outputs persist across refresh and re-login
- playbook / handoff path feels real

## Critical Cross-Module Rules

### Rule 1
If a module writes data that no downstream surface visibly uses, its value will feel fake.

### Rule 2
If a module needs prior state but does not explain that dependency in-product, it will feel broken.

### Rule 3
If demo seed does not exercise a module, that module will be invisible in tours, explainers, and most first impressions.

### Rule 4
If the handoff kit cannot absorb a module's output, the module is likely not contributing enough strategic memory.

### Rule 5
If a module requires more than about 3-5 minutes of setup before first payoff, it needs stronger seed/default/inference behavior.

## Immediate Design Consequences

### Consequence 1
Future module work must be judged against downstream consumption, not local cleverness.

### Consequence 2
Demo seed is now part of module-definition work, not launch polish.

### Consequence 3
Every module needs:
- upstream dependency display
- one-session output definition
- saved artifact
- next recommended downstream move

### Consequence 4
The handoff kit should become the visible "why" behind almost every module.

That means module copy, welcome copy, tour steps, and dashboard summaries should increasingly reinforce:
- this module is helping you build the system your next hire would inherit

## Exit-Criteria Check
- every module has explicit inputs: yes
- every module has explicit one-session outputs: yes
- connective tissue is defined: yes
- handoff kit logic is elevated as the supreme output: yes
- demo seed is treated as first-class connective tissue: yes

