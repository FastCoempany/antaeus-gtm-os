# Antaeus App 9/10 Program Plan

Date: 2026-03-22  
Derived from: `deliverables/audits/antaeus-app-end-to-end-audit-2026-03-22.md`  
Intent: move Antaeus from “broad and promising” to “narrowly credible, operationally sharp, commercially trustworthy, and module-complete.”  
Mode: deliberate, surgical, phase-gated. No hand-wavy “we’ll tighten later.” Every phase has a definition of done.

---

## 0. Program Philosophy

This plan assumes the following:

1. **Every module must deliver on its promise.**  
   If a module cannot produce a believable outcome for a new user in under one focused session, its promise is too vague, its inputs are too heavy, or its outputs are too weak.

2. **Broad is not enough.**  
   The app is already broad. This plan is about converting breadth into reliability, trust, clarity, and compounding value.

3. **Launch readiness is not aesthetic.**  
   The blockers are not just “make it prettier.” The blockers are:
   - checkout truth
   - trust/legal truth
   - self-serve truth
   - reliability truth
   - module-output truth

4. **The right launch order is:**
   - commercial truth
   - trust truth
   - shell reliability
   - activation truth
   - module truth
   - automation truth
   - launch truth

5. **We are not optimizing for speed.**  
   We are optimizing for a product that earns the right to charge and retain.

---

## 1. What 9/10 Means

Antaeus reaches 9/10 only when all of the following are true:

- a cold visitor can understand what the app is, who it is for, and what happens after purchase
- a buyer can pay without confusion
- legal, privacy, billing, and support surfaces feel publish-ready
- a new user can get from signup to first real value without needing you
- the tour and welcome corridor teach the system, not just show buttons
- every module has a clear promise, clear inputs, clear outputs, and believable success states
- the workspace survives refresh, re-login, device changes, reset, backup, and import
- silent failures are surfaced
- UI chrome does not fight itself
- core modules compound off each other instead of behaving like isolated tools
- top-of-funnel is connected to activation and monetization
- outbound is connected to discovery, pipeline, PoC, and playbook
- the product can support both guided beta and self-serve public growth

---

## 2. Program Scorecard

Track these metrics every wave:

### Commercial
- Landing-to-signup conversion
- Signup-to-onboarding completion
- Onboarding-to-first-core-action completion
- Visitor-to-paid conversion
- Demo-to-paid conversion
- Refund / cancel / support burden

### Reliability
- Module boot success rate
- Silent failure count
- Duplicate UI injection count
- Cross-device persistence pass rate
- Export/import pass rate
- Page-level JS error count

### Product Value
- Time to first believable output
- Number of modules a new user can use without guidance
- Number of modules with clear empty states
- Number of modules with “good enough to hand to a first AE” outputs

### Trust
- Legal readiness
- Billing readiness
- Proof/testimonial readiness
- Copy consistency
- Encoding/polish defect count

### Automation
- Manual-to-automated ratio by module
- Number of required duplicate inputs
- Number of inputs inferred from prior modules
- Number of automations that actually save user work

---

## 3. Execution Rules

- Do not advance a phase without closing its acceptance criteria.
- Do not add new modules during this program unless they unblock an existing promise.
- Do not treat “it works on my machine” as done.
- Do not accept silent catches where a user-facing error state should exist.
- Do not accept placeholder billing/legal/proof in public surfaces.
- Do not accept “this module is powerful if the user knows what to do.”

---

## 4. Phase Map

This program is split into **52 phases** across 7 waves.

- Wave A: program controls and score definition
- Wave B: commercial truth and trust
- Wave C: shell, reliability, and shared-system hardening
- Wave D: activation and top-of-funnel completion
- Wave E: module-by-module promise delivery
- Wave F: automation, integration, and teamability
- Wave G: launch gates and post-launch operating model

---

# Wave A — Program Controls

