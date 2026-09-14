# shapshyftrs

Landing page mockups: three variants of one page, thirteen teasers. Plain HTML, CSS and JavaScript; Python for tooling.

Phase 0 scaffold. Full build, preview, screenshot and deploy notes land in phase 5.

- Build: `python3 build.py` writes `dist/`.
- Preview: `cd dist && python3 -m http.server 8000`.
- Screenshots: `pip install playwright && playwright install chromium`, then `python3 screenshot.py`.
