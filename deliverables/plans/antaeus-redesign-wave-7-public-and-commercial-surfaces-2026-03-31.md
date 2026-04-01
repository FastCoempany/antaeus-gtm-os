# Antaeus Redesign Wave 7: Public And Commercial Surfaces
Date: 2026-03-31
Status: local-patch

## Scope
Wave 7 redesigned the shared public layer that sits outside the authenticated app:

- methodology hub and methodology article family
- methodology bridge runtime and CTA logic
- purchase corridor
- purchase success state
- purchase cancelled state

## Why this wave existed
After shell waves and anchor-module redesign waves, the interior of the product had a much clearer operating language than the exterior.

The remaining gap was the public edge:

- methodology still looked like an older content site
- purchase still felt like a separate commercial explainer
- the overall exterior was not yet reading as the same product family as the redesigned app

The point of this wave was to make the public layer feel like the same operating system, not a parallel marketing stack.

## What changed

### 1. Methodology family redesign
Shared redesign landed in:

- `css/methodology.css`
- `js/methodology-bridge.js`

Impact:

- methodology pages now use a calmer, shell-adjacent exterior language
- the hub reads like a real entry point into the product, not a content archive
- article bridge sections and CTA blocks now route more cleanly into demo, workspace, and annual-plan paths
- the old awkward/funnel-heavy phrasing was tightened toward “belief -> sample lane -> workspace truth”

### 2. Methodology text cleanup
Targeted repairs landed in:

- `methodology/index.html`
- `methodology/first-ae-playbook.html`
- `methodology/founder-led-sales-process.html`
- `methodology/portfolio-gtm-assessment.html`
- `methodology/when-to-hire-first-sales-person-startup.html`

Impact:

- visible mojibake in live metadata and article copy was removed
- hub hero copy now better matches the redesigned public family
- index card metadata now uses clean buyer labels

### 3. Purchase corridor redesign
Redesign landed in:

- `purchase/index.html`
- `purchase/success/index.html`
- `purchase/cancelled/index.html`

Impact:

- purchase now reads like a deliberate commercial corridor
- success now reads like activation truth, not just receipt confirmation
- cancellation now reads like a trust-preserving branch, not a dead end
- the commercial path is more explicit about:
  - what the buyer is actually buying
  - what should happen after payment
  - how the corridor routes into onboarding, welcome, and dashboard

## Intentional boundary
Wave 7 did **not** materially rebuild:

- `coming-soon.html`
- `demo-seed.html`
- `marketing-landing-preview.html`

Reason:

- `coming-soon.html` is currently a deliberate stealth front door, not a general public marketing surface
- `demo-seed.html` is better treated as a sample-lane convergence problem than a generic commercial page
- `marketing-landing-preview.html` is an internal preview asset, not the active public front door

Those surfaces can be handled in a later public/demo convergence pass if needed.

## Verification performed

- `node --check js/methodology-bridge.js`
- extracted inline runtime check for `purchase/index.html`
- targeted text cleanup verification on methodology pages

## What still needs live validation

- methodology hub visual pass
- at least 2 methodology articles visual pass
- purchase page visual pass
- purchase success visual pass
- purchase cancelled visual pass

## Completion note
Wave 7 is complete as an implementation pass.

To call it validated, the live browser pass still needs to happen on the surfaces above.
