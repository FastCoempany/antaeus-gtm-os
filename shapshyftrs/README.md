# shapshyftrs

Landing page mockups: three variants of one page, thirteen teasers. Plain HTML, CSS and JavaScript; Python for tooling.

Phase 0 scaffold. Full build, preview, screenshot and deploy notes land in phase 5.

- Build: `python3 build.py` writes `dist/`. While the teaser set is still being written (phases 2 to 4) missing teasers are skipped with a warning; `BUILD_STRICT=1 python3 build.py` requires all thirteen and is the phase-5 gate.
- Preview: `cd dist && python3 -m http.server 8000`.
- Screenshots: `pip install playwright && playwright install chromium`, then `python3 screenshot.py`.
