#!/usr/bin/env python3
"""Screenshot dist/ into screens/ with Playwright for Python.

  python3 screenshot.py                 variants at 1440x900 and 390x844 (full page),
                                        plus every teaser's resting frame at 1600 wide
  python3 screenshot.py --variants      variants only
  python3 screenshot.py --teasers       teaser stills only
  python3 screenshot.py --live          capture teasers mid-loop (3 s in) instead of resting
  python3 screenshot.py --only NAME     restrict to files whose name contains NAME
  python3 screenshot.py --fold          variants at viewport size only (first fold)
  python3 screenshot.py --fetch-fonts   cache the declared Google Fonts faces into
                                        .fontcache/ (gitignored); once that exists every
                                        capture is served from it instead of the network

Resting frames are captured with prefers-reduced-motion: reduce emulated, which
is exactly the frame the page shows to a visitor who asked for reduced motion.

Console errors and page errors are collected and printed; the exit code is 1
if any were seen, so this doubles as the "no console errors" check. A still taken
before the declared faces loaded is reported as FALLBACK TYPE and also exits 1 --
it is a still of Times and Arial, not of the design.

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


# Every face the page declared must have loaded. Three conditions, and the first one matters
# most: document.fonts must be NON-EMPTY. When the Google Fonts stylesheet itself is dropped
# (the common proxy failure here) the page has zero FontFaces, and check() then answers true
# for every family on earth -- nothing is needed, so nothing is missing -- which silently
# passes a still rendered entirely in Times and Arial. Face count first, then the chrome face
# by name, then no face left sitting in the error state.
FONT_PROBE = (
    "(() => { if (!document.fonts) return true;"
    " if (document.fonts.size === 0) return false;"
    " if (!document.fonts.check('600 16px \"Schibsted Grotesk\"')) return false;"
    " return !Array.from(document.fonts).some(f => f.status === 'error'); })()"
)


# Google Fonts is served through this container's proxy, which drops the stylesheet or its
# woff2 files often enough that a capture run can finish with every face fallen back. When a
# cache built by `python3 screenshot.py --fetch-fonts` is on disk, requests to googleapis and
# gstatic are answered from it instead of the network. The built pages are untouched -- they
# still point at Google Fonts for real visitors; only the capture browser reads local bytes.
FONT_CACHE = ROOT / ".fontcache"


def cache_key(url: str) -> str:
    import hashlib

    return hashlib.md5(url.encode()).hexdigest()[:16] + ".woff2"


def fetch_fonts() -> int:
    """Download the stylesheet declared in partials/head.html and every woff2 it names."""
    import re
    import urllib.request

    head = (ROOT / "partials" / "head.html").read_text()
    m = re.search(r"https://fonts\.googleapis\.com/css2\?[^\"']+", head)
    if not m:
        print("no Google Fonts stylesheet declared in partials/head.html")
        return 1
    (FONT_CACHE / "files").mkdir(parents=True, exist_ok=True)

    def get(url: str) -> bytes:
        # The woff2 subset is only served to a browser UA; a default UA gets ttf.
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        last: Exception | None = None
        for _ in range(5):
            try:
                return urllib.request.urlopen(req, timeout=30).read()
            except Exception as exc:  # noqa: BLE001
                last = exc
        raise last  # type: ignore[misc]

    css = get(m.group(0)).decode()
    (FONT_CACHE / "google.css").write_bytes(css.encode())
    urls = sorted(set(re.findall(r"https://fonts\.gstatic\.com[^)]+", css)))
    for i, u in enumerate(urls, 1):
        dest = FONT_CACHE / "files" / cache_key(u)
        if dest.exists() and dest.read_bytes()[:4] == b"wOF2":
            continue
        dest.write_bytes(get(u))
        print(f"  [{i}/{len(urls)}] {dest.name}")
    print(f"cached {len(urls)} font files + stylesheet in {FONT_CACHE.relative_to(ROOT)}/")
    return 0


UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def serve_fonts_locally(ctx) -> bool:
    """Answer Google Fonts requests from the cache. Returns False if there is no cache."""
    css = FONT_CACHE / "google.css"
    if not css.exists():
        return False
    body = css.read_bytes()

    def css_route(route):
        route.fulfill(status=200, content_type="text/css", body=body)

    def file_route(route):
        f = FONT_CACHE / "files" / cache_key(route.request.url)
        if f.exists():
            route.fulfill(status=200, content_type="font/woff2", body=f.read_bytes())
        else:
            route.continue_()

    ctx.route("https://fonts.googleapis.com/**", css_route)
    ctx.route("https://fonts.gstatic.com/**", file_route)
    return True


def settle(page, ms: int) -> bool:
    """Wait for load and fonts; reload up to four times if any face was dropped
    (a proxy hiccup, not a page fault). Returns False if the faces never arrived,
    which means the still about to be taken is in fallback type and is not usable."""
    good = False
    for attempt in range(5):
        page.wait_for_load_state("load")
        try:
            page.evaluate("document.fonts && document.fonts.ready")
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(600)
        try:
            good = bool(page.evaluate(FONT_PROBE))
        except Exception:  # noqa: BLE001
            good = True  # no font API to consult; nothing to assert against
            break
        if good:
            break
        if attempt < 4:
            page.wait_for_timeout(400 * (attempt + 1))
            page.reload()
    page.wait_for_timeout(ms)
    return good


def main(argv: list[str]) -> int:
    if "--fetch-fonts" in argv:
        return fetch_fonts()
    want_variants = "--teasers" not in argv
    want_teasers = "--variants" not in argv
    live = "--live" in argv
    fold = "--fold" in argv
    only = argv[argv.index("--only") + 1] if "--only" in argv else ""

    SCREENS.mkdir(exist_ok=True)
    (SCREENS / "teasers").mkdir(exist_ok=True)
    errors: list[str] = []
    network: list[str] = []  # resource fetch failures (fonts behind a proxy), reported but not counted
    fallback: list[str] = []  # stills taken before the declared faces loaded -- not usable

    with sync_playwright() as p:
        browser = launch(p)

        def open_page(width: int, height: int, reduce: bool):
            ctx = browser.new_context(
                viewport={"width": width, "height": height},
                ignore_https_errors=True,
                reduced_motion="reduce" if reduce else "no-preference",
                device_scale_factor=1,
            )
            serve_fonts_locally(ctx)
            page = ctx.new_page()
            page.on("console", lambda m: (network.append(m.text) if m.text.startswith("Failed to load resource") else errors.append(f"console.{m.type}: {m.text}")) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.on("requestfailed", lambda r: network.append(f"{r.url} :: {r.failure}"))
            return ctx, page

        if want_variants:
            for html in sorted(DIST.glob("variant-*.html")):
                if only and only not in html.name:
                    continue
                for w, h in VIEWPORTS:
                    ctx, page = open_page(w, h, reduce=False)
                    page.goto(html.resolve().as_uri())
                    ok = settle(page, 1500)
                    out = SCREENS / f"{html.stem}-{w}x{h}{'-fold' if fold else ''}.png"
                    page.screenshot(path=str(out), full_page=not fold)
                    if not ok:
                        fallback.append(str(out.relative_to(ROOT)))
                    print(f"wrote {out.relative_to(ROOT)}{'' if ok else '   ** FALLBACK TYPE **'}")
                    ctx.close()

        if want_teasers:
            for html in sorted((DIST / "teasers").glob("t*.html")):
                if only and only not in html.name:
                    continue
                ctx, page = open_page(TEASER_WIDTH, TEASER_WIDTH * 10 // 16, reduce=not live)
                page.goto(html.resolve().as_uri())
                ok = settle(page, 3000 if live else 800)
                sub = "live" if live else ""
                (SCREENS / "teasers" / sub).mkdir(exist_ok=True) if sub else None
                out = SCREENS / "teasers" / sub / f"{html.stem}.png"
                page.screenshot(path=str(out), full_page=False)
                if not ok:
                    fallback.append(str(out.relative_to(ROOT)))
                print(f"wrote {out.relative_to(ROOT)}{'' if ok else '   ** FALLBACK TYPE **'}")
                ctx.close()

        browser.close()

    if network:
        print(f"\n{len(network)} resource fetch failure(s), not counted as page errors (fonts through a proxy, usually):")
        for n in network[:4]:
            print("  " + n[:160])
    if fallback:
        print(f"\n{len(fallback)} still(s) captured in FALLBACK TYPE -- the declared faces never loaded:")
        for f in fallback:
            print("  " + f)
        print("  run `python3 screenshot.py --fetch-fonts` to cache the faces locally, then re-run.")
    if errors:
        print("\nconsole/page errors:")
        for e in errors:
            print("  " + e)
        return 1
    if fallback:
        return 1
    print("\nno console errors, every still on the declared faces")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
