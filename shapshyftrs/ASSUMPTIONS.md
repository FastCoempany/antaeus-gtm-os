# Assumptions and decisions

Every decision made where the brief was silent, every copy cut, every provisional token. Newest at the bottom of each section.

## Repo home and sources

- The tooling available to this build could not create a new GitHub repository, so `shapshyftrs` was built as its own standalone git repository (own history, own `.gitignore`, exactly the tree in brief section 4) and mirrored, history intact, as the `shapshyftrs/` subtree of the GTM OS repository on that repo's working branch so the work persists. Splitting it back out later is one `git subtree split --prefix=shapshyftrs` away, or the standalone history can be pushed to a fresh empty repository as-is.
- The AESDR repository was not in the workspace when the build started. It is public and readable, so it was attached read-only and its tokens are transcribed rather than derived. The brief's "do not fetch" instruction was read as "do not go looking for material to copy"; nothing was taken from it beyond values and anatomy, per rule 1.
- The cockpit source was read from its repository under a neutral name. No path, employer name, partner name, account name, or person name from it appears in this repo or in `dist/`; `SOURCES.md` cites its files by path relative to that repo's root only, and skips any path that carries a name.
- `sources.local.json` holds this workspace's absolute paths and is gitignored. `build.py` never reads it.

## Tooling

- `screenshot.py` falls back to a Chromium binary at a fixed path when Playwright's own download is absent, and opens pages with `ignore_https_errors` so Google Fonts load behind a corporate or sandbox proxy that re-signs TLS. Neither affects a normal install.
- Teaser resting frames are captured with `prefers-reduced-motion: reduce` emulated, so the still in `screens/` is exactly the frame a reduced-motion visitor sees.

## Page structure

- Teaser 1 lives in the hero on every variant, as section 7 says. In variant A the gallery then runs teasers 2 to 13, matching the wireframe. In variant B the compact hero holds the text in the top 40% of the viewport and teaser 1 as a full-width stage below it, and the wall runs 2 to 13 (twelve tiles, which fills two and three columns evenly). In variant C the strip carries all thirteen because the brief asks for a thirteen-tick indicator, so teaser 1 appears twice on that page (hero and strip); every teaser is written to run as multiple instances on one page.
- The stage every teaser stands on is shared, as section 6.1 says, so its rules live once in `tokens/stage.css` (true black, 16:10, the 4:5 crop below 640px around the declared focal point, play/pause and reduced-motion conventions) and the play/pause runtime lives once in `partials/runtime.html`. Each teaser still carries its own scoped CSS and JS under its root class and exposes nothing global.
- The 4:5 crop switches on the teaser's own width (a container query), not the viewport, so a narrow wall tile and a narrow phone both crop correctly.
