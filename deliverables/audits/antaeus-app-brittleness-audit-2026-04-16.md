# Antaeus App Brittleness Audit

Date: 2026-04-16

Scope:
- demo QA bootstrap reliability
- onboarding guard drift
- shared browser-state brittleness
- renderer patterns that make room behavior easy to break

What was hardened in this pass:
- Added reusable demo QA bootstrap scripts in `tools/qa/`
- Unified shared onboarding completion semantics so `nav.js` and `onboarding.js` now read the same completion truth
- Centralized demo storage/environment bootstrap in `js/demo-storage-bootstrap.js`
- Extracted the demo seed writer/runtime out of `demo-seed.html` into `js/demo-seed-runtime.js`
- Replaced demo reset blanket-clear behavior with explicit demo-namespace or visible-`gtmos_*` purging
- Verified seeded demo entry lands cleanly in both Deal Workspace and Discovery Studio without false redirect to onboarding

## Findings

### P1. Demo storage/environment patching was duplicated in multiple places

Source:
- Previous duplication lived in:
  - `js/nav.js`
  - `js/supabase-config.js`
  - `demo-seed.html`

Status:
- Fixed in this pass.

Why this is brittle:
- Demo namespacing is implemented more than once.
- The app currently depends on different files agreeing on how `gtmos_*` keys are mapped into `gtmos_demo__*`.
- A small drift in one file can produce hard-to-debug QA failures that look like room bugs but are really bootstrap bugs.

Observed symptom:
- This is the exact class of drift that caused the earlier false onboarding redirect during headless inspection.

Recommendation:
- Extract one shared demo-storage bootstrap helper and have `nav.js`, `supabase-config.js`, and `demo-seed.html` all consume it.

What changed:
- `js/demo-storage-bootstrap.js` is now the single shared environment/bootstrap helper.
- `nav.js`, `supabase-config.js`, and `demo-seed.html` now consume the shared helper instead of carrying separate storage bootstrap logic.

Remaining recommendation:
- Keep bootstrap logic out of room files and continue treating the shared helper as the only authority for demo storage mode.

### P1. `demo-seed.html` contained duplicate runtime definitions

Source:
- Previous duplication lived inside `demo-seed.html`.

Status:
- Fixed in this pass.

Why this is brittle:
- `window.seed` is defined twice.
- `clearAll` is defined twice.
- The later block silently overrides the earlier block.
- This makes the file misleading to anyone reading or patching it and raises the chance of fixing the wrong implementation.

Recommendation:
- Collapse `demo-seed.html` to one canonical seed path and one canonical reset path.

What changed:
- `demo-seed.html` is now a thin shell.
- The seed writer and runtime behavior now live in `js/demo-seed-runtime.js`.
- Only one `window.seed` and one `window.clearAll` path remain.

### P1. Room rendering still relies heavily on HTML-string assembly plus inline handlers

Representative source:
- `app/deal-workspace/index.html:731`
- `app/deal-workspace/index.html:1064`
- `app/deal-workspace/index.html:1073`
- `js/tour-guide.js:336`
- `js/shell-chrome.js:269`
- `js/discovery-studio-segment-jump-room.js:749`

Why this is brittle:
- Large UI regions are assembled with `innerHTML` and inline `onclick`/`onchange` attributes.
- Even when strings are escaped, this style is easy to drift, hard to test, and fragile under refactors.
- It is also an XSS-adjacent maintenance surface because safety depends on every interpolated path remaining correctly escaped forever.

Recommendation:
- Start with the highest-churn rooms and move interaction binding out of HTML strings.
- First target: `app/deal-workspace/index.html` and `js/discovery-studio-segment-jump-room.js`.

### P1. Onboarding guard logic was duplicated and semantically narrower than the real workspace state

Source:
- `js/nav.js:180`
- `js/onboarding.js:60`
- `js/onboarding.js:469`

Status:
- Partially fixed in this pass.

What was wrong:
- One path trusted only `gtmos_onboarding.completed`.
- Another path could reasonably need to trust `gtmos_profile_cache.onboarding_completed` as well.

Why this was brittle:
- Different files could disagree about whether the workspace was ready.
- Demo QA could be routed incorrectly even when seeded profile state said onboarding was complete.

What changed:
- Shared guard semantics now live in `window.gtmWorkspaceGuard`.
- `onboarding.js` now defers to the shared guard when present.

Remaining recommendation:
- Move this guard into one standalone shared module instead of having `nav.js` own it.

### P2. Demo reset behavior previously depended on patched storage semantics

Source:
- Previous behavior lived in the older `demo-seed.html` inline runtime.

Status:
- Fixed in this pass.

Why this is brittle:
- `localStorage.clear()` is only non-destructive here because the storage prototype has already been patched for demo mode.
- If that patch regresses or the page is loaded outside the expected mode, reset semantics become harder to reason about.

Recommendation:
- Replace `localStorage.clear()` in demo tools with an explicit namespace purge helper.
- Reuse the key-variant cleanup logic already present in `js/data-manager.js`.

What changed:
- Demo reset now prefers the shared `purgeDemoNamespace()` helper.
- The externalized demo runtime falls back to removing only visible `gtmos_*` keys instead of calling `localStorage.clear()`.

### P2. There is no single obvious repo-level dev entrypoint

Observed symptom:
- Root `npm run dev` fails because the repo is served as a static site, not as a root package app.
- QA automation currently assumes an already-running static server.

Status:
- Partially addressed in this pass via `tools/qa/start-static-server.ps1`.

Why this is brittle:
- New contributors and automated QA runs can fail before they ever touch product logic.

Recommendation:
- Keep `tools/qa/start-static-server.ps1` as the canonical QA launcher.
- Optionally add a root `package.json` with thin QA scripts if the team wants one canonical command.

### P2. Tour/overlay systems still have the power to intercept room QA

Representative source:
- `js/tour-guide.js:282`
- `js/tour-guide.js:336`

Why this is brittle:
- First-entry overlays can interfere with live-room inspection and automated flow capture.
- This is especially risky in rooms like Discovery Studio where uninterrupted call-flow visibility matters.

Recommendation:
- Add one explicit QA mode switch that disables tours and non-essential overlays during automated capture.

## Priority Order

1. Introduce one canonical repo-level static-server launcher
2. Reduce HTML-string renderer usage in the highest-churn rooms
3. Move the shared onboarding guard into its own standalone module
4. Add one explicit QA overlay/tour disable switch

## Verification Completed

Verified with the new QA bootstrap:
- `node tools/qa/capture-demo-room.js --path /app/deal-workspace/ --scenario mm`
- `node tools/qa/capture-demo-room.js --path /app/discovery-studio/ --scenario mm`

Both landed in the requested rooms under `?demo=1` rather than redirecting to onboarding.
