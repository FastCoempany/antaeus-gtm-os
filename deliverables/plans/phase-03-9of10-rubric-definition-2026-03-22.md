# Phase 3 - 9/10 Rubric Definition

Date: 2026-03-22  
Companion to:
- [phase-01-promise-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-01-promise-matrix-2026-03-22.md)
- [phase-02-input-output-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-02-input-output-matrix-2026-03-22.md)

## Why Phase 3 Exists
Phase 1 defined what each surface promises.

Phase 2 defined how each surface is supposed to work, what it must take in, what it must put out, and how it must handshake with the rest of the system.

Phase 3 defines the law of judgment.

Without Phase 3:
- improvements are taste-driven
- module quality becomes subjective
- "good enough" keeps drifting
- launch decisions become emotional instead of defensible

With Phase 3:
- every surface is judged under the same standard
- every score means something
- every rebuild can be accepted or rejected against a written rubric

## Phase 3 Objective
Create one scoring system that can be applied across:
- public pages
- auth / onboarding / welcome
- core app modules
- settings / trust surfaces
- methodology pages
- standalone launch-agent surfaces

And do it in a way that still respects:
- the handoff kit as the supreme output
- the need for modules to handshake
- the importance of demo seed, tour, and explainer readiness

## The 8 Rubric Dimensions
These are the canonical dimensions from the master program. Every surface gets scored on all 8.

1. `Clarity`
2. `Trust`
3. `Reliability`
4. `Speed to Value`
5. `Automation Value`
6. `Module Completeness`
7. `Exportability`
8. `Launch Readiness`

## Weighted Score Formula

### Weighting
| Dimension | Weight |
|---|---:|
| Clarity | 15% |
| Trust | 10% |
| Reliability | 20% |
| Speed to Value | 15% |
| Automation Value | 10% |
| Module Completeness | 15% |
| Exportability | 5% |
| Launch Readiness | 10% |

### Formula
`overall_score = sum(dimension_score * weight)`

The result is a `0.0 - 10.0` score.

### Why these weights
- Reliability is weighted highest because an elegant broken module is still a bad module.
- Clarity, speed to value, and completeness are next because Antaeus is supposed to feel like an operating system, not a puzzle.
- Trust and launch readiness matter because the product is trying to sell self-serve.
- Automation value matters because too much manual burden will collapse perceived sophistication.
- Exportability is lower-weighted globally, but it matters much more for modules feeding the handoff kit.

## Dimension Definitions

### 1. Clarity
**Question:** does the surface make it immediately obvious what it does, what it needs, and what the user gets?

#### Score anchors
- `0`: incomprehensible or mislabeled
- `2`: user can name the module, but not what to do with it
- `4`: broad idea is clear, but inputs/outputs are still fuzzy
- `6`: promise is understandable and UI mostly maps to outcome
- `8`: user knows how to use it without outside explanation
- `10`: user instantly understands the job, sequence, and payoff

#### Evidence
- page title / subtitle quality
- field labeling
- step logic
- empty-state instruction quality
- next-step guidance

### 2. Trust
**Question:** does the surface feel safe, serious, and publish-ready enough to be believed?

#### Score anchors
- `0`: broken, drafty, or obviously unsafe
- `2`: visible placeholders / legal / copy issues
- `4`: mostly usable, but confidence-eroding rough edges remain
- `6`: credible enough for a guided beta
- `8`: credible for self-serve paid use
- `10`: polished, confidence-building, and commercially trustworthy

#### Evidence
- copy quality
- absence of mojibake
- absence of placeholder text
- legal/billing confidence where relevant
- visible proof that data persists / exports / syncs

### 3. Reliability
**Question:** does the surface boot, save, update, and recover consistently without silent failure?

#### Score anchors
- `0`: effectively broken
- `2`: frequent failure or obvious instability
- `4`: works sometimes, but has silent failures or flaky behavior
- `6`: generally works, but edge cases or UX regressions remain
- `8`: stable in normal use and transparent when something fails
- `10`: stable, resilient, and operationally dependable

#### Evidence
- boot success
- save success
- no swallowed errors
- no duplicate chrome/injection defects
- no broken interactions
- persistence and refresh behavior

### 4. Speed to Value
**Question:** how quickly can a user get from opening the surface to a believable output?

#### Score anchors
- `0`: no meaningful output in-session
- `2`: value only appears after heavy setup
- `4`: payoff exists, but takes too much work before it appears
- `6`: value appears in one focused session
- `8`: value appears quickly and feels tangible
- `10`: value appears almost immediately and feels obvious