## Phase 1 — Promise Matrix - ran it 22MAR2026
**Objective:** define the explicit promise of every surface.  
**Modules:** all.  
**Work:**
- list each page/module
- define promise in one sentence
- define who it is for
- define what input is required
- define what output must exist within one session
- define what “failure to deliver” looks like
**Deliverables:**
- promise matrix
- module owner list
- module promise score baseline
**Exit criteria:**
- every module has a one-sentence promise
- no module remains “general GTM help”

## Phase 2 — Input / Output Matrix ran it 22MAR2026
**Objective:** map every meaningful input and output across the system.  
**Work:**
- enumerate all saved inputs by module
- enumerate all generated outputs by module
- tag each as manual, inferred, generated, synced, exported
- map which modules feed which modules
- identify duplicate inputs and dead-end outputs
**Exit criteria:**
- every major field in the system belongs to an input/output map
- no critical output is orphaned from downstream value

## Phase 3 — 9/10 Rubric Definition
**Objective:** create the scoring rubric used for this entire program.  
**Rubric dimensions:**
- clarity
- trust
- reliability
- speed to value
- automation value
- module completeness
- exportability
- launch readiness
**Exit criteria:**
- each module has a 0-10 rubric under the same standard

## Phase 4 — Evidence Board
**Objective:** replace intuition with tracked evidence.  
**Work:**
- create one operating board for findings
- separate: bugs, design gaps, trust blockers, funnel blockers, automation opportunities, module promise failures
- tie each to owner, phase, and proof
**Exit criteria:**
- no major problem lives only in memory or chat history

## Phase 5 — Journey Inventory
**Objective:** document all user journeys that must eventually work.  
**Journeys:**
- cold visitor -> paid user
- cold visitor -> demo -> paid user
- invited design partner -> activated user
- founder -> first AE handoff
- founder -> fractional CRO use
- solo user -> export/handoff
- returning user -> dashboard command mode
**Exit criteria:**
- every journey has a written start, middle, and end

---

# Wave B — Commercial Truth and Trust

## Phase 6 — Purchase Path Wiring
**Objective:** make purchase real.  
**Scope:** landing CTAs, pricing CTA, post-checkout route, success path.  
**Current blocker:** landing still points to `#buy`, not a real checkout flow.  
**Work:**
- wire live payment entry point
- define success URL and failure URL
- define “what happens after I pay”
- connect payment to account creation or entitlement
**Exit criteria:**
- a user can move from landing to payment to access without ambiguity

## Phase 7 — Subscription and Billing Operations
**Objective:** make the revenue model real operationally, not just visually.  
**Work:**
- define billing model truth: annual, monthly, trial/no trial, renewals
- implement subscription state display
- implement cancellation / renewal / billing management path
- define refund logic
**Exit criteria:**
- billing state is visible and manageable
- support does not need manual intervention for ordinary subscription tasks

## Phase 8 — Signup and Email Infrastructure
**Objective:** remove auth fragility.  
**Current blocker:** signup can be throttled by email-rate limits.  
**Work:**
- configure durable email delivery
- define confirmation-email policy
- build meaningful error copy for auth failures
- make duplicate-account handling clean
**Exit criteria:**
- signup failure modes are understandable
- confirmation delivery is production-safe

## Phase 9 — Legal and Privacy Publish Pass
**Objective:** make trust surfaces real.  
**Current blocker:** terms/privacy are visibly draft-grade.  
**Work:**
- rewrite terms
- rewrite privacy
- remove placeholders
- remove malformed HTML
- make data-storage and local/cloud truth accurate
- clarify billing/refund/renewal
**Exit criteria:**
- legal pages are publishable without embarrassment

## Phase 10 — Proof Layer for Public Buyers
**Objective:** replace abstract promise with buyer confidence.  
**Work:**
- add real proof blocks
- add use-case proof
- add founder / AE / advisor buyer proof
- add “what this replaces” copy
- add “who this is not for” copy
**Exit criteria:**
- landing trust does not rely purely on rhetoric

