# Antaeus Anchor Module Redesign Wave 1

Date: 2026-03-31

## Scope

This wave redesigns the first three anchor surfaces so they behave like one operating system instead of three unrelated module pages:

- Dashboard
- Welcome
- ICP Studio

The goal is not cosmetic polish. The goal is to make each page answer:

1. What is happening right now?
2. What should the user do next?
3. What does that next move unlock downstream?

## What Changed

### Dashboard

- Replaced the mixed shell-plus-legacy top with a real anchor-stage operating surface.
- Added a single primary intervention block instead of making the user infer the real priority from scattered cards.
- Added explicit operating lanes:
  - now
  - next
  - keep honest
- Added a ranked risk queue instead of relying only on the older risk stack.
- Added a ranked next-move queue that merges:
  - briefing moves
  - hot-account pressure
  - advisor leverage
- Added a tighter command-tools section for immediate intervention.

### Welcome

- Reframed the page as an activation corridor instead of a polished onboarding recap.
- Added a real anchor-stage hero with:
  - activation status
  - focus summary
  - one primary action
- Added explicit operating lanes so the first week feels ordered instead of generic.
- Replaced the old “next actions” list with a ranked queue that shows:
  - why this is next
  - what this unlocks
- Kept the lifecycle, activation-map, and recovery surfaces, but made them subordinate to the main operating path.

### ICP Studio

- Added a new top operating board so the user sees the decision outcome before the long builder.
- The top of the page now shows:
  - the current wedge statement
  - quality state
  - next consequence
  - sharp vs broad contrast
  - direct save/copy/export actions
- Kept the existing builder depth and diagnostics below it so the page still functions as a detailed working surface.

## Shared Design Principles Applied

- One dominant decision surface first
- Downstream consequence visible early
- Ranked next move above dense detail
- The page should explain itself before asking for more effort
- The top of the page should feel like a control surface, not a report

## Verification

- Inline runtime syntax check passed for:
  - `app/dashboard/index.html`
  - `app/welcome/index.html`
  - `app/icp-studio/index.html`

## Still Needed

- Live browser validation across the 3 anchor surfaces
- A second pass on ICP Studio copy cleanup where older mojibake still exists deeper in the page
- Convergence of remaining legacy module sections into the same redesign language

## Outcome

Wave 1 establishes the behavioral pattern for the broader modernization program:

- Dashboard = command surface
- Welcome = activation corridor
- ICP Studio = decision surface

These three now provide the visual and structural direction the rest of the app should follow.
