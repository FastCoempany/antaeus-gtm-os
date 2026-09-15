#!/usr/bin/env python3
"""Assemble dist/ from partials, tokens, frames and variant skeletons.

Standard library only. Reads config.json. Never reads sources.local.json.

Directives understood inside variants/*.html and partials/*.html:

  <!-- @include partials/NAME.html -->   inline a partial (directives inside it are expanded too)
  <!-- @tokens -->                       inline every token file in one <style> block
  <!-- @materials -->                    inline every material recipe in one <style> block
  <!-- @frame N -->                     inline frame number N (markup, scoped CSS, scoped JS)
  <!-- @each-frame from=A to=B -->
     ... template using ${FRAME_*} placeholders ...
  <!-- @end-each -->                     repeat the template for frames A..B in gallery order

Global placeholders, substituted after assembly. Only these exact keys are
touched, so JavaScript template literals inside frames survive untouched:

  ${PRICE} ${TURNAROUND} ${CONTACT_EMAIL} ${SLOGAN} ${PAY_HREF} ${CHROME_FONT}

Per-frame placeholders (valid inside an @each-frame block):

  ${FRAME_HTML}          the frame's full markup
  ${FRAME_ID}            e.g. fork-rail
  ${FRAME_NUM}           e.g. 1        ${FRAME_NUM2}  e.g. 01
  ${FRAME_CAPTION}       locked caption (brief 8.3)
  ${FRAME_SOURCE}        source key (puff-junction, darkest-shades, digs, aesdr, antaeus)
  ${FRAME_SOURCE_LABEL}  plain-text source label (brief 8.8), may be empty
  ${FRAME_SOURCE_HTML}   the label as HTML, linked when config allows, may be empty
  ${FRAME_LOOP}          loop seconds       ${FRAME_INTERACTIVE}  yes|no
  ${FRAME_FOCAL_X}       0..1               ${FRAME_FOCAL_Y}      0..1

Every frame file opens with a header comment build.py parses:

  <!-- frame id=knurl-wall num=1 source=puff-junction focal=50%,50% loop=9 interactive=no -->

Outputs:
  dist/variant-<name>.html        one file per variants/<name>.html
  dist/frames/index.html         contact sheet, all frames with id and source
  dist/frames/tNN-<id>.html      one frame per page, for stills

Token files are inlined without their comments: the provenance marks and the
header's file lists stay in tokens/ and SOURCES.md and never reach dist/.

Modes: the default build tolerates a partial frame set (phases 2 to 4);
BUILD_STRICT=1 requires all twelve and is the phase-5 gate.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# The default build tolerates frames that are still being written (a malformed
# header, gaps in the 1..12 numbering): they are skipped with a warning so the
# documented command keeps working through phases 2 to 4. BUILD_STRICT=1 is the
# phase-5 gate: every frame must parse and the set must be exactly 1..12.
# (BUILD_LENIENT=1 is accepted as an alias of the default for older notes.)
STRICT = os.environ.get("BUILD_STRICT") == "1"
LENIENT = not STRICT
FRAME_COUNT = 12

ROOT = Path(__file__).resolve().parent
TOKENS_DIR = ROOT / "tokens"
FRAMES_DIR = ROOT / "frames"
MATERIALS_DIR = ROOT / "materials"
PARTIALS_DIR = ROOT / "partials"
VARIANTS_DIR = ROOT / "variants"
DIST = ROOT / "dist"

# Token files are inlined in this order: the chrome, the shared stage, then one
# per source. A frame reads only its own source's tokens and the stage.
TOKEN_ORDER = [
    "chrome.css",
    "stage.css",
    "puff-junction.css",
    "darkest-shades.css",
    "digs.css",
    "aesdr.css",
    "antaeus.css",
]

# Locked copy, brief 8.3. Teasers never carry their caption; the variant
# template sets it in the chrome face.
CAPTIONS = {
    "knurl-wall": "Brass, at four hundred percent.",
    "ground-line": "A mark that stands on a line.",
    "blackout": "A lens you cannot see through.",
    "iris-seam": "One line, seven colours.",
    "waffle": "A knit, and the seam through it.",
    "harlequin": "A pattern eating a wall.",
    "prismatic": "A logo, cast as a shadow.",
    "tech-pack": "A drawing that calls itself out.",
    "tortoise": "Acetate, lit from behind.",
    "margin": "A page marking itself up.",
    "reconciliation": "Monochrome, and one green thing.",
    "live-edge": "A wire switching off.",
}

# Locked source labels, brief 8.8. (label, link-key-in-config, brand-name-or-None)
SOURCES = {
    "antaeus": ("Antaeus GTM OS", "antaeus", None),
    "aesdr": ("AESDR", "aesdr", None),
    "puff-junction": ("PUFF JUNCTION", None, "PUFF JUNCTION"),
    "darkest-shades": ("DARKEST SHADES", None, "DARKEST SHADES"),
    "digs": ("DIGS", None, "DIGS"),
}

HEADER_RE = re.compile(
    r"<!--\s*frame\s+id=(?P<id>[\w-]+)\s+num=(?P<num>\d+)\s+source=(?P<source>[\w-]+)"
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
    for name in TOKEN_ORDER:
        path = TOKENS_DIR / name
        if path.exists():
            parts.append(f"/* tokens/{name} */\n" + strip_provenance(path.read_text(encoding="utf-8")))
    return "\n\n".join(parts)


def load_materials() -> str:
    """Inline every material recipe (brief 4.4).

    A material is a reusable recipe for a real surface, measured from a source
    file. Frames compose materials; frames do not re-derive them. The header
    comment in each recipe records what it was measured from and what the
    recreation does not do -- that stays in materials/ and SOURCES.md and never
    reaches dist/.
    """
    parts = []
    for path in sorted(MATERIALS_DIR.glob("*.css")):
        parts.append(f"/* materials/{path.name} */\n" + strip_provenance(path.read_text(encoding="utf-8")))
    if not parts:
        return ""
    return "\n\n".join(parts)


def load_frames() -> list[dict]:
    frames = []
    for path in sorted(FRAMES_DIR.glob("t*.html")):
        text = path.read_text(encoding="utf-8")
        m = HEADER_RE.search(text)
        problem = None
        if not m:
            problem = "missing or malformed header comment"
        elif m.group("id") not in CAPTIONS:
            problem = f"unknown frame id {m.group('id')!r}"
        elif m.group("source") not in SOURCES:
            problem = f"unknown source {m.group('source')!r}"
        if problem:
            if LENIENT:
                print(f"build.py: skipping {path.name}: {problem}", file=sys.stderr)
                continue
            die(f"{path.name}: {problem}")
        tid = m.group("id")
        source = m.group("source")
        frames.append(
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
    frames.sort(key=lambda t: t["num"])
    nums = [t["num"] for t in frames]
    if len(nums) != len(set(nums)):
        die(f"two frames share a number: {nums}")
    if nums != list(range(1, FRAME_COUNT + 1)):
        if LENIENT:
            print(f"build.py: frames present so far: {nums}", file=sys.stderr)
        else:
            die(f"frame numbering is not 1..{FRAME_COUNT}: {nums}")
    return frames


def source_label(source: str, cfg: dict) -> tuple[str, str]:
    """Return (plain text, html) for a source label per brief 8.8."""
    label, link_key, brand_fallback = SOURCES[source]
    if not cfg.get("show_source_names", True):
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


def frame_vars(t: dict, cfg: dict) -> dict:
    plain, html = source_label(t["source"], cfg)
    return {
        "FRAME_HTML": t["html"],
        "FRAME_ID": t["id"],
        "FRAME_NUM": str(t["num"]),
        "FRAME_NUM2": f"{t['num']:02d}",
        "FRAME_CAPTION": CAPTIONS[t["id"]],
        "FRAME_SOURCE": t["source"],
        "FRAME_SOURCE_LABEL": plain,
        "FRAME_SOURCE_HTML": html,
        "FRAME_LOOP": t["loop"],
        "FRAME_INTERACTIVE": t["interactive"],
        "FRAME_FOCAL_X": f"{t['fx']:.3f}".rstrip("0").rstrip("."),
        "FRAME_FOCAL_Y": f"{t['fy']:.3f}".rstrip("0").rstrip("."),
    }


def substitute(text: str, values: dict) -> str:
    for key, val in values.items():
        text = text.replace("${" + key + "}", val)
    return text


INCLUDE_RE = re.compile(r"<!--\s*@include\s+([\w./-]+)\s*-->")
TOKENS_RE = re.compile(r"<!--\s*@tokens\s*-->")
MATERIALS_RE = re.compile(r"<!--\s*@materials\s*-->")
TEASER_RE = re.compile(r"<!--\s*@frame\s+(\d+)\s*-->")
EACH_RE = re.compile(
    r"<!--\s*@each-frame\s+from=(\d+)\s+to=(\d+)\s*-->(.*?)<!--\s*@end-each\s*-->", re.S
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
    text = MATERIALS_RE.sub(lambda m: "<style>\n" + ctx["materials"] + "\n</style>", text)

    by_num = {t["num"]: t for t in ctx["frames"]}

    def one(m: re.Match) -> str:
        n = int(m.group(1))
        if n not in by_num:
            print(f"build.py: warning: frame {n} not built yet", file=sys.stderr)
            return f"<!-- frame {n} not built yet -->"
        return by_num[n]["html"]

    text = TEASER_RE.sub(one, text)

    def each(m: re.Match) -> str:
        a, b, tpl = int(m.group(1)), int(m.group(2)), m.group(3)
        out = []
        for n in range(a, b + 1):
            if n not in by_num:
                continue
            out.append(substitute(tpl, frame_vars(by_num[n], ctx["cfg"])))
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
    for t in ctx["frames"]:
        v = frame_vars(t, ctx["cfg"])
        label = v["FRAME_SOURCE_LABEL"] or SOURCES[t["source"]][0]
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
        "<title>shapshyftrs frames</title>\n<style>\n" + ctx["tokens"] + "\n</style>\n"
        "<style>" + SHEET_CSS + "</style>\n</head>\n<body class=\"sheet\">\n"
        "<h1>shapshyftrs frames</h1>\n<p>All twelve frames, gallery order, for review.</p>\n"
        "<div class=\"sheet-grid\">\n" + "\n".join(items) + "\n</div>\n" + runtime +
        "\n</body>\n</html>\n"
    )
    out = DIST / "frames" / "index.html"
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
    for t in ctx["frames"]:
        html = (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n" + head +
            f"<title>{escape(t['id'])}</title>\n<style>\n" + ctx["tokens"] + "\n</style>\n"
            "<style>" + SINGLE_CSS + "</style>\n</head>\n<body>\n"
            f"<div class=\"single\">{t['html']}</div>\n" + runtime + "\n</body>\n</html>\n"
        )
        out = DIST / "frames" / f"t{t['num']:02d}-{t['id']}.html"
        out.write_text(html, encoding="utf-8")
        written.append(out)
    return written


def main() -> None:
    cfg = load_config()
    ctx = {
        "cfg": cfg,
        "tokens": load_tokens(),
        "materials": load_materials(),
        "frames": load_frames(),
    }
    DIST.mkdir(exist_ok=True)
    (DIST / "frames").mkdir(exist_ok=True)
    for stale in (DIST / "frames").glob("*.html"):
        stale.unlink()
    outs = build_variants(ctx)
    outs.append(build_contact_sheet(ctx))
    outs.extend(build_single_pages(ctx))
    for o in outs:
        size = o.stat().st_size
        print(f"wrote {o.relative_to(ROOT)}  {size/1024:.1f} KB")
    print(f"frames: {len(ctx['frames'])}  variants: {len(list(VARIANTS_DIR.glob('*.html')))}")


if __name__ == "__main__":
    main()
