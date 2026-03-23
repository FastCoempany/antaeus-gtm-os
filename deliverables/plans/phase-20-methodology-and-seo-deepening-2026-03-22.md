# Phase 20 - Methodology and SEO Deepening

Date: 2026-03-22

## Objective
Make methodology pages work as acquisition and conversion assets instead of detached thought pieces.

## What This Phase Was Supposed To Do
- review all 10 methodology pages
- tighten CTAs and internal linking
- connect pages to real signup / demo / pricing logic
- add credibility modules to those pages
- define publishing cadence beyond the first 10 pages

## What Was Implemented

### 1. Shared methodology-to-product bridge runtime
Added [js/methodology-bridge.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/methodology-bridge.js).

This file now:
- normalizes methodology CTAs away from dead `/#pricing` anchors and into the real purchase corridor at `/purchase/`
- rewrites methodology top-nav CTAs into:
  - `Explore Demo`
  - `Start Workspace`
  - `See Annual Plan`
- adds UTM-tagged routing for methodology-origin traffic using the existing attribution helper
- tracks methodology CTA usage as explicit analytics events

### 2. All methodology articles now bridge into live modules
Every methodology page under [methodology](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology) now loads the bridge runtime.

For each article, the bridge layer now injects:
- a credibility strip after the metadata row
  - `Best for`
  - `Inside Antaeus`
  - `One-session payoff`
- a richer bottom bridge section that replaces the old shallow `Where this shows up inside the operating system` content with:
  - exact app-module links
  - one-session output expectations
  - related methodology pages for internal linking
- a stronger bottom CTA block with real funnel actions:
  - `Explore Demo`
  - `Start Workspace`
  - `See Annual Plan`

### 3. Methodology hub is now treated like funnel infrastructure
The hub at [methodology/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/index.html) now receives:
- a `Methodology as funnel infrastructure` guide section
- a clearer three-step bridge:
  - read for the bottleneck
  - inspect the sample workspace
  - start the real workspace
- a publishing-cadence block defining what comes after the first 10 pages

### 4. Publishing cadence beyond the first 10 pages is now explicit
The hub now defines the next methodology lanes:
- founder-led sales
- discovery and deal discipline
- platform and portfolio support

Each lane includes:
- cadence
- next-topic examples

### 5. Shared methodology styling expanded
Updated [css/methodology.css](c:/AppDev/v1AntaeusApp/Appv2_290126/css/methodology.css) to support:
- credibility cards
- bridge cards
- hub guide sections
- publishing-cadence sections

## Files Changed
- [js/methodology-bridge.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/methodology-bridge.js)
- [css/methodology.css](c:/AppDev/v1AntaeusApp/Appv2_290126/css/methodology.css)
- [methodology](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology)
- [phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Verification
- [js/methodology-bridge.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/methodology-bridge.js) passes `node --check`
- methodology HTML set now routes pricing CTAs to `/purchase/`
- methodology HTML set now loads `/js/methodology-bridge.js`

## Live Checks Required
After deploy, verify:
1. [methodology/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/index.html)
   - guide section appears
   - publishing cadence appears
   - top nav shows:
     - `Explore Demo`
     - `Start Workspace`
     - `See Annual Plan`
2. Open any 3 methodology pages, for example:
   - [founder-led-sales-process.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/founder-led-sales-process.html)
   - [enterprise-discovery-call-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/enterprise-discovery-call-framework.html)
   - [vc-platform-sales-tools.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/vc-platform-sales-tools.html)
3. Confirm each article shows:
   - credibility strip
   - module bridge section
   - related-reading links
   - bottom CTA block with demo/signup/purchase
4. Confirm CTA clicks land on:
   - `/demo-seed.html`
   - `/signup.html`
   - `/purchase/`
   with methodology attribution params attached

## Honest Residual
This phase improves the methodology-to-product handshake materially, but it does not yet:
- guarantee that methodology traffic converts well
- solve the separate duplicate `Week 1` sidebar nudge issue surfaced during testing
- replace future deeper content strategy work

## Exit Read
Phase 20 is now implemented as a real bridge layer.

It should move methodology from:
- content that happens to mention the product

to:
- content that intentionally routes belief into demo, signup, and the annual-plan path.
