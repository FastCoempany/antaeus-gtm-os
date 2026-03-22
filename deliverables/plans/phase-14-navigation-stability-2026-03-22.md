# Phase 14 - Navigation Stability

Date: 2026-03-22

## Objective

Make the app shell feel stable and respectful by preserving sidebar position, preserving module context across non-module routes, and reducing orientation loss during module-to-module movement.

## Current Truth Before This Phase

- The sidebar HTML was rebuilt on every app page load by [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js).
- The scrollable element was `.sidebar-nav`.
- No shell state was persisted for:
  - sidebar scroll position
  - last active module context
- Result:
  - clicking a module lower in the nav could snap the sidebar back to the top on the next page
  - pages like Settings or Welcome could feel disconnected from the module the user just came from
  - the shell felt like it forgot where the user was

## Repo Surface Updated

- [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)

## What This Phase Implemented

### 1. Sidebar scroll persistence

- Added session-scoped persistence for `.sidebar-nav` scroll position.
- The shell now saves scroll position on:
  - sidebar scroll
  - sidebar nav click
  - page hide
  - before unload
- The shell restores that scroll position on the next app page load.

### 1a. Hardening pass after real-user failure

- Real manual use showed that the first scroll-persistence pass was not strong enough.
- The shell now stores:
  - raw sidebar scroll position
  - the clicked or visible anchor module
  - that anchor's offset within the visible sidebar viewport
- Restore is now replayed across multiple boot moments:
  - initial animation frame
  - window load
  - font-ready pass
  - short delayed pass
- Goal:
  - keep the clicked lower module near the same visible position instead of merely restoring a stale raw `scrollTop`

### 2. Last-module context persistence

- Added session-scoped persistence for the last clicked module nav key.
- If the current page is not itself a first-class nav module, the sidebar now restores a contextual highlight using the last active module.
- This is especially relevant for pages like:
  - Welcome
  - Settings

### 3. Active/context restore behavior

- If there is a true active module on the current route, that module remains the primary active item.
- If there is no active module for the current route, the shell uses the remembered module context and styles it as contextual rather than fully active.
- If there is no stored scroll position, the shell scrolls the active/context item into view instead of defaulting to the top.

### 4. Navigation handler hygiene

- Settings and Welcome-guide buttons now preserve sidebar scroll before navigation.
- Role reset flow now preserves sidebar scroll before redirecting to onboarding.
- Sidebar logo click now stores dashboard as the last active context.

### 5. Shell copy cleanup

- Removed the lingering corrupted source string for the tour button label.
- `Tour the App` in the shell now comes from a clean text assignment.

## Verification

### Parse check

```powershell
node --check js/nav.js
```

Expected result:

- parses cleanly

### Source cleanliness check

```powershell
Get-Content js/nav.js | Select-String 'â|Â|Ã|îˆ|ð|tourBtn\.innerHTML'
```

Expected result:

- no matches

## Manual Browser Verification Recommended

1. Open an app page with the full sidebar, such as `/app/dashboard/`.
2. Scroll the sidebar downward until modules like PoC Framework / Advisor Deploy are visible.
3. Click a lower module.
4. Confirm the next page keeps the sidebar near the same scroll position instead of jumping back to the top.
5. From a lower module, click `Settings`.
6. Confirm the sidebar still feels anchored to the prior module context.
7. Click `Back to Welcome Guide`.
8. Confirm the sidebar preserves its previous vertical position.
9. Return into a module and confirm the nav still highlights the current module correctly.

## Exit Criteria Status

- preserve sidebar scroll position: **done in repo, hardening pass added after real-user failure**
- preserve relevant shell state: **done in repo**
- confirm active-nav behavior: **done in repo, still worth manual sanity check**
- remove shell jumps that break orientation: **materially improved, reopened for real verification**

## Evidence Board Status

- `EB-R02` moved from `open` to `local-patch`

Reason:

- the code change is real and parse-safe
- the first implementation attempt misfired in live use
- the phase now includes an anchor-based restore hardening pass
- browser verification is required before calling it validated

## Next Best Step

Move to **Phase 15 - Shared Chrome Audit**.