## Phase 11 — Pricing / Packaging Reframe
**Objective:** make pricing match product scope and buyer psychology.  
**Work:**
- test whether $299/year remains the front-door offer
- model solo-founder price vs advisor/team price
- define whether launch-agent stays separate or premium
- define whether public offer is low-friction entry or premium system
**Exit criteria:**
- price is intentional, not inherited

## Phase 12 — Commercial Copy Consistency
**Objective:** align the message across landing, onboarding, welcome, and modules.  
**Work:**
- define the primary buyer
- define the secondary buyer(s)
- unify wording around:
  - GTM OS
  - readiness
  - handoff
  - first hire
  - signal-led outbound
- remove confusing overlaps between “course,” “academy,” “system,” and “app”
**Exit criteria:**
- the product story sounds like one company, not five partial pitches

---

# Wave C — Shell, Reliability, and Shared-System Hardening

## Phase 13 — Encoding and Copy Integrity Sweep
**Objective:** remove all visible mojibake and broken typography.  
**Current evidence:** landing, legal, tour, guided rail, PoC, and other surfaces still show artifacts.  
**Work:**
- full-text repo scan for mojibake
- normalize characters
- normalize symbols/icons
- recheck page titles, CTAs, FAQs, legal, tooltips, module subtitles
**Exit criteria:**
- no customer-facing mojibake on any public or core app surface

## Phase 14 — Navigation Stability
**Objective:** make the app shell feel stable and respectful.  
**Current evidence:** sidebar resets to top on page navigation.  
**Work:**
- preserve sidebar scroll position
- preserve relevant shell state
- confirm active-nav behavior
- remove shell jumps that break user orientation
**Exit criteria:**
- module-to-module navigation no longer disorients the user

## Phase 15 — Shared Chrome Audit
**Objective:** stop shared UI injectors from fighting each other.  
**Current evidence:** stacked banners/chips are possible.  
**Work:**
- inventory all shared injectors:
  - guided rail
  - save indicator
  - data flow
  - module header
  - collapsible sections
- define injection order and exclusivity rules
- ensure no duplicate top-of-page chrome
**Exit criteria:**
- no page can render duplicate stacked guidance/banners by default

## Phase 16 — Load States and Error States
**Objective:** make failures visible and recoverable.  
**Current evidence:** Discovery Studio swallows boot failures.  
**Work:**
- define every module’s loading state
- define every module’s empty state
- define every module’s error state
- remove silent catches
- log actionable user-facing recovery paths
**Exit criteria:**
- if a module fails, the user sees what failed and what to do next

## Phase 17 — Persistence QA Program
**Objective:** make “durable workspace truth” something users can trust.  
**Work:**
- rerun cross-browser matrix
- rerun cross-device matrix
- rerun export/import/reset matrix
- rerun demo/prod storage isolation checks
- identify any stale local override risks
**Exit criteria:**
- persistence reliability is boring and dependable

## Phase 18 — Observability and Diagnostics
**Objective:** instrument the app for operational visibility.  
**Work:**
- page-level error logging
- module boot event logging
- key failure counters
- signup / onboarding / welcome / dashboard drop-off instrumentation
- track module usage depth, not just pageviews
**Exit criteria:**
- launch decisions are based on operating telemetry, not anecdote

---

# Wave D — Activation and Top-of-Funnel Completion

## Phase 19 — Landing Page Conversion System
**Objective:** upgrade landing from beautiful narrative to conversion machine.  
**Work:**
- clarify primary buyer
- simplify CTA ladder
- connect CTA to real purchase or demo
- tighten FAQ around real objections
- add post-price reassurance
- make “what happens after purchase” explicit
**Exit criteria:**
- visitor can understand, believe, and act without guessing

## Phase 20 — Methodology and SEO Deepening
**Objective:** make methodology pages work as acquisition and conversion assets.  
**Work:**
- review all 10 methodology pages
- tighten CTAs and internal linking
- connect pages to real signup / demo / pricing logic
- add credibility modules to those pages
- define publishing cadence beyond the first 10 pages
**Exit criteria:**
- methodology is not just content; it is funnel infrastructure

