# SHOULD WE HIRE THE NEXT AE?
## Master Build Specification — Offer, Landing Page, Underwriting Engine, Decision System, Report, Commerce, Operations, Calibration

**Owner:** Antaeus  
**Product:** Should We Hire the Next AE?  
**Purchased artifact:** AE Hiring Brief  
**Method:** AE Capacity Underwriting  
**Initial price:** $149 one-time  
**Primary route:** `/should-we-hire-an-ae/`  
**Design source of truth:** current Antaeus `body.command-surface-page` layer in `/css/app.css`  
**Technical posture:** compatible with the current Antaeus pure HTML/CSS/JS architecture  
**Document purpose:** remove product, analytical, design, and implementation ambiguity before coding

---

# 0. Executive Build Decision

This is a **decision-underwriting service**, not a stripped-down Antaeus subscription.

A buyer pays once, supplies structured commercial inputs, and receives a finished artifact answering:

> **Does the company currently have enough economic need, demand supply, repeatable sales motion, and timing/management capacity to justify adding the next quota-carrying AE?**

If the evidence does not support the hire, the output answers:

> **What specifically must become true before the hire becomes defensible?**

The product is deliberately conservative. It must not:
- turn a revenue gap directly into a hiring recommendation;
- substitute generic SaaS benchmarks for missing company data;
- hide contradictory answers;
- present false mathematical precision;
- confuse founder-led performance with transferable AE performance;
- double-count ramp and sales-cycle delay;
- treat pipeline owned by current sellers as freely allocatable to a new seller;
- convert a low-confidence estimate into a high-confidence recommendation.

The underwriting model evaluates four independent questions:

1. **Economic Need** — is there a real capacity gap?
2. **Demand Sufficiency** — is there enough qualified opportunity to feed another seller?
3. **Motion Repeatability** — can a non-founder seller reproduce the current motion?
4. **Timing & Management Capacity** — can the hire ramp and contribute when the plan needs the revenue?

The final decision state is one of:

- **SUPPORTED**
- **CONDITIONAL**
- **NOT YET SUPPORTED**
- **INSUFFICIENT EVIDENCE**

Every decision includes:
- dominant constraint,
- supporting evidence,
- conflicting evidence,
- assumptions,
- unknowns,
- sensitivity,
- confidence,
- and explicit hiring conditions.

---

# 1. Completion Map — Original 34-Point Step-1 Plan

## 1. Product

### Public product name
**Should We Hire the Next AE?**

### Purchased artifact
**AE Hiring Brief**

### Method
**AE Capacity Underwriting**

### Category
A one-time sales-capacity underwriting analysis for early-stage B2B companies.

### This product is not
- sales coaching
- fractional VP Sales
- recruiting
- candidate assessment
- generic GTM consulting
- a benchmark report
- an AI report generator
- Antaeus application access
- a financial-planning replacement
- a CRM audit

### Core question
> Does the current sales system support adding another quota-carrying AE?

### Secondary question
> If not, what conditions must become true before the hire is supportable?

---

## 2. Buyer

### Primary buyer
First VP Sales, Head of Sales, or founding sales leader at a Seed–Series B B2B company, typically with 0–3 existing quota carriers, who is preparing to request or validate the next sales head.

### Secondary buyer
Founder/CEO deciding whether to make the first or second professional AE hire.

### Tertiary buyer
VC operating/platform partner supporting a portfolio company’s early GTM hiring decision.

### Copy priority
The landing page writes to the **first sales leader**. Other buyers should recognize themselves without diluting the page.

---

## 3. Job to Be Done

The buyer’s real job is:

> **Help me walk into the headcount conversation with a defensible answer.**

The buyer is not primarily purchasing education about sales hiring. They are purchasing an evidence-backed decision artifact that can survive scrutiny from a CEO, CFO, founder, board member, or operating partner.

---

## 4. Product Promise

Approved direction:

> **Give us the operating numbers behind your sales motion. Get back a decision brief showing whether the next AE is supported by the math, where the case breaks, and what must be true before you hire.**

### Prohibited marketing language
Avoid:
- scale confidently
- unlock growth
- actionable insights
- data-driven decisions
- predictable revenue engine
- accelerate revenue
- optimize your GTM
- transform your sales organization
- AI-powered intelligence

The page should sound like an operating instrument.

---

## 5. Deliverable

The buyer receives a finished:

# AE Hiring Brief

Target rendered length: **6–10 pages**

Required sections:
1. Decision Summary
2. Revenue/Capacity Gap
3. Proposed AE Contribution
4. Funnel Requirement
5. Demand Coverage
6. Repeatability Evidence
7. Timing Reality
8. Management Capacity
9. Sensitivity Analysis
10. Hiring Conditions
11. Evidence Gaps
12. Assumptions & Methodology

The buyer purchases the finished conclusion and evidence trail, not software access.

---

## 6. Central Analytical Concept

The product runs four independent tests.

### Test A — Economic Need
Would additional quota-carrying capacity solve an actual capacity shortfall?

### Test B — Demand Sufficiency
Is enough qualified demand likely to exist for the proposed seller to work?

### Test C — Motion Repeatability
Can a non-founder seller reproduce the current sales motion with reasonable independence?

### Test D — Timing & Management Capacity
Can the hire ramp, receive management, and contribute on the timetable the revenue plan requires?

No single test substitutes for the others.

---

## 7. Verdict Architecture

### SUPPORTED
Available evidence supports adding the seat under the declared assumptions.

### CONDITIONAL
The economics can support the seat, but one or more explicit unresolved conditions materially affect the case.

### NOT YET SUPPORTED
The evidence currently indicates that another AE is not the next constraint the company should solve.

### INSUFFICIENT EVIDENCE
Critical data is unavailable, contradictory, or too weak to support a responsible conclusion.

### Display
```text
CONDITIONAL
Primary constraint: Pipeline supply
Confidence: Moderate
```

**Decision state and confidence are separate.**

---

## 8. $149 Scope Boundary

### Included
- structured intake
- internal-consistency validation
- revenue/capacity math
- funnel workback
- demand coverage
- repeatability assessment
- timing assessment
- management assessment
- sensitivity analysis
- explicit evidence gaps
- finished AE Hiring Brief
- one asynchronous clarification request if submitted inputs conflict

### Excluded
- live consulting call
- CRM connection
- CRM cleaning
- CRM export analysis
- call transcript analysis
- manual target-account research
- territory research
- compensation-plan design
- hiring-profile design
- candidate evaluation
- recruiting
- sales-process implementation
- rep onboarding
- board-deck creation
- custom forecasting engagement
- ongoing advisory

---

## 9. Inputs

The intake collects:
- decision context
- revenue target
- current sales team
- proposed AE economics
- ACV and sales cycle
- conversion
- qualified pipeline
- pipeline creation
- founder involvement
- process repeatability
- timing
- management capacity
- source/provenance of key numbers

Exact fields are specified in Step 2.

---

## 10. Missing Data as Evidence

Every applicable field supports:
- supplied value,
- unknown,
- not applicable.

The engine distinguishes:

```text
0
```

from:

```text
Unknown
```

Unknown is never converted to zero.

Missing critical data may:
- reduce confidence,
- force a conditional conclusion,
- or force `INSUFFICIENT EVIDENCE`.

Generic benchmarks are not silently substituted.

---

## 11. Price Architecture

### V1
# $149 one time

No:
- subscription
- fake crossed-out price
- three-tier table
- free trial
- discount countdown
- demo requirement

Potential later ladder, not prominent on V1:
- $149 self-reported AE Hiring Brief
- $750–$1,000 verified analysis using CRM export
- $2,500+ first-two-AE/headcount validation

---

## 12. Technical CSS Architecture

Use:

```html
<link rel="stylesheet" href="/css/app.css">
<link rel="stylesheet" href="/css/service-page.css">

<body class="command-surface-page service-page ae-hire-page">
```

### `/css/app.css` owns
- brand palette
- semantic colors
- typography tokens
- base buttons
- spacing language
- radius language
- shadow language

### `/css/service-page.css` owns
- public-page layout
- hero composition
- section composition
- report specimens
- analytical diagrams
- responsive behavior

Do not re-hard-code Antaeus colors throughout the new stylesheet.

---

## 13. Visual Principle

Approved concept:

# Decision Sheet

The page should feel like:

> **an underwriting instrument opened to the public**

Not:

> a generic SaaS marketing page for consulting.

Visual characteristics:
- bright Antaeus command surface
- navy information hierarchy
- orange action/brand emphasis
- blue information state
- restrained amber/red risk states
- open sections
- thin rules
- analytical specimens
- limited container use
- no decorative stock imagery dependency

---

## 14. Surface Hierarchy

### Level 1 — Open Page
Default. Most content sits directly on the page.

### Level 2 — Ruled Section
Use spacing and thin borders.

### Level 3 — Analytical Object
Contained surface only when it represents a real object:
- decision brief
- equation
- report specimen
- sensitivity table
- input specimen
- verdict block

No container exists merely to create visual variety.

---

## 15. Layout Grid

### Desktop
```text
max-width: 1200px
12-column grid
outer gutter: 32px
major section spacing: 96px
minor spacing: 48px
```

### Hero
```text
7 columns — proposition
5 columns — decision-sheet specimen
```

### Tablet
Stack hero near 900–960px.

### Mobile
Single column. Recompose the decision specimen; do not simply shrink desktop.

---

## 16. Navigation

Recommended:

```text
ANTAEUS                       How it works     Sample     $149     Get the brief →
```

Rules:
- Antaeus mark routes to the main site.
- How it works anchors to methodology.
- Sample anchors to sample result.
- $149 anchors to pricing.
- primary CTA initiates checkout.
- no mega-navigation.

---

## 17. Hero Architecture

### Kicker
`HEADCOUNT UNDERWRITING · B2B SALES`

### H1
# Before you hire the next AE, prove there’s a sales system for them to inherit.

### Support
We work backward from your revenue target, pipeline, conversions, ramp, sales cycle and current selling capacity to determine whether another quota-carrying seat is supported — and what must become true if it isn’t.

### Primary CTA
`Get the hiring brief — $149`

### Secondary CTA
`See a sample result`

### Microcopy
`One-time analysis · No call required · Structured decision brief`

Do not publish a turnaround-time promise until fulfillment has been validated.

---

## 18. Hero Visual

Show the purchased object, not a generic dashboard.

```text
SAMPLE · AE CAPACITY DECISION

CONDITIONAL
Pipeline supply is the limiting condition.

Economic need                    SUPPORTED
Demand supply                    THIN
Motion repeatability             SUPPORTED
Timing & management              SUPPORTED

NEXT AE ECONOMICS

Annual quota                       $900k
Horizon contribution              $675k
Wins required                        ≈13
Qualified opps required              ≈62
Qualified pipeline required       $3.21M

THE HIRE BECOMES SUPPORTABLE WHEN

Allocatable qualified pipeline    ≥ required amount
Non-founder conversion evidence   sufficient
Monthly qualified opp creation    supports added seat
```

All sample outputs must be labeled `SAMPLE` or `ILLUSTRATIVE`.

---

## 19. Page Sequence

1. Hero
2. Hidden hiring error
3. Four underwriting tests
4. Reverse-engineered model
5. What buyer receives
6. Sample result
7. Required inputs
8. Fit / non-fit
9. Pricing
10. FAQ
11. Final CTA

Exact production copy appears in Step 1A.

---

## 20. “What You Receive” Section

Name the actual artifact sections:
- Decision
- Capacity Model
- Funnel Model
- Timing Model
- Sensitivity
- Hiring Conditions
- Evidence Gaps

Do not use a generic feature-icon grid.

---

## 21. Sample Result

Use a clearly fictional B2B SaaS case.

The sample must demonstrate:
- calculation,
- judgment,
- constraint detection,
- uncertainty,
- and conditions.

It must never imply the sample company is a customer.

---

## 22. Inputs Section

Headline:

# You probably already know most of what we need.

Categories:
- revenue plan
- current team
- quota + compensation
- ACV + cycle
- conversion
- pipeline
- pipeline creation
- founder involvement
- management capacity

Required copy:

> Don’t know a number? Say so. Missing evidence is treated as missing evidence — not silently replaced with an industry benchmark.

---

## 23. Fit / Non-Fit

### Use it when
- you are requesting another sales head;
- a founder is deciding whether it is time for the first AE;
- finance wants the revenue logic;
- there is real sales history;
- leadership is debating now versus next quarter;
- current reps may be approaching capacity.

### Do not use it when
- evaluating a specific candidate;
- there is essentially no customer/sales evidence;
- requesting recruiting services;
- requesting broad GTM consulting;
- requiring CRM cleanup;
- requiring custom compensation design.

---

## 24. Pricing

# $149

**One AE hiring analysis. One completed brief.**

Includes:
- structured intake
- capacity analysis
- demand analysis
- repeatability analysis
- timing analysis
- management analysis
- sensitivity analysis
- evidence-gap analysis
- AE Hiring Brief

CTA:
`Underwrite the next AE →`

---

## 25. FAQ

Required questions:
1. Is this evaluating the candidate?
2. What if I do not know every number?
3. Do you need CRM access?
4. What exactly do I receive?
5. What happens if the answer is “not yet”?
6. Is this financial advice?
7. Is this based on industry benchmarks?
8. How is company information handled?

Privacy wording must match actual storage/deletion behavior.

---

## 26. Final CTA

# Know what has to be true before you put another quota on payroll.

`Get the AE Hiring Brief — $149 →`

---

## 27. Interaction Design

Allowed:
- restrained calculation sequencing
- subtle number transitions
- sample sensitivity interaction
- report-preview reveal
- anchor scrolling

Avoid:
- decorative floating objects
- heavy parallax
- constant typing animations
- gratuitous gradients
- animated card grids
- motion required to understand content

---

## 28. State Colors

| Meaning | Antaeus token |
|---|---|
| Brand/action | current `--brand-gold` command-surface orange |
| Informational | `--accent-blue` |
| Supported | `--accent-green` |
| Conditional/risk | `--accent-amber` |
| Unsupported/blocked | `--accent-red` |
| Primary information | `--text-primary` |

Orange must not double as a warning state.

---

## 29. Component Inventory

```text
service-nav
service-hero
service-kicker
service-section
service-section-rule
service-cta
decision-sheet
decision-state
decision-metric
equation-stack
underwriting-lane
report-specimen
sample-case
input-category
price-block
faq-row
service-footer
```

Avoid generic “feature-card” abstractions unless a real semantic need emerges.

---

## 30. Route

Public:
`/should-we-hire-an-ae/`

Related:
```text
/ae-hire/sample/
/ae-hire/intake/
/ae-hire/confirmation/
/ae-hire/privacy/
```

Report-delivery URLs must be private/tokenized and `noindex`.

---

## 31. Purchase Architecture

```text
/should-we-hire-an-ae/
        ↓
Stripe checkout
        ↓
/ae-hire/intake/?order=<opaque-id>
        ↓
validated submission
        ↓
analysis
        ↓
finished brief
        ↓
secure delivery
```

Do not force the buyer into:
- an Antaeus workspace,
- Antaeus onboarding,
- an Antaeus subscription,
- app learning.

The application is production infrastructure; the brief is the purchased product.

---

## 32. Analytics

Funnel:
```text
ae_page_view
ae_sample_view
ae_checkout_click
ae_checkout_complete
ae_intake_start
ae_intake_save
ae_intake_complete
ae_clarification_required
ae_analysis_complete
ae_brief_delivered
```

Diagnostics:
```text
pricing_seen
faq_open
scroll_50
scroll_75
intake_validation_error
checkout_error
brief_generation_error
```

Use the current `window.gtmAnalytics.track()` path when available.

---

## 33. Validation

Run five ICP-matched comprehension tests.

Ask:
1. What is being sold?
2. Who is it for?
3. What do you get?
4. What does it cost?
5. What information would you expect to provide?

Pass:
- at least 4/5 correctly answer the first four without coaching;
- no misconception repeats across two testers;
- repeated confusion triggers revision;
- fixes prefer cutting/clarifying over adding paragraphs.

---

## 34. Step-1 Definition of Done

### Complete in this spec
- [x] final product name
- [x] purchased artifact
- [x] methodology
- [x] primary buyer
- [x] secondary buyer
- [x] job to be done
- [x] promise
- [x] exclusions
- [x] price
- [x] four-test model
- [x] verdict taxonomy
- [x] constraint concept
- [x] intake categories
- [x] brief structure
- [x] page information architecture
- [x] hero concept
- [x] specimen concept
- [x] section sequence
- [x] design-token strategy
- [x] surface hierarchy
- [x] responsive framework
- [x] component inventory
- [x] commerce architecture
- [x] analytics taxonomy
- [x] validation protocol

### External dependencies
- [ ] live Stripe credentials/configuration
- [ ] final production data-handling policy
- [ ] five-person external comprehension test

---

# 2. Step 1A — Production Landing Page Specification

## 2.1 Page Goal

Convert a sales leader already contemplating headcount into a $149 purchase without requiring a call.

The page does not argue that the company *should* hire. It argues that the decision is worth underwriting before scarce capital is committed.

## 2.2 Primary Conversion

`ae_checkout_click`

## 2.3 Secondary Conversion

`ae_sample_view`

No email-gated lead magnet in V1.

---

## 2.4 Final Landing Page Copy

### Navigation

**ANTAEUS**

Links:
- How it works
- Sample
- $149
- **Get the brief →**

---

### HERO

**Kicker**

`HEADCOUNT UNDERWRITING · B2B SALES`

**H1**

# Before you hire the next AE, prove there’s a sales system for them to inherit.

**Body**

We work backward from your revenue target, pipeline, conversions, ramp, sales cycle and current selling capacity to determine whether another quota-carrying seat is supported — and what must become true if it isn’t.

**Primary CTA**

`Get the hiring brief — $149`

**Secondary CTA**

`See a sample result`

**Microcopy**

`One-time analysis · No call required · Structured decision brief`

