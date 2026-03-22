# Antaeus App End-to-End Audit

Date: 2026-03-22  
Scope: product surface, launch readiness, monetization potential, self-serve efficacy, automation vs manual burden, module coverage, funnel completeness, outbound completeness, and notable product/UX defects.  
Method: repo audit, local code review, previously confirmed deployment/setup evidence from this workspace, and current market/pricing comparison against live vendor pricing pages.

## Acknowledgment

You mixed two kinds of concerns into the request:

1. Product audit questions  
Examples: market viability, launch readiness, module coverage, self-serve quality, pricing potential, automation level.

2. Patch-worthy defects  
Examples: Discovery Studio appearing not to load, sidebar scroll resetting to top, duplicate progress banner on PoC Framework, signup behavior, tour quality.

This document treats the defects as audit findings, not fixes. Where a reported issue is supported by code evidence, it is called out explicitly.

## Executive Verdict

### Short version

Antaeus is **more substantial than a landing-page promise**. It already behaves like a real GTM operating system with broad coverage across ICP, signal research, territory, outbound, discovery, pipeline, PoC, advisor deployment, readiness, and playbook/handoff. That breadth is the product's biggest strength.

But it is **not yet ready for a broad self-serve paid launch**. It is ready for:

- a closed alpha
- founder design partners
- fractional CRO / advisor-led use
- a narrow paid beta with hands-on support

It is **not yet ready** for a scaled self-serve funnel where strangers land, pay, onboard, and succeed without human help.

### My overall read

- Product ambition: **high**
- Product coherence: **medium-high**
- Reliability/polish: **medium-low**
- Self-serve readiness: **medium-low**
- Launch readiness for public paid traffic: **low-medium**
- Launch readiness for guided beta / founder cohort: **high**

## Scorecard

| Area | Score | Audit read |
|---|---:|---|
| Product breadth | 9/10 | Unusually broad and opinionated. |
| Product coherence | 7/10 | The pieces fit, but the system is still uneven in polish and maturity. |
| Core GTM logic | 8/10 | Strong methodology spine. |
| Reliability | 5/10 | Too many silent failures, UX regressions, and encoding artifacts. |
| Self-serve onboarding | 5/10 | Better than before, but still not reliably “understood without help.” |
| Tour efficacy | 4/10 | Present, but not yet capable of carrying the product on its own. |
| Billing / checkout readiness | 3/10 | Funnel exists, payment completion does not. |
| Legal / trust readiness | 3/10 | Terms/privacy are still draft-quality and visibly broken. |
| Outbound coverage | 8/10 | Broad coverage, but mostly manual and fragmented. |
| Top-of-funnel completeness | 6/10 | SEO/demo/auth/welcome exist, purchase path does not truly close. |
| $3k MRR feasibility at current price | 4/10 | Possible, but not likely yet via self-serve at $299/year. |

## Strengths

### 1. The app is genuinely broad, not fake-broad

The repo supports real modules for:

- Signal Console
- ICP Studio
- Territory Architect
- Sourcing Workbench
- Outbound Studio
- Cold Call Studio
- LinkedIn Playbook
- Call Planner / Discovery Agenda
- Discovery Studio
- Deal Workspace
- Future Autopsy
- PoC Framework
- Advisor Deploy
- Quota Workback
- Playbook
- Readiness
- Dashboard
- Onboarding
- Welcome

That breadth matters because the product promise is not “one isolated tool.” It is “a durable GTM operating system.” The module surface supports that claim.

### 2. The underlying methodology is stronger than the average GTM product

The strongest strategic advantage is not the UI. It is the methodology:

- explicit ICP definition
- signal-led targeting
- multi-channel outbound
- discovery frameworks
- deal qualification
- autopsy discipline
- PoC scoping
- advisor deployment logic
- readiness scoring
- handoff/playbook output

This makes the product harder to dismiss as “just another template pack.”

### 3. Persistence is meaningfully ahead of where it was

The workspace is no longer just ephemeral localStorage. `js/supabase-config.js` now acts like a real persistence spine for major workspace truth, and export/import/reset flows were hardened. That materially improves cross-device credibility.

### 4. There is a real acquisition layer

The public surface is not just a homepage:

