#!/usr/bin/env python3
"""Walk a rendered page in viewport steps.  python3 walk.py <slug|page> [width] [height]"""
import sys, re, json, hashlib, pathlib, importlib.util
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("b", ROOT/"build.py")
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
CACHE = pathlib.Path("/home/user/shapshyftrs/.fontcache")
CH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
OUT = pathlib.Path("/tmp/claude-0/-home-user/b9a5eb09-6d16-57bd-a1df-221d1d6df0e3/scratchpad/walk")

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
w = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
h = int(sys.argv[3]) if len(sys.argv) > 3 else 900
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
src = pathlib.Path(f"/tmp/prev_{slug}.html"); src.write_text(html)
for f in OUT.glob(f"{slug}_*.png"): f.unlink()
with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CH)
    ctx = br.new_context(viewport={"width":w,"height":h}); serve(ctx)
    pg = ctx.new_page(); errs=[]
    pg.on("pageerror", lambda e: errs.append("ERR "+str(e)[:140]))
    pg.on("console", lambda m: errs.append("CONSOLE "+m.text[:140]) if m.type=="error" else None)
    pg.goto(src.as_uri()); pg.wait_for_timeout(2600)
    H = pg.evaluate("document.documentElement.scrollHeight")
    n = 0; y = 0
    while y < H and n < 40:
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT/f"{slug}_{n:02d}.png"))
        n += 1; y += h
    print(f"{slug}: {w}x{H}px  {n} frames")
    for e in dict.fromkeys(errs): print("  ", e)
    br.close()
