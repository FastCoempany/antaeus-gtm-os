# Antaeus Convergence Sweep
Date: 2026-03-31
Owner: Codex
Status: implemented

## Scope
This sweep closed the remaining exterior-family mismatches after redesign wave 7.

Primary targets:
- `demo-seed.html`
- `marketing-landing-preview.html`

Preserved intentionally:
- `coming-soon.html`

## Why this sweep existed
After the shell waves and redesign waves, the app interior, auth corridor, settings, purchase corridor, and methodology family were reading like one product.

The remaining mismatch was at the perimeter:
- the demo lane still looked like an older utility surface
- the preserved marketing preview still spoke an older typography and CTA dialect
- the approved stealth front door (`coming-soon.html`) was already intentional and did not need destabilizing

## What changed

### Demo lane
File:
- `demo-seed.html`

Changes:
- switched the page into the same public-family type stack used by the current perimeter
- upgraded the background and container treatment so it reads like a product surface, not a loader utility
- rewrote the non-JS fallback so it matches the live demo-lane story instead of saying `Demo Seed Loader`
- tightened visible CTA language:
  - `See Annual Plan`
  - `Sign In`
  - `Read Methodology`
- tightened the reset / seed helper copy
- updated the document title to `Antaeus Demo Workspace`
- added `noindex, nofollow`

### Preserved marketing preview
File:
- `marketing-landing-preview.html`

Changes:
- aligned the type stack to the current public-family typography
- fixed the brand link so it no longer points at `#`
- normalized CTA language:
  - `Explore Demo Lane`
  - `See Annual Plan`
  - `Read Methodology`
- normalized the hero scroll label
- tightened the pricing CTA so it routes more cleanly into the purchase corridor

### Front door
File:
- `coming-soon.html`

Decision:
- left unchanged by design

Reason:
- it is the approved stealth front door
- the page is already intentionally minimal and does not need more public-surface convergence work right now

## Validation needed
Implementation is complete.

To call the sweep validated, run a quick browser pass on:
1. `/demo-seed.html`
2. `/marketing-landing-preview.html`
3. `/coming-soon.html`

Look for:
- typography family consistency
- CTA wording consistency
- no spacing breaks
- no visual regression against the approved front door

## Result
The app perimeter now reads more coherently across:
- stealth front door
- demo lane
- methodology family
- purchase corridor
- auth corridor
- redesigned app interior
