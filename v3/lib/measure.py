"""Measure a built mockup's own document height at its design width.

The page frames each mockup at its natural height so nothing is sliced. That
number therefore has to come from the mockup, not from a hand-copied constant
in the page: a constant goes stale the moment the mockup grows a section, and
nothing executes a constant. Measurements are cached against a hash of the
built document, so a build that changes nothing costs nothing.
"""
import hashlib
import json
import pathlib
import re

CACHE = pathlib.Path("/home/user/shapshyftrs/.fontcache")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
DESIGN_WIDTH = 1400


def _serve_fonts(ctx):
    css = CACHE / "google.css"
    if not css.exists():
        return
    body = css.read_bytes()

    def handler(route):
        url = route.request.url
        if "googleapis" in url:
            route.fulfill(status=200, content_type="text/css", body=body)
            return
        f = CACHE / "files" / (hashlib.md5(url.encode()).hexdigest()[:16] + ".woff2")
        if f.exists():
            route.fulfill(status=200, content_type="font/woff2", body=f.read_bytes())
        else:
            route.continue_()

    ctx.route(re.compile(r"https://fonts\.(googleapis|gstatic)\.com/.*"), handler)


def heights(docs: dict, cache_path: pathlib.Path) -> dict:
    """docs: {slug: built html}. Returns {slug: height in css px at 1400 wide}."""
    try:
        cache = json.loads(cache_path.read_text())
    except Exception:
        cache = {}
    want = {s: hashlib.sha256(d.encode()).hexdigest()[:16] for s, d in docs.items()}
    stale = [s for s, h in want.items() if cache.get(s, {}).get("hash") != h]
    if stale:
        from playwright.sync_api import sync_playwright

        tmp = pathlib.Path("/tmp/measure"); tmp.mkdir(exist_ok=True)
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=CHROME)
            ctx = br.new_context(viewport={"width": DESIGN_WIDTH, "height": 900})
            _serve_fonts(ctx)
            for slug in stale:
                f = tmp / f"{slug}.html"
                f.write_text(docs[slug], encoding="utf-8")
                pg = ctx.new_page()
                pg.goto(f.as_uri())
                pg.wait_for_timeout(1600)
                px = pg.evaluate("document.documentElement.scrollHeight")
                pg.close()
                cache[slug] = {"hash": want[slug], "h": int(px)}
                print(f"  measured {slug}: {px}px at {DESIGN_WIDTH} wide")
            br.close()
        cache_path.write_text(json.dumps(cache, indent=1, sort_keys=True) + "\n")
    return {s: cache[s]["h"] for s in docs}