## Phase 21 — Demo Lane Productization
**Objective:** make demo mode a real self-serve acquisition tool.  
**Work:**
- define demo personas and demo narratives
- ensure demo seed always works
- define demo resets
- expose “what is real vs sample” clearly
- make demo path lead naturally into paid value
**Exit criteria:**
- demo feels intentional, not like a hidden dev utility

## Phase 22 — Welcome Corridor 2.0
**Objective:** turn welcome into an actual activation corridor.  
**Work:**
- remove remaining redundancy
- make guidance adaptive by user state
- make “back to welcome” part of the product model
- connect welcome actions to real workspace progress
- reduce conceptual overload
**Exit criteria:**
- welcome teaches the system and moves the user into the right first action

## Phase 23 — Tour Guide 2.0 Spec and Rebuild
**Objective:** make the tour actually sell the product to a new user.  
**Work:**
- rebuild tour around jobs-to-be-done, not button locations
- connect seeded demo to tour context
- support pause/resume
- support branch paths by persona
- support “show me the next thing that matters”
**Exit criteria:**
- tour can carry a new user meaningfully without human help

## Phase 24 — First 7 Days User Lifecycle
**Objective:** define the first week after signup.  
**Work:**
- in-product prompts
- backup reminder
- email or in-app nudges
- first-value milestones
- “return to dashboard” rhythm
**Exit criteria:**
- activation is not a one-session event; it is a guided week-one experience

---

# Wave E — Module-by-Module Promise Delivery

## Phase 25 — Dashboard
**Promise:** command center for the whole workspace.  
**Inputs:** deals, discovery stats, signals, readiness, outbound data.  
**Outputs:** weekly brief, risk view, next actions, command-mode entry.  
**Gap:** good summary logic exists, but trust depends on upstream data quality and shell stability.  
**Work:**
- verify every panel has clear source logic
- remove summary mismatches
- define dashboard empty states by maturity stage
- define “this dashboard becomes useful when…” copy
**9/10 exit:**
- dashboard is the obvious home page after activation

## Phase 26 — Signal Console
**Promise:** convert account research and triggers into action.  
**Inputs:** account list, research triggers, enrichment, notes.  
**Outputs:** signals, account heat, actionable intelligence.  
**Gap:** strong directionally, but still trust-sensitive and AI/research-dependent.  
**Work:**
- harden research success/failure states
- clarify signal scoring
- improve explainability of heat
- make “what do I do next?” explicit per account
**9/10 exit:**
- one researched account yields an obvious next move

## Phase 27 — ICP Studio
**Promise:** define and refine who you sell to.  
**Inputs:** industry, buyer, pain, trigger, profile fields.  
**Outputs:** ICP truth for downstream modules.  
**Gap:** still fairly manual and concept-heavy.  
**Work:**
- reduce ambiguity in required fields
- surface examples and anti-examples
- show downstream impact more clearly
- tighten ICP scoring credibility
**9/10 exit:**
- a new user can produce one strong ICP without founder-level GTM literacy

## Phase 28 — Territory Architect
**Promise:** convert ICP truth into targetable territory design.  
**Inputs:** ICPs, segmentation choices, accounts.  
**Outputs:** territory account sets and prioritization.  
**Gap:** valuable but not yet obviously essential to the user.  
**Work:**
- clarify territory object model
- show why territory matters before sourcing
- connect directly into sourcing and outbound
**9/10 exit:**
- territory outputs feel like an obvious bridge, not extra admin

## Phase 29 — Sourcing Workbench
**Promise:** source accounts worth pursuing.  
**Inputs:** territory constraints, filters, sourced prospects.  
**Outputs:** actionable account universe.  
**Gap:** still input-heavy and not fully integrated with signal-led flow.  
**Work:**
- tighten account import flow
- connect sourced prospects to Signal Console faster
- show quality thresholds
**9/10 exit:**
- sourcing produces a real working queue, not a static list

