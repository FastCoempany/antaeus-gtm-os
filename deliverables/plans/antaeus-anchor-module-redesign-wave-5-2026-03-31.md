# Antaeus Anchor-Module Redesign Wave 5

Date: 2026-03-31

## Scope

Wave 5 focused on the remaining synthesis family:

- `app/advisor-deploy/index.html`
- `app/quota-workback/index.html`
- `app/readiness/index.html`
- `app/founding-gtm/index.html`

## Design Goal

These modules should behave like verdict and operating boards, not just summaries, calculators, or exports wrapped in older local chrome.

The family job is:

- tell the operator where outside leverage belongs
- turn quota into believable execution pressure
- explain how ready the system is for the next hire
- convert the whole operating system into a transfer-ready handoff kit

## What Changed

### Advisor Deploy

- dashboard now gets a real relationship operating board
- command band now answers:
  - where to deploy
  - why now
  - what the first ask should be
- top stats were replaced with shell-native deployment lanes

### Quota Workback

- top layer now behaves like a planning board
- command band now frames quota as execution pressure, not abstract math
- new shell-native top board now shows:
  - assumption posture
  - weekly revenue pressure
  - touches per week
  - opps per quarter
  - planning quality

### Readiness

- top layer now behaves like a readiness verdict board
- the score ring is still there, but it now lives inside a shell-native operating surface
- the page now makes:
  - verdict
  - strongest dimension
  - weakest dimension
  - top unlock
  explicit before the lower score breakdown

### Playbook / Handoff Kit

- top layer now behaves like a handoff verdict board
- the command band still handles export gravity
- the top board now makes:
  - verdict
  - ready / partial / empty sections
  - weak source gaps
  - export readiness
  explicit before the section-by-section content

## Why This Wave Matters

This family is where the app proves it is a system, not just a cluster of modules.

- Advisor Deploy should feel like targeted leverage
- Quota Workback should feel like operating pressure
- Readiness should feel like an honest verdict
- Playbook should feel like a true transfer asset

## Verification

- inline runtime syntax checks passed for:
  - `app/advisor-deploy/index.html`
  - `app/quota-workback/index.html`
  - `app/readiness/index.html`
  - `app/founding-gtm/index.html`

## Still Needed

- live browser validation on all 4 surfaces after deploy
- family-level spacing and copy refinement after real use

## Outcome

Wave 5 completes the anchor-family redesign sweep across the app’s synthesis surfaces.

The top of each module now answers:

- what this surface is for
- what the current operating truth is
- what the next move should be

before the user drops into the deeper local mechanics.