---

### SECTION 2 — THE HEADCOUNT ERROR

**Kicker**

`THE HEADCOUNT ERROR`

**H2**

# A revenue target does not prove you need another salesperson.

**Body**

A company can be short of revenue and still have enough selling capacity. The real constraint may be pipeline, conversion, territory supply, founder dependence, ramp timing or management capacity.

**Visual**

```text
“We need another $1.2M.”
                ≠
“We need another AE.”
```

**Close**

The analysis separates the revenue problem from the headcount question.

---

### SECTION 3 — FOUR TESTS

**Kicker**

`WHAT WE UNDERWRITE`

**H2**

# Four things have to survive the math.

#### 01 — Economic Need

**Is additional selling capacity actually required?**

We compare the revenue plan with the productive capacity already in the system.

#### 02 — Demand

**Is there enough qualified opportunity for another seat?**

We test whether allocatable pipeline and pipeline creation can feed the proposed seller.

#### 03 — Repeatability

**Can another seller reproduce the motion?**

We separate founder-led success from evidence that a non-founder seller can run the motion.

#### 04 — Timing

**Can the hire contribute when the plan needs the revenue?**

We reconcile recruiting timing, ramp, sales cycle and management capacity.

---

### SECTION 4 — THE WORKBACK

**Kicker**

`THE WORKBACK`

**H2**

# Start with the revenue. Work backward until the seat either holds or breaks.

**Sample**

```text
$1,200,000 incremental ARR
÷ $75,000 ACV
= 16 wins

16 wins
÷ 24% qualified-opportunity win rate
= 67 qualified opportunities

67 × $75,000
= $5.0M qualified pipeline
```

**Body**

That is only the beginning. We then ask whether the existing team already has unused capacity, whether the pipeline can actually be allocated to the new seller, whether the conversion rate is transferable beyond the founder, and whether the revenue can arrive inside the required period.

**Pull line**

> The question is not whether you want another AE. It is whether the system can supply what that AE would need to produce.

---

### SECTION 5 — WHAT YOU GET

**Kicker**

`WHAT YOU GET`

**H2**

# A decision brief, not a dashboard.

**Intro**

Your AE Hiring Brief shows the argument, the math beneath it, the evidence that weakens it, and the conditions that would change the answer.

**Decision**  
What the available evidence supports now.

**Capacity model**  
What the incremental seller must produce and how much of the revenue gap the seat can realistically cover.

**Funnel model**  
The qualified pipeline, opportunity and meeting volume implied by the target.

**Timing model**  
When the seat can realistically begin contributing under the declared ramp structure.

**Sensitivity**  
Which assumption changes the conclusion fastest.

**Hiring conditions**  
The explicit operating conditions that must become true before the seat is supportable.

**Evidence gaps**  
What the company does not currently know well enough to underwrite.

---

### SECTION 6 — SAMPLE RESULT

**Kicker**

`SAMPLE RESULT`

**H2**

# The answer can be “yes” to the economics and “not yet” to the hire.

**Sample label**

`SERIES A · INFRASTRUCTURE SAAS · FICTIONAL EXAMPLE`

**Inputs**

```text
Current ARR                          $3.4M
12-month new ARR target              $2.0M
Current AEs                              2
Average ACV                           $52k
Qualified-opportunity win rate         21%
Average sales cycle                    94d
Current qualified pipeline            $3.4M
Allocatable at proposed AE start        $2.9M
```

**Verdict**

# CONDITIONAL

**Primary constraint: pipeline supply**

**Analysis**

Another AE can be economically justified by the revenue plan, but the current pipeline-production rate does not yet support three fully productive sellers.

At the declared conversion rate, the proposed seat requires more qualified opportunity supply than is currently allocatable after the existing team’s demand is accounted for.

**Conditions**

The hire becomes supportable when:
- allocatable qualified pipeline reaches the required coverage for the proposed contribution period;
- monthly qualified opportunity creation supports the additional seller after existing-team demand;
- non-founder conversion evidence is strong enough to use as the planning rate;
- the start date still allows the seller to contribute inside the required revenue window.

**Disclaimer**

`Illustrative sample. Not a benchmark and not a customer result.`

---

### SECTION 7 — INPUTS

**Kicker**

`THE INPUT`

**H2**

# You probably already know most of what we need.

**Categories**

Revenue plan  
Current sales team  
Proposed quota + compensation  
ACV + sales cycle  
Conversion rates  
Qualified pipeline  
Pipeline creation  
Founder involvement  
Management capacity  
Required timing

> Don’t know a number? Say so. Missing evidence is treated as missing evidence — not silently replaced with an industry benchmark.

---

### SECTION 8 — FIT

**Kicker**

`WHEN TO USE IT`

**H2**

# Built for an actual headcount decision.

**Use it when**
- you are asking for another quota-carrying sales head;
- the founder is deciding whether it is time for the first AE;
- finance wants the math behind the request;
- you have real sales history but the capacity case is still mostly verbal;
- leadership is debating now versus next quarter.

**This is not**
- candidate evaluation;
- recruiting;
- broad GTM consulting;
- CRM cleanup;
- compensation design;
- a custom operating engagement.

---

### SECTION 9 — PRICING

**Kicker**

`ONE DECISION · ONE PRICE`

# $149

**One AE hiring analysis. One completed brief.**

Includes:
- structured intake
- capacity analysis
- demand analysis
- repeatability analysis
- timing analysis
- management analysis
- sensitivity analysis
- evidence-gap analysis
- AE Hiring Brief

**CTA**

`Underwrite the next AE →`

**Microcopy**

`No subscription. No sales call required.`

---

### SECTION 10 — FAQ

#### Is this evaluating the candidate?

No. It evaluates whether the business and sales motion currently support adding the seat. Candidate quality is a separate question.

#### What if I do not know every number?

Use `I don’t know`. Unknown inputs remain unknown and appear as evidence gaps. We do not quietly replace them with generic industry assumptions.

#### Do you need CRM access?

Not for the $149 version. The analysis is based on the structured information you provide.

#### What do I receive?

A completed AE Hiring Brief containing the decision state, capacity and funnel math, timing analysis, sensitivity, evidence gaps and hiring conditions.

#### What happens if the answer is “not yet”?

The brief identifies the constraint and the conditions that would need to become true before the hire becomes supportable.

#### Is this financial advice?

No. It is an operating analysis of sales-capacity assumptions. Hiring and financial decisions remain with the company.

#### Is this based on industry benchmarks?

Not by default. The model prioritizes company-specific inputs. If an optional external assumption is ever used, it must be explicitly labeled as an external assumption rather than presented as company evidence.

#### How is our company information handled?

Production copy must mirror the implemented storage, access and deletion policy.

---

### SECTION 11 — FINAL CTA

# Know what has to be true before you put another quota on payroll.

`Get the AE Hiring Brief — $149 →`

---

## 2.5 DOM / Component Skeleton

```html
<body class="command-surface-page service-page ae-hire-page">
  <header class="service-nav">...</header>

  <main>
    <section class="service-hero" id="top">
      <div class="service-hero__copy">...</div>
      <aside class="decision-sheet decision-sheet--sample">...</aside>
    </section>

    <section class="service-section service-section--reframe">...</section>
    <section class="service-section" id="how-it-works">...</section>
    <section class="service-section service-section--equation">...</section>
    <section class="service-section service-section--deliverable">...</section>
    <section class="service-section" id="sample">...</section>
    <section class="service-section service-section--inputs">...</section>
    <section class="service-section service-section--fit">...</section>
    <section class="service-section" id="pricing">...</section>
    <section class="service-section service-section--faq">...</section>
    <section class="service-final">...</section>
  </main>

  <footer class="service-footer">...</footer>
</body>
```

---

## 2.6 CSS Contract

Required classes:

```text
service-page
service-nav
service-nav__inner
service-nav__brand
service-nav__links
service-hero
service-hero__copy
service-kicker
service-title
service-lede
service-actions
service-proofline
service-section
service-section--ruled
service-section__inner
service-section__head
service-section__body
decision-sheet
decision-sheet__header
decision-sheet__state
decision-sheet__metrics
decision-metric
underwriting-lanes
underwriting-lane
equation-stack
report-specimen
sample-case
input-category-grid
price-block
faq-list
faq-row
service-final
service-footer
```

Core layout:

```css
.service-page {
  background:
    radial-gradient(circle at 8% 2%, rgba(36,113,231,.05), transparent 28rem),
    linear-gradient(180deg, #fbfcfe 0%, var(--bg-primary) 100%);
  color: var(--text-secondary);
}

.service-nav__inner,
.service-hero,
.service-section__inner,
.service-final__inner,
.service-footer__inner {
  width: min(1200px, calc(100% - 64px));
  margin-inline: auto;
}

.service-hero {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(340px, 5fr);
  gap: clamp(40px, 6vw, 84px);
  align-items: center;
  min-height: 720px;
}

.service-section {
  padding-block: 96px;
}

.service-section--ruled {
  border-top: 1px solid var(--border-default);
}

@media (max-width: 960px) {
  .service-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-block: 72px;
  }
}

@media (max-width: 640px) {
  .service-nav__inner,
  .service-hero,
  .service-section__inner,
  .service-final__inner,
  .service-footer__inner {
    width: min(100% - 36px, 1200px);
  }

  .service-section {
    padding-block: 64px;
  }
}
```

### Design restrictions

Do not:
- create a shadowed card for each block;
- use purple gradients;
- revive the legacy dark purchase aesthetic;
- introduce unrelated fonts;
- turn glassmorphism into a theme;
- use rounded pills for every label;
- introduce arbitrary new colors;
- use generic illustrations where a data object can do the work.

---

## 2.7 Accessibility

Required:
- WCAG AA contrast for normal text and controls;
- visible `:focus-visible`;
- no meaning encoded only in color;
- verdict label plus color;
- FAQ keyboard accessible;
- `prefers-reduced-motion` support;
- charts/specimens accompanied by textual equivalent;
- sample calculation understandable without animation;
- minimum substantive body copy size ~16px desktop / 15px mobile;
- tap targets at least 44px where practical.

---

## 2.8 SEO

**Title**

`Should We Hire the Next AE? | Antaeus`

**Meta description**

`Underwrite the next sales hire using your revenue target, pipeline, conversion, ramp and current selling capacity. Get an AE Hiring Brief for $149.`

Use one H1.

Structured data may use `Product` or `Service` only with accurate fields. Never fabricate reviews, ratings, or customer counts.

---

## 2.9 Landing-Page Acceptance Tests

- checkout CTA works;
- sample anchor works;
- content remains understandable with JS disabled except enhanced interactions;
- mobile at 320px has no overflow;
- decision specimen labeled `SAMPLE`;
- price consistently `$149`;
- no `$299/year` Antaeus app pricing leaks into page;
- no app-subscription language leaks into this offer;
- analytics failure never blocks checkout;
- missing checkout config is explicit in staging and impossible to overlook;
- page contains no fabricated proof;
- FAQ privacy language matches actual implementation;
- semantic state colors are not overloaded.

---

# 3. Step 2 — Intake + Data Contract

## 3.1 Principle

Collect enough evidence to underwrite the decision without turning intake into a consulting discovery process.

Target completion time after usability testing: **8–12 minutes** for a prepared sales leader.

Use progressive disclosure.

Do not ask the buyer to calculate values the system can derive.

---

## 3.2 Intake Sections

1. Decision context
2. Revenue target
3. Current seller capacity
4. Proposed AE
5. Deal economics
6. Funnel conversion
7. Demand supply
8. Repeatability
9. Timing
10. Management capacity
11. Data confidence
12. Review and submit

---

## 3.3 Field-Level Contract

### A. Decision Context

| Field | Type | Required | Unknown allowed | Definition |
|---|---|---:|---:|---|
| `company_name` | string | yes | no | Company name |
| `company_stage` | enum | yes | no | Pre-seed, Seed, Series A, Series B, Later, Bootstrapped, Other |
| `business_model` | enum | yes | no | B2B SaaS, services, hybrid, other B2B |
| `buyer_role` | enum | yes | no | Founder/CEO, Sales leader, Finance, VC/operator, other |
| `decision_deadline` | date/null | no | yes | Expected decision date |
| `analysis_horizon_months` | integer | yes | no | Default 12; 6–18 supported |
| `why_now` | enum[] | yes | no | Revenue plan, rep load, founder handoff, new territory, board plan, other |

### B. Revenue Target

| Field | Type | Required | Unknown |
|---|---|---:|---:|
| `current_arr` | currency | no | yes |
| `target_metric` | enum | yes | no |
| `new_arr_target_horizon` | currency | yes | no |
| `target_includes_expansion` | boolean | yes | no |
| `target_includes_renewal` | boolean | yes | no |
| `existing_team_committed_new_arr` | currency | no | yes |
| `founder_committed_new_arr` | currency | no | yes |
| `target_period_start` | date | yes | no |
| `target_period_end` | date | yes | no |

`target_metric` must be one of:
- new ARR
- booked ARR
- ACV/bookings
- TCV
- ending ARR growth
- other

The engine must not combine quota, ACV and target values that use incompatible revenue bases without an explicit normalization. If the company supplies an ending-ARR-growth target, churn/expansion assumptions are required before treating it as a new-sales target.

### C. Current Seller Capacity

If seller-by-seller entry is used:

```json
{
  "seller_id": "opaque-local-id",
  "role": "AE",
  "annual_quota": 900000,
  "start_date": "2026-01-01",
  "trailing_attainment_pct": 0.84,
  "current_qualified_pipeline": 650000,
  "active_qualified_opps": 14,
  "is_founder": false
}
```

Aggregate fallback:

| Field | Required |
|---|---:|
| `current_quota_carriers` | yes |
| `aggregate_annual_quota` | yes if sellers > 0 |
| `trailing_team_attainment_pct` | preferred |
| `existing_team_current_qualified_pipeline` | yes |
| `existing_team_active_qualified_opps` | preferred |

### D. Proposed AE

| Field | Type | Required |
|---|---|---:|
| `hire_reason` | enum | yes |
| `proposed_start_date` | date | yes |
| `annual_quota` | currency | yes |
| `quota_metric` | enum | yes |
| `quota_includes_expansion` | boolean | yes |
| `base_salary` | currency | yes |
| `variable_comp_target` | currency | yes |
| `other_loaded_cost_estimate` | currency/null | no |
| `ramp_months` | number | yes |
| `ramp_definition` | enum | yes |
| `company_ramp_schedule_known` | boolean | yes |

`hire_reason`:
- growth capacity
- replacement
- founder handoff
- new segment
- new geography
- strategic coverage
- other

For a replacement hire, collect the departing seller's expected departure date and remove that seller's capacity after departure rather than treating the hire as additive growth capacity.

`quota_metric` must identify the basis of quota and be compatible with the target metric.

`ramp_definition`:
- `closed_bookings`
- `pipeline_productivity`
- `unknown`

If a company has an explicit monthly ramp quota schedule, collect it and use it instead of the generic linear ramp assumption.

### E. Deal Economics

| Field | Type | Required |
|---|---|---:|
| `average_acv` | currency | conditionally yes |
| `median_acv` | currency/null | no |
| `gross_margin_pct` | percent/null | no |
| `average_sales_cycle_days` | number | yes |
| `sales_cycle_definition` | enum | yes |
| `qualified_stage_definition` | string/null | preferred |
| `contract_term_months_typical` | number/null | optional |
| `top_3_wins_share_pct` | percent/null | optional |

`sales_cycle_definition`:
- qualified opportunity → close
- first meeting → close
- first touch → close
- unknown

Do not treat these as interchangeable.

### F. Conversion

Preferred source order:
1. non-founder qualified-opportunity win rate
2. team non-founder rate calculated from counts
3. team all-seller rate
4. founder-inclusive rate
5. unknown

Fields:

| Field | Type |
|---|---|
| `conversion_evidence_window_start` | date/null |
| `conversion_evidence_window_end` | date/null |
| `material_gtm_change_date` | date/null |
| `qualified_opps_trailing_12m` | integer/null |
| `closed_won_trailing_12m` | integer/null |
| `non_founder_qualified_opps_trailing_12m` | integer/null |
| `non_founder_wins_trailing_12m` | integer/null |
| `meeting_to_qualified_opp_pct` | percent/null |
| `qualified_opp_to_win_pct` | percent/null |
| `non_founder_qualified_opp_to_win_pct` | percent/null |

### G. Demand Supply

| Field | Type | Required |
|---|---|---:|
| `current_qualified_pipeline_value` | currency | yes |
| `pipeline_value_type` | enum | yes |
| `pipeline_stage_basis` | string/null | preferred |
| `pipeline_likely_open_at_ae_start` | currency/null | preferred |
| `monthly_qualified_pipeline_created_value` | currency/null | preferred |
| `monthly_qualified_opps_created` | number/null | preferred |
| `monthly_first_meetings` | number/null | optional |
| `target_accounts_available` | integer/null | optional |
| `territory_reserved_for_new_ae` | boolean | yes |
| `new_ae_pipeline_share_pct` | percent/null | preferred |
| `pipeline_creation_is_seasonal` | boolean | yes |
| `monthly_pipeline_series` | currency[]/null | optional |
| `new_ae_market_same_as_history` | enum: yes/partly/no | yes |

### H. Repeatability

| Field | Type |
|---|---|
| `wins_trailing_12m` | integer/null |
| `non_founder_wins_trailing_12m` | integer/null |
| `founder_primary_seller_share_pct` | percent/null |
| `icp_documented` | yes/partial/no |
| `qualification_documented` | yes/partial/no |
| `discovery_documented` | yes/partial/no |
| `sales_stages_documented` | yes/partial/no |
| `rep_can_run_discovery_without_founder` | yes/partial/no |
| `founder_required_late_stage` | rarely/sometimes/often/almost_always/unknown |
| `repeatable_use_cases_count` | integer/null |

### I. Timing