## Phase 30 — Outbound Studio
**Promise:** turn GTM truth into outreach angles.  
**Inputs:** quota, ICPs, signals, angles, touch history.  
**Outputs:** messages, sequence angles, action plan.  
**Gap:** method strong; execution still manual.  
**Work:**
- make angle generation clearer
- connect angles directly to touch logging
- clarify what “good” looks like
- reduce abstraction in empty states
**9/10 exit:**
- a user can produce a useful outreach angle in one sitting

## Phase 31 — Cold Call Studio
**Promise:** help the user execute better live calls.  
**Inputs:** call notes, outcomes, framework prompts.  
**Outputs:** better talk tracks and logged call outcomes.  
**Gap:** likely useful for disciplined reps, but still manual and logging-centric.  
**Work:**
- define pre-call vs live-call vs post-call mode
- improve quick-capture UX
- improve outcome feedback loop
**9/10 exit:**
- a rep can use it during a real week of calls without friction

## Phase 32 — LinkedIn Playbook
**Promise:** operationalize LinkedIn as a GTM channel.  
**Inputs:** actions, messages, profile/campaign behavior.  
**Outputs:** trackable LinkedIn motion.  
**Gap:** channel exists, but value may feel thinner than core outbound.  
**Work:**
- clarify use cases
- connect to ICP, signals, and touches
- define success thresholds
**9/10 exit:**
- LinkedIn becomes clearly worth using, not optional garnish

## Phase 33 — Call Planner / Discovery Agenda
**Promise:** prepare a discovery call that actually advances.  
**Inputs:** contact, company, gates, agenda fields.  
**Outputs:** a credible agenda and qualification setup.  
**Gap:** strong conceptually, but not always clearly tied to next modules.  
**Work:**
- connect agenda to discovery run and deal record
- tighten gate logic
- surface what “good agenda” means
**9/10 exit:**
- planner output obviously improves the next call

## Phase 34 — Discovery Studio
**Promise:** run better discovery and objection handling live.  
**Inputs:** framework selection, worked moves, call context.  
**Outputs:** better call quality, logged learning, advancement.  
**Gap:** currently undermined by silent failure risk and lack of error state.  
**Work:**
- harden boot path
- add visible loading and error states
- make framework navigation easier
- clarify worked-move learning loop
**9/10 exit:**
- it loads every time and clearly helps a live or just-finished call

## Phase 35 — Deal Workspace
**Promise:** manage live opportunities with real GTM rigor.  
**Inputs:** deals, quals, notes, plans, outcomes.  
**Outputs:** health, next actions, qualification clarity.  
**Gap:** central module, but must become the unquestioned pipeline truth.  
**Work:**
- tighten deal creation flow
- improve qualification ergonomics
- improve account-plan integration
- improve stale-deal recovery flows
**9/10 exit:**
- a founder or AE can run real pipeline review from it

## Phase 36 — Future Autopsy
**Promise:** prevent deal death before it happens.  
**Inputs:** active deal context, risk assumptions.  
**Outputs:** kill-switch / risk insight / next interventions.  
**Gap:** strong methodology, but user must believe it is worth doing.  
**Work:**
- make timing of use obvious
- connect outputs back into deal action
- clarify value through examples
**9/10 exit:**
- users can tell when and why to run it, and what to do with the result

## Phase 37 — PoC Framework
**Promise:** scope tight proofs of concept that force decisions.  
**Inputs:** vendor, account, success criteria, boundaries, duration, outcome.  
**Outputs:** PoC scope, kickoff agenda, readout, proposal email, stats.  
**Gap:** content good, UX and chrome interference not yet clean.  
**Work:**
- remove duplicate chrome risk
- tighten save/download logic
- define relation to deal stage
- improve proof tracking
**9/10 exit:**
- users can run a real PoC from this without UI confusion

## Phase 38 — Advisor Deploy
**Promise:** deploy advisors strategically at the right moments.  
**Inputs:** advisors, deployments, moments, outcomes.  
**Outputs:** advisor leverage and feedback loop.  
**Gap:** strategically sharp, but still niche and may be under-explained.  
**Work:**
- clarify advisor data model
- clarify “when to deploy”
- connect outcomes back into deals and playbook
**9/10 exit:**
- advisor deployment feels concrete, not theoretical