#### Evidence
- time to first saved artifact
- number of required inputs before payoff
- seeded/demo defaults
- quality of default states

### 5. Automation Value
**Question:** does the surface meaningfully reduce manual thinking or manual labor?

#### Score anchors
- `0`: pure manual worksheet
- `2`: almost all value comes from user discipline
- `4`: some assistance, but still mostly manual
- `6`: real assistance exists, but not enough leverage yet
- `8`: system does meaningful work for the user
- `10`: automation feels like a force multiplier without destroying control

#### Evidence
- inference from prior modules
- seeded defaults
- computed summaries
- automated cross-module propagation
- generated drafts / scores / prioritization

### 6. Module Completeness
**Question:** does the module fully deliver the job it claims, or only part of it?

#### Score anchors
- `0`: promise and implementation are disconnected
- `2`: module gestures at the job but does not truly complete it
- `4`: useful fragments exist, but core parts are missing
- `6`: most of the job is covered
- `8`: module covers the full job in a credible way
- `10`: module feels whole, defensible, and ready for repeated use

#### Evidence
- coverage of promised workflow
- presence of required states
- downstream utility
- quality of saved outputs

### 7. Exportability
**Question:** does the value produced here survive beyond the moment and feed the broader system or handoff?

#### Score anchors
- `0`: output is trapped or ephemeral
- `2`: output exists, but is not durable or reusable
- `4`: output persists, but has weak downstream consumption
- `6`: output is durable and some downstream surfaces use it
- `8`: output materially compounds through the system
- `10`: output is handoff-safe, export-safe, and strategically reusable

#### Evidence
- durable persistence
- downstream surfaces consuming the output
- export/handoff relevance
- cross-device survival where appropriate

### 8. Launch Readiness
**Question:** if a new stranger hit this surface during a live launch, would it strengthen or weaken the launch?

#### Score anchors
- `0`: launch liability
- `2`: should be hidden from public use
- `4`: usable in guided beta only
- `6`: safe for design partners / narrow launch
- `8`: ready for public use
- `10`: actively helps conversion, retention, or trust in launch conditions

#### Evidence
- self-serve viability
- support burden
- copy and trust quality
- clarity under first-use conditions

## Hard Cap Rules
Weighted average alone is not enough. Certain failures cap the score regardless of averages.

### Cap 1 - Reliability cap
If `Reliability < 5`, overall score cannot exceed `5.9`.

### Cap 2 - Trust cap
If `Trust < 5` on any public, billing, auth, or legal surface, overall score cannot exceed `5.5`.

### Cap 3 - Speed-to-value cap
If `Speed to Value < 5` on any demo-critical module, overall score cannot exceed `6.0`.

### Cap 4 - Completeness cap
If `Module Completeness < 5`, overall score cannot exceed `5.9`.

### Cap 5 - Exportability cap for handoff-feeding modules
If a handoff-feeding module has `Exportability < 5`, overall score cannot exceed `6.2`.

### Cap 6 - Launch-readiness cap
If `Launch Readiness < 4`, the surface is not launch-safe and must be marked `beta-only`.

## Connective-Tissue Gates
The 8 dimensions are the score. These gates determine whether the score is allowed to stand.

### Gate A - Handshake gate
The module must have:
- at least one named upstream dependency, or a justified "none"
- at least one named downstream consumer, or a justified "terminal output"
- a recommended next move for the user

If not, the module is marked `handshake-failed`.

#### Result
Any `handshake-failed` module is capped at `6.0`.

### Gate B - Demo-seed gate
If a module is `demo-critical` and demo seed does not make it feel believable on first load, it is marked `demo-failed`.

#### Result
Any `demo-failed` module is capped at `5.5`.

### Gate C - Handoff contribution gate
If a module claims to improve operating readiness but contributes nothing durable to the playbook / handoff path, it is marked `handoff-light`.

#### Result
Any `handoff-light` module is capped at `6.5` until that changes.

### Gate D - Silent-failure gate
If a surface swallows important user-facing errors instead of surfacing them, it is marked `silent-failure`.

#### Result
Any `silent-failure` surface is capped at `5.0`.

## Surface Classes
Every surface should be tagged so the rubric is applied with the right expectations.

### Class 1 - Public conversion surfaces
Examples:
- landing
- methodology index
- methodology pages
- terms
- privacy

What matters most:
- Clarity
- Trust
- Launch Readiness

### Class 2 - Activation surfaces
Examples:
- signup
- login
- onboarding
- welcome

What matters most:
- Reliability
- Speed to Value
- Clarity