| Field | Type |
|---|---|
| `revenue_needed_by_date` | date/null |
| `recruiting_lead_time_days` | integer/null |
| `proposed_start_date` | date |
| `first_revenue_expected_by_company` | date/null |

### J. Management Capacity

| Field | Type |
|---|---|
| `direct_manager_exists` | boolean |
| `manager_current_direct_reports` | integer/null |
| `weekly_1to1_capacity` | yes/partial/no |
| `weekly_pipeline_review_capacity` | yes/partial/no |
| `onboarding_owner_named` | boolean |
| `onboarding_plan_exists` | yes/partial/no |
| `manager_is_also_primary_seller` | boolean |

### K. Provenance

For key values ask:

`Where did this number come from?`

Options:
- CRM/report
- finance model
- spreadsheet
- structured internal analysis
- memory/estimate
- founder estimate
- unknown

Store provenance on major inputs.

---


### L. Metric-Basis Compatibility

Before any revenue math:

```text
target metric
quota metric
ACV metric
pipeline metric
```

must describe compatible economics.

Examples of incompatibility:
- target = new ARR while quota = TCV;
- ACV reported as annual value while pipeline reported as full multi-year TCV;
- target excludes expansion while quota includes substantial expansion;
- pipeline is probability-weighted but the model also multiplies by win rate.

If values are incompatible and cannot be normalized from supplied information:
- request clarification;
- do not calculate a definitive capacity verdict.

### M. Pipeline Value Type

`pipeline_value_type`:
- unweighted contract/ARR value
- probability-weighted
- forecast category value
- unknown

The primary demand formula expects **unweighted qualified pipeline value** because it applies a win rate separately.

If the input is already probability-weighted, do **not** multiply it by win rate again. Either:
- recover the unweighted value from source data, or
- use a separate weighted-pipeline branch with clear labeling.

### N. Historical Relevance

If a material GTM change occurred inside the evidence window, examples:
- new ICP,
- major pricing change,
- new product,
- new segment,
- new geography,
- substantial change in ACV,

then historical conversion before that change is not automatically transferable.

Prefer post-change evidence where sufficient. Otherwise:
- show both pre/post values if available;
- lower confidence;
- use sensitivity/range rather than silently pooling unlike motions.

### O. New-Market Transferability

If `new_ae_market_same_as_history = no`, historical conversion is context evidence, not directly transferable evidence.

The report must say:

> The proposed seller is entering a market materially different from the one that produced the historical conversion data. The historical rate is therefore modeled as a scenario rather than treated as a proven planning rate.

### P. Seasonality

If pipeline creation is seasonal:
- do not multiply a single recent monthly rate by the full horizon;
- use a supplied monthly/quarterly series when possible;
- otherwise lower confidence and display the linear extrapolation as an explicit simplification.


## 3.4 Unknown Representation

Normalize unknowns explicitly.

```json
{
  "value": null,
  "status": "unknown",
  "source": "unknown"
}
```

Do not use:
- empty string,
- zero,
- `NaN`,
- omitted property

for a known unknown in the normalized object.

---

## 3.5 Validation Rules

### Numeric
- currency >= 0
- percent 0–1 internally
- count integer >= 0
- ramp months 0–12
- analysis horizon 6–18
- sales cycle 1–730 days unless manually overridden

### Fatal contradiction examples
- `closed_won > qualified_opps`
- `non_founder_wins > total_wins`
- `non_founder_qualified_opps > total_qualified_opps`
- `proposed_start_date > target_period_end` when the user expects contribution inside that period
- negative currency or count
- impossible dates
- unsupported currency mixed without conversion

### Clarification-required examples
- supplied win rate differs materially from rate calculated from supplied counts;
- founder-primary share is 100% while non-founder wins are substantial;
- pipeline expected to remain open at AE start exceeds current pipeline plus stated creation without explanation;
- company expects first revenue before proposed start date;
- current quota carriers = 0 while aggregate seller quota is positive.

### Nonfatal anomaly examples
Warn but allow:
- attainment >150%
- win rate >70%
- very short cycle for high ACV
- pipeline coverage >10×
- proposed OTE exceeds ACV
- quota/OTE ratio is unusual

Unusual is not automatically invalid.

---

## 3.6 Intake UX

Progress:
```text
01 Decision
02 Target
03 Team
04 New AE
05 Deals
06 Funnel
07 Demand
08 Repeatability
09 Timing
10 Management
11 Review
```

Behavior:
- save/resume;
- definitions inline;
- `I don’t know` always visible;
- no jargon without helper text;
- derived calculations appear on review, not after every field;
- final review table shows all inputs and assumptions;
- changing an answer invalidates any stale preview until recalculated.

---

## 3.7 Normalized Object

```json
{
  "schema_version": "ae-underwriting-1.0",
  "submission_id": "opaque-id",
  "company": {},
  "decision": {},
  "target": {},
  "current_team": {},
  "proposed_ae": {},
  "economics": {},
  "conversion": {},
  "demand": {},
  "repeatability": {},
  "timing": {},
  "management": {},
  "provenance": {},
  "unknowns": [],
  "validation": {
    "fatal_errors": [],
    "clarifications": [],
    "warnings": []
  }
}
```

---

## 3.8 Step-2 Acceptance Criteria

- no unknown coerces to zero;
- contradictions are detected;
- definitions render in UI;
- user can complete without CRM access;
- user can save/resume;
- dates are timezone-safe;
- currency is explicit;
- percentage normalization is tested;
- review shows all assumptions;
- submission cannot finalize with fatal errors;
- warnings remain visible;
- raw and normalized submission are both versioned;
- schema version travels with every report.



# 4. Step 3 — Underwriting Engine

## 4.1 Engine Design Principles

The engine must be:

1. **Company-specific first.**
2. **Deterministic.**
3. **Inspectable.**
4. **Versioned.**
5. **Conservative about unknowns.**
6. **Explicit about policy thresholds.**
7. **Able to return ranges when a single point estimate is unjustified.**
8. **Unable to recommend headcount merely because a revenue gap exists.**
9. **Unable to double-count ramp and sales-cycle delay.**
10. **Unable to count existing-team pipeline as automatically available to the new AE.**

Every report must record:
- engine version,
- policy version,
- normalized input version,
- calculation timestamp,
- formulas used,
- assumptions invoked.

Recommended:

```text
engine_version: ae-engine-1.0.0
policy_version: ae-policy-1.0.0
schema_version: ae-underwriting-1.0
```

---

## 4.2 Core Definitions

Let:

```text
H = analysis horizon in months
Q = proposed AE annual quota
A = average ACV
W = transferable qualified-opportunity win rate
M = meeting → qualified-opportunity conversion
C = qualified-opportunity sales cycle in months
R_t = proposed AE ramp factor in month t
E = existing-team expected bookings contribution in horizon
F = explicitly planned founder bookings contribution not already included in E
T = new bookings / new ARR target in horizon
G = residual revenue gap
N = proposed AE expected bookings contribution in horizon
P_req = qualified pipeline required for proposed AE
O_req = qualified opportunities required
Meet_req = first meetings required
P_alloc = qualified pipeline allocatable to proposed AE
D = demand coverage ratio
```

All currency calculations use the same currency. V1 should default to USD or explicitly reject mixed-currency inputs.

---

## 4.3 Analysis Horizon

Default:

```text
H = 12 months
```

Allowed V1 range:

```text
6 ≤ H ≤ 18
```

The horizon begins at `target_period_start` and ends at `target_period_end`.

The engine must use actual dates rather than assuming every period begins on January 1.

---

## 4.4 Transferable Win Rate Selection

The proposed AE should not automatically inherit a founder-led win rate.

Select `W` using the following source order:

### Priority 1
Calculated non-founder qualified-opportunity win rate:

```text
W = non_founder_wins / non_founder_qualified_opps
```

when denominator > 0.

### Priority 2
User-supplied non-founder qualified-opportunity win rate, if provenance is credible and counts are unavailable.

### Priority 3
Calculated all-seller qualified-opportunity win rate.

### Priority 4
User-supplied all-seller qualified-opportunity win rate.

### Priority 5
Founder-inclusive rate only.

When only founder-inclusive conversion exists:
- use it for an **illustrative scenario**, not as unquestioned transferable truth;
- mark `transferability_assumption = founder_inclusive`;
- reduce confidence;
- repeatability test cannot be `demonstrated` solely from that rate.

### Priority 6
Unknown.

If `W` is unknown:
- capacity can still be modeled in quota dollars;
- opportunity/pipeline requirement cannot be stated as a definitive point estimate;
- decision may become `INSUFFICIENT EVIDENCE` if demand is outcome-determinative.

---

## 4.5 Ramp Model

### Preferred input

Use the company’s explicit monthly ramp schedule when available.

Example:

```json
[0.25, 0.50, 0.75, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
```

### Fallback

If only `ramp_months = r` is known, use a transparent linear ramp:

```text
R_t = min(1, t / r)
```

for `t = 1...months_available`.

If `r = 0`:

```text
R_t = 1
```

This is a **modeling convention**, not a claimed SaaS benchmark.

The report must label it:

> Ramp assumption: linear progression to full productivity over the supplied ramp period because a company-specific monthly ramp schedule was not provided.

---

## 4.6 Months Available

Compute the count/fraction of months from proposed start date through the analysis horizon.

A hire starting after the horizon has:

```text
months_available = 0
```

and cannot contribute to the horizon target.

For partial months, either:
- prorate by days, or
- use a documented full-month convention.

Preferred: prorate by days for engine math and round only in presentation.

---

## 4.7 Critical Branch — What Does Ramp Mean?

This distinction prevents double counting.

### Branch A — Ramp describes closed bookings

If `ramp_definition = closed_bookings`, the monthly ramp factors already describe the expected pace of booked/closed revenue.

Then:

```text
N = Σ[(Q / 12) × R_t]
```

for months inside the horizon.

**Do not subtract a sales-cycle delay again.**

Sales cycle remains useful for:
- timing plausibility,
- pipeline-generation deadlines,
- sensitivity,
- comparing company expectations to physical timing.

It is not applied as a second delay to the same booked-revenue ramp.

---

### Branch B — Ramp describes pipeline productivity

If `ramp_definition = pipeline_productivity`, ramp factors describe the seller’s ability to generate qualified pipeline, not closed bookings.

At full productivity, qualified pipeline required per month is:

```text
P_full_month = (Q / 12) / W
```

Monthly pipeline generated:

```text
P_t = P_full_month × R_t
```

Each month’s generated qualified pipeline is expected to close after the qualified-opportunity sales cycle `C`.

Only generated pipeline whose expected close date falls inside the analysis horizon contributes to `N`.

For each month:

```text
if close_date(t) <= horizon_end:
    bookings_t = P_t × W
else:
    bookings_t = 0 inside this horizon
```

Then:

```text
N = Σ bookings_t
```

This branch legitimately applies the sales-cycle lag because the ramp input describes pipeline production rather than booked revenue.

---

### Branch C — Ramp definition unknown

Do not choose one silently.

Compute:
- `N_closed_bookings_interpretation`
- `N_pipeline_productivity_interpretation`

If the two values are materially different:
- display a range;
- mark ambiguity;
- lower confidence;
- if the decision changes across the two interpretations, return `CONDITIONAL` or `INSUFFICIENT EVIDENCE` depending on other evidence.

This is a required adversarial safeguard.

---

## 4.8 Existing-Team Expected Capacity

### Preferred

If seller-level data exists, compute each current seller independently.

For seller `i`:

```text
nominal_capacity_i = annual_quota_i × horizon_fraction_i
```

If a reliable trailing attainment rate is available:

```text
evidence_capacity_i = nominal_capacity_i × trailing_attainment_i
```

If the seller is still ramping, use the seller’s supplied ramp plan.

Then:

```text
E = Σ evidence_capacity_i
```

### If attainment is unknown

Use quota as the declared planning capacity:

```text
E = aggregate_quota × horizon_fraction
```

but label:

> Existing-team capacity uses 100% of declared quota because an evidence-based attainment rate was not provided.

Do not invent an 80%, 70%, or other “typical” attainment factor.

### If a finance-approved existing-team bookings plan is supplied

Store both:
- `E_operating`
- `E_finance_plan`

If they differ materially, surface the difference instead of choosing whichever supports the desired conclusion.

---

## 4.9 Founder Contribution

Founder contribution is included only when:
- the founder is expected to remain a seller during the horizon; and
- the contribution is not already included in current-team capacity.

Prevent double counting with:

```text
founder_in_existing_team = true/false
```

If true:

```text
F = 0 additional
```

unless there is an explicitly distinct founder-sourced contribution outside the current-team plan.

---

## 4.10 Residual Revenue Gap

```text
G = max(0, T - E - F)
```

Keep the unbounded signed value as well:

```text
G_raw = T - E - F
```

If `G_raw <= 0`, the current declared plan has no mathematical revenue-capacity gap.

That does not automatically prohibit hiring; strategic reasons can exist. But the product should state:

> The stated revenue target does not currently require incremental AE capacity under the supplied assumptions.

This is a major anti-upsell truth condition.

---

## 4.11 Proposed AE Effective Contribution

Use the applicable ramp branch to compute:

```text
N
```

Then:

```text
gap_coverage = N / G
```

when `G > 0`.

If `G = 0`, do not divide. Set:

```text
gap_coverage = null
economic_need_state = no_revenue_gap
```

Also calculate:

```text
seat_utilization_against_gap = min(G / N, 1)
```

when `N > 0`.

This asks how much of the proposed seat’s modeled in-horizon capacity is actually needed to close the residual gap.

---

## 4.12 Economic Need State

Use transparent policy thresholds.

These are **operating policy defaults**, not universal benchmarks.

Configuration:

```json
{
  "economic": {
    "full_use_threshold": 0.80,
    "partial_use_threshold": 0.50
  }
}
```

Interpretation:

### `supported`
```text
G > 0
and G / N >= 0.80
```

The revenue gap can use at least 80% of the modeled proposed-seat contribution.

### `partial`
```text
0.50 <= G / N < 0.80
```

The company may need incremental capacity, but one full seat may be oversized for the stated gap.

### `weak`
```text
0 < G / N < 0.50
```

The proposed seat materially exceeds the capacity gap.

### `none`
```text
G <= 0
```

No revenue-capacity gap under supplied assumptions.

### Important

A `partial` or `weak` economic state does not by itself mean “do not hire.” It means the company has not demonstrated that the stated revenue plan requires a full additional seat.

Policy thresholds must live in a config object and be calibration-ready.

---

## 4.13 Required Wins

If ACV is known:

```text
wins_required = N / A
```

Presentation:
- keep decimal internally;
- show both continuous requirement and practical whole-deal count.

Example:

```text
9.3 expected average-sized wins
Practical deal count: approximately 10
```

Do not simply round down.

If ACV is highly variable and median ACV is also known, show an ACV sensitivity range.

---

## 4.14 Required Qualified Opportunities

If `W` is known:

```text
O_req = wins_required / W
```

Equivalent:

```text
O_req = N / (A × W)
```

If ACV is unknown but pipeline value math is possible:

```text
P_req = N / W
```

and opportunity count remains unknown.

---

## 4.15 Required Qualified Pipeline

If `W` is known and qualified pipeline means total potential contract value at the defined qualified-opportunity stage:

```text
P_req = N / W
```

Why:

```text
qualified pipeline × win rate ≈ expected bookings
```

This must use a win rate whose denominator matches the pipeline stage definition.

Do not apply an arbitrary “3× pipeline coverage” benchmark on top of this formula.

The formula already derives required pipeline from the company’s own conversion.

---

## 4.16 Required Meetings

If meeting-to-qualified-opportunity conversion `M` is known:

```text
Meet_req = O_req / M
```

If `M` is unknown:
- meeting requirement remains unknown;
- do not substitute a benchmark.

---

## 4.17 Demand Pool

The model needs qualified pipeline expected to be available inside the analysis horizon.

Preferred:

```text
P_current_horizon =
qualified pipeline currently expected to close inside horizon
```

Future qualified pipeline creation:

```text
P_future =
monthly_qualified_pipeline_created × eligible_creation_months
```

But do not count future pipeline generated so late that its expected close falls after the horizon when the sales-cycle definition is qualified-opportunity → close.

Therefore:

```text
eligible_creation_months =
months where creation_date + qualified_sales_cycle <= horizon_end
```

Then:

```text
P_pool = P_current_horizon + P_future
```

---

## 4.18 Existing-Team Pipeline Demand

Using the selected transferable/team conversion as appropriate:

```text
P_existing_req = E / W_existing
```

where `W_existing` uses the best available rate for the current team.

If current-team conversion differs materially from proposed-transfer rate, preserve both.

---

## 4.19 Theoretical Pipeline Surplus

```text
P_surplus = max(0, P_pool - P_existing_req)
```

This is the amount mathematically left after supplying the current team’s expected bookings.

It is not automatically allocatable.

---

## 4.20 Allocatable Pipeline

Use the most conservative supported measure.

### If explicit allocatable pipeline supplied

```text
P_declared_alloc
```

### If explicit new-AE share supplied

```text
P_share_alloc = P_pool × new_ae_pipeline_share_pct
```

### Theoretical surplus

```text
P_surplus
```

Preferred:

```text
P_alloc = minimum(non-null supported allocation measures)
```

This avoids counting the same pipeline as available to everyone.

If none are known:
- `P_alloc = unknown`;
- demand conclusion cannot be `supported`.

---

## 4.21 Demand Coverage

```text
D = P_alloc / P_req
```

when both are known.

Interpretation:

### `sufficient`
```text
D >= 1.00
```

### `near`
```text
0.85 <= D < 1.00
```

### `short`
```text
D < 0.85
```

`0.85` is a **policy threshold for “near”**, not a benchmark.

The exact ratio must always be shown.

Example:

```text
Demand coverage: 0.72×
Shortfall: $840k qualified pipeline
```

Never hide the ratio behind only a label.

---

## 4.22 Pipeline Creation Sufficiency

Calculate how much additional qualified pipeline must be created:

```text
P_gap = max(0, P_req - P_alloc_current)
```

Then:

```text
required_monthly_pipeline_creation =
P_gap / eligible_creation_months
```

Compare with observed monthly qualified pipeline creation:

```text
pipeline_creation_ratio =
observed_monthly_pipeline_creation /
required_monthly_pipeline_creation
```

If observed production is below requirement, identify the monthly gap.

---

## 4.23 Opportunity Creation Sufficiency

If opportunity count is known:

```text
required_monthly_opps =
remaining_opps_required / eligible_creation_months
```

Then compare with observed monthly qualified-opportunity creation.

This creates a practical hiring condition:

> Monthly qualified opportunity creation must rise from 5.1 to 7.8 before the proposed seat is fully supplied.

No generic benchmark required.

---

## 4.24 Repeatability Evidence State

Do **not** collapse repeatability into an opaque 0–100 score.

Use four evidence states:

### `demonstrated`

Default policy requires:
- at least 5 non-founder wins in the selected evidence window;
- non-founder qualified-opportunity denominator available;
- non-founder conversion can be calculated or credibly sourced;
- founder is not `almost_always` required late-stage;
- at least two of ICP / qualification / discovery / sales stages are `yes` or `partial`.

The `5` is a **minimum evidence-policy threshold**, not a statistical claim that five wins prove repeatability.

### `emerging`

Examples:
- 1–4 non-founder wins;
- non-founder win rate exists but sample is thin;
- process is partly documented;
- founder is sometimes/often involved.

### `founder_dependent`

Examples:
- zero non-founder wins despite meaningful company win history;
- founder is almost always primary seller;
- founder is almost always required late-stage;
- non-founder motion has not independently closed business.

### `unknown`

Insufficient evidence to classify.

Always show the underlying evidence:
```text
Non-founder wins: 3
Non-founder qualified opps: 17
Founder required late stage: Often
ICP documented: Yes
Qualification standard: Partial
```

---

## 4.25 Sample-Size Warning

When calculated conversion uses small denominator:

Policy:

```json
{
  "conversion_sample": {
    "very_thin_below": 10,
    "thin_below": 20
  }
}
```

If qualified-opportunity denominator <10:
- label `very thin sample`.

If 10–19:
- label `thin sample`.

If >=20:
- no sample-size warning by default.

These are communication thresholds, not claims of statistical significance.

Optional future upgrade: Wilson interval / beta-binomial uncertainty.

V1 can include a simple binomial confidence interval if implemented correctly, but should not imply the true conversion is known precisely.

---

## 4.26 Timing Model

### Recruiting

If proposed start date is already given, recruiting lead time does not shift it; it is used to test plausibility.

If proposed start date is not fixed:

```text
earliest_start = decision_date + recruiting_lead_time
```

### First potential close

When sales cycle is measured from qualified opportunity:

If ramp is pipeline-productivity-based:

```text
first_expected_close ≈ first_meaningful_qualified_opp_date + sales_cycle
```

When ramp is closed-bookings-based:
- do not add the cycle again to quota capacity;
- still compare stated first-revenue expectation with supplied cycle for plausibility.

### Timing conflict

Flag if:

```text
revenue_needed_by_date < earliest_plausible_contribution_date
```

or if a material share of required contribution is expected before the model can generate it.

---

## 4.27 Management Capacity State

Use explicit gates, not a numeric score.

### `ready`
- direct manager exists;
- weekly 1:1 capacity = yes;
- weekly pipeline-review capacity = yes;
- onboarding owner named;
- onboarding plan = yes or partial.

### `conditional`
- one or two items partial/missing;
- manager also sells but explicitly has management capacity;
- onboarding plan partial.

### `constrained`
- no direct manager;
- no weekly pipeline-review capacity;
- no onboarding owner;
- manager already overloaded by declared constraints.

### `unknown`
Insufficient management information.

Do not pretend a universal “X reps per manager” benchmark exists in the model.

---

## 4.28 Cost View

At $149, keep cost modeling simple.

```text
OTE = base_salary + variable_comp_target
```

If loaded cost estimate supplied:

```text
loaded_cost = OTE + other_loaded_cost_estimate
```

If gross margin supplied:

```text
gross_profit_from_modeled_bookings =
N × gross_margin_pct
```

Possible informational ratio:

```text
gross_profit_to_loaded_cost =
gross_profit_from_modeled_bookings / loaded_cost
```

Do not convert this ratio into a universal “hire/no hire” threshold in V1.

Present it as supporting economics.

---

## 4.29 Sensitivity Variables

Mandatory sensitivity variables:
- ACV
- transferable win rate
- ramp duration
- sales cycle
- monthly qualified pipeline creation
- proposed start date

Optional:
- existing-team attainment
- meeting-to-opportunity conversion
- loaded cost
- founder contribution

Default scenario perturbations must be labeled **model scenarios**, not market expectations.

Recommended:

```text
ACV:              -20%, base, +20%
Win rate:          -20% relative, base, +20% relative
Ramp:              base -1 month, base, base +1 month
Sales cycle:       -30 days, base, +30 days
Pipeline creation: -20%, base, +20%
Start date:        -30 days, base, +30 days
```

Clamp impossible values:
- win rate stays in 0–100%;
- ramp cannot go below 0;
- cycle cannot go below 1 day.

---

## 4.30 Sensitivity Impact

For each scenario compute:
- proposed AE contribution `N`;
- pipeline requirement `P_req`;
- demand coverage `D`;
- timing status;
- overall decision state.

Rank sensitivity by:

```text
absolute change in key output
+
whether decision state changes
```

Top sensitivity statement example:

> The hiring case is most sensitive to non-founder win rate. A 20% relative decrease increases required qualified pipeline from $3.1M to $3.9M and changes demand coverage from 1.04× to 0.83×.

---

## 4.31 Evidence Confidence

Confidence describes **quality of evidence**, not whether the hire is supported.

### High
- no critical missing inputs;
- key conversion and pipeline values come from CRM/finance/structured reports;
- no unresolved contradictions;
- non-founder conversion has a nontrivial sample;
- ramp definition known.

### Moderate
- no fatal missing input;
- some values are estimates;
- non-founder sample thin or founder-inclusive conversion required;
- ramp schedule modeled from supplied ramp months.

### Low
- critical variables rely on memory/estimates;
- transferability uncertain;
- pipeline allocation uncertain;
- material contradictions unresolved;
- ramp meaning unknown and materially changes outcome.

### Insufficient
Evidence does not permit a responsible conclusion.

Do not calculate confidence as a fake precision percentage in V1.

---

## 4.32 Critical Unknowns

Critical unknowns include:
- revenue target;
- proposed quota;
- proposed start date;
- ramp duration or schedule;
- sales cycle;
- enough conversion evidence to derive demand requirement;
- enough demand evidence to evaluate supply;
- current sales capacity.

If one critical unknown prevents a core test:
- mark that test `unknown`.

If two or more core tests are outcome-determinative and unknown:
- default final state to `INSUFFICIENT EVIDENCE`.

---

## 4.33 Engine Output Object

```json
{
  "engine_version": "ae-engine-1.0.0",
  "policy_version": "ae-policy-1.0.0",
  "decision": {
    "state": "conditional",
    "confidence": "moderate",
    "primary_constraint": "pipeline_supply"
  },
  "tests": {
    "economic_need": {},
    "demand_sufficiency": {},
    "repeatability": {},
    "timing_management": {}
  },
  "calculations": {
    "target": 0,
    "existing_capacity": 0,
    "residual_gap": 0,
    "proposed_ae_contribution": 0,
    "wins_required": null,
    "qualified_opps_required": null,
    "qualified_pipeline_required": null,
    "allocatable_pipeline": null,
    "demand_coverage": null
  },
  "sensitivity": [],
  "conditions": [],
  "evidence_gaps": [],
  "assumptions": [],
  "warnings": [],
  "audit": {}
}
```

---

## 4.34 Pseudocode

```js
function underwrite(input, policy) {
  const normalized = normalizeAndValidate(input);
  if (normalized.validation.fatal_errors.length) {
    return stopForInvalidSubmission(normalized);
  }

  const winRate = selectTransferableWinRate(normalized);
  const existingCapacity = calculateExistingCapacity(normalized);
  const founderContribution = calculateNonDuplicatedFounderContribution(normalized);
  const revenueGap = Math.max(
    0,
    normalized.target.new_arr_target_horizon -
      existingCapacity.value -
      founderContribution.value
  );

  const hireCapacity = calculateHireContribution({
    input: normalized,
    winRate,
    mode: normalized.proposed_ae.ramp_definition
  });

  const economic = testEconomicNeed({
    revenueGap,
    hireCapacity,
    policy
  });

  const funnel = calculateFunnelRequirements({
    contribution: hireCapacity,
    acv: normalized.economics.average_acv,
    winRate,
    meetingToOpp: normalized.conversion.meeting_to_qualified_opp_pct
  });

  const demandPool = calculateDemandPool(normalized);
  const existingDemand = calculateExistingTeamPipelineNeed(normalized);
  const allocatable = calculateAllocatablePipeline({
    demandPool,
    existingDemand,
    input: normalized
  });

  const demand = testDemandSufficiency({
    allocatable,
    required: funnel.pipeline_required,
    policy
  });

  const repeatability = classifyRepeatability(normalized, winRate, policy);
  const timing = testTiming(normalized, hireCapacity, policy);
  const management = classifyManagement(normalized, policy);
  const confidence = classifyEvidenceConfidence(normalized, {
    winRate,
    economic,
    demand,
    repeatability,
    timing,
    management
  });

  const sensitivities = runSensitivityGrid(normalized, policy);

  const decision = decide({
    economic,
    demand,
    repeatability,
    timing,
    management,
    confidence,
    sensitivities,
    policy
  });

  const conditions = generateConditions(decision, {
    economic,
    demand,
    repeatability,
    timing,
    management
  });

  return assembleOutput(...);
}
```

---

## 4.35 Step-3 Acceptance Criteria

- same input always produces same output under same versions;
- no generic benchmark inserted silently;
- quota/workback math unit-tested;
- ramp semantics unit-tested;
- cycle double-count prevention unit-tested;
- existing-pipeline allocation unit-tested;
- founder double-count prevention unit-tested;
- unknown-safe arithmetic unit-tested;
- division-by-zero handled;
- 0% win rate handled without crash;
- start date after horizon handled;
- no existing sellers handled;
- no founder sales handled;
- all calculated values traceable to formula and inputs;
- sensitivity cannot produce invalid percentages;
- output includes engine/policy/schema versions.



# 4A. First-AE Transferability Override

This section supersedes any Step-3 repeatability rule that would classify a company as `founder_dependent` solely because it has zero non-founder wins.

## Trigger

Use the first-AE branch when:

```text
current_non_founder_quota_carriers = 0
and company is evaluating first professional AE
```

## Why

A company cannot have historical non-founder AE wins before it has ever employed a non-founder AE. Treating the absence of such wins as negative evidence would create a structural false negative.

## First-AE evidence states

### `transferable_evidence_strong`

Default policy:
- founder/company has at least 5 relevant wins in the evidence window;
- ICP is documented or strongly consistent;
- qualification is `yes` or `partial`;
- discovery is `yes` or `partial`;
- at least one repeatable use case exists;
- founder can articulate buyer, problem, trigger and close path;
- demand math supports a dedicated seller.

This does **not** mean transferability is proven. It means the company has enough observable structure to make the first-hire experiment defensible.

### `transferable_evidence_emerging`

- some repeat wins exist;
- ICP/use case is recognizable;
- process is partly tacit;
- founder is still central to most late-stage activity.

### `founder_motion_not_yet_externalizable`

- wins are idiosyncratic or relationship-driven;
- no stable buyer/use case pattern;
- process is almost entirely tacit;
- demand evidence is thin;
- the seller would be asked to discover the motion rather than inherit one.

### `unknown`

Not enough evidence.

## Decision implication

For a first AE:
- `transferable_evidence_strong` can support an overall **CONDITIONAL** or **SUPPORTED WITH FIRST-HIRE RISK DISCLOSED** posture depending on the rest of the model.
- It must never be described as “proven repeatability.”
- The report must explicitly say that first-hire transferability remains an execution risk until non-founder evidence exists.

V1 public verdict vocabulary remains the four standard states; this nuance appears inside the repeatability section and confidence.

---

# 5. Step 4 — Decision Engine

## 5.1 Decision Philosophy

The decision engine is not a scorecard.

It is a deterministic rule system that:
1. checks whether a decision can be made responsibly;
2. identifies hard contradictions;
3. evaluates the four underwriting tests;
4. separates present-state evidence from future conditions;
5. returns the least aggressive conclusion supported by the evidence.

The engine must prefer:
- `CONDITIONAL` over unsupported certainty;
- `INSUFFICIENT EVIDENCE` over invented assumptions;
- `NOT YET SUPPORTED` over a false positive hire recommendation.

But it must also avoid becoming so conservative that every early-stage company fails automatically.

---

## 5.2 Dimension States

### Economic Need
```text
supported
partial
weak
none
unknown
```

### Demand
```text
sufficient
near
short
unknown
```

### Repeatability — existing AE motion
```text
demonstrated
emerging
founder_dependent
unknown
```

### Repeatability — first AE
```text
transferable_evidence_strong
transferable_evidence_emerging
founder_motion_not_yet_externalizable
unknown
```

### Timing
```text
compatible
tight
incompatible
unknown
```

### Management
```text
ready
conditional
constrained
unknown
```

### Confidence
```text
high
moderate
low
insufficient
```

---

## 5.3 Evidence Gate

Before assigning a final decision, run:

```text
can_decide = true/false
```

Set `can_decide = false` when:
- target is unknown;
- current capacity is unknowable;
- proposed quota/start/ramp are unavailable;
- both transfer conversion and demand cannot be estimated;
- contradictions invalidate core math;
- two or more core tests are outcome-determinative and unknown.

If false:

# INSUFFICIENT EVIDENCE

The report still provides:
- known math,
- missing evidence,
- exact data required to complete the decision.

This prevents a useless dead end.

---

## 5.4 Hard “Not Yet” Conditions

A final state should default to `NOT YET SUPPORTED` when evidence is sufficient and any of these are true:

### Economic
- no residual capacity gap exists **and** no separately stated strategic capacity reason exists;
- proposed seat is materially oversized relative to the declared gap under the policy thresholds.

### Demand
- demand coverage is materially short (`D < policy.demand.near_threshold`) and no evidence shows the shortfall will close before the seller needs the pipeline;
- allocatable pipeline is effectively zero while existing-team demand consumes the available pool.

### Repeatability — later AE
- motion is classified `founder_dependent` and the proposed AE is expected to run independently.

### Repeatability — first AE
- motion is `founder_motion_not_yet_externalizable`.

### Timing
- modeled contribution cannot arrive inside the period for which the hire is being justified.

### Management
- no one can onboard/manage the hire and this is not being solved before start.

These are current-state conclusions, not permanent judgments.

---

## 5.5 Conditional Conditions

A final state should tend toward `CONDITIONAL` when:
- economic need is `partial`;
- demand is `near`;
- demand is short but a quantitatively specified condition can plausibly close before start;
- repeatability is `emerging`;
- first-AE transferability is strong but unproven;
- timing is `tight`;
- management is `conditional`;
- confidence is moderate because one material assumption is estimated;
- the ramp interpretation range changes key outputs but not the overall direction;
- sensitivity shows the verdict flips under a modest deterioration in one assumption.

A conditional decision must have **named conditions**. Never return “conditional” without telling the buyer what the conditions are.

---

## 5.6 Supported Conditions

A final state can be `SUPPORTED` only when all are true:

```text
evidence gate passes
economic_need == supported
demand == sufficient
timing == compatible
management in {ready, conditional-with-nonmaterial-gap}
confidence in {high, moderate}
```

And:

For existing/later AE:
```text
repeatability == demonstrated
```

For first AE:
```text
repeatability == transferable_evidence_strong
```

If first-AE transferability is untested, the report must still include:

> Transferability is not yet empirically proven because this is the first non-founder AE. The current evidence supports running the hire, not claiming the motion is already repeatable.

This prevents the label from overstating certainty.

---

## 5.7 Decision Resolution Order

```text
1. Fatal validation failure?
   → no decision; return validation stop.

2. Evidence gate fails?
   → INSUFFICIENT EVIDENCE.

3. Any hard not-yet condition?
   → NOT YET SUPPORTED.

4. Any material conditional condition?
   → CONDITIONAL.

5. All support conditions satisfied?
   → SUPPORTED.

6. Otherwise
   → CONDITIONAL.
```

The fallback is conditional, not supported.

---

## 5.8 Strategic Override

A company may intentionally hire ahead of immediate revenue need for:
- new geography,
- new segment,
- succession from founder,
- strategic coverage,
- expected demand inflection.

The model must allow the user to state this.

But the report must distinguish:

```text
Revenue-capacity case: Not established
Strategic hiring case: Declared by company
```

The underwriting engine should not convert a strategic rationale into an economically supported conclusion.

Recommended language:

> The stated 12-month revenue target does not require another full AE under the supplied capacity assumptions. Leadership may still choose to hire ahead of demand for strategic reasons, but that is a different investment thesis than a current capacity requirement.

---

## 5.9 Primary Constraint Selection

Assign each non-supported dimension a severity:

```text
3 = blocking
2 = material condition
1 = watch item
0 = supported
```

Primary constraint selection:

1. highest severity;
2. if multiple quantitative constraints share severity, choose the largest normalized shortfall;
3. if still tied, choose the earliest causal constraint in this order:
   - economic need
   - demand supply
   - repeatability
   - timing
   - management
4. record all secondary constraints.

The tie-break order is a product policy, not an empirical truth.

---

## 5.10 Constraint Codes

Use stable machine-readable codes:

```text
no_capacity_gap
seat_oversized
pipeline_supply
pipeline_creation
opportunity_creation
transferability
founder_dependency
thin_conversion_sample
sales_cycle_timing
late_start
management_capacity
onboarding_readiness
territory_supply
unknown_conversion
unknown_pipeline_allocation
unknown_current_capacity
ramp_ambiguity
data_conflict
```

A report can display human language while storing stable codes.

---

## 5.11 Hiring Condition Generator

Conditions must be measurable whenever possible.

### Pipeline condition

```text
required_incremental_allocatable_pipeline =
max(0, P_req - P_alloc)
```

Output:

> Increase allocatable qualified pipeline by **$X** before the new AE requires full coverage.

### Pipeline-creation condition

```text
required_monthly_creation =
P_gap / eligible_creation_months
```

Output:

> Raise monthly qualified pipeline creation from **$A** to **$B** by **DATE**.

### Opportunity condition

```text
required_monthly_opps =
O_remaining / eligible_creation_months
```

Output:

> Sustain approximately **N qualified opportunities/month** available to the new seat.

### Timing condition

Compute latest viable start under the model.

Output:

> To contribute to the stated revenue window under the supplied ramp/cycle assumptions, the seat must start no later than **DATE**.

### Repeatability condition

For later AE:

> Establish non-founder conversion evidence from at least **N qualified opportunities** and demonstrate independent late-stage progression before treating the founder-led rate as transferable.

For first AE:

> Document the buyer/use-case/qualification path the new seller is expected to inherit before start; treat first-hire conversion as unproven until observed.

### Management condition

> Name an onboarding owner and reserve weekly 1:1 and pipeline-review capacity before the start date.

### Economic condition

> Either increase the revenue/capacity gap to approximately **$X** or change the proposed seat scope; under the current target, a full additional quota carrier is materially underutilized by the stated need.

---

## 5.12 Confidence Rules

### High

All:
- no critical unknown;
- key pipeline/conversion data sourced from systems or structured reports;
- no unresolved conflict;
- ramp definition known;
- sample not thin;
- allocation logic known.

### Moderate

Any:
- some values are estimates;
- conversion sample thin;
- ramp uses fallback linear schedule;
- first AE has no non-founder history;
- allocation is partially estimated.

### Low

Any:
- key rates based mainly on memory;
- founder-inclusive conversion is the only rate;
- allocatable pipeline uncertain;
- ramp meaning unresolved;
- sample very thin;
- sensitivity flips result easily.

### Insufficient

Evidence gate fails.

---

## 5.13 Decision Explanation Template

Every report opens with:

```text
DECISION
[STATE]

PRIMARY CONSTRAINT
[constraint]

CONFIDENCE
[confidence]

WHY
[2–4 sentences grounded in the actual calculations]

WHAT WOULD CHANGE THE ANSWER
[1–3 explicit conditions]
```

No adjective such as “strong,” “healthy,” or “poor” should appear unless tied to a defined state or calculation.

---

## 5.14 Decision Examples

### Example A — Supported

```text
SUPPORTED
Primary constraint: None material
Confidence: High

The 12-month revenue plan leaves a $740k capacity gap after the current team's evidence-based contribution. The proposed AE can contribute approximately $690k inside the horizon. Allocatable qualified pipeline covers 1.18× the calculated requirement, non-founder conversion is based on 31 qualified opportunities, and the start/ramp schedule is compatible with the revenue window.
```

### Example B — Conditional

```text
CONDITIONAL
Primary constraint: Pipeline supply
Confidence: Moderate

The revenue plan can use the proposed seat, but only 0.88× of the AE's required qualified pipeline is currently allocatable. At the current creation rate, the shortfall closes approximately six weeks after the proposed start date. The hire becomes supportable on the current schedule if monthly qualified pipeline creation reaches $X by DATE.
```

### Example C — Not Yet Supported

```text
NOT YET SUPPORTED
Primary constraint: Economic need
Confidence: High

The current team’s evidence-based capacity already covers the supplied 12-month bookings target. Under the stated target, another full AE would add substantially more capacity than the plan requires. Leadership may still choose to hire ahead of demand, but the current revenue target does not establish the capacity case.
```

### Example D — Insufficient Evidence

```text
INSUFFICIENT EVIDENCE
Primary gap: Transferable conversion + pipeline allocation
Confidence: Insufficient

The company supplied a revenue target and proposed quota but cannot currently establish a qualified-opportunity win rate or the amount of pipeline available to a new seller. Those two values determine both the required opportunity volume and whether demand can support the seat, so a reliable hiring conclusion would be false precision.
```

---

## 5.15 Step-4 Acceptance Criteria

- same engine output maps to same decision;
- no supported verdict with failed evidence gate;
- no supported verdict with demand short;
- no supported verdict with incompatible timing;
- first-AE branch works;
- later-AE founder dependency works;
- strategic override does not rewrite economic result;
- every conditional verdict includes conditions;
- every not-yet verdict includes reason and change condition;
- every insufficient verdict identifies exact missing evidence;
- primary constraint selection is deterministic;
- secondary constraints retained;
- confidence separated from decision state.

---

# 6. Step 5 — AE Hiring Brief System

## 6.1 Output Principle

The report is the product.

It should feel like:
- an underwriting memo,
- an executive operating brief,
- a decision record.

It should not feel like:
- a generic AI report,
- a dashboard printout,
- a consultant slide deck,
- a motivational sales audit.

Target: readable in 5–8 minutes.

---

## 6.2 Report Formats

### Required

1. **Web brief**
2. **PDF brief**

### Optional later

3. Markdown export
4. CSV appendix
5. board-slide summary

V1 web/PDF content must be identical in substance.

---

## 6.3 Report Page Structure

### Page 1 — Decision

- product mark
- company
- analysis date
- decision
- primary constraint
- confidence
- 3-sentence explanation
- 3 key conditions
- methodology/version footer

### Page 2 — Capacity

- revenue target
- current-team modeled contribution
- founder contribution if separate
- residual capacity gap
- proposed AE horizon contribution
- seat utilization against gap
- cost context

### Page 3 — Funnel

- ACV
- transferable win rate
- wins required
- qualified opps required
- pipeline required
- meetings required if known
- rate provenance

### Page 4 — Demand

- pipeline pool
- existing-team requirement
- allocatable pipeline
- proposed AE requirement
- demand coverage ratio
- pipeline creation requirement
- opportunity creation requirement

### Page 5 — Repeatability

- existing/later AE or first-AE branch
- non-founder evidence
- founder dependence
- process documentation
- transferability conclusion
- sample-size warning

### Page 6 — Timing & Management

- start date
- ramp definition
- ramp schedule
- cycle
- first plausible contribution
- revenue-needed date
- manager/onboarding state

### Page 7 — Sensitivity

- top 3 assumptions
- scenario table
- verdict-flip analysis

### Page 8 — Conditions & Evidence Gaps

- conditions required
- evidence missing
- contradictory/weak inputs
- assumptions
- methodology note

If content is shorter, combine pages. Do not pad to eight pages.

---

## 6.4 Decision Page Layout

```text
ANTAEUS · AE HIRING BRIEF

Company: Acme
Analysis: 30 Sep 2026

DECISION
CONDITIONAL

PRIMARY CONSTRAINT
Pipeline supply

CONFIDENCE
Moderate

WHY
[short narrative]

WHAT MUST BECOME TRUE
01 ...
02 ...
03 ...

[methodology/version footer]
```

---

## 6.5 Calculation Presentation Rules

Every important number should have:
- value,
- label,
- source/derivation.

Example:

```text
$3.21M
QUALIFIED PIPELINE REQUIRED

Derived from:
$675k modeled AE contribution ÷ 21% transferable win rate
```

Never show a standalone number without a derivation when it materially affects the decision.

---

## 6.6 Evidence Language

Use:

- `Supplied by company`
- `Calculated from supplied counts`
- `Derived by engine`
- `Modeled assumption`
- `Unknown`
- `Conflicting inputs`
- `Illustrative scenario`

Do not label estimated values as “actual.”

---

## 6.7 Narrative Generation Rules

Narrative can be template-driven.

### Rule

Every prose claim must map to:
- a calculation,
- a state,
- an input,
- or a documented policy.

Example:

Bad:
> Your pipeline is unhealthy.

Good:
> Allocatable qualified pipeline covers 0.71× the calculated requirement for the proposed AE.

Bad:
> Your team is not ready to scale.

Good:
> The company has not yet demonstrated non-founder late-stage execution, and the founder is reported as required in almost every close.

---

## 6.8 Report Tone

- direct
- analytical
- non-dramatic
- no motivational language
- no consultant filler
- no “Congratulations”
- no “Here’s the exciting part”
- no “game changer”
- no “unlock”

---

## 6.9 Conditions Section

Format:

```text
CONDITION 01 — PIPELINE
Current: $1.8M allocatable
Required: $2.4M
Gap: $600k

The hiring case becomes demand-supported when allocatable qualified pipeline reaches approximately $2.4M under the current win-rate assumption.
```

Each condition should include:
- current state,
- required state,
- gap,
- deadline if relevant,
- what assumption it depends on.

---

## 6.10 Evidence Gaps Section

Severity:

### Decision-critical
Missing evidence can change the decision.

### Confidence-limiting
Conclusion survives, but certainty is lower.

### Informational
Useful but nonessential.

Example:

```text
DECISION-CRITICAL
Non-founder opportunity-to-win conversion is unknown.

Why it matters:
The founder-inclusive rate is currently being used only as an illustrative scenario. If a non-founder seller converts materially below that rate, required pipeline rises.
```

---

## 6.11 Methodology Note

Required:

> This brief is an operating analysis based on the information supplied by the company and deterministic model assumptions documented in the report. It is not financial, legal, accounting, recruiting or investment advice. Policy thresholds are Antaeus operating rules used to make the analysis consistent; they are not presented as universal industry benchmarks.

---

## 6.12 PDF Generation

Recommended V1:
- generate semantic HTML report;
- dedicated print stylesheet;
- `window.print()` for operator/manual PDF or headless Chromium serverless generation later;
- page-break classes;
- avoid canvas where SVG/HTML works;
- embed version metadata in footer.

Print CSS:

```css
@media print {
  .report-actions { display: none !important; }
  .report-page { break-after: page; }
  .report-page:last-child { break-after: auto; }
  body { background: #fff !important; }
}
```

If automated PDF generation is added, use the same HTML source to prevent web/PDF divergence.

---

## 6.13 File Naming

```text
antaeus-ae-hiring-brief-[company-slug]-[yyyy-mm-dd].pdf
```

Avoid putting email addresses or sensitive IDs in filenames.

---

## 6.14 Report QA

Before delivery:
- decision matches engine object;
- all displayed numbers match engine object;
- no stale sample data;
- no divide-by-zero placeholders;
- no `undefined`, `NaN`, or `null` user-facing strings;
- unknowns render as `Unknown`;
- report version present;
- sample-size warnings present;
- assumptions present;
- conditions measurable;
- no contradictory decision/narrative;
- PDF pagination checked.

---

# 7. Step 6 — Commerce + Operations

## 7.1 Critical Architecture Decision

The existing Antaeus app purchase corridor is not sufficient for this service.

A frontend-only redirect cannot securely prove that a buyer paid.

For a real paid launch, use a minimal serverless verification layer.

Recommended:

```text
Static Antaeus site
+
Stripe
+
Supabase
+
Supabase Edge Functions (or Cloudflare Worker)
```

This preserves the static public-page architecture while adding secure order verification and intake storage.

---

## 7.2 Do Not Reuse App Commerce Config

Do not reuse:
- `$299/year`
- app plan metadata
- `/purchase/success/`
- app signup/onboarding assumptions

Create separate config:

```text
/js/ae-commerce-config.js
```

Suggested:

```js
window.AE_HIRE_COMMERCE = {
  productCode: 'ae-hiring-brief-v1',
  priceLabel: '$149',
  currency: 'USD',
  intakePath: '/ae-hire/intake/',
  confirmationPath: '/ae-hire/confirmation/',
  supportEmail: 'hello@antaeus.app'
};
```

Do not store a live Stripe secret in client JS.

---

## 7.3 Recommended Checkout Flow

### 1. Landing CTA

POST to serverless endpoint:

```text
POST /api/ae-hire/create-checkout
```

Payload:
- product code
- attribution
- optional email if already collected

Server:
- creates Stripe Checkout Session;
- amount fixed server-side;
- embeds `product_code`;
- generates opaque `order_ref`;
- returns checkout URL.

### 2. Stripe Checkout

Buyer pays $149.

### 3. Webhook

Stripe sends verified webhook:

```text
checkout.session.completed
```

Server:
- verifies signature;
- creates/updates `ae_orders`;
- marks `payment_status = paid`;
- stores Stripe session/customer IDs server-side;
- creates single-purpose intake token.

### 4. Redirect

Stripe success URL:

```text
/ae-hire/intake/?token=<opaque-token>
```

### 5. Intake Verification

Intake page calls:

```text
GET /api/ae-hire/order-status?token=...
```

Only paid/valid orders can submit.

This is materially more defensible than trusting query parameters or localStorage.

---

## 7.4 Suggested Database Tables

### `ae_orders`

```sql
id uuid primary key
order_ref text unique
stripe_checkout_session_id text unique
stripe_customer_id text null
buyer_email text
product_code text
amount_cents integer
currency text
payment_status text
created_at timestamptz
paid_at timestamptz null
intake_token_hash text
token_expires_at timestamptz
```

### `ae_submissions`

```sql
id uuid primary key
order_id uuid references ae_orders(id)
schema_version text
raw_payload jsonb
normalized_payload jsonb
validation_payload jsonb
status text
created_at timestamptz
updated_at timestamptz
submitted_at timestamptz null
```

### `ae_analyses`

```sql
id uuid primary key
submission_id uuid references ae_submissions(id)
engine_version text
policy_version text
result_payload jsonb
decision_state text
confidence text
primary_constraint text
status text
created_at timestamptz
completed_at timestamptz null
```

### `ae_deliveries`

```sql
id uuid primary key
analysis_id uuid references ae_analyses(id)
web_token_hash text
pdf_storage_path text null
delivered_at timestamptz null
expires_at timestamptz null
created_at timestamptz
```

---

## 7.5 Security

Required:
- Stripe webhook signature verification;
- service-role keys server-side only;
- intake tokens random and opaque;
- store token hashes, not raw reusable tokens where practical;
- RLS on Supabase tables;
- no public `select *`;
- rate-limit verification/submission endpoints;
- validate payload server-side;
- sanitize text fields;
- enforce maximum lengths;
- no sensitive values in analytics;
- no full intake payload sent to GA4/PostHog;
- no Stripe secret in client;
- no report token in analytics URLs if analytics could capture full href.

---

## 7.6 Analytics Privacy

Current Antaeus analytics records `href`.

For private intake/report pages:
- either disable analytics entirely;
- or ensure URLs contain no reusable secret/token;
- or redact query parameters before analytics loads.

Recommended:
- public landing: normal analytics;
- checkout redirect page: minimal analytics;
- intake: product analytics without field values;
- report: no third-party analytics by default.

Never emit:
- company financial numbers,
- ACV,
- pipeline,
- quota,
- compensation,
- email,
- token,
- report data

to GA4/PostHog event properties.

---

## 7.7 Data Retention Recommendation

Recommended V1 policy:

- incomplete intake: delete 30 days after purchase if abandoned;
- submitted intake: retain through analysis and delivery;
- raw/normalized submission and analysis: delete 30 days after delivery by default;
- payment/accounting records: retain only what is legally/operationally required, separately from sales-analysis payload;
- allow customer deletion request sooner where operationally feasible.

This is a **recommended operating policy**. Final public privacy language requires legal/operational confirmation.

Do not claim automatic deletion until the deletion job exists and is tested.

---

## 7.8 Internal Production Queue

Statuses:

```text
paid
intake_started
intake_submitted
clarification_required
ready_for_analysis
analysis_running
analysis_review
brief_ready
delivered
closed
deleted
```

Each transition should record:
- timestamp
- actor/system
- reason
- prior status

---

## 7.9 Analysis Production Modes

### V1 recommended
Deterministic engine + human QA.

Flow:

```text
submission
→ validation
→ deterministic analysis
→ generated draft brief
→ human QA
→ delivery
```

This protects quality while calibration is immature.

### Later
Auto-delivery only after calibration thresholds are met.

---

## 7.10 Human QA Checklist

Operator checks:
- did engine choose correct conversion source?
- is founder contribution double-counted?
- is pipeline allocation plausible?
- is ramp branch correct?
- does narrative match math?
- did sensitivity identify actual fragile assumption?
- are conditions measurable?
- is any conclusion stronger than evidence?
- are unusual values real or input errors?

Human QA cannot silently change model values without recording an override reason.

---

## 7.11 Override Log

If operator overrides:
- final decision;
- primary constraint;
- key assumption;
- calculation input,

record:

```json
{
  "field": "decision.state",
  "engine_value": "conditional",
  "override_value": "not_yet_supported",
  "reason_code": "pipeline_allocation_misclassified",
  "operator_note": "...",
  "timestamp": "..."
}
```

Overrides become calibration data.

---

## 7.12 Clarification Flow

If inputs conflict:
- do not reject the customer;
- send one structured clarification request;
- show exact conflict;
- allow edit/resubmit.

Example:

> You reported 18 qualified opportunities and 22 closed wins for the same period. We need one of those values corrected before the opportunity-to-win rate can be calculated.

Avoid vague:
> We need more information.

---

## 7.13 Delivery

Recommended email:
- subject: `Your Antaeus AE Hiring Brief`
- secure web link
- PDF link or attachment depending security implementation
- expiration notice if link expires
- support contact

Do not put the verdict in the email subject.

---

## 7.14 Refund / Failure Policy

Operational recommendation:
- if the company cannot provide enough data after clarification to produce a meaningful analysis, offer either:
  1. a refund, or
  2. an Evidence Gap Brief with buyer approval.

Do not take $149 and deliver a one-line “insufficient evidence” output without a useful artifact.