## Phase 39 — Quota Workback
**Promise:** turn target revenue into operational math.  
**Inputs:** quota, ACV, win rate, stage assumptions.  
**Outputs:** targets for touches, meetings, deals.  
**Gap:** useful, but may not yet dominate behavior downstream.  
**Work:**
- improve output legibility
- connect numbers explicitly to outbound, calls, dashboard
- define default assumptions better
**9/10 exit:**
- users can set targets and trust downstream modules more because of it

## Phase 40 — Playbook / Handoff Kit
**Promise:** auto-assemble a playbook your next hire can run.  
**Inputs:** every other module.  
**Outputs:** GTM playbook and exportable handoff kit.  
**Gap:** concept strong, output can still be thin if upstream data is weak.  
**Work:**
- improve section quality thresholds
- improve output formatting
- show weak-source warnings
- distinguish empty vs partial vs handoff-ready states
**9/10 exit:**
- exported playbook looks like a serious deliverable, not a stitched dump

## Phase 41 — Readiness Score
**Promise:** tell the user how systematized their GTM motion is.  
**Inputs:** cross-module truth.  
**Outputs:** score, gaps, readiness rationale.  
**Gap:** score logic exists, but justification must be more legible to the user.  
**Work:**
- expose score reasoning
- improve trust in “why this number”
- connect score gaps to specific actions
**9/10 exit:**
- the score feels earned, understandable, and motivating

## Phase 42 — Onboarding
**Promise:** configure the product so it knows who you are and what you need.  
**Inputs:** role, company, quota, ACV, buyer type, category.  
**Outputs:** seeded workspace context.  
**Gap:** it exists, but still feels like setup rather than first value.  
**Work:**
- reduce friction
- make role-based branching sharper
- improve post-onboarding expectations
**9/10 exit:**
- onboarding feels like activating the system, not filling out a form

## Phase 43 — Welcome
**Promise:** translate signup into believable first use.  
**Inputs:** onboarding and workspace summary.  
**Outputs:** first actions and orientation.  
**Gap:** improved, but still not a fully mature first-session corridor.  
**Work:**
- continue copy hardening
- improve action ranking
- connect welcome to first-week lifecycle
- improve return path and help state
**9/10 exit:**
- welcome meaningfully reduces confusion and increases action completion

## Phase 44 — Settings / Backup / Reset
**Promise:** give the user control over their workspace and safety.  
**Inputs:** current workspace and backups.  
**Outputs:** export, import, reset, data trust.  
**Gap:** powerful but not yet fully “confidence-inspiring.”  
**Work:**
- simplify backup UX
- define account-level settings vs workspace-level settings
- surface what is cloud truth vs local-only
**9/10 exit:**
- users trust backup/restore and understand what settings actually do

---

# Wave F — Automation, Integration, and Teamability

## Phase 45 — Automation Dial Design
**Objective:** deliberately decide what should be automated, inferred, or left manual.  
**Work:**
- review every module input
- tag each as:
  - must remain manual
  - should be suggested
  - should be inferred
  - should be auto-generated
- remove accidental manual burden
**Exit criteria:**
- automation is intentional, not opportunistic

## Phase 46 — Cross-Module Compounding Rules
**Objective:** make inputs compound automatically across the system.  
**Work:**
- define what fills what
- define what updates what
- define what should trigger downstream suggestions
- define how confidence/quality flows through modules
**Exit criteria:**
- the app feels like one system, not a set of tabs

## Phase 47 — CRM / Calendar / Email Integration Strategy
**Objective:** decide the next layer of system credibility.  
**Work:**
- define minimum viable integrations
- decide whether to read-only ingest first
- decide whether to start with email, calendar, CRM, or none
**Exit criteria:**
- integration roadmap is explicit and sequenced