- landing page
- login/signup
- demo seed
- methodology hub
- SEO pages
- robots/sitemap
- GA4 + UTM capture
- Search Console setup work

That means the product has a plausible top-of-funnel narrative, not just an app shell.

### 5. The standalone launch agent increases upside

The standalone `antaeus-launch-agent` meaningfully expands the system. It can scout, map warm paths, draft messages, and qualify replies. That is strategically valuable, even though it is still separate from the core app.

## Weaknesses / Launch Blockers

### 1. Billing is not truly end to end

This is the single biggest commercial blocker.

Evidence:

- the public landing page pricing CTA is still `href="#buy"` in `index.html`
- there is no real Stripe checkout link wired from the landing page
- repo search shows Stripe references in planning docs, not in actual live purchase flow

Implication:

- the funnel is structurally present
- the purchase step is not actually closed
- top-of-funnel is therefore **not truly end to end**

### 2. Legal/trust pages are not publish-ready

`terms.html` and `privacy.html` still contain:

- draft warning language
- broken placeholders
- malformed inline HTML like `<div antaeusapp...>`
- mojibake and bad copy artifacts

This is a serious trust blocker if you want cold traffic to pay.

### 3. The product still has visible polish regressions

The repo still contains customer-facing mojibake / encoding artifacts in places like:

- `index.html`
- `terms.html`
- `privacy.html`
- `js/tour-guide.js`
- `js/guided-rail.js`
- `app/poc-framework/index.html`

This matters more than it looks. It degrades trust exactly where a new buyer is deciding whether the product is real and safe to adopt.

### 4. The app still suppresses some failures instead of surfacing them

Discovery Studio is a good example:

- the inline script in `app/discovery-studio/index.html` is syntactically valid
- but boot failures are swallowed with `.catch(function(){})`
- there is no visible error state if startup fails

This means a runtime failure can look like “the module doesn’t load,” which matches your report.

### 5. Too much of the product still depends on disciplined manual input

The system is strongest when the user actually logs:

- ICPs
- touches
- call agendas
- discovery outcomes
- deal qualifications
- PoC state
- advisor deployments

That is fine for a disciplined operator. It is not yet fine for a skeptical founder expecting magic.

## Readiness Assessment

### Can it launch?

Yes, but not all launch types are equal.

#### Safe launch posture right now

- design-partner cohort
- hands-on founder beta
- advisor/fractional-CRO-led use
- invite-only paid alpha

#### Unsafe launch posture right now

- broad public paid launch
- performance marketing to cold traffic
- “buy now and do it yourself” at scale

### Why

The product is strategically deep enough to charge for. But it is not yet operationally frictionless enough to convert and retain strangers at scale without support.

## Market Viability / Pricing / Resistance

### Can it generate $3k minimum per month?

Yes, but **not easily at the current public price**.

Current landing price: `$299/year`

That means:

- monthly revenue equivalent per customer is about **$24.92**
- to sustain `$3,000 MRR-equivalent`, you need about **121 active paying customers**

That is not impossible, but it is a volume game. For a product that still has onboarding friction and manual-input demands, that is ambitious.

### Should it generate more than that?

Yes. It probably **should** generate more per account if the product is positioned correctly and the trust layer is fixed.

My read:

- at `$299/year`, the product is probably **underpriced relative to scope**
- but it is also **under-polished for a higher-friction premium sale today**

So the real issue is not only price. It is:

- price
- credibility
- onboarding clarity
- proof
- execution reliability

### Likely resistance in market

Most likely objections:

- “This feels broad. Is it actually deep anywhere?”
- “Do I have to manually maintain all this?”
- “Is this a CRM? a course? a playbook? an intelligence tool?”
- “Will this work if I already use HubSpot / Attio / Notion / Clay / Apollo?”
- “Why is the price low if the product does so much?”
- “What happens after I pay?”
- “Can I trust my data here?”

### Competitive pricing context

Official pricing pages show that the market already tolerates meaningfully higher GTM/ops pricing than `$299/year`:

- Attio: Plus at `$29/user/month` annual and Pro at `$69/user/month` annual ([attio.com/pricing](https://attio.com/pricing))
- Common Room: Starter at `$1k/month` ([commonroom.io/pricing](https://www.commonroom.io/pricing/))
- OpenVC Premium: `$99/month` or `$299/year` ([openvc.app/pricing](https://www.openvc.app/pricing))

Inference:

- your current price is close to low-friction founder tooling like OpenVC
- but the product ambition is closer to a lightweight GTM operating platform, which points to higher eventual pricing if trust and execution are strong

### Commercial conclusion

At current state:

- **$3k MRR-equivalent is possible**
- **it is not yet likely via pure self-serve**
- **it is more likely through guided sales, founder networks, advisors, or cohorts**

## Tour Guide / Self-Service Efficacy

### Current state

The tour exists and now routes through demo seeding, which is directionally right. But it is not yet strong enough to carry a new user through the app without confusion.

### Why it is not 100% self-serve yet

- it is still a sequential tooltip tour, not a true guided activation system
- it does not adapt deeply to what the user has or has not done
- it assumes the user will understand why each module matters
- it does not prove outcomes fast enough
- it does not yet transform the product from “many modules” into “one obvious journey”

### Audit verdict

Tour efficacy today: **helpful orientation, not self-serve activation**

## Manual vs Automation Radio Dial

Scale:

- `0` = fully manual
- `10` = mostly automated

| Surface | Dial | Read |
|---|---:|---|
| ICP Studio | 3/10 | Mostly manual framing and scoring. |
| Signal Console | 6/10 | Strongest semi-automated area thanks to enrichment/research. |
| Territory Architect / Sourcing | 4/10 | Structured, but still input-heavy. |
| Outbound Studio | 3/10 | Good frameworks; very manual execution. |
| Cold Call / LinkedIn | 2/10 | Mostly playbook + logging, not true automation. |
| Discovery Agenda / Studio | 3/10 | Strong prompts, weak automation. |
| Deal Workspace / Autopsy / PoC / Advisor | 4/10 | Good systems, but user must feed them. |
| Playbook / Handoff | 6/10 | Best auto-compounding surface once other inputs exist. |
| Launch Agent (standalone) | 7/10 | Strong automation direction, but separate product and manual send only. |

### Bottom line

The app is currently a **high-discipline operator amplifier**, not a low-discipline automation machine.

That is not a flaw by itself. But it means the ideal user is narrower than the landing page may imply.

## Top-of-Funnel Coverage

### Covered

- landing page
- login/signup
- demo seed
- welcome corridor
- methodology hub
- SEO pages
- GA4 + UTM instrumentation
- Search Console / sitemap / robots support

### Not fully covered

- actual paid conversion path from landing to checkout
- billing confirmation / customer portal / subscription management
- strong post-purchase email lifecycle
- public proof/testimonials/customer evidence
- legally publish-ready trust pages

### Verdict

Top of funnel is **structurally broad but commercially incomplete**.

## Outbound Coverage

### Covered well

- target definition
- signal-led prospecting
- outbound framing
- cold call support
- LinkedIn support
- discovery planning
- negotiation / procurement framing
- deal qualification
- PoC scoping
- advisor deployment
- loss analysis

### Not fully covered end to end

- actual sending / sequencing inside the main app
- inbox sync
- reply ingestion in the main app
- CRM / calendar / email integration
- deliverability management
- campaign analytics inside the core app

### Verdict

Outbound is **methodologically covered end to end**, but **operationally not yet automated end to end**.

## Playbook Robustness

### What is good

- the playbook is genuinely fed by real module data
- it is not just a blank template
- export / handoff behavior exists

### What is still weak

- output quality still depends on sparse or uneven upstream data
- some sections can remain shallow if the user has not been disciplined elsewhere
- it is not yet obviously “founder can hand this to a first AE and vanish”

### Verdict

The playbook is **conceptually robust**, but **not yet consistently robust in practice**.

## Reported Defects Confirmed or Strongly Supported

### 1. Sidebar scroll reset on module click

Strongly supported by `js/nav.js`.

Why:

- every module nav click is a full page navigation
- the sidebar HTML is rebuilt on load
- there is no sidebar scroll-state persistence

Result:

- the nav will snap back to top when moving between modules

### 2. Discovery Studio can appear not to load

Strongly supported.

Why:

- the page has no resilient loading/error state
- boot failures are swallowed silently
- runtime dependency issues would present as a blank or dead-feeling module

### 3. PoC Framework duplicate banner risk

Likely supported.

Why:

- `app/poc-framework/index.html` loads several shared UI injectors:
  - `js/guided-rail.js`
  - `js/data-flow.js`
  - `js/save-indicator.js`
  - `js/collapsible-sections.js`
- shared injected chrome increases the risk of stacked banners/chips at the top of the page

### 4. Signup reliability is gated by Supabase email throttling

The original signup JS bug was fixed, but signup is still fragile for real testing because Supabase’s built-in email limits can throttle confirmation flow.

### 5. Data-flow badges are likely broken

`js/data-flow.js` searches for `a.sidebar-link[...]`, while the real sidebar links in `js/nav.js` are `.nav-item`.

Result:

- the intended nav badge behavior is likely not rendering reliably

## Module Gaps / Missing Surfaces

These are not all mandatory before launch, but they are the main missing pieces relative to the ambition of the product:

- true checkout/billing/customer-portal flow
- team seats / role permissions / invites
- CRM integration
- calendar/email integration
- inbox/reply ingestion
- implementation / onboarding project plan surface
- procurement/security handoff surface
- renewals / expansion / customer success layer
- customer proof / case study / evidence vault
- support / help / diagnostics / “why is this empty?” layer
- error observability surfaced to users

## What You’re Probably Not Thinking About Enough

### 1. The product promise is bigger than the current trust layer

The app asks users to trust:

- methodology
- data durability
- decision logic
- purchase flow
- legal/docs
- onboarding clarity

The methodology is ahead of the trust layer right now.

### 2. You still need a sharper ideal buyer

The app is currently attractive to:

- founders
- founding AEs
- first sales hires
- sales leaders
- fractional CROs
- advisors

That is a lot. The product can serve several of them, but the landing story and self-serve experience will convert better if one buyer is primary.

### 3. Manual data entry is a pricing problem, not just a UX problem

Every extra required input reduces:

- activation
- retention
- price tolerance

If the app stays manual-heavy, the pricing and positioning need to respect that.

### 4. The product needs a clearer line between “operating system” and “education”

Right now it is both.

That is not bad, but it creates buyer confusion unless the product journey makes the distinction obvious:

- education gets them moving
- operating system keeps them running

### 5. Your weakest launch risks are boring, not strategic

Not the GTM philosophy. The boring things:

- checkout
- legal pages
- error handling
- UX polish
- email throttling
- visible encoding bugs

Those are the most likely reasons a real buyer bounces.

## Final Recommendation

### My recommendation today

Launch it as a **guided paid beta / founder cohort product**, not a broad self-serve public SaaS.

### Why

Because the product already has enough value to charge for, but not enough polish to let strangers reliably buy, onboard, understand it, trust it, and retain without help.

### Hard conclusion

- **Can it make money now?** Yes.
- **Can it likely hit $3k MRR-equivalent at $299/year via cold self-serve right now?** Unlikely.
- **Could it justify more revenue per customer if positioned and polished correctly?** Yes.
- **Is everything that should be covered already covered?** No.
- **Is the core GTM operating system concept real?** Absolutely yes.

## Evidence and Sources

### Repo evidence

- Landing / pricing: `index.html`
- Signup / login: `signup.html`, `login.html`
- Welcome: `app/welcome/index.html`
- Persistence: `js/supabase-config.js`
- Navigation: `js/nav.js`
- Tour: `js/tour-guide.js`
- Discovery Studio: `app/discovery-studio/index.html`
- PoC Framework: `app/poc-framework/index.html`
- Playbook: `app/founding-gtm/index.html`
- Export/import: `js/data-manager.js`
- Analytics / UTMs: `js/analytics.js`, `js/analytics-site-config.js`
- SEO hub: `methodology/`, `sitemap.xml`, `robots.txt`
- Legal pages: `terms.html`, `privacy.html`
- Launch agent: `antaeus-launch-agent/`

### Market/pricing comparison

- Attio pricing: https://attio.com/pricing
- Common Room pricing: https://www.commonroom.io/pricing/
- OpenVC pricing: https://www.openvc.app/pricing

All pricing conclusions above are inference from those official pricing pages plus the current state of this repo.