If the final state is `INSUFFICIENT EVIDENCE`, the brief must still explain:
- what is known;
- what cannot be established;
- exactly what data would resolve it.

---

## 7.15 Step-6 Acceptance Criteria

- payment cannot be forged from client state;
- unpaid user cannot submit a paid analysis;
- duplicate Stripe webhook is idempotent;
- duplicate intake submission is idempotent;
- order amount server-controlled;
- tokens not logged to analytics;
- private data absent from GA4/PostHog;
- RLS tested;
- deletion policy implemented before claimed;
- email delivery failure recoverable;
- report can be regenerated from versioned analysis object;
- app subscription purchase path remains untouched.

---

# 8. Step 7 — Calibration System

## 8.1 Goal

Calibration determines whether the model consistently reaches a decision an experienced sales operator can defend.

It is not an exercise in making the model agree with every operator opinion.

The objective is to identify:
- systematic false positives;
- systematic false negatives;
- unstable thresholds;
- missing variables;
- misleading precision;
- bad causal assumptions.

---

## 8.2 Calibration Dataset

### Phase A — Synthetic adversarial cases

Minimum 20 designed cases spanning:
- no revenue gap;
- huge revenue gap / no pipeline;
- huge pipeline / no capacity gap;
- founder-only sales;
- first AE;
- second/third AE;
- high ACV/low volume;
- low ACV/high volume;
- short cycle;
- long cycle;
- late start;
- overstaffed current team;
- missing win rate;
- conflicting counts;
- strong economics/weak management;
- strong demand/weak repeatability;
- seasonality;
- strategic hire ahead of demand.

### Phase B — Reconstructed historical cases

Use 10–20 real historical startup moments where possible.

For each:
- freeze data available at the decision date;
- do not leak future outcome into inputs;
- run engine;
- separately record experienced-operator decision;
- later compare to known outcome cautiously.

### Phase C — Paid/live cases

Every override and clarification becomes calibration evidence.

---

## 8.3 Golden Case Format

```json
{
  "case_id": "golden-001",
  "description": "Two AEs, target gap, insufficient pipeline",
  "input": {},
  "expected": {
    "allowed_decisions": ["conditional", "not_yet_supported"],
    "forbidden_decisions": ["supported"],
    "primary_constraint": "pipeline_supply",
    "must_include_condition": "pipeline"
  }
}
```

Use `allowed_decisions` where operator judgment can reasonably differ.

---

## 8.4 Calibration Metrics

### Decision agreement
Percent of cases where engine decision is inside accepted operator range.

### Constraint agreement
Percent with correct dominant constraint.

### False-positive rate
Cases marked Supported where expert review says support is not defensible.

This is the most important error class.

### False-negative rate
Cases marked Not Yet where expert review says support is defensible.

### Insufficient-evidence precision
Did the engine refuse only when refusal was necessary?

### Condition usefulness
Are generated conditions measurable and causally related?

### Stability
Does tiny irrelevant input noise leave decision unchanged?

### Sensitivity coherence
Does changing a causal variable affect outputs in the expected direction?

---

## 8.5 Launch Thresholds

Recommended initial release gates:

```text
0 critical formula defects
0 known payment/security critical defects
≥ 95% pass on deterministic unit tests
≥ 90% golden-case decision inside allowed range
≥ 90% primary-constraint agreement
0 unsupported "SUPPORTED" verdicts in golden red-team cases
100% unknown/null handling tests pass
100% double-count tests pass
```

These are internal quality gates, not customer-facing claims.

---

## 8.6 Stability Tests

### Perturbation

Change nonmaterial inputs ±5%.

Expected:
- decision should usually remain stable;
- displayed numbers move proportionally.

### Monotonicity

Holding everything else constant:
- more allocatable pipeline must not reduce demand coverage;
- higher win rate must not increase required pipeline;
- longer sales cycle must not improve timing;
- later start must not increase in-horizon contribution;
- greater existing capacity must not increase residual capacity gap;
- more founder dependence must not improve repeatability state.

Any violation is a defect.

---

## 8.7 Boundary Tests

Test values immediately around each policy threshold.

Example:

```text
demand coverage:
0.849
0.850
0.999
1.000
1.001
```

Verify:
- correct labels;
- no numerical jump beyond intended categorical state;
- report explains exact ratio so the category does not create fake discontinuity.

---

## 8.8 Missingness Tests

For each critical input:
1. run complete case;
2. delete input;
3. verify confidence cannot increase;
4. verify decision does not become more aggressive solely because data disappeared.

This is a mandatory monotonicity property:

> **Less evidence must never make the recommendation more confident.**

---

## 8.9 Contradiction Tests

Inject:
- wins > opps;
- impossible dates;
- non-founder wins > total wins;
- rate/count mismatch;
- negative pipeline;
- pipeline allocation > pipeline pool.

Expected:
- validation catches;
- no final supported decision before clarification.

---

## 8.10 Calibration Governance

Every threshold change requires:
- old value;
- new value;
- reason;
- cases affected;
- false-positive/negative impact;
- policy-version bump.

Example:

```text
ae-policy-1.0.0 → ae-policy-1.1.0
demand.near_threshold: 0.85 → 0.90
Reason: 6/20 live cases at 0.85–0.90 were consistently underfed during ramp.
```

Do not silently change production decision logic.

---

## 8.11 Auto-Delivery Gate

Do not remove human QA until:
- at least 30 completed analyses;
- override rate <10%;
- no critical formula defect for 20 consecutive cases;
- no decision-state override caused by engine logic for 15 consecutive cases;
- calibration suite remains green.

Even after automation, random QA sampling should continue.



# 9. Adversarial Passes — Findings, Corrections, and Non-Negotiable Safeguards

This section records deliberate attempts to break the product before launch.

The purpose is not to make the system complicated. It is to remove hidden assumptions that could make a simple-looking answer wrong.

---

## 9.1 Adversarial Pass 1 — Commercial Product Attack

### Attack: “This is just a spreadsheet.”

**Risk**

If the product only calculates:

```text
quota ÷ ACV ÷ win rate
```

then the buyer can reproduce it in minutes.

**Correction**

The product must add decision value through:
- existing-team capacity;
- proposed-seat in-horizon contribution;
- pipeline allocation rather than total pipeline;
- founder vs non-founder transferability;
- ramp semantics;
- timing compatibility;
- management capacity;
- sensitivity;
- evidence gaps;
- conditions that change the decision.

The spreadsheet math is necessary but insufficient.

**Status:** resolved in model.

---

### Attack: “$149 turns into free consulting.”

**Risk**

Customers submit ambiguous data and expect multiple rounds of advice.

**Correction**

V1 includes:
- structured intake;
- one clarification round only for contradictory data;
- no call;
- no custom strategy;
- no implementation.

If analysis reveals a larger problem, the brief identifies it without solving the entire GTM system inside the $149 scope.

**Status:** resolved in scope.

---

### Attack: “A ‘not yet’ result feels like paying to be told no.”

**Correction**

Every `NOT YET SUPPORTED` result must include:
- the reason;
- the quantitative gap where possible;
- the condition that changes the answer;
- the evidence required;
- the earliest plausible re-test trigger.

The buyer is purchasing a decision boundary, not a positive answer.

**Status:** resolved in report contract.

---

### Attack: “The page needs social proof.”

**Risk**

Inventing weak testimonials or unverifiable customer logos damages credibility.

**Correction**

V1 can launch with:
- a rigorous sample result;
- methodology transparency;
- clear scope;
- precise output preview.

No fabricated proof.

**Status:** resolved.

---

### Attack: “The buyer may be asking for budget ammunition, not truth.”

**Risk**

Product becomes a justification generator that always finds a way to support hiring.

**Correction**

Engine has explicit anti-upsell behavior:
- no revenue gap can return `NOT YET SUPPORTED`;
- insufficient demand can block;
- current reps can have unused capacity;
- strategic rationale is separated from capacity rationale;
- no operator can change the answer silently.

**Status:** resolved.

---

## 9.2 Adversarial Pass 2 — Analytical Model Attack

### Attack: ARR vs bookings vs TCV

**Failure mode**

Target is $2M new ARR, proposed quota is $1M TCV, ACV is annual value. Direct arithmetic is invalid.

**Correction**

Metric-basis compatibility gate.

**Status:** patched into canonical intake.

---

### Attack: weighted pipeline gets multiplied by win rate again

**Failure mode**

Probability-weighted pipeline × win rate double-discounts demand.

**Correction**

Require `pipeline_value_type`.

Primary formula uses unweighted qualified pipeline. Weighted pipeline must use a separate branch or be converted.

**Status:** patched.

---

### Attack: expansion is mixed with new-logo target

**Failure mode**

Seller quota includes expansion but target is new ARR only.

**Correction**

Collect target and quota inclusion flags. Normalize or clarify.

**Status:** patched.

---

### Attack: replacement AE is treated as additive capacity

**Failure mode**

A departing $900k seller is replaced by another $900k seller, but engine calls the new seat incremental capacity.

**Correction**

`hire_reason = replacement` invokes departure-date capacity removal before calculating residual gap.

**Status:** patched.

---

### Attack: sales-cycle delay is counted twice

**Failure mode**

Company’s ramp plan already reflects booked revenue, then engine pushes all revenue out again by the sales cycle.

**Correction**

Separate closed-bookings ramp from pipeline-productivity ramp.

**Status:** resolved.

---

### Attack: founder conversion is assumed transferable

**Failure mode**

Founder closes 35% of qualified deals; first AE cannot reproduce founder credibility/network.

**Correction**

Conversion source hierarchy and first-AE branch. Founder-inclusive rate becomes scenario evidence rather than automatic planning truth.

**Status:** resolved.

---

### Attack: first AE is rejected because there are no non-founder wins

**Failure mode**

Impossible requirement.

**Correction**

Dedicated first-AE transferability branch.

**Status:** resolved.

---

### Attack: pipeline already belongs to current reps

**Failure mode**

Total pipeline is counted as supply for both current sellers and proposed seller.

**Correction**

Calculate existing-team pipeline demand and allocatable surplus. Use the minimum supported allocation measure.

**Status:** resolved.

---

### Attack: late-stage deals cannot realistically be reassigned

**Failure mode**

Pipeline surplus exists mathematically but consists of deals already owned by existing AEs.

**Correction**

Prefer `pipeline_likely_open_at_ae_start` and explicit allocatable share. If allocation unknown, demand cannot be marked fully supported.

**Status:** resolved.

---

### Attack: historical conversion predates a GTM pivot

**Failure mode**

Company changed ICP/pricing/product three months ago, but 12-month win rate is used unchanged.

**Correction**

Collect material GTM change date and evidence window. Post-change evidence takes priority; otherwise confidence declines.

**Status:** patched.

---

### Attack: new geography/segment uses old conversion

**Failure mode**

US enterprise history used as if transferable to EMEA mid-market.

**Correction**

Collect `new_ae_market_same_as_history`. If no, historical rate is scenario evidence.

**Status:** patched.

---

### Attack: seasonality makes monthly extrapolation false

**Failure mode**

January pipeline creation × 12 is used for a highly seasonal company.

**Correction**

Seasonality flag and optional monthly series. Linear extrapolation must be labeled when used.

**Status:** patched.

---

### Attack: average ACV is distorted by a whale

**Failure mode**

One $700k deal makes typical deal size look like $150k.

**Correction**

Collect median ACV when available and optional top-three booking concentration. Run ACV sensitivity when average/median materially differ.

**Status:** resolved as optional evidence.

---

### Attack: sales-cycle average is only closed-won cycle

**Failure mode**

Losses and stalled deals are omitted, creating optimistic timing.

**Correction**

Report definition/source of cycle. If cycle is closed-won-only, label that limitation and increase timing sensitivity.

**Status:** methodology safeguard.

---

### Attack: opportunity win rate denominator is inconsistent

**Failure mode**

One company counts discovery-stage opportunities, another only proposals.

**Correction**

Collect qualified-stage definition. The report names the denominator and refuses false comparability.

**Status:** patched.

---

### Attack: current reps are overperforming temporarily

**Failure mode**

Trailing attainment is 160% because of one quarter; engine assumes durable capacity.

**Correction**

Outlier warning; compare finance plan, quota, trailing attainment, concentration, and sensitivity. Do not cap silently.

**Status:** resolved.

---

### Attack: current reps are underperforming because of bad pipeline, not lack of capacity

**Failure mode**

Engine interprets low bookings as justification for another seller.

**Correction**

Economic capacity and demand supply are independent. Underfed existing sellers can cause `NOT YET SUPPORTED`.

**Status:** resolved.

---

### Attack: hiring ahead of demand is strategically intentional

**Failure mode**

Engine says no, company says it is entering a new market deliberately.

**Correction**

Strategic override is recorded but does not rewrite capacity economics.

**Status:** resolved.

---

## 9.3 Adversarial Pass 3 — Software / Security Attack

### Attack: fake `?paid=true`

**Risk**

Frontend-only payment state can be forged.

**Correction**

Server-side Stripe session + signed webhook + server-side order status.

**Status:** architecture resolved; requires implementation.

---

### Attack: replayed webhook creates duplicate orders

**Correction**

Use Stripe event/session ID uniqueness and idempotent upsert.

**Status:** implementation requirement.

---

### Attack: report token leaks into analytics

**Correction**

No secret-bearing query params exposed to third-party analytics. Disable/redact analytics on private routes.

**Status:** implementation requirement.

---

### Attack: buyer’s pipeline/comp numbers leak to GA4/PostHog

**Correction**

Never emit intake values as event properties.

**Status:** implementation requirement.

---

### Attack: XSS through company name or free text

**Correction**

Render user text via `textContent`, never raw `innerHTML`. Server-side validation and length limits.

**Status:** implementation requirement.

---

### Attack: stale draft produces report after edited inputs

**Correction**

Hash/version normalized input. Analysis stores submission version/hash. Any post-analysis edit invalidates old analysis until regenerated.

**Status:** implementation requirement.

---

### Attack: duplicate submission generates two briefs

**Correction**

Idempotency key per paid order/submission version.

**Status:** implementation requirement.

---

### Attack: decimal/percentage confusion

**Correction**

Normalize percent internally to decimal and test UI serialization separately.

**Status:** test requirement.

---

### Attack: timezone shifts proposed start date

**Correction**

Use date-only fields for business dates; avoid unintended UTC conversion. Store canonical ISO date strings.

**Status:** implementation requirement.

---

### Attack: policy changes alter old reports

**Correction**

Every analysis freezes engine and policy version. Old reports are reproducible under their original version.

**Status:** architecture resolved.

---

## 9.4 Adversarial Pass 4 — UX Attack

### Attack: intake is too long

**Correction**

Progressive disclosure; calculated fields removed; unknown path always available; usability target 8–12 minutes.

### Attack: user guesses because unknown feels like failure

**Correction**

Make `I don’t know` a first-class answer and explain that uncertainty itself is useful evidence.

### Attack: jargon causes bad data

**Correction**

Every metric has a definition and example. Qualified opportunity, pipeline value type, ramp type, and target metric receive extra explanation.

### Attack: mobile form causes abandonment

**Correction**

Single-column controls, sticky progress only when it does not crowd viewport, numeric keyboards, no wide tables in intake.

### Attack: verdict color looks like grade/shame

**Correction**

Use state label + explanation; color is secondary.

---

## 9.5 Adversarial Pass 5 — Operational Attack

### Attack: human reviewer overrides too much

**Correction**

Override log becomes calibration data. Auto-delivery blocked until override rate falls below defined threshold.

### Attack: operator “improves” copy and contradicts engine

**Correction**

Narrative templates pull values from engine object; manual edits cannot change calculated facts without explicit override.

### Attack: insufficient-evidence result feels worthless

**Correction**

Deliver Evidence Gap Brief or refund path; exact evidence requirements included.

### Attack: turnaround promise becomes operational debt

**Correction**

No public SLA until real fulfillment timings are observed.

### Attack: support volume destroys $149 economics

**Correction**

One clarification round, no call, structured report, self-serve status, explicit scope.

---

# 10. Golden / Red-Team Case Suite

These cases are requirements, not examples to ignore.

## G01 — No Capacity Gap

**Setup**
- target: $1.5M
- evidence-based existing capacity: $1.7M
- strong pipeline
- proposed AE: $900k

**Expected**
- decision: `NOT YET SUPPORTED`
- primary constraint: `no_capacity_gap`
- forbidden: `SUPPORTED`

**Reason**
Revenue plan does not require incremental seller capacity.

---

## G02 — Strong Case

**Setup**
- target: $2.2M
- existing capacity: $1.4M
- residual gap: $800k
- proposed contribution: ~$750k
- demand coverage: 1.20×
- non-founder repeatability demonstrated
- timing compatible
- management ready

**Expected**
- `SUPPORTED`
- confidence high/moderate

---

## G03 — Pipeline Near

**Setup**
- economic need supported
- demand coverage: 0.90×
- pipeline creation trend can close gap before full ramp
- repeatability demonstrated
- timing compatible

**Expected**
- `CONDITIONAL`
- primary constraint: `pipeline_supply`

---

## G04 — Pipeline Materially Short

**Setup**
- economic need supported
- demand coverage: 0.55×
- current sellers also underfed

**Expected**
- `NOT YET SUPPORTED`
- `pipeline_supply`

---

## G05 — First AE, Strong Founder Motion

**Setup**
- no non-founder sellers have existed
- 11 founder-led wins in current ICP
- documented ICP/qualification/discovery
- strong demand
- economic need supported
- management/onboarding ready

**Expected**
- `SUPPORTED` or `CONDITIONAL` depending sensitivity
- repeatability state: `transferable_evidence_strong`
- forbidden: automatic `founder_dependent`

---

## G06 — First AE, Idiosyncratic Founder Deals

**Setup**
- 4 wins
- different use cases
- relationship-driven
- no qualification/discovery process
- uncertain pipeline

