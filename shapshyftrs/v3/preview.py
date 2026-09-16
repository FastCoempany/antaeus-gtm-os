#!/usr/bin/env python3
"""Render one mockup (or the page) and shoot it.  python3 preview.py <slug|page> [width]"""
import sys, re, json, hashlib, pathlib, importlib.util
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("b", ROOT/"build.py")
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
CACHE = pathlib.Path("/home/user/shapshyftrs/.fontcache")
CH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

def serve(ctx):
    css = (CACHE/"google.css")
    if not css.exists(): return
    body = css.read_bytes()
    def key(u): return hashlib.md5(u.encode()).hexdigest()[:16]+".woff2"
    def h(r):
        u = r.request.url
        if "googleapis" in u: r.fulfill(status=200, content_type="text/css", body=body); return
        f = CACHE/"files"/key(u)
        r.fulfill(status=200, content_type="font/woff2", body=f.read_bytes()) if f.exists() else r.continue_()
    ctx.route(re.compile(r"https://fonts\.(googleapis|gstatic)\.com/.*"), h)

slug = sys.argv[1]
w = int(sys.argv[2]) if len(sys.argv) > 2 else 1280
cfg = json.loads((ROOT/"config.json").read_text())
if slug == "page":
    mks = {}
    for p in sorted((ROOT/"mockups").glob("*.html")):
        m = b.read_mockup(p); m["_doc"] = b.substitute(m["html"], cfg); mks[m["slug"]] = m
    import sys as _s; _s.path.insert(0, str(ROOT / "lib")); import measure
    for _s2, _px in measure.heights({k: v["_doc"] for k, v in mks.items()},
                                    ROOT / "lib" / "heights.json").items():
        mks[_s2]["_h"] = _px
    html = b.substitute((ROOT/"page.html").read_text(), cfg, mks)
else:
    m = b.read_mockup(ROOT/"mockups"/f"{slug}.html")
    html = b.substitute(m["html"], cfg)
out = pathlib.Path(f"/tmp/prev_{slug}.html"); out.write_text(html)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CH)
    ctx = br.new_context(viewport={"width":w,"height":900}); serve(ctx)
    pg = ctx.new_page(); errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console "+m.text[:80]) if m.type=="error" else None)
    pg.goto(out.as_uri()); pg.wait_for_timeout(2600)
    H = pg.evaluate("document.body.scrollHeight")
    pg.screenshot(path=f"/tmp/prev_{slug}.png", full_page=True)
    print(f"{slug}: {w}x{H}px  errors={errs[:2]}")
    br.close()
