#!/usr/bin/env python3
"""Assemble dist/ from partials, tokens, teasers and variant skeletons.

Standard library only. Reads config.json. Never reads sources.local.json.

Directives understood inside variants/*.html and partials/*.html:

  <!-- @include partials/NAME.html -->   inline a partial (directives inside it are expanded too)
  <!-- @tokens -->                       inline every token file in one <style> block
  <!-- @teaser N -->                     inline teaser number N (markup, scoped CSS, scoped JS)
  <!-- @each-teaser from=A to=B -->
     ... template using ${TEASER_*} placeholders ...
  <!-- @end-each -->                     repeat the template for teasers A..B in gallery order

Global placeholders, substituted after assembly. Only these exact keys are
touched, so JavaScript template literals inside teasers survive untouched:

  ${PRICE} ${TURNAROUND} ${CONTACT_EMAIL} ${SLOGAN} ${PAY_HREF} ${CHROME_FONT}

Per-teaser placeholders (valid inside an @each-teaser block):

  ${TEASER_HTML}          the teaser's full markup
  ${TEASER_ID}            e.g. fork-rail
  ${TEASER_NUM}           e.g. 1        ${TEASER_NUM2}  e.g. 01
  ${TEASER_CAPTION}       locked caption (brief 8.3)
  ${TEASER_SOURCE}        source key (gtmos, aesdr, cockpit, nrdi-darkest-shades, ...)
  ${TEASER_SOURCE_LABEL}  plain-text source label (brief 8.8), may be empty
  ${TEASER_SOURCE_HTML}   the label as HTML, linked when config allows, may be empty
  ${TEASER_LOOP}          loop seconds       ${TEASER_INTERACTIVE}  yes|no
  ${TEASER_FOCAL_X}       0..1               ${TEASER_FOCAL_Y}      0..1

Every teaser file opens with a header comment build.py parses:

  <!-- teaser id=fork-rail num=1 source=gtmos focal=50%,48% loop=8 interactive=no -->

Outputs:
  dist/variant-<name>.html        one file per variants/<name>.html
  dist/teasers/index.html         contact sheet, all teasers with id and source
  dist/teasers/tNN-<id>.html      one teaser per page, for stills

Token files are inlined without their comments: the provenance marks and the
header's file lists stay in tokens/ and SOURCES.md and never reach dist/.

Modes: the default build tolerates a partial teaser set (phases 2 to 4);
BUILD_STRICT=1 requires all thirteen and is the phase-5 gate.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# The default build tolerates teasers that are still being written (a malformed
# header, gaps in the 1..13 numbering): they are skipped with a warning so the
# documented command keeps working through phases 2 to 4. BUILD_STRICT=1 is the
# phase-5 gate: every teaser must parse and the set must be exactly 1..13.
# (BUILD_LENIENT=1 is accepted as an alias of the default for older notes.)
STRICT = os.environ.get("BUILD_STRICT") == "1"
LENIENT = not STRICT
TEASER_COUNT = 13

ROOT = Path(__file__).resolve().parent
TOKENS_DIR = ROOT / "tokens"
TEASERS_DIR = ROOT / "teasers"
PARTIALS_DIR = ROOT / "partials"
VARIANTS_DIR = ROOT / "variants"
DIST = ROOT / "dist"

# Token files are inlined in this order. nrdi.css wins over nrdi.provisional.css
# when both exist, so real tokens drop in without touching a teaser.
TOKEN_ORDER = ["chrome.css", "stage.css", "gtmos.css", "aesdr.css", "cockpit.css"]
NRDI_CANDIDATES = ["nrdi.css", "nrdi.provisional.css"]

# Locked copy, brief 8.3. Teasers never carry their caption; the variant
# template sets it in the chrome face.
CAPTIONS = {
    "fork-rail": "A call that branches.",
    "lesson-card": "A lesson, typeset.",
    "frames": "Nine frames.",
    "heat-dial": "Lead heat on one dial.",
    "signal-strip": "A signal, scored in seven phases.",
    "coach-exchange": "A coach that answers back.",
    "turntable": "An accessory, turning.",
    "territory-map": "A city, cut into territories.",
    "territory-tiles": "Territory, in tiles.",
    "course-arc": "Seven courses, in order.",
    "garment-tag": "A label, a tag.",
    "task-tiers": "Tasks in three tiers.",
    "constellation": "Nineteen modules, one system.",
}

# Locked source labels, brief 8.8. (label, link-key-in-config, brand-name-or-None)
SOURCES = {
    "gtmos": ("GTM OS, antaeus.app", "gtmos", None),
    "aesdr": ("AESDR, aesdr.com", "aesdr", None),
    "cockpit": ("an internal sales cockpit", None, None),
    "nrdi-darkest-shades": ("NRDI, DARKEST SHADES", None, "NRDI"),
    "nrdi-puff-junction": ("NRDI, PUFF JUNCTION", None, "NRDI"),
    "nrdi-digs": ("NRDI, DIGS", None, "NRDI"),
}

HEADER_RE = re.compile(
    r"<!--\s*teaser\s+id=(?P<id>[\w-]+)\s+num=(?P<num>\d+)\s+source=(?P<source>[\w-]+)"
    r"\s+focal=(?P<fx>[\d.]+)%\s*,\s*(?P<fy>[\d.]+)%\s+loop=(?P<loop>[\d.]+)"
    r"\s+interactive=(?P<interactive>yes|no)\s*-->",
    re.IGNORECASE,
)


def die(msg: str) -> None:
    print(f"build.py: {msg}", file=sys.stderr)
    sys.exit(1)


def load_config() -> dict:
    return json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


CSS_COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)


def strip_provenance(css: str) -> str:
    """Drop every comment from a token file before it is inlined.

    The token files carry their provenance as comments (the header's list of
    files read, the per-line from-source / pinned / derived marks). That record
    belongs to the repo and to SOURCES.md, never to dist/, so nothing a token
    file cites can reach a shipped page. Only the declarations survive.
    """
    css = CSS_COMMENT_RE.sub("", css)
    lines = [ln.rstrip() for ln in css.splitlines()]
    out: list[str] = []
    for ln in lines:
        if ln.strip() == "":
            if out and out[-1] == "":
                continue
            out.append("")
        else:
            out.append(ln)
    return "\n".join(out).strip()


def load_tokens() -> str:
    parts = []
    names = list(TOKEN_ORDER)
    for cand in NRDI_CANDIDATES:
        if (TOKENS_DIR / cand).exists():
            names.append(cand)
            break
    for name in names:
        path = TOKENS_DIR / name
        if path.exists():
            parts.append(f"/* tokens/{name} */\n" + strip_provenance(path.read_text(encoding="utf-8")))
    return "\n\n".join(parts)


def load_teasers() -> list[dict]:
    teasers = []
    for path in sorted(TEASERS_DIR.glob("t*.html")):
        text = path.read_text(encoding="utf-8")
        m = HEADER_RE.search(text)
        problem = None
        if not m:
            problem = "missing or malformed header comment"
        elif m.group("id") not in CAPTIONS:
            problem = f"unknown teaser id {m.group('id')!r}"
        elif m.group("source") not in SOURCES:
            problem = f"unknown source {m.group('source')!r}"
        if problem:
            if LENIENT:
                print(f"build.py: skipping {path.name}: {problem}", file=sys.stderr)
                continue
            die(f"{path.name}: {problem}")
        tid = m.group("id")
        source = m.group("source")
        teasers.append(
            {
                "path": path,
                "html": text,
                "id": tid,
                "num": int(m.group("num")),
                "source": source,
                "fx": float(m.group("fx")) / 100.0,
                "fy": float(m.group("fy")) / 100.0,
                "loop": m.group("loop"),
                "interactive": m.group("interactive").lower(),
            }
        )
    teasers.sort(key=lambda t: t["num"])
    nums = [t["num"] for t in teasers]
    if len(nums) != len(set(nums)):
        die(f"two teasers share a number: {nums}")
    if nums != list(range(1, TEASER_COUNT + 1)):
        if LENIENT:
            print(f"build.py: teasers present so far: {nums}", file=sys.stderr)
        else:
            die(f"teaser numbering is not 1..{TEASER_COUNT}: {nums}")
    return teasers


def source_label(source: str, cfg: dict) -> tuple[str, str]:
    """Return (plain text, html) for a source label per brief 8.8."""
    label, link_key, brand_fallback = SOURCES[source]
    if source != "cockpit" and not cfg.get("show_source_names", True):
        return "", ""
    if brand_fallback and not cfg.get("show_brand_names", True):
        label = brand_fallback
    href = ""
    if link_key:
        href = (cfg.get("source_links") or {}).get(link_key) or ""
    if href:
        html = f'<a class="source-link" href="{escape(href)}" rel="noopener">{escape(label)}</a>'
    else:
        html = escape(label)
    return label, html


def escape(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )


def teaser_vars(t: dict, cfg: dict) -> dict:
    plain, html = source_label(t["source"], cfg)
    return {
        "TEASER_HTML": t["html"],
        "TEASER_ID": t["id"],
        "TEASER_NUM": str(t["num"]),
        "TEASER_NUM2": f"{t['num']:02d}",
        "TEASER_CAPTION": CAPTIONS[t["id"]],
        "TEASER_SOURCE": t["source"],
        "TEASER_SOURCE_LABEL": plain,
        "TEASER_SOURCE_HTML": html,
        "TEASER_LOOP": t["loop"],
        "TEASER_INTERACTIVE": t["interactive"],
        "TEASER_FOCAL_X": f"{t['fx']:.3f}".rstrip("0").rstrip("."),
        "TEASER_FOCAL_Y": f"{t['fy']:.3f}".rstrip("0").rstrip("."),
    }


def substitute(text: str, values: dict) -> str:
    for key, val in values.items():
        text = text.replace("${" + key + "}", val)
    return text


INCLUDE_RE = re.compile(r"<!--\s*@include\s+([\w./-]+)\s*-->")
TOKENS_RE = re.compile(r"<!--\s*@tokens\s*-->")
TEASER_RE = re.compile(r"<!--\s*@teaser\s+(\d+)\s*-->")
EACH_RE = re.compile(
    r"<!--\s*@each-teaser\s+from=(\d+)\s+to=(\d+)\s*-->(.*?)<!--\s*@end-each\s*-->", re.S
)


def expand(text: str, ctx: dict, depth: int = 0) -> str:
    if depth > 12:
        die("include recursion too deep")

    def inc(m: re.Match) -> str:
        p = ROOT / m.group(1)
        if not p.exists():
            die(f"include not found: {m.group(1)}")
        return expand(p.read_text(encoding="utf-8"), ctx, depth + 1)

    text = INCLUDE_RE.sub(inc, text)
    text = TOKENS_RE.sub(lambda m: "<style>\n" + ctx["tokens"] + "\n</style>", text)

    by_num = {t["num"]: t for t in ctx["teasers"]}

    def one(m: re.Match) -> str:
        n = int(m.group(1))
        if n not in by_num:
            print(f"build.py: warning: teaser {n} not built yet", file=sys.stderr)
            return f"<!-- teaser {n} not built yet -->"
        return by_num[n]["html"]

    text = TEASER_RE.sub(one, text)

    def each(m: re.Match) -> str:
        a, b, tpl = int(m.group(1)), int(m.group(2)), m.group(3)
        out = []
        for n in range(a, b + 1):
            if n not in by_num:
                continue
            out.append(substitute(tpl, teaser_vars(by_num[n], ctx["cfg"])))
        return "".join(out)

    text = EACH_RE.sub(each, text)
    return text


def global_vars(cfg: dict) -> dict:
    return {
        "PRICE": cfg["price"],
        "TURNAROUND": cfg["turnaround"],
        "CONTACT_EMAIL": cfg["contact_email"],
        "SLOGAN": cfg.get("slogan") or "See it before you build it.",
        "PAY_HREF": cfg.get("stripe_url") or "#",
        "CHROME_FONT": cfg.get("chrome_font") or "Schibsted Grotesk",
    }


def build_variants(ctx: dict) -> list[Path]:
    written = []
    for skel in sorted(VARIANTS_DIR.glob("*.html")):
        html = expand(skel.read_text(encoding="utf-8"), ctx)
        html = substitute(html, global_vars(ctx["cfg"]))
        out = DIST / f"variant-{skel.stem}.html"
        out.write_text(html, encoding="utf-8")
        written.append(out)
    return written


SHEET_CSS = """
html,body{margin:0;background:#000;color:#F4F4F0;font-family:"Schibsted Grotesk",system-ui,sans-serif}
.sheet{padding:48px 32px 96px}
.sheet h1{font-size:28px;font-weight:700;margin:0 0 8px}
.sheet p{margin:0 0 40px;color:#8E8E89;font-size:15px;line-height:24px}
.sheet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(640px,1fr));gap:40px 24px}
.sheet-item{margin:0}
.sheet-frame{width:100%}
.sheet-item figcaption{margin-top:10px;font-size:14px;line-height:20px;color:#8E8E89}
.sheet-item figcaption b{color:#F4F4F0;font-weight:600}
"""


def build_contact_sheet(ctx: dict) -> Path:
    head = expand((PARTIALS_DIR / "head.html").read_text(encoding="utf-8"), ctx)
    items = []
    for t in ctx["teasers"]:
        v = teaser_vars(t, ctx["cfg"])
        label = v["TEASER_SOURCE_LABEL"] or SOURCES[t["source"]][0]
        items.append(
            "<figure class=\"sheet-item\">"
            f"<div class=\"sheet-frame\">{t['html']}</div>"
            f"<figcaption><b>{v['TEASER_NUM2']} {escape(t['id'])}</b>, {escape(label)}. "
            f"{escape(v['TEASER_CAPTION'])} Loop {escape(v['TEASER_LOOP'])}s, "
            f"interactive {v['TEASER_INTERACTIVE']}.</figcaption></figure>"
        )
    runtime = expand((PARTIALS_DIR / "runtime.html").read_text(encoding="utf-8"), ctx)
    html = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n" + head +
        "<title>shapshyftrs teasers</title>\n<style>\n" + ctx["tokens"] + "\n</style>\n"
        "<style>" + SHEET_CSS + "</style>\n</head>\n<body class=\"sheet\">\n"
        "<h1>shapshyftrs teasers</h1>\n<p>All thirteen teasers, gallery order, for review.</p>\n"
        "<div class=\"sheet-grid\">\n" + "\n".join(items) + "\n</div>\n" + runtime +
        "\n</body>\n</html>\n"
    )
    out = DIST / "teasers" / "index.html"
    out.write_text(html, encoding="utf-8")
    return out


SINGLE_CSS = """
html,body{margin:0;background:#000}
.single{width:min(100vw,1600px);margin:0 auto}
"""


def build_single_pages(ctx: dict) -> list[Path]:
    head = expand((PARTIALS_DIR / "head.html").read_text(encoding="utf-8"), ctx)
    runtime = expand((PARTIALS_DIR / "runtime.html").read_text(encoding="utf-8"), ctx)
    written = []
    for t in ctx["teasers"]:
        html = (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n" + head +
            f"<title>{escape(t['id'])}</title>\n<style>\n" + ctx["tokens"] + "\n</style>\n"
            "<style>" + SINGLE_CSS + "</style>\n</head>\n<body>\n"
            f"<div class=\"single\">{t['html']}</div>\n" + runtime + "\n</body>\n</html>\n"
        )
        out = DIST / "teasers" / f"t{t['num']:02d}-{t['id']}.html"
        out.write_text(html, encoding="utf-8")
        written.append(out)
    return written


def main() -> None:
    cfg = load_config()
    ctx = {"cfg": cfg, "tokens": load_tokens(), "teasers": load_teasers()}
    DIST.mkdir(exist_ok=True)
    (DIST / "teasers").mkdir(exist_ok=True)
    for stale in (DIST / "teasers").glob("*.html"):
        stale.unlink()
    outs = build_variants(ctx)
    outs.append(build_contact_sheet(ctx))
    outs.extend(build_single_pages(ctx))
    for o in outs:
        size = o.stat().st_size
        print(f"wrote {o.relative_to(ROOT)}  {size/1024:.1f} KB")
    print(f"teasers: {len(ctx['teasers'])}  variants: {len(list(VARIANTS_DIR.glob('*.html')))}")


if __name__ == "__main__":
    main()