**Expected**
- `NOT YET SUPPORTED` or `INSUFFICIENT EVIDENCE`
- primary constraint: transferability or evidence
- forbidden: `SUPPORTED`

---

## G07 — Founder Rate Only

**Setup**
- 30% founder-inclusive win rate
- no non-founder denominator
- otherwise strong demand

**Expected**
- founder rate used only as scenario
- confidence cannot be high
- conditional unless first-AE branch plus strong transferability evidence resolves risk

---

## G08 — Start After Horizon

**Setup**
- proposed AE starts after target period ends

**Expected**
- `NOT YET SUPPORTED`
- primary constraint: `late_start`
- proposed contribution inside horizon = 0

---

## G09 — Closed-Bookings Ramp

**Setup**
- ramp schedule explicitly defined on booked ARR
- 90-day sales cycle

**Expected**
- sales cycle not subtracted again from ramped booked contribution
- no double-count

---

## G10 — Pipeline-Productivity Ramp

**Setup**
- ramp applies to qualified pipeline creation
- 90-day qualified-opportunity cycle

**Expected**
- pipeline generation shifted by cycle before recognized bookings
- later generated pipeline outside horizon excluded

---

## G11 — Ramp Definition Unknown / Decision Stable

**Setup**
- both ramp interpretations produce different numbers but same `NOT YET SUPPORTED` result due severe demand shortage

**Expected**
- decision may remain `NOT YET SUPPORTED`
- confidence lower
- ramp ambiguity disclosed

---

## G12 — Ramp Definition Unknown / Decision Flips

**Setup**
- closed-bookings interpretation yields sufficient capacity/timing
- pipeline-productivity interpretation misses target window

**Expected**
- `CONDITIONAL` or `INSUFFICIENT EVIDENCE`
- forbidden: `SUPPORTED`

---

## G13 — Replacement Hire

**Setup**
- one current AE leaves month 2
- new AE starts month 3

**Expected**
- departing AE capacity removed after departure
- new AE not treated as purely additive
- residual gap reflects replacement dynamics

---

## G14 — Weighted Pipeline

**Setup**
- user supplies $2M probability-weighted pipeline
- win rate 25%

**Expected**
- engine does not calculate $2M × 25%
- clarification/weighted branch required

---

## G15 — Metric Basis Conflict

**Setup**
- target = new ARR
- quota = TCV
- multi-year deals
- no normalization data

**Expected**
- clarification required
- no definitive verdict

---

## G16 — GTM Pivot

**Setup**
- 12-month win rate = 28%
- pricing/ICP pivot 3 months ago
- post-pivot win rate = 15% from thin sample

**Expected**
- old 28% not silently used as planning truth
- confidence moderate/low
- sensitivity or post-pivot range shown

---

## G17 — New Geography

**Setup**
- US history
- new AE assigned EMEA
- user states market materially different

**Expected**
- historical conversion marked scenario evidence
- no high-confidence supported verdict solely from US history

---

## G18 — Existing Reps Underfed

**Setup**
- two AEs at 55% attainment
- enough quota capacity for target
- demand coverage weak
- proposal to hire third AE

**Expected**
- `NOT YET SUPPORTED`
- primary constraint likely pipeline supply, not seller capacity

---

## G19 — Manager Constraint

**Setup**
- economics and demand supported
- no onboarding owner
- VP already carrying full quota
- no weekly coaching/review capacity

**Expected**
- `CONDITIONAL` or `NOT YET SUPPORTED` depending severity
- primary/secondary constraint management capacity

---

## G20 — Unknown Win Rate + Unknown Allocation

**Setup**
- target/quota known
- no reliable qualified-opportunity conversion
- total pipeline known but allocatable share unknown

**Expected**
- `INSUFFICIENT EVIDENCE`
- exact evidence requested

---

## G21 — 0% Win Rate

**Setup**
- qualified opportunities exist
- closed wins = 0

**Expected**
- no divide-by-zero crash
- pipeline requirement is effectively unbounded under observed rate
- decision cannot be supported from current motion

---

## G22 — 100% Win Rate on 2 Opps

**Setup**
- 2 qualified opportunities, 2 wins

**Expected**
- very-thin sample warning
- no high confidence
- sensitivity required

---

## G23 — Strategic Hire Ahead of Demand

**Setup**
- no current capacity gap
- company intentionally wants a new-market seller

**Expected**
- revenue-capacity case not supported
- strategic rationale recorded separately
- no conversion of strategy into false economic support

---

## G24 — Seasonality

**Setup**
- quarterly pipeline series shows Q4 concentration
- proposed start in Q1
- simple recent-month extrapolation would overstate supply

**Expected**
- monthly/quarterly series used
- no flat multiplication

---

# 11. Reference Case — Fully Consistent Example

Use this as a canonical fixture.

## Inputs

```text
Analysis horizon                         12 months
New ARR target                           $2,000,000

Existing AE 1 annual quota               $900,000
AE 1 trailing attainment                 72%
Existing AE 2 annual quota               $900,000
AE 2 trailing attainment                 78%

Existing-team modeled capacity           $1,350,000
Founder incremental commitment           $0

Residual revenue gap                     $650,000

Proposed AE annual quota                 $900,000
Proposed start                           month 3 of horizon
Ramp                                     3 months
Ramp definition                          closed bookings
Months available                         10

Ramp factors                             .33, .67, 1, 1, 1, 1, 1, 1, 1, 1
Modeled AE contribution                  $675,000

Average ACV                              $52,000
Transferable qualified-opportunity rate  21%
Meeting → qualified opportunity          35%

Allocatable qualified pipeline           $2,900,000
```

## Expected calculations

```text
Seat utilization against gap
= 650,000 / 675,000
= 0.963

Expected average-sized wins
= 675,000 / 52,000
= 12.98

Qualified opportunities required
= 675,000 / (52,000 × .21)
≈ 61.81

Qualified pipeline required
= 675,000 / .21
≈ $3,214,286

Demand coverage
= 2,900,000 / 3,214,286
≈ 0.902×
```

## Expected states

```text
Economic need        supported
Demand               near
Repeatability        demonstrated (assume sufficient evidence)
Timing               compatible
Management           ready
Confidence           moderate/high depending provenance
```

## Expected final decision

# CONDITIONAL

**Primary constraint: Pipeline supply**

## Expected condition

Qualified allocatable pipeline must increase by approximately:

```text
$3,214,286 - $2,900,000
= $314,286
```

before full demand support is established under the current 21% transferable win-rate assumption.

This reference case must be unit-tested.

---

# 12. Codex / Engineering Implementation Contract

## 12.1 Build Philosophy

Codex should make **implementation decisions**, not product decisions.

This document is authoritative on:
- copy,
- formulas,
- states,
- thresholds,
- data semantics,
- route structure,
- component intent.

If implementation exposes a genuine contradiction, Codex should stop and surface the contradiction rather than inventing a new product rule.

---

## 12.2 New Files

Recommended:

```text
/should-we-hire-an-ae/index.html
/ae-hire/sample/index.html
/ae-hire/intake/index.html
/ae-hire/confirmation/index.html
/css/service-page.css
/css/ae-report.css
/js/ae-policy.js
/js/ae-underwriting-engine.js
/js/ae-intake.js
/js/ae-report.js
/js/ae-commerce-config.js
/js/ae-commerce.js
/tests/ae-underwriting-engine.test.js
/tests/ae-golden-cases.js
/tests/ae-validation.test.js
```

Serverless:

```text
/supabase/functions/ae-create-checkout/index.ts
/supabase/functions/ae-stripe-webhook/index.ts
/supabase/functions/ae-order-status/index.ts
/supabase/functions/ae-submit-intake/index.ts
/supabase/functions/ae-delivery-status/index.ts
```

Database:

```text
/supabase/migrations/<timestamp>_ae_hiring_brief.sql
```

Exact folder placement may follow existing Supabase conventions if already present.

---

## 12.3 Pure Engine Module

`ae-underwriting-engine.js` must contain no DOM code.

Recommended wrapper:

```js
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.AEUnderwriting = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // pure deterministic functions

  return {
    normalizeInput,
    validateInput,
    selectTransferableWinRate,
    calculateExistingCapacity,
    calculateHireContribution,
    calculateFunnelRequirements,
    calculateDemandPool,
    calculateAllocatablePipeline,
    classifyRepeatability,
    classifyManagement,
    runSensitivity,
    decide,
    underwrite
  };
});
```

This preserves browser compatibility and allows Node-based tests without a framework.

---

## 12.4 Policy Module

`ae-policy.js` owns every judgment threshold.

Example:

```js
window.AE_HIRE_POLICY = {
  version: 'ae-policy-1.0.0',

  economic: {
    fullUseThreshold: 0.80,
    partialUseThreshold: 0.50
  },

  demand: {
    sufficientThreshold: 1.00,
    nearThreshold: 0.85
  },

  conversionSample: {
    veryThinBelow: 10,
    thinBelow: 20
  },

  repeatability: {
    demonstratedNonFounderWins: 5
  }
};
```

No threshold should be duplicated inside UI code.

---

## 12.5 Tests Without Adding a Framework

If the repo remains framework-free, use Node’s built-in `assert`.

Run:

```text
node tests/ae-underwriting-engine.test.js
node tests/ae-validation.test.js
node tests/ae-golden-cases.js
```

Each exits nonzero on failure.

---

## 12.6 Phase A — Landing Page

Build:
- route
- final copy
- sample decision object
- responsive behavior
- analytics
- checkout CTA staging state

Pass:
- copy matches spec;
- current command-surface design language;
- no legacy dark purchase styling;
- mobile verified;
- accessibility verified;
- sample labeled.

---

## 12.7 Phase B — Pure Engine

Build:
- normalized schema
- formulas
- branches
- decision logic
- sensitivity
- output object

Pass:
- all unit tests;
- all golden cases;
- reference case exact within rounding tolerance;
- no DOM dependency.

Do this **before** building intake UI.

---

## 12.8 Phase C — Intake

Build:
- form
- save/resume
- unknown state
- validation
- provenance
- review
- schema generation

Pass:
- all required fields;
- unknowns survive round-trip;
- contradictions caught;
- keyboard/mobile tested;
- no sensitive analytics.

---

## 12.9 Phase D — Report

Build:
- web report
- print/PDF stylesheet
- narrative templates
- derivations
- conditions
- evidence gaps
- version footer

Pass:
- reference case renders correctly;
- unknown case renders correctly;
- no stale/sample data;
- print pagination.

---

## 12.10 Phase E — Secure Commerce

Build:
- server-side Checkout Session
- Stripe webhook
- order table
- token verification
- paid gating
- idempotency

Pass:
- fake client state cannot unlock;
- duplicate webhook harmless;
- unpaid order denied;
- amount server-controlled.

Current Supabase documentation explicitly supports Edge Functions for third-party webhooks such as Stripe and requires verifying the provider signature inside a public webhook handler. Implement against the current deployed Supabase/Stripe versions at build time.

---

## 12.11 Phase F — Operations

Build:
- status transitions
- QA view
- override log
- clarification flow
- delivery
- deletion workflow

Pass:
- every override audited;
- report reproducible;
- delivery retryable;
- retention behavior tested before public claim.

---

## 12.12 Phase G — Calibration

Build:
- golden fixtures
- test runner
- override analytics
- policy versioning
- calibration log

Pass:
- launch gates from Step 7.

---

# 13. Launch Gates

Do not call the product live until:

## Product
- [ ] landing page passes 5-person comprehension test
- [ ] no repeated misconception
- [ ] scope is explicit
- [ ] sample result is internally consistent

## Engine
- [ ] all formula tests pass
- [ ] all 24 golden cases pass allowed outcomes
- [ ] reference case matches exact math
- [ ] double-count tests pass
- [ ] first-AE branch passes
- [ ] replacement branch passes
- [ ] metric-basis conflicts block appropriately
- [ ] weighted-pipeline conflicts block appropriately
- [ ] missingness cannot increase confidence

## Security
- [ ] verified Stripe webhook
- [ ] RLS tested
- [ ] no secret in client
- [ ] no private values in analytics
- [ ] token leakage test
- [ ] duplicate webhook idempotent
- [ ] duplicate submission idempotent

## Report
- [ ] web/PDF parity
- [ ] methodology note
- [ ] conditions measurable
- [ ] evidence gaps categorized
- [ ] no fabricated benchmark/proof

## Operations
- [ ] clarification workflow
- [ ] refund/evidence-gap path
- [ ] human QA checklist
- [ ] override log
- [ ] deletion behavior implemented

---

# 14. Final Adversarial Stability Properties

These are non-negotiable invariants.

## Mathematical

1. Increasing win rate cannot increase required qualified pipeline.
2. Increasing ACV cannot increase required win count.
3. Delaying start cannot increase in-horizon contribution.
4. Lengthening ramp cannot increase in-horizon contribution.
5. Increasing allocatable pipeline cannot reduce demand coverage.
6. Increasing existing-team capacity cannot increase residual revenue gap.
7. Removing evidence cannot increase confidence.
8. Changing pipeline from unweighted to weighted cannot leave the same formula path silently.
9. A zero denominator cannot generate infinity/NaN in user-facing output.
10. Every displayed derived number has an input/formula trace.

## Decision

11. A failed evidence gate cannot produce `SUPPORTED`.
12. Materially insufficient demand cannot produce `SUPPORTED`.
13. Incompatible timing cannot produce `SUPPORTED`.
14. A first AE cannot fail merely because no prior non-founder AE existed.
15. Founder-inclusive conversion cannot be called transferable without qualification.
16. Strategic desire cannot rewrite absent economic need.
17. Unknown cannot become zero.
18. An operator override cannot be silent.
19. Policy changes cannot retroactively mutate old reports.
20. A low-confidence result cannot be written with high-certainty prose.

## Commerce / Privacy

21. Client-side state alone cannot establish payment.
22. Query parameters alone cannot establish payment.
23. Sensitive intake values never go to generic analytics.
24. Private report tokens never appear in third-party analytics.
25. Public privacy promises cannot exceed actual implementation.

---

# 15. Product Expansion Ladder — Explicitly Out of V1 UI

Once the $149 product is calibrated:

## SKU 2 — Verified AE Hiring Brief
**Target:** $750–$1,000

Adds:
- CRM export
- opportunity-level evidence
- stage aging
- pipeline allocation verification
- conversion cohort check
- data-quality reconciliation

## SKU 3 — First Two AE Budget Validation
**Target:** $2,500–$5,000

Adds:
- two-seat capacity model
- territory split
- quota/ramp schedule
- downside/base/upside
- CEO/CFO decision memo
- hiring gates
- budget case

## SKU 4 — Founding AE Inheritance Kit
**Target:** $5,000–$10,000

Adds:
- ICP
- qualification
- discovery
- stages
- messaging
- proof
- deal process
- weekly operating cadence
- first-90-day rep inheritance package

The $149 product is the wedge. It must remain useful without being intentionally crippled.

---

# 16. Definition of Complete

This master specification is complete when the following are true:

### Defined in this file
- [x] all original 34 Step-1 points
- [x] Step 1A production landing-page specification
- [x] final landing-page copy
- [x] CSS/design contract
- [x] intake schema
- [x] validation
- [x] metric compatibility
- [x] underwriting formulas
- [x] ramp/cycle branches
- [x] demand-allocation model
- [x] first-AE logic
- [x] replacement-hire logic
- [x] decision engine
- [x] constraint generator
- [x] confidence
- [x] sensitivity
- [x] report structure
- [x] commerce architecture
- [x] security requirements
- [x] operations workflow
- [x] calibration framework
- [x] golden cases
- [x] adversarial passes
- [x] implementation file contract
- [x] launch gates
- [x] stability invariants

### Requires external execution
- [ ] production Stripe credentials
- [ ] production Supabase secrets
- [ ] legal/privacy confirmation
- [ ] five ICP-matched comprehension testers
- [ ] real paid cases for calibration
- [ ] live fulfillment timing data

---

# 17. Build Order — Final

Do not reorder unless a dependency requires it.

```text
1. Pure engine + policy + tests
2. Golden cases
3. Landing page
4. Intake schema/UI
5. Report renderer
6. Secure checkout/order verification
7. Submission storage
8. Operator QA/override flow
9. Delivery
10. Retention/deletion
11. End-to-end QA
12. Five-person landing-page comprehension test
13. Synthetic calibration
14. Soft launch
15. Human-QA live cases
16. Threshold calibration
17. Consider auto-delivery only after gates are met
```

Why engine first:

The landing page can be beautiful and the intake can be polished while the underlying conclusion is wrong. The decision logic is the product’s load-bearing structure. Build and break that first.

---

# 18. Final Product Standard

The product is ready when a skeptical VP Sales, founder, CFO, or experienced operator can inspect the brief and answer all of these:

1. **What decision did it reach?**
2. **What evidence produced that decision?**
3. **What assumptions were made?**
4. **What evidence is missing?**
5. **What would change the answer?**
6. **Can I reproduce the core math?**
7. **Does the conclusion remain stable when nonmaterial inputs move?**
8. **Is the system willing to tell me not to buy more sales capacity?**

If any answer is unclear, the product is not finished.



# Appendix A — Exact Antaeus Design-System Compliance

The public service page must inherit the **current bright command-surface design layer** from `/css/app.css`.

Do not rebuild these as page-local values unless a fallback is required.

## A.1 Canonical Command-Surface Tokens

Current source-of-truth values:

```css
body.command-surface-page {
  --bg-primary: #f4f7fb;
  --bg-secondary: #ffffff;
  --bg-tertiary: #edf2f9;
  --bg-elevated: #ffffff;

  --brand-gold: #e6701e;
  --brand-gold-light: #f08b43;
  --brand-gold-dark: #d26417;

  --brand-teal: #2471e7;
  --brand-teal-light: #4f8ff0;
  --brand-teal-dark: #1e64d1;

  --accent-blue: #2471e7;
  --accent-green: #1f9d55;
  --accent-amber: #d97706;
  --accent-red: #c2410c;

  --text-primary: #0a1c40;
  --text-secondary: #253b5d;
  --text-tertiary: #46607f;
  --text-muted: #7a8da8;

  --border-default: rgba(10, 28, 64, 0.1);
  --border-hover: rgba(36, 113, 231, 0.28);
  --border-active: #2471e7;

  --shadow-sm: 0 1px 2px rgba(10, 28, 64, 0.06);
  --shadow-md: 0 12px 32px rgba(19, 42, 79, 0.08);
  --shadow-lg: 0 24px 56px rgba(19, 42, 79, 0.1);

  --font-serif: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Space Mono', 'Monaco', 'Consolas', monospace;
}
```

The historical variable name `--brand-gold` maps to the current orange in this bright layer. Do not rename the token only for this page; doing so would fork the design system.

---

## A.2 Typography

### H1

```css
font-family: var(--font-serif);
font-size: clamp(3rem, 6vw, 5.9rem);
font-weight: 600;
line-height: .96;
letter-spacing: -.045em;
color: var(--text-primary);
```

Desktop max width: approximately `11ch–13ch` depending final line breaks.

### H2

```css
font-family: var(--font-serif);
font-size: clamp(2rem, 4vw, 3.6rem);
font-weight: 600;
line-height: 1.02;
letter-spacing: -.035em;
color: var(--text-primary);
```

### H3 / analytical headline

```css
font-family: var(--font-serif);
font-size: clamp(1.25rem, 2vw, 1.7rem);
font-weight: 600;
line-height: 1.2;
```

### Body

```css
font-family: var(--font-sans);
font-size: 1rem;
line-height: 1.68;
color: var(--text-secondary);
```

### Large lede

```css
font-size: clamp(1.08rem, 1.5vw, 1.28rem);
line-height: 1.6;
color: var(--text-tertiary);
```

### Kicker / data label

```css
font-family: var(--font-mono);
font-size: .69rem;
font-weight: 700;
letter-spacing: .10em;
text-transform: uppercase;
color: var(--brand-gold);
```

Do not use monospace for long prose.

---

## A.3 Button Rules

Primary button should reuse or extend current `.btn.btn-primary`.

```css
.service-cta--primary {
  min-height: 48px;
  padding: 0 22px;
  border-radius: 12px;
  background: var(--brand-gold);
  color: var(--text-primary);
  border: 1px solid rgba(230,112,30,.24);
  box-shadow: none;
  font-weight: 700;
}
```

Hover:

```css
background: var(--brand-gold-light);
box-shadow: 0 10px 22px rgba(230,112,30,.18);
transform: translateY(-1px);
```

Secondary:

```css
background: rgba(255,255,255,.90);
color: var(--text-secondary);
border: 1px solid rgba(36,113,231,.16);
```

Avoid huge pill buttons.

---

## A.4 Decision Sheet

The decision sheet is the principal contained surface.

```css
.decision-sheet {
  border: 1px solid rgba(10,28,64,.10);
  border-radius: 22px;
  background: rgba(255,255,255,.94);
  box-shadow: var(--shadow-lg);
  padding: clamp(22px, 3vw, 34px);
}
```

Internal structure uses rules rather than nested cards.

```css
.decision-sheet__row {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: 18px;
  padding: 12px 0;
  border-top: 1px solid var(--border-default);
}
```

No nested shadow boxes.

---

## A.5 Verdict Treatment

State label:

```css
.decision-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
```

Use:
- supported → green
- conditional → amber
- not yet supported → red
- insufficient evidence → blue/neutral, not red

Insufficient evidence is not failure; visually treating it as red would miscommunicate.

---

## A.6 Section Rhythm

Recommended desktop:

```text
nav height                68–76px
hero top/bottom           88–112px
major section vertical    88–104px
section heading → body    28–40px
large content blocks      40–56px
analytical row gap        16–24px
```

Mobile:

```text
hero top/bottom           56–72px
major section vertical    56–72px
content block gap         28–36px
```

Spacing should create hierarchy before containers do.

---

## A.7 Four-Test Lanes

Desktop:

```css
.underwriting-lanes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
}

.underwriting-lane {
  padding: 28px 24px 32px;
}

.underwriting-lane + .underwriting-lane {
  border-left: 1px solid var(--border-default);
}
```

At mobile:
- stack vertically;
- change left borders to top borders.

Do not make four freestanding cards.

---

## A.8 Equation Stack

Equation should read like an analytical proof.

```css
.equation-stack__line {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  align-items: baseline;
  padding: 16px 0;
  border-top: 1px solid var(--border-default);
}

.equation-stack__number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
```

Use an accent only on the final derived result.

---

## A.9 Motion

Default transition:

```css
transition:
  transform .15s ease,
  border-color .15s ease,
  background .15s ease,
  opacity .2s ease;
```

No content should be hidden awaiting intersection animation without a failsafe.

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

---

# Appendix B — Exact Golden-Fixture Strategy

Golden tests should use a shared base object and explicit overrides. This prevents every fixture from accidentally encoding different irrelevant assumptions.

## B.1 Base Fixture

```js
const BASE = {
  company: {
    company_stage: 'series_a',
    business_model: 'b2b_saas'
  },

  decision: {
    analysis_horizon_months: 12,
    hire_reason: 'growth_capacity',
    new_ae_market_same_as_history: 'yes'
  },

  target: {
    target_metric: 'new_arr',
    new_arr_target_horizon: 2_000_000,
    target_includes_expansion: false,
    target_includes_renewal: false
  },

  current_team: {
    current_quota_carriers: 2,
    sellers: [
      {
        annual_quota: 900_000,
        trailing_attainment_pct: .72,
        is_founder: false
      },
      {
        annual_quota: 900_000,
        trailing_attainment_pct: .78,
        is_founder: false
      }
    ],
    founder_committed_new_arr: 0
  },

  proposed_ae: {
    annual_quota: 900_000,
    quota_metric: 'new_arr',
    quota_includes_expansion: false,
    start_month_index: 3,
    ramp_months: 3,
    ramp_definition: 'closed_bookings',
    base_salary: 140_000,
    variable_comp_target: 140_000
  },

  economics: {
    average_acv: 52_000,
    median_acv: 50_000,
    average_sales_cycle_days: 94,
    sales_cycle_definition: 'qualified_opportunity_to_close'
  },

  conversion: {
    non_founder_qualified_opps_trailing_12m: 57,
    non_founder_wins_trailing_12m: 12,
    non_founder_qualified_opp_to_win_pct: 12 / 57,
    meeting_to_qualified_opp_pct: .35
  },

  demand: {
    pipeline_value_type: 'unweighted',
    current_qualified_pipeline_value: 3_400_000,
    pipeline_likely_open_at_ae_start: 2_900_000,
    monthly_qualified_pipeline_created_value: 650_000,
    monthly_qualified_opps_created: 12,
    territory_reserved_for_new_ae: true,
    new_ae_pipeline_share_pct: null,
    pipeline_creation_is_seasonal: false
  },

  repeatability: {
    wins_trailing_12m: 14,
    non_founder_wins_trailing_12m: 12,
    founder_primary_seller_share_pct: .14,
    icp_documented: 'yes',
    qualification_documented: 'yes',
    discovery_documented: 'yes',
    sales_stages_documented: 'yes',
    rep_can_run_discovery_without_founder: 'yes',
    founder_required_late_stage: 'rarely',
    repeatable_use_cases_count: 2
  },

  management: {
    direct_manager_exists: true,
    manager_current_direct_reports: 2,
    weekly_1to1_capacity: 'yes',
    weekly_pipeline_review_capacity: 'yes',
    onboarding_owner_named: true,
    onboarding_plan_exists: 'yes',
    manager_is_also_primary_seller: false
  },

  provenance: {
    conversion: 'crm_report',
    pipeline: 'crm_report',
    attainment: 'finance_model'
  }
};
```

This base is intentionally close to the canonical reference case.

---

## B.2 Fixture Overrides

Implement a deep-merge helper.

### G01
```js
{
  target: { new_arr_target_horizon: 1_250_000 }
}
```

Expected: no residual gap after current-team evidence capacity.

### G02
```js
{
  target: { new_arr_target_horizon: 2_200_000 },
  demand: { pipeline_likely_open_at_ae_start: 4_200_000 }
}
```

Expected: supported if all other states remain green.

### G03
Base fixture.

Expected: conditional; near demand.

### G04
```js
{
  demand: { pipeline_likely_open_at_ae_start: 1_750_000 }
}
```

Expected: not yet; pipeline.

### G05 — First AE strong
```js
{
  current_team: {
    current_quota_carriers: 0,
    sellers: [],
    founder_committed_new_arr: 650_000
  },
  repeatability: {
    wins_trailing_12m: 11,
    non_founder_wins_trailing_12m: 0,
    founder_primary_seller_share_pct: 1,
    icp_documented: 'yes',
    qualification_documented: 'yes',
    discovery_documented: 'yes',
    sales_stages_documented: 'partial',
    rep_can_run_discovery_without_founder: 'unknown',
    founder_required_late_stage: 'almost_always',
    repeatable_use_cases_count: 2
  },
  conversion: {
    non_founder_qualified_opps_trailing_12m: null,
    non_founder_wins_trailing_12m: null,
    qualified_opps_trailing_12m: 42,
    closed_won_trailing_12m: 11,
    qualified_opp_to_win_pct: 11/42
  }
}
```

Expected: first-AE branch; never automatic founder-dependent failure.

### G06
Use G05 plus:
```js
{
  repeatability: {
    wins_trailing_12m: 4,
    icp_documented: 'no',
    qualification_documented: 'no',
    discovery_documented: 'no',
    sales_stages_documented: 'partial',
    repeatable_use_cases_count: 0
  },
  demand: {
    pipeline_likely_open_at_ae_start: null
  }
}
```

Expected: not yet or insufficient.

### G07
```js
{
  conversion: {
    non_founder_qualified_opps_trailing_12m: null,
    non_founder_wins_trailing_12m: null,
    qualified_opps_trailing_12m: 30,
    closed_won_trailing_12m: 9,
    qualified_opp_to_win_pct: .30
  }
}
```

Expected: confidence cannot be high.

### G08
```js
{
  proposed_ae: { start_month_index: 13 }
}
```

Expected: 0 in-horizon contribution; late-start failure.

### G09
Base ramp semantics plus long cycle.

Expected: closed-bookings branch does not add cycle delay.

### G10
```js
{
  proposed_ae: { ramp_definition: 'pipeline_productivity' }
}
```

Expected: cycle lag applied to generated qualified pipeline.

### G11
```js
{
  proposed_ae: { ramp_definition: 'unknown' },
  demand: { pipeline_likely_open_at_ae_start: 1_000_000 }
}
```

Expected: both interpretations still demand-short; ambiguity disclosed.

### G12
```js
{
  proposed_ae: { ramp_definition: 'unknown', start_month_index: 5 },
  demand: { pipeline_likely_open_at_ae_start: 3_100_000 }
}
```

Expected: if ramp interpretations produce different overall state, never supported without resolving ambiguity.

### G13 — replacement
Add:
```js
{
  decision: { hire_reason: 'replacement' },
  current_team: {
    departing_seller_index: 1,
    departure_month_index: 2
  }
}
```

Expected: departing capacity removed after departure.

### G14 — weighted pipeline
```js
{
  demand: {
    pipeline_value_type: 'probability_weighted',
    current_qualified_pipeline_value: 2_000_000
  }
}
```

Expected: primary unweighted pipeline formula cannot run unchanged.

### G15 — metric conflict
```js
{
  target: { target_metric: 'new_arr' },
  proposed_ae: { quota_metric: 'tcv' },
  economics: { contract_term_months_typical: 36 }
}
```

Expected: normalization required before verdict.

### G16 — pivot
```js
{
  conversion: {
    material_gtm_change_date: 'recent',
    qualified_opp_to_win_pct: .28,
    post_change_qualified_opps: 13,
    post_change_wins: 2
  }
}
```

Expected: old .28 cannot silently be planning rate.

### G17 — new geography
```js
{
  decision: { new_ae_market_same_as_history: 'no' }
}
```

Expected: historical rate scenario-only; confidence reduced.

### G18 — current reps underfed
```js
{
  target: { new_arr_target_horizon: 1_600_000 },
  current_team: {
    sellers: [
      { annual_quota: 900_000, trailing_attainment_pct: .55, is_founder: false },
      { annual_quota: 900_000, trailing_attainment_pct: .55, is_founder: false }
    ]
  },
  demand: {
    pipeline_likely_open_at_ae_start: 1_000_000,
    monthly_qualified_pipeline_created_value: 250_000
  }
}
```

Expected: new AE not supported merely because trailing bookings are low.

### G19 — management
```js
{
  management: {
    direct_manager_exists: true,
    weekly_1to1_capacity: 'no',
    weekly_pipeline_review_capacity: 'no',
    onboarding_owner_named: false,
    onboarding_plan_exists: 'no',
    manager_is_also_primary_seller: true
  }
}
```

Expected: management material condition/blocker.

### G20 — unknown conversion/allocation
```js
{
  conversion: {
    non_founder_qualified_opps_trailing_12m: null,
    non_founder_wins_trailing_12m: null,
    qualified_opp_to_win_pct: null
  },
  demand: {
    pipeline_likely_open_at_ae_start: null,
    new_ae_pipeline_share_pct: null
  }
}
```

Expected: insufficient evidence.

### G21 — zero win
```js
{
  conversion: {
    non_founder_qualified_opps_trailing_12m: 20,
    non_founder_wins_trailing_12m: 0,
    non_founder_qualified_opp_to_win_pct: 0
  }
}
```

Expected: no divide-by-zero; not supported.

### G22 — perfect but tiny
```js
{
  conversion: {
    non_founder_qualified_opps_trailing_12m: 2,
    non_founder_wins_trailing_12m: 2,
    non_founder_qualified_opp_to_win_pct: 1
  }
}
```

Expected: very-thin warning; no high confidence.

### G23 — strategic ahead
```js
{
  target: { new_arr_target_horizon: 1_250_000 },
  decision: {
    hire_reason: 'new_geography',
    new_ae_market_same_as_history: 'no'
  }
}
```

Expected: revenue-capacity case absent; strategic rationale separate.

### G24 — seasonal
```js
{
  demand: {
    pipeline_creation_is_seasonal: true,
    monthly_pipeline_series: [
      200000, 220000, 240000,
      300000, 350000, 400000,
      450000, 500000, 550000,
      900000, 1100000, 1300000
    ]
  }
}
```

Expected: use series; never recent-month × 12.

---

# Appendix C — Fulfillment Economics and Operational Guardrails

The $149 product only works if fulfillment is bounded.

## C.1 Target Operator Time

After calibration:

```text
normal case QA                    ≤ 20 minutes
clarification case incremental    ≤ 10 minutes average
manual narrative editing          ≤ 5 minutes
total normal human touch          target ≤ 25 minutes
```

These are internal operating targets, not customer SLAs.

If median human touch exceeds 30 minutes across 20 cases:
- do not hide the problem;
- either improve automation/scope or raise price.

---

## C.2 Manual-Review Triggers

Require enhanced review when:
- metric-basis normalization needed;
- ramp definition unknown and verdict flips;
- new-market transferability;
- material GTM pivot;
- weighted pipeline only;
- extreme concentration;
- 0% or 100% conversion on thin sample;
- decision sensitivity flips under ±10% change;
- operator sees contradiction not caught by validation.

---

## C.3 No-Consulting Creep Rule

Operator may:
- correct obvious formatting;
- request clarification;
- explain report content asynchronously;
- fix engine/report defects.

Operator may not within $149 scope:
- redesign compensation;
- create territory;
- inspect a CRM export;
- rewrite sales process;
- coach candidate;
- build board deck;
- run a live strategy session.

Escalate to another SKU rather than silently absorbing work.

---

## C.4 Re-Test Path

A `CONDITIONAL` or `NOT YET SUPPORTED` report should contain a re-test trigger.

Example:

```text
Re-run when either:
- allocatable qualified pipeline reaches $3.2M; or
- the company has 20 post-pivot qualified opportunities; or
- proposed start date changes materially.
```

Do not automatically promise a free re-run. Commercial policy can later define a re-test price or credit.

---

# Appendix D — Current External Architecture Verification Note

Architecture recommendation was re-checked against current Supabase documentation on **September 30, 2026**.

Current Supabase guidance supports:
- Edge Functions for Stripe/webhook integrations;
- public webhook functions with platform JWT verification disabled when the external provider cannot supply a Supabase JWT;
- authentication of the external webhook by verifying the provider’s own signature inside the function;
- use of the raw request body for Stripe signature verification;
- server-side secrets through environment/project secrets.

At implementation time, Codex must re-check the deployed Stripe SDK and Supabase Edge Function APIs rather than pinning example versions from this planning document.

---

# Appendix E — Final Integrity Checklist

Before handing implementation to Codex:

- [x] all 34 original Step-1 points present
- [x] Step 1A present
- [x] Step 2 present
- [x] Step 3 present
- [x] Step 4 present
- [x] Step 5 present
- [x] Step 6 present
- [x] Step 7 present
- [x] first-AE edge case corrected
- [x] ramp/cycle double-count corrected
- [x] pipeline allocation corrected
- [x] weighted pipeline corrected
- [x] metric-basis mismatch corrected
- [x] replacement-hire case corrected
- [x] GTM pivot/history relevance corrected
- [x] seasonality accounted for
- [x] new-market transferability accounted for
- [x] payment-verification weakness corrected
- [x] analytics/privacy leakage addressed
- [x] policy versioning defined
- [x] calibration suite defined
- [x] golden fixtures defined
- [x] Antaeus CSS token compliance defined
- [x] report design defined
- [x] launch gates defined

Open only because they require external execution:
- [ ] Stripe production credentials
- [ ] Supabase production secrets
- [ ] live privacy/legal review
- [ ] external comprehension testers
- [ ] real customer calibration data