## Phase 48 — Launch Agent Product Strategy
**Objective:** decide how the standalone launch agent relates to the main app.  
**Options to resolve:**
- keep separate
- bundle as premium
- integrate partially
- use only for internal/operator workflows
**Exit criteria:**
- launch agent role is productized, not ambiguous

## Phase 49 — Team / Advisor / Seat Model
**Objective:** make the product team-capable when ready.  
**Work:**
- define seat types
- define founder vs AE vs advisor vs admin permissions
- define workspace sharing rules
- define what is personal vs shared state
**Exit criteria:**
- teamability has an intentional design direction

## Phase 50 — Automation Quality Controls
**Objective:** ensure automation does not create untrustworthy outputs.  
**Work:**
- quality thresholds
- explainability rules
- source visibility
- fallback behavior
- “confidence low” states
**Exit criteria:**
- automation never quietly lowers trust

---

# Wave G — Launch Gates and Post-Launch Operation

## Phase 51 — Full End-to-End QA Matrix
**Objective:** test everything that matters before public exposure.  
**Tracks:**
- auth
- billing
- onboarding
- welcome
- demo
- persistence
- every module boot
- export/import/reset
- tour
- public pages
- SEO pages
- mobile and narrow desktop
**Exit criteria:**
- every critical journey has a pass/fail record

## Phase 52 — Launch Readiness Gate
**Objective:** formally decide launch type and timing.  
**Decision outputs:**
- guided beta only
- invite-only paid alpha
- public soft launch
- public scale launch
**Go-live checklist:**
- purchase path works
- legal pages are real
- welcome/tour can carry a new user
- core modules have believable outputs
- known blocker list is below threshold
- error visibility is good enough
- support burden is manageable
**Exit criteria:**
- launch is a decision, not a hope

---

## 5. Cross-Phase Workstreams

These workstreams run across many phases and should be tracked continuously.

### Workstream A — Copy and Language Integrity
- remove mojibake
- remove filler phrasing
- define consistent language
- remove fake confidence and vague labels

### Workstream B — Trust and Proof
- terms
- privacy
- billing clarity
- testimonials
- demo truth
- proof artifacts

### Workstream C — Reliability and Error Handling
- boot states
- empty states
- error states
- logging
- shell stability

### Workstream D — Data Model and Persistence
- cloud truth
- local cache behavior
- export/import accuracy
- demo/prod isolation

### Workstream E — User Guidance
- onboarding
- welcome
- tour
- first-week lifecycle
- contextual prompts

### Workstream F — Automation
- input inference
- downstream propagation
- launch agent alignment
- guardrails

---

## 6. Suggested Order of Operations

If we execute this practically, the smartest order is:

1. Phases 1-5  
2. Phases 6-12  
3. Phases 13-18  
4. Phases 19-24  
5. Phases 25-44, module by module  
6. Phases 45-50  
7. Phases 51-52

This keeps us from polishing modules before the commercial and shell foundations are trustworthy.

---

## 7. Immediate Next Sequencing Recommendation

If we start tomorrow, the first 8 execution phases should be:

1. Phase 1 — Promise Matrix
2. Phase 2 — Input / Output Matrix
3. Phase 6 — Purchase Path Wiring
4. Phase 9 — Legal and Privacy Publish Pass
5. Phase 13 — Encoding and Copy Integrity Sweep
6. Phase 14 — Navigation Stability
7. Phase 16 — Load States and Error States
8. Phase 22 — Welcome Corridor 2.0

That order attacks the biggest blockers first:

- can people buy?
- can they trust it?
- does the shell behave?
- do failures surface?
- can a new user understand what to do?

---

## 8. Final Program Thesis

Antaeus does **not** need more breadth right now.

It needs:

- sharper promises
- cleaner trust surfaces
- stronger self-serve behavior
- better reliability
- more deliberate automation
- module-by-module proof that each surface is worth existing

The goal is not to make the app look complete.

The goal is to make it:

- commercially believable
- operationally stable
- cognitively clear
- trustworthy enough to pay for
- strong enough to become the real GTM operating system it already gestures toward

That is what 9/10 looks like.
