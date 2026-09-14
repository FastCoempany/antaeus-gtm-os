#!/usr/bin/env python3
"""Screenshot dist/ into screens/ with Playwright for Python.

  python3 screenshot.py                 variants at 1440x900 and 390x844 (full page),
                                        plus every teaser's resting frame at 1600 wide
  python3 screenshot.py --variants      variants only
  python3 screenshot.py --teasers       teaser stills only
  python3 screenshot.py --live          capture teasers mid-loop (3 s in) instead of resting
  python3 screenshot.py --only NAME     restrict to files whose name contains NAME
  python3 screenshot.py --fold          variants at viewport size only (first fold)

Resting frames are captured with prefers-reduced-motion: reduce emulated, which
is exactly the frame the page shows to a visitor who asked for reduced motion.

Console errors and page errors are collected and printed; the exit code is 1
if any were seen, so this doubles as the "no console errors" check.

Install once:  pip install playwright && playwright install chromium
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
SCREENS = ROOT / "screens"
VIEWPORTS = [(1440, 900), (390, 844)]
TEASER_WIDTH = 1600
FALLBACK_CHROMIUM = ["/opt/pw-browsers/chromium", os.environ.get("PLAYWRIGHT_CHROMIUM_PATH", "")]


def launch(p):
    try:
        return p.chromium.launch()
    except Exception as exc:  # noqa: BLE001
        for cand in FALLBACK_CHROMIUM:
            if cand and Path(cand).exists():
                return p.chromium.launch(executable_path=cand)
        raise exc


def settle(page, ms: int) -> None:
    page.wait_for_load_state("load")
    try:
        page.evaluate("document.fonts && document.fonts.ready")
    except Exception:  # noqa: BLE001
        pass
    page.wait_for_timeout(ms)


def main(argv: list[str]) -> int:
    want_variants = "--teasers" not in argv
    want_teasers = "--variants" not in argv
    live = "--live" in argv
    fold = "--fold" in argv
    only = argv[argv.index("--only") + 1] if "--only" in argv else ""

    SCREENS.mkdir(exist_ok=True)
    (SCREENS / "teasers").mkdir(exist_ok=True)
    errors: list[str] = []

    with sync_playwright() as p:
        browser = launch(p)

        def open_page(width: int, height: int, reduce: bool):
            ctx = browser.new_context(
                viewport={"width": width, "height": height},
                ignore_https_errors=True,
                reduced_motion="reduce" if reduce else "no-preference",
                device_scale_factor=1,
            )
            page = ctx.new_page()
            page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            return ctx, page

        if want_variants:
            for html in sorted(DIST.glob("variant-*.html")):
                if only and only not in html.name:
                    continue
                for w, h in VIEWPORTS:
                    ctx, page = open_page(w, h, reduce=False)
                    page.goto(html.resolve().as_uri())
                    settle(page, 1500)
                    out = SCREENS / f"{html.stem}-{w}x{h}{'-fold' if fold else ''}.png"
                    page.screenshot(path=str(out), full_page=not fold)
                    print(f"wrote {out.relative_to(ROOT)}")
                    ctx.close()

        if want_teasers:
            for html in sorted((DIST / "teasers").glob("t*.html")):
                if only and only not in html.name:
                    continue
                ctx, page = open_page(TEASER_WIDTH, TEASER_WIDTH * 10 // 16, reduce=not live)
                page.goto(html.resolve().as_uri())
                settle(page, 3000 if live else 800)
                sub = "live" if live else ""
                (SCREENS / "teasers" / sub).mkdir(exist_ok=True) if sub else None
                out = SCREENS / "teasers" / sub / f"{html.stem}.png"
                page.screenshot(path=str(out), full_page=False)
                print(f"wrote {out.relative_to(ROOT)}")
                ctx.close()

        browser.close()

    if errors:
        print("\nconsole/page errors:")
        for e in errors:
            print("  " + e)
        return 1
    print("\nno console errors")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