### Class 3 - Execution modules
Examples:
- Signal Console
- ICP Studio
- Outbound Studio
- Discovery Studio
- Deal Workspace
- PoC Framework

What matters most:
- Reliability
- Speed to Value
- Completeness
- Exportability

### Class 4 - Synthesis / command surfaces
Examples:
- dashboard
- readiness
- playbook
- launch-agent dashboard

What matters most:
- Clarity
- Reliability
- Completeness
- Launch Readiness

### Class 5 - Trust / ops surfaces
Examples:
- settings
- terms
- privacy

What matters most:
- Trust
- Reliability
- Exportability

## Module-Tier Definitions

### 0-3.9 = Broken or ornamental
- not safe to rely on
- not safe to launch
- either broken, unclear, or fake-complete

### 4.0-5.9 = Beta-only
- useful in guided settings
- too fragile or incomplete for self-serve

### 6.0-6.9 = Credible but not yet sharp
- can be shown
- can be used
- still not a flagship module

### 7.0-7.9 = Strong
- useful, believable, and worth leaning on
- still has one or two material upgrade paths

### 8.0-8.9 = Launch-strong
- clearly delivers
- supports self-serve or near-self-serve usage
- no major apology required

### 9.0-10.0 = Category-defining for its role
- fast
- crisp
- reliable
- compounds through the system
- helps explain why the whole product exists

## What 9/10 Means By Surface Type

### Landing page at 9/10
- a cold visitor instantly understands the offer
- the CTA resolves to a real purchase path
- trust objections are handled
- demo and signup paths are clean

### Onboarding / welcome at 9/10
- new user gets from account creation to believable workspace with no help
- welcome feels like intelligent guidance, not filler
- demo and real-workspace paths are both obvious

### Execution module at 9/10
- user can produce a durable artifact in one session
- module is clear, stable, and downstream-useful
- demo seed makes it instantly believable
- the output feeds the playbook / dashboard / readiness path

### Playbook / handoff at 9/10
- the workspace can be inherited by another operator
- the assembled narrative feels earned
- exports are credible
- gaps are obvious and motivating

## Evidence Requirements For Scoring
No score should be assigned without evidence.

### Valid evidence
- repo-backed implementation
- visible UI output
- live persisted state
- explicit saved artifact
- launch/demo path proof
- reproducible user test

### Weak evidence
- "the code suggests"
- "it should work"
- "the plan exists"
- "the page is there"

### Rule
If evidence is weak, score conservatively.

## Scorecard Template
Use this template for every module audit going forward.

```md
## [Module Name]

Surface type:
Owner:
Promise:
Demo-critical: yes/no
Handoff-feeding: yes/no

### Scores
- Clarity: x/10
- Trust: x/10
- Reliability: x/10
- Speed to Value: x/10
- Automation Value: x/10
- Module Completeness: x/10
- Exportability: x/10
- Launch Readiness: x/10

Weighted score:

### Gates
- Handshake gate: pass/fail
- Demo-seed gate: pass/fail
- Handoff contribution gate: pass/fail
- Silent-failure gate: pass/fail

Effective score after caps:

### Why this score
- ...

### What blocks 9/10
- ...

### Fastest path to +1.0 score
- ...
```

## Program-Level Control Rules

### Rule 1
No module can be called "done" without an explicit scorecard.

### Rule 2
No module can be called "launch-ready" if:
- Reliability < 7
- Trust < 7
- Launch Readiness < 7

### Rule 3
No demo-critical module can be called "tour-ready" if:
- Speed to Value < 7
- Demo-seed gate fails

### Rule 4
No handoff-feeding module can be called "system-complete" if:
- Exportability < 7
- Handoff contribution gate fails

### Rule 5
No public self-serve launch should happen until:
- landing >= 8
- signup >= 8
- onboarding >= 8
- welcome >= 8
- dashboard >= 8
- legal/trust pages >= 7
- purchase path >= 8

## Current Baseline Interpretation
Using the current repo and audit:
- the strongest candidates are already around `7-8`
- the weakest surfaces are around `3-4`
- many core modules are not far from strong
- the biggest blockers are not "need more ideas"
- they are reliability, trust, and connective-tissue proof

That is good news because this rubric is not being introduced into a hollow product. It is being introduced into a product that already has meaningful breadth and now needs uniform quality law.

## Exit-Criteria Check
- each module has a `0-10` rubric under the same standard: yes
- the rubric accounts for handshake logic: yes
- the rubric accounts for demo-seed reality: yes
- the rubric accounts for handoff-kit supremacy: yes
- the rubric can now govern the rest of the program: yes

