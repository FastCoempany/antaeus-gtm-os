#!/usr/bin/env python3
"""Drive the built page and measure it. A pass here is evidence, not a claim.

    python3 accept.py

Every check reports the number it measured, so a failure names what was wrong
rather than saying something failed. Exit code is 1 if anything failed.

Written after the build shipped a page that dumped five mockup source files
into its own body and reported success: the build's own output is not evidence
that the build worked. Checks 5, 6 and 7 exist because of that specific bug.

Needs the shared font cache. A page judged in fallback type is not the page.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT / "dist"
CACHE = pathlib.Path("/home/user/shapshyftrs/.fontcache")
CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
PAGE_BUDGET_KB = 1600          # the reference page this borrows its form from is ~1.3 MB

results: list[tuple[bool, str, str]] = []


def say(name: str, ok: bool, detail: str = "") -> None:
    results.append((bool(ok), name, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   {detail}" if detail else ""))


def serve_fonts(ctx) -> None:
    css = CACHE / "google.css"
    if not css.exists():
        sys.exit("accept.py: no font cache at %s" % CACHE)
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


# ══ static checks over what would actually be published ═══════════════════════

def static_checks(cfg: dict) -> None:
    print("\nWHAT WOULD SHIP")
    files = sorted(p for p in DIST.rglob("*") if p.is_file())
    text = "\n".join(p.read_text(encoding="utf-8", errors="ignore")
                     for p in files if p.suffix in {".html", ".css", ".js", ".json"})

    # 1 — no person's name and no out-of-scope brand. The names are hashed so
    # this guard is not itself the only place in the repo they are written.
    name_hashes = {"13aacf62bf70", "14a96ebb257d", "27652cad4994", "2993f8453f06",
                   "316a91552b13", "329026f90ad2", "3ac71bc84920", "678d1193e038",
                   "70d98166acac", "74258916fd9a", "7b54df6d6361", "8535e86c8118",
                   "9cf44bc93065", "9f04291f95d0", "a558eaa0f8eb", "a66ded421756",
                   "a7bece6b48d8", "aec1c22d36c5", "ce0fee7e61f9", "f53460b9de69",
                   "fe384adb7e67"}
    # A base64 payload spells words by accident. Strip every data: URI before
    # reading prose out of the page, or the guard cries over an image.
    prose = re.sub(r"data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+", " ", text)
    words = {w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'-]{3,}", prose)}
    name_hits = sorted(w for w in words
                       if hashlib.sha256(w.encode()).hexdigest()[:12] in name_hashes)
    banned = ["prismhr", "VULKEN", "RHECC", "Pure Patch", "/home/user/", "src-assets",
              "fastcoempany/", "sources.local"]
    brand_hits = [b for b in banned if b.lower() in text.lower()]
    say("1  no person's name, out-of-scope brand or source path",
        not name_hits and not brand_hits,
        f"{len(name_hashes)} names + {len(banned)} strings against {len(words)} prose words"
        + (f"  HIT {name_hits}" if name_hits else "")
        + (f"  HIT {brand_hits}" if brand_hits else ""))

    # 1b — a hashed list catches a name it knows. It cannot catch a name that was
    #      invented, and one was: a surname with no source behind it sat on the
    #      Antaeus screen for a while. So every capitalised word the pages put in
    #      front of a reader is banked, and a new one fails until it is looked at.
    sys.path.insert(0, str(ROOT / "lib"))
    import capitalised
    known = set(json.loads((ROOT / "lib" / "lexicon.json").read_text())["words"])
    seen = capitalised.words(DIST)
    unknown = sorted(seen - known)
    say("1b no proper noun arrived unreviewed", not unknown,
        f"{len(seen)} capitalised words against a banked {len(known)}"
        + (f"  NEW {unknown[:5]}" if unknown else ""))


    # 2 — every asset is inlined; nothing reaches out to a file that is not here
    refs = re.findall(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']', text)
    refs += re.findall(r'url\(\s*["\']?([^"\')]+)', text)
    external = sorted({r for r in refs
                       if not r.startswith(("data:", "#", "mailto:", "https://fonts."))
                       and not (DIST / r.split("#")[0].split("?")[0].lstrip("/")).exists()})
    say("2  every asset inlined, no dangling reference", not external,
        f"{len(refs)} references" + (f"  DANGLING {external[:4]}" if external else ""))

    # 3 — dist/ holds only what the last build wrote. dist/ is the only thing
    #     published, so a file that outlives its build ships to real visitors.
    expected = {DIST / "index.html"} | {DIST / "work" / f"{s}.html" for s in cfg["order"]}
    strays = sorted(str(p.relative_to(DIST)) for p in files if p not in expected)
    say("3  dist/ holds only this build's output", not strays,
        f"{len(files)} files" + (f"  STRAY {strays[:4]}" if strays else ""))

    # 4 — no directive survived into the output
    left = sorted(set(re.findall(r"\{\{[^}\n]{1,60}\}\}", text)))
    say("4  no unresolved build directive", not left,
        "none left" if not left else f"LEFT {left[:4]}")

    kb = (DIST / "index.html").stat().st_size / 1024
    say("5  page weight within budget", kb <= PAGE_BUDGET_KB,
        f"{kb:.0f} KB of {PAGE_BUDGET_KB} KB")

    # 6 — the standalone work page and the page's embedded copy are the same
    #     document, so the tour and the page can never drift apart
    index = (DIST / "index.html").read_text(encoding="utf-8")
    import html as _html
    drift = []
    for slug in cfg["order"]:
        standalone = (DIST / "work" / f"{slug}.html").read_text(encoding="utf-8")
        if _html.escape(standalone, quote=True) not in index:
            drift.append(slug)
    say("6  embedded and standalone mockups are byte-identical", not drift,
        f"{len(cfg['order'])} mockups" + (f"  DRIFT {drift}" if drift else ""))


# ══ the page, driven ══════════════════════════════════════════════════════════

CLIP_JS = r"""
() => {
  // A run of text is sliced when its own box is only partly inside some
  // ancestor that hides overflow. Fully hidden is deliberate (a closed panel);
  // cut through is the defect.
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const s = n.nodeValue.trim();
    if (s.length < 2) continue;
    const el = n.parentElement;
    if (!el || getComputedStyle(el).visibility === "hidden") continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const b = r.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) continue;
    if (getComputedStyle(el).textOverflow === "ellipsis") continue;   // deliberate, and it says so
    let box = {l:b.left, t:b.top, r:b.right, b:b.bottom};
    let scrollable = false;
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/auto|scroll/.test(cs.overflowX + cs.overflowY) &&
          (a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1))
        scrollable = true;                                            // reachable, not cut
      if (cs.overflow === "visible" && cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const ar = a.getBoundingClientRect();
      box = {l:Math.max(box.l,ar.left), t:Math.max(box.t,ar.top),
             r:Math.min(box.r,ar.right), b:Math.min(box.b,ar.bottom)};
    }
    const vis = Math.max(0,box.r-box.l) * Math.max(0,box.b-box.t) / (b.width*b.height);
    if (!scrollable && vis > 0.02 && vis < 0.97)
      out.push({text:s.slice(0,44), vis:+vis.toFixed(2)});
  }
  return out;
}
"""

LEAK_JS = r"""
() => {
  // The page prints prose. A text node long enough to be a document, carrying
  // markup or CSS, means something was wired to the wrong key and the page is
  // printing source into its own body.
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentElement;
    if (p && (p.tagName === "SCRIPT" || p.tagName === "STYLE")) continue;  // their own source
    const t = n.nodeValue;
    if (t.length > 1200 && (t.includes("<") || t.includes("{") || t.includes("base64,")))
      out.push({len: t.length, head: t.trim().slice(0, 60),
                where: n.parentElement ? n.parentElement.className || n.parentElement.tagName : "?"});
  }
  return out;
}
"""

DEVICE_JS = r"""
() => document.querySelectorAll(".dev").length
"""


def run_page(cfg: dict) -> None:
    src = (DIST / "index.html").resolve().as_uri()
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=CHROMIUM)

        # ── desktop ───────────────────────────────────────────────────────────
        print("\nTHE PAGE AT 1440")
        ctx = br.new_context(viewport={"width": 1440, "height": 900})
        serve_fonts(ctx)
        pg = ctx.new_page()
        errs: list[str] = []
        pg.on("pageerror", lambda e: errs.append("pageerror " + str(e)[:120]))
        pg.on("console", lambda m: errs.append("console " + m.text[:120])
              if m.type == "error" else None)
        pg.goto(src)
        pg.wait_for_timeout(3200)

        say("7  no page or console error", not errs,
            "clean" if not errs else f"{len(errs)}: {sorted(set(errs))[:2]}")

        leaks = pg.evaluate(LEAK_JS)
        say("8  no source printed into the page body", not leaks,
            "body carries prose only" if not leaks
            else f"{len(leaks)} leak(s): {leaks[0]['len']} chars in .{leaks[0]['where']}")

        # every device shows its whole mockup, at the right scale
        devs = pg.evaluate(r"""() => [...document.querySelectorAll(".dev")].map(d => {
          const f = d.querySelector("iframe"), p = d.querySelector(".dev__port");
          const doc = f.contentDocument;
          return {
            crop: d.classList.contains("dev--crop"),
            frameH: parseFloat(getComputedStyle(d).getPropertyValue("--h")),
            docH: doc ? doc.documentElement.scrollHeight : 0,
            chars: doc ? (doc.body.innerText || "").trim().length : 0,
            boxes: doc ? doc.body.querySelectorAll("*").length : 0,
            portW: p.clientWidth,
            drawnW: f.getBoundingClientRect().width,
            title: f.getAttribute("title") || ""};
        })""")
        say("9  every frame carries a rendered document",
            len(devs) == 6 and all(d["chars"] > 200 and d["boxes"] > 20 and d["docH"] > 400
                                   for d in devs),
            f"{len(devs)} frames, " +
            ", ".join(f"{d['docH']}px/{d['boxes']}el/{d['chars']}ch" for d in devs))

        sliced = [d for d in devs if not d["crop"] and d["docH"] > d["frameH"] + 2]
        say("10 no mockup sliced by its frame", not sliced,
            f"{len(devs)-1} full frames + 1 deliberate crop"
            + (f"  SLICED {[(s['title'][:18], s['docH'], s['frameH']) for s in sliced]}"
               if sliced else ""))

        misfit = [d for d in devs if abs(d["drawnW"] - d["portW"]) > 1.5]
        say("11 every frame scaled to its column", not misfit,
            f"widest error {max(abs(d['drawnW']-d['portW']) for d in devs):.2f}px")

        clipped = pg.evaluate(CLIP_JS)
        say("12 no sliced or overprinted type", not clipped,
            "every run whole" if not clipped
            else f"{len(clipped)}: {clipped[:2]}")

        # one dominant move per surface
        moves = pg.evaluate(r"""() => {
          // A dominant move is one that is filled. Outlined and text actions
          // are secondary by construction, so counting fills counts primaries
          // without depending on which class name was typed.
          const filled = el => {
            const bg = getComputedStyle(el).backgroundColor;
            const m = bg.match(/[\d.]+/g);
            return !!m && (m.length < 4 || parseFloat(m[3]) > 0.5);
          };
          const zones = {hero:".hero", buybar:"#buybar", form:"#send"};
          const out = {};
          for (const k in zones){
            const z = document.querySelector(zones[k]);
            out[k] = z ? [...z.querySelectorAll("a.btn, button")].filter(filled).length : -1;
          }
          return out;}""")
        say("13 one dominant move per surface",
            all(v == 1 for v in moves.values()),
            ", ".join(f"{k} {v}" for k, v in moves.items()))

        # the chrome arrives and leaves where it should
        pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(500)
        top = pg.evaluate("""() => ({nav: localnav.classList.contains("is-on"),
                                     buy: buybar.classList.contains("is-on")})""")
        pg.evaluate("scrollTo(0, 2400)"); pg.wait_for_timeout(600)
        mid = pg.evaluate("""() => ({nav: localnav.classList.contains("is-on"),
                                     buy: buybar.classList.contains("is-on")})""")
        pg.evaluate("document.getElementById('send').scrollIntoView()"); pg.wait_for_timeout(600)
        end = pg.evaluate("""() => ({nav: localnav.classList.contains("is-on"),
                                     buy: buybar.classList.contains("is-on")})""")
        say("14 local nav and buy bar arrive and leave on cue",
            not top["nav"] and not top["buy"] and mid["nav"] and mid["buy"] and not end["buy"],
            f"top {top}  middle {mid}  at the form {end}")

        # every in-page link resolves
        dead = pg.evaluate(r"""() => [...document.querySelectorAll('a[href^="#"]')]
            .map(a => a.getAttribute("href"))
            .filter(h => h.length > 1 && !document.querySelector(h))""")
        say("15 every in-page link resolves", not dead,
            "all anchors found" if not dead else f"DEAD {dead}")

        # images carry alt text or are explicitly decorative
        bad_alt = pg.evaluate(r"""() => {
          const bad = [];
          for (const f of document.querySelectorAll("iframe")){
            const d = f.contentDocument; if (!d) continue;
            for (const i of d.querySelectorAll("img"))
              if (!i.hasAttribute("alt") && i.getAttribute("aria-hidden") !== "true")
                bad.push((i.getAttribute("src")||"").slice(0,24));
          }
          for (const i of document.querySelectorAll("img"))
            if (!i.hasAttribute("alt")) bad.push("page img");
          return bad;}""")
        say("16 every image has alt text or is marked decorative", not bad_alt,
            "checked page and all five mockups"
            + (f"  {len(bad_alt)} without" if bad_alt else ""))
        pg.close(); ctx.close()

        # ── phone ─────────────────────────────────────────────────────────────
        print("\nTHE PAGE AT 390")
        ctx = br.new_context(viewport={"width": 390, "height": 844})
        serve_fonts(ctx)
        pg = ctx.new_page()
        perr: list[str] = []
        pg.on("pageerror", lambda e: perr.append(str(e)[:100]))
        pg.goto(src); pg.wait_for_timeout(3000)

        over = pg.evaluate(r"""() => {
          const w = document.documentElement.clientWidth, out = [];
          for (const el of document.body.querySelectorAll("*")){
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > w + 1 && !el.closest(".rail"))
              out.push((el.className||el.tagName).toString().slice(0,26) +
                       " +" + Math.round(r.right - w));
          }
          return [...new Set(out)];}""")
        say("17 nothing overflows the phone width", not over,
            f"document {pg.evaluate('document.documentElement.scrollWidth')}px in 390px"
            + (f"  OVER {over[:3]}" if over else ""))

        pmis = pg.evaluate(r"""() => [...document.querySelectorAll(".dev")].map(d => {
            const f = d.querySelector("iframe"), p = d.querySelector(".dev__port");
            return Math.abs(f.getBoundingClientRect().width - p.clientWidth);})""")
        say("18 frames still fit their column on a phone", max(pmis) <= 1.5,
            f"widest error {max(pmis):.2f}px")

        pclip = pg.evaluate(CLIP_JS)
        say("19 no sliced type on a phone", not pclip,
            "every run whole" if not pclip else f"{len(pclip)}: {pclip[:2]}")
        say("20 no page error on a phone", not perr,
            "clean" if not perr else str(perr[:1]))
        pg.close(); ctx.close()

        # ── reduced motion ────────────────────────────────────────────────────
        print("\nWITH MOTION REDUCED")
        ctx = br.new_context(viewport={"width": 1440, "height": 900},
                             reduced_motion="reduce")
        serve_fonts(ctx)
        pg = ctx.new_page(); pg.goto(src); pg.wait_for_timeout(2600)
        rm = pg.evaluate(r"""() => {
          const hidden = [...document.querySelectorAll(".rv")]
            .filter(e => !e.classList.contains("in")).length;
          let moving = 0;
          const seen = new Set([document]);
          for (const f of document.querySelectorAll("iframe"))
            if (f.contentDocument) seen.add(f.contentDocument);
          for (const d of seen)
            for (const e of d.querySelectorAll("*"))
              if (getComputedStyle(e).animationName !== "none" &&
                  getComputedStyle(e).animationPlayState === "running") moving++;
          return {hidden, moving};}""")
        say("21 nothing stays hidden when reveals are off", rm["hidden"] == 0,
            f"{rm['hidden']} element(s) still unrevealed")
        say("22 no animation runs when motion is reduced", rm["moving"] == 0,
            f"{rm['moving']} running animation(s) across the page and all five mockups")
        pg.close(); ctx.close()
        br.close()


def main() -> None:
    if not (DIST / "index.html").exists():
        sys.exit("accept.py: no dist/index.html — run build.py first")
    cfg = json.loads((ROOT / "config.json").read_text())
    static_checks(cfg)
    run_page(cfg)
    bad = [n for ok, n, _ in results if not ok]
    print(f"\n{len(results) - len(bad)}/{len(results)} passed")
    if bad:
        print("failed: " + "; ".join(bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
