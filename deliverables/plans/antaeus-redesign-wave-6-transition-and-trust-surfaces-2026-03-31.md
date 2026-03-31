# Antaeus Redesign Wave 6: Transition And Trust Surfaces

Date: 2026-03-31

## Scope
- Onboarding
- Settings
- Signup
- Login
- Forgot Password
- Reset Password
- Auth Callback

## Intent
Make first entry, account access, recovery, and trust/control feel like one product corridor instead of a mix of older card screens and newer shell surfaces.

## What Shipped

### 1. Shared auth corridor treatment
- Added a shared auth-page visual system in [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css).
- Auth surfaces now use:
  - a left-side corridor explaining what the page is for
  - a right-side action card for the actual form
  - shared status-card treatment for callback state
- This replaces the older isolated-card feel without turning auth into fake app-shell chrome.

### 2. Signup as activation entry
- [signup.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html) now frames account creation as the start of the activation corridor.
- The page explains:
  - what happens after signup
  - what this account actually owns
  - why the work email matters

### 3. Login as continuity surface
- [login.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/login.html) now frames sign-in as continuity, not just access.
- The demo CTA remains, but it now sits inside the same corridor language instead of feeling bolted on.
- Cleaned the stale password placeholder corruption while rebuilding the page.

### 4. Recovery surfaces as a real lane
- [forgot-password.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/forgot-password.html) now explains what recovery changes and what stays safe.
- [reset-password.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/reset-password.html) now reads like the final step in a recovery corridor, not an orphan form.
- [auth/callback/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/auth/callback/index.html) now uses the same visual family and explicit status treatment instead of the old bare loading page.

### 5. Onboarding as activation, not a wizard
- [app/onboarding/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html) now opens with a real activation hero above the step card.
- That hero updates with:
  - role lens
  - current focus
  - what the current step tunes
  - what successful completion should lead to

### 6. Settings as a trust-and-control board
- [app/settings/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html) now uses:
  - a shared shell command band
  - a shared context rail
  - the existing destructive/config cards underneath
- The page now reads as a top-level trust surface instead of a local bridge card plus utility tiles.

## What Did Not Change
- Demo lane runtime was not materially rebuilt in this wave.
- Reason:
  - it is already a distinct guided sample-workspace surface
  - it belongs more naturally with the later public/commercial/demo convergence pass than with auth/onboarding/settings trust work

## Verification
- Extracted inline runtime syntax checks passed for:
  - [signup.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html)
  - [login.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/login.html)
  - [forgot-password.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/forgot-password.html)
  - [reset-password.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/reset-password.html)
  - [auth/callback/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/auth/callback/index.html)
  - [app/onboarding/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)
  - [app/settings/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html)

## Validation Still Needed
- Live browser pass on:
  - signup
  - login
  - forgot/reset flow
  - auth callback
  - onboarding
  - settings

## Recommended Next Move
Run a live sanity pass on wave 6, then write the missing master modernization program doc so the redesign has an official total sequence instead of only wave records.
