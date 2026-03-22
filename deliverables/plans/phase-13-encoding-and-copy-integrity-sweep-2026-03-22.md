# Phase 13 - Encoding and Copy Integrity Sweep

Date: 2026-03-22

## Objective

Remove visible mojibake, broken typography, and corrupted iconography from public and core app surfaces so the product stops looking careless anywhere a user can realistically touch it.

## Current Truth Before This Phase

- Phase 9 had already cleaned the public legal pages.
- The remaining visible corruption was concentrated in:
  - [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
  - [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js)
  - [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js)
  - [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- One public methodology page still had a visible corrupted separator:
  - [methodology/sales-champion-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html)

## Repo Surfaces Updated

- [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
- [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js)
- [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js)
- [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- [methodology/sales-champion-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html)

## What Was Wrong Before

- Landing page titles, CTA labels, separators, FAQ copy, and pricing bullets still contained mojibake.
- Shared tour and guided-rail copy still contained corrupted punctuation and iconography.
- PoC Framework still showed corrupted icons, chevrons, and action labels.
- One public methodology page still showed a corrupted `Buyer B` eyebrow separator.
- The result was a product that looked fragile even when the logic underneath was sound.

## What This Phase Fixed

### Landing page normalization

- Replaced corrupted punctuation in:
  - page title
  - nav CTA
  - hero CTA and hero subtext
  - calibration section
  - modules compound line
  - readiness cards
  - social proof separators
  - pricing period and include list
  - FAQ answers
  - final CTA
  - footer copyright
- Normalized decorative CSS comment headers to plain ASCII separators.
- Replaced corrupted checkmarks/arrows with stable ASCII equivalents.

### Shared shell copy normalization

- Rewrote [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js) with clean user-facing text and comment headers.
- Rewrote [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js) so path labels, CTA labels, ready-state copy, and dismiss controls no longer render corrupted characters.

### PoC Framework normalization

- Replaced corrupted section icons with stable text labels where appropriate.
- Normalized the data-guide chevron and explanatory copy.
- Removed corrupted emoji-style button labels from:
  - Reset
  - Download All
  - Save to Deal
- Replaced corrupted em dashes in action guidance with ASCII-safe separators.

### Public methodology cleanup

- Fixed the remaining corrupted separator in [methodology/sales-champion-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html).

## Verification

### Targeted mojibake scan

```powershell
rg -n "â|Â|Ã|îˆ|ð" index.html terms.html privacy.html app js auth login.html signup.html forgot-password.html reset-password.html demo-seed.html methodology purchase -S
```

Expected result:

- no matches on public or core app surfaces

### Syntax checks

```powershell
node --check js/tour-guide.js
node --check js/guided-rail.js
```

Expected result:

- both files parse cleanly

## Exit Criteria Status

- no customer-facing mojibake on any public surface: **done**
- no customer-facing mojibake on core app shell surfaces: **done**
- broken iconography normalized where it was visibly corrupted: **done**
- Phase 13 evidence item can move to validated: **done**

## What This Phase Did Not Try To Solve

- module depth
- shell injection conflicts
- nav scroll persistence
- duplicate PoC banner behavior
- tour strategy overhaul

Those belong to later phases and should not be confused with encoding/copy integrity.

## Next Best Step

Move to **Phase 14 - Navigation Stability**.
