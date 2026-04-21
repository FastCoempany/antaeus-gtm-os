# Phase 5 - Journey Inventory

Date: 2026-03-22  
Companion to:
- [phase-01-promise-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-01-promise-matrix-2026-03-22.md)
- [phase-02-input-output-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-02-input-output-matrix-2026-03-22.md)
- [phase-03-9of10-rubric-definition-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-03-9of10-rubric-definition-2026-03-22.md)
- [phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Why Phase 5 Exists
The product now has:
- a promise matrix
- an input/output matrix
- a scoring rubric
- an evidence board

What it still needs is a definitive answer to:
- which user journeys must work
- what "working" means for each journey
- where each journey starts
- what the middle actually contains
- what the end must feel like
- what currently blocks the journey

Without this, rebuild work will still be module-first instead of outcome-first.

## Journey Design Rules

### Rule 1
Every journey must have:
- a real start
- a real middle
- a real end

### Rule 2
Every journey must specify:
- who the user is
- what state they arrive in
- what the first commitment is
- what the first believable value is
- what the terminal success state is

### Rule 3
Every journey must identify:
- the exact surfaces involved
- the hard blockers
- the handoff-kit relationship
- the demo-seed relationship

### Rule 4
If a journey depends on manual founder help to succeed today, that must be stated plainly.

## State Vocabulary
- `entry state`: the condition the user arrives in
- `first commitment`: the first meaningful action the user must take
- `first believable value`: the first moment the product feels real
- `terminal success`: the moment the journey can be considered complete
- `current state`: how the repo supports the journey today

## Journey Map

### J1 - Cold Visitor -> Paid User

#### Who this is
A stranger who lands on the site from search, social, referral, or direct traffic and is willing to buy if the offer feels trustworthy and legible.

#### Entry state
- no account
- no product context
- no workspace
- low trust

#### Start
- landing page at `/`

#### Middle
- understand what Antaeus is
- understand who it is for
- understand what happens after buying
- click a pricing / purchase CTA
- complete payment
- enter account creation or entitlement flow
- continue into onboarding

#### End
- user has paid
- user has access
- user is in onboarding / welcome without ambiguity

#### First commitment
- click a serious CTA that implies purchase or product entry

#### First believable value
- buyer understands this is a real GTM operating system, not a template pack

#### Terminal success
- a cold buyer can go from landing page to paid account access without needing you

#### Surfaces involved
- [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
- Stripe / billing system not yet wired in repo
- [signup.html](c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html)
- [app/onboarding/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)
- [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)

#### Current blockers
- landing CTA still points to `#buy`
- subscription / portal / billing truth missing
- legal pages are not publish-ready
- proof layer is still weak

#### Current state
`not working end to end`

#### Linked evidence-board items
- `EB-F01`
- `EB-F02`
- `EB-T01`
- `EB-T02`
- `EB-F04`

#### Target phases
- Phase 6
- Phase 7
- Phase 8
- Phase 9
- Phase 10
- Phase 11
- Phase 12

---

### J2 - Cold Visitor -> Demo -> Paid User

#### Who this is
A skeptical user who does not want to buy blind and needs to see the app with believable data first.

#### Entry state
- no account
- high curiosity
- medium skepticism
- wants proof without commitment

#### Start
- landing page CTA or login-page demo CTA

#### Middle
- click `Explore Demo` or `Launch Interactive Demo`
- hit [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html)
- seed believable workspace
- land in dashboard or tour-enabled demo mode
- browse demo-critical modules
- conclude the system is coherent and useful
- convert to signup or purchase

#### End
- demo visitor becomes real buyer or real account creator

#### First commitment
- seed a demo workspace

#### First believable value
- dashboard and surrounding modules feel populated, interconnected, and inspectable

#### Terminal success
- a demo visitor can see enough to trust the product and then convert into a real customer path

#### Surfaces involved
- [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
- [login.html](c:/AppDev/v1AntaeusApp/Appv2_290126/login.html)
- [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html)
- [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- demo-critical modules
- eventual pricing / purchase path

#### Current blockers
- purchase path still broken
- tour is not yet self-serve effective enough
- demo lane is still a utility page, not a polished product lane
- demo-seed credibility depends on all demo-critical modules staying aligned

#### Current state
`partially working`

#### Linked evidence-board items
- `EB-L03`
- `EB-A02`
- `EB-A03`
- `EB-F01`

#### Target phases
- Phase 6
- Phase 10
- Phase 19
- Phase 21
- Phase 23

---

### J3 - Invited Design Partner -> Activated User

#### Who this is
A user who is not arriving cold. They already have founder context from you and are willing to be guided.

#### Entry state
- pre-contextualized
- medium trust
- expects some white-glove support

#### Start
- direct invite
- direct login/signup link
- possibly seeded or guided demo first

#### Middle
- account creation or direct sign-in
- onboarding
- welcome corridor
- first ICP / first account / first deal
- dashboard as command surface

#### End
- partner has a durable workspace with at least one real operating artifact

#### First commitment
- finish onboarding

#### First believable value
- welcome + dashboard + one live module produces a durable artifact

#### Terminal success
- design partner can use the app meaningfully between your sessions without feeling lost

#### Surfaces involved
- signup/login
- onboarding
- welcome
- dashboard
- at least one core module
- settings/export for safety

#### Current blockers
- tour is still too weak to replace your explanation
- welcome is real but not yet full "activation OS"
- some modules still require too much manual interpretation

#### Current state
`working for guided beta, not yet hands-off`

#### Linked evidence-board items
- `EB-A01`
- `EB-A02`
- `EB-A04`
- `EB-AU01`

#### Target phases
- Phase 22
- Phase 23
- Phase 24
- Phase 42
- Phase 43

---

### J4 - Founder -> First AE Handoff

#### Who this is
A founder who has done the early work and now needs the system to be inheritable by a first AE or early seller.

#### Entry state
- existing workspace
- some level of deal / discovery / targeting history
- hiring or handoff pressure

#### Start
- founder is already inside the app
- often from dashboard, readiness, or playbook surfaces

#### Middle
- ICPs exist
- signals exist
- outbound motion exists
- discovery patterns exist
- deals and outcomes exist
- autopsy / proof / advisor notes exist
- playbook gets assembled
- handoff export is generated

#### End
- founder has a playbook / handoff kit that another human could actually run from

#### First commitment
- treat the app as source-of-truth instead of scattered notes

#### First believable value
- readiness and playbook begin reflecting real accumulated operating memory

#### Terminal success
- first AE can inherit the motion without rebuilding the founder's brain from scratch

#### Surfaces involved
- ICP Studio
- Signal Console
- Outbound Studio
- Cold Call Studio
- Discovery Studio
- Deal Workspace
- PoC Framework
- Future Autopsy
- Advisor Deploy
- Quota Workback
- Readiness
- [app/founding-gtm/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)

#### Current blockers
- playbook quality depends on upstream module depth and usage
- some upstream modules are still too manual or too shallow
- handoff export is meaningful, but not yet guaranteed to feel complete

#### Current state
`directionally working, not yet handoff-safe by default`

#### Linked evidence-board items
- `EB-M01`
- `EB-M02`
- `EB-M03`
- `EB-M04`
- `EB-M05`
- `EB-M06`
- `EB-M07`

#### Target phases
- Phase 25 through Phase 41
- especially Phase 40 and Phase 41

---

### J5 - Founder -> Fractional CRO Use

#### Who this is
A founder or small team using Antaeus as a shared system with an outside advisor, fractional CRO, or strategic operator.

#### Entry state
- active founder workspace
- need for judgment, inspection, and operational guidance

#### Start
- existing workspace or newly activated workspace

#### Middle
- dashboard synthesis
- readiness diagnosis
- deal inspection
- advisor deployment
- autopsy and proof analysis
- playbook review

#### End
- outside operator can use the workspace as a review and guidance system rather than asking for scattered screenshots and notes

#### First commitment
- founder records enough structured context for outside review to be valuable

#### First believable value
- dashboard, deals, readiness, and playbook all reflect enough reality to support an expert review session

#### Terminal success
- fractional CRO / advisor can guide the company from inside the product

#### Surfaces involved
- dashboard
- readiness
- deal workspace
- future autopsy
- advisor deploy
- playbook
- export / settings as needed

#### Current blockers
- trust and polish need to be higher for serious advisory use
- some modules still feel too much like worksheets rather than review-grade operating surfaces
- legal/trust layer weakens premium posture

#### Current state
`plausible, but not yet premium-grade`

#### Linked evidence-board items
- `EB-T01`
- `EB-T02`
- `EB-M05`
- `EB-M06`
- `EB-M08`
- `EB-M09`

#### Target phases
- Phase 9
- Phase 25
- Phase 37
- Phase 38
- Phase 40
- Phase 41
- Phase 49

---

### J6 - Solo User -> Export / Handoff

#### Who this is
A single operator who wants a durable offline copy, a backup, or a handoff artifact without necessarily hiring immediately.

#### Entry state
- active workspace
- concern about durability or sharing

#### Start
- dashboard, settings, or playbook

#### Middle
- export backup
- import/restore confidence
- generate playbook / handoff export
- store or share the output

#### End
- user can leave the session with durable output that survives the browser and can be shared or restored

#### First commitment
- use settings/export instead of trusting only browser memory

#### First believable value
- backup works and playbook export reflects real operating state

#### Terminal success
- user believes the workspace is durable and handoff-safe

#### Surfaces involved
- settings
- dashboard
- playbook / handoff
- export/import flows in [js/data-manager.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-manager.js)

#### Current blockers
- backup/export/import still needs explicit full QA
- handoff quality depends on upstream depth
- trust pages and export experience should reinforce durability, not leave doubt

#### Current state
`mostly built, not yet fully proven`

#### Linked evidence-board items
- `EB-M07`
- `EB-P04`

#### Target phases
- Phase 40
- Phase 44
- Phase 51

---

### J7 - Returning User -> Dashboard Command Mode

#### Who this is
An active user coming back to the app to operate, not explore.

#### Entry state
- signed in before
- workspace already exists
- expects fast re-entry

#### Start
- sign in
- or hit root while already authenticated

#### Middle
- route resolver sends user to correct surface
- dashboard loads believable summary
- nav lets the user jump into the right module
- sidebar holds context instead of fighting them

#### End
- returning user can immediately act on the most important work

#### First commitment
- open the dashboard and trust the brief

#### First believable value
- dashboard summary feels current and aligned to real workspace truth

#### Terminal success
- returning user treats dashboard as command mode, not as a decorative home page

#### Surfaces involved
- login
- root route logic
- welcome seen logic
- dashboard
- nav
- all summary loaders

#### Current blockers
- nav scroll reset breaks continuity
- dashboard value is capped by upstream discipline
- some shared badges/flow signals may be broken

#### Current state
`working with friction`

#### Linked evidence-board items
- `EB-R02`
- `EB-R07`
- `EB-M09`

#### Target phases
- Phase 14
- Phase 15
- Phase 25

---

## Adjacent Supporting Journeys
These are not the seven canonical journeys from the program plan, but they materially support them.

### J8 - New User -> Demo-Seeded Tour
- start: click `Tour the App`
- middle: route through demo seed, enter demo workspace, run guided tour
- end: user understands the product with believable data
- current state: `partially working`
- blockers:
  - current tour is not good enough yet
  - demo lane needs stronger productization
- target phases:
  - Phase 21
  - Phase 23

### J9 - Buyer -> Trust Verification
- start: lands on site and needs reassurance
- middle: pricing, legal, privacy, support, proof, billing expectations
- end: buyer feels safe enough to buy
- current state: `not working cleanly`
- blockers:
  - legal pages weak
  - proof layer weak
  - billing truth weak
- target phases:
  - Phase 7
  - Phase 9
  - Phase 10

### J10 - Product Operator -> Module-to-Module Compounding
- start: user finishes one module
- middle: system suggests and pre-fills the next sensible move
- end: app feels like one operating system
- current state: `partially working`
- blockers:
  - compounding rules are not explicit enough in-product
  - many modules still require manual carryover
- target phases:
  - Phase 45
  - Phase 46

## Journey Coverage Table
| Journey | Start Exists | Middle Exists | End Exists | Current State |
|---|---|---|---|---|
| J1 Cold visitor -> paid user | yes | partial | no | broken end to end |
| J2 Cold visitor -> demo -> paid user | yes | partial | no | partially working |
| J3 Invited design partner -> activated user | yes | yes | partial | guided-beta viable |
| J4 Founder -> first AE handoff | yes | yes | partial | directionally working |
| J5 Founder -> fractional CRO use | yes | partial | partial | plausible but thin |
| J6 Solo user -> export / handoff | yes | yes | partial | mostly built, not fully proven |
| J7 Returning user -> dashboard command mode | yes | yes | yes | working with friction |
| J8 New user -> demo-seeded tour | yes | partial | partial | partially working |
| J9 Buyer -> trust verification | yes | weak | no | not ready |
| J10 Module-to-module compounding | yes | partial | partial | not explicit enough |

## Current Most Important Journey Truths

### Truth 1
The product is already credible for:
- guided design-partner activation
- founder-led usage with context
- demo-driven explanation

### Truth 2
The product is not yet credible for:
- broad cold-traffic self-serve purchase
- trust-heavy buyer evaluation
- fully self-service activation via tour alone

### Truth 3
The strongest non-commercial journey today is:
- returning user -> dashboard command mode

### Truth 4
The strongest strategic journey, but not yet fully earned, is:
- founder -> first AE handoff

### Truth 5
The most broken journey is still:
- cold visitor -> paid user

## Which Journey Should Govern The Near-Term Rebuild
If only one journey should dominate the next wave, it is:

### Primary governing journey
`J1 Cold Visitor -> Paid User`

Because if that is broken:
- top-of-funnel is not really closed
- public launch is not real
- pricing/package decisions remain hypothetical

### Secondary governing journey
`J2 Cold Visitor -> Demo -> Paid User`

Because if the product sells best through demonstration, the demo path may be the real commercial spine before the direct self-serve path is fully ready.

### Third governing journey
`J4 Founder -> First AE Handoff`

Because that is the deepest strategic promise of the app.

## Exit-Criteria Check
- every required journey has a written start, middle, and end: yes
- each journey has current-state truth, not just ideal-state language: yes
- journey blockers are tied back to the evidence board and future phases: yes

