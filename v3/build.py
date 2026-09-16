#!/usr/bin/env python3
"""Build the shapshyftrs page.

    python3 build.py

Two kinds of source:
  page.html      the marketing page. Its form is the flagship product-page
                 scroll; its content is the work.
  mockups/*.html one complete, standalone document per piece of work. Each is
                 a real deliverable -- the thing a client receives for $75 --
                 and the page shows them by embedding the same bytes.

Assets are inlined as data URIs so every output is one self-contained file:
dist/work/<name>.html stands alone, and dist/index.html carries all five
inside srcdoc iframes, which also means each mockup keeps its own CSS and
cannot leak a style into the page or into a sibling.

Directives, in both page.html and any mockup:
  {{ASSET:name.jpg}}   -> data URI for assets/name.jpg
  {{SVG:name.svg}}     -> the file's <svg> element, inlined
  {{MOCKUP:slug}}      -> the built mockup as an escaped srcdoc value
  {{MOCKUP_META:slug.field}} -> a field from the mockup's header comment
  {{PRICE}} {{DAYS}} {{EMAIL}} {{SLOGAN}}  -> config.json
"""
from __future__ import annotations

import base64, html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
MOCKUPS = ROOT / "mockups"
ASSETS = ROOT / "assets"

MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".svg": "image/svg+xml"}


def die(msg: str) -> None:
    sys.exit(f"build.py: {msg}")


def asset_uri(name: str) -> str:
    p = ASSETS / name
    if not p.exists():
        die(f"no such asset: {name}")
    mime = MIME.get(p.suffix.lower()) or die(f"unknown asset type: {name}")
    return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"


def inline_svg(name: str) -> str:
    """Return the <svg> element only, so it inherits currentColor and can be
    sized by CSS. The real marks are carried as their own paths, which is what
    BRIEF 4.2 permits and what re-typesetting a wordmark never achieves."""
    p = ASSETS / name
    if not p.exists():
        die(f"no such svg: {name}")
    m = re.search(r"<svg\b.*?</svg>", p.read_text(), re.S)
    return m.group(0) if m else die(f"no <svg> element in {name}")


HEADER = re.compile(r"<!--\s*mockup\s+(.*?)-->", re.S)


def read_mockup(path: Path) -> dict:
    src = path.read_text(encoding="utf-8")
    m = HEADER.search(src)
    if not m:
        die(f"{path.name}: needs a header comment `<!-- mockup slug=... -->`")
    meta = {k: " ".join(v.split())
            for k, v in re.findall(r'(\w+)\s*=\s*"([^"]*)"', m.group(1), re.S)}
    for k in ("slug", "brand", "kind", "title"):
        if k not in meta:
            die(f"{path.name}: header is missing {k}=")
    meta["html"] = src
    meta["path"] = path
    return meta


def substitute(text: str, cfg: dict, mockups: dict | None = None) -> str:
    text = re.sub(r"\{\{ASSET:([^}]+)\}\}", lambda m: asset_uri(m.group(1).strip()), text)
    text = re.sub(r"\{\{SVG:([^}]+)\}\}", lambda m: inline_svg(m.group(1).strip()), text)
    for key, val in cfg.items():
        text = text.replace("{{" + key.upper() + "}}", str(val))
    if mockups is not None:
        def meta(m):
            slug, field = m.group(1).split(".", 1)
            if slug not in mockups:
                die(f"no such mockup: {slug}")
            if field.startswith("_"):
                die(f"{{{{MOCKUP_META:{slug}.{field}}}}} is internal, not a header field")
            if field not in mockups[slug]:
                die(f"mockup {slug} has no header field {field!r}; "
                    f"it has {sorted(k for k in mockups[slug] if not k.startswith('_') and k != 'html')}")
            val = str(mockups[slug][field])
            # a meta field labels the mockup. It is never a document: if one is
            # ever long enough to be one, something has been wired to the wrong
            # key and the page would silently print source into its own body.
            if len(val) > 240 or "<" in val:
                die(f"MOCKUP_META {slug}.{field} is {len(val)} chars / contains markup "
                    f"- meta fields are labels, not documents")
            return html.escape(val, quote=True)
        text = re.sub(r"\{\{MOCKUP_META:([\w.-]+)\}\}", meta, text)

        def doc(m):
            slug = m.group(1).strip()
            if slug not in mockups:
                die(f"no such mockup: {slug}")
            return html.escape(mockups[slug]["_doc"], quote=True)
        text = re.sub(r"\{\{MOCKUP:([\w-]+)\}\}", doc, text)

        def height(m):
            slug = m.group(1).strip()
            if slug not in mockups:
                die(f"no such mockup: {slug}")
            px = mockups[slug].get("_h")
            if not px:
                die(f"{slug} has not been measured; {{{{MOCKUP_H}}}} needs a measured build")
            return str(px)
        text = re.sub(r"\{\{MOCKUP_H:([\w-]+)\}\}", height, text)
    left = re.findall(r"\{\{[^}]+\}\}", text)
    if left:
        die(f"unresolved directive(s): {sorted(set(left))[:4]}")
    return text


def sweep(written: list[Path]) -> list[str]:
    """Remove anything in dist/ this build did not write. dist/ is the only
    thing published, so a file that outlives the build that made it ships."""
    keep = {p.resolve() for p in written}
    gone = []
    for p in sorted(DIST.rglob("*")):
        if p.is_file() and p.resolve() not in keep:
            p.unlink(); gone.append(str(p.relative_to(ROOT)))
    for p in sorted(DIST.rglob("*"), reverse=True):
        if p.is_dir() and not any(p.iterdir()):
            p.rmdir(); gone.append(str(p.relative_to(ROOT)) + "/")
    return gone


def main() -> None:
    cfg = json.loads((ROOT / "config.json").read_text())
    paths = sorted(MOCKUPS.glob("*.html"))
    if not paths:
        die("no mockups found")
    mockups: dict[str, dict] = {}
    for p in paths:
        mk = read_mockup(p)
        mk["_doc"] = substitute(mk["html"], cfg)
        mockups[mk["slug"]] = mk

    order = [s.strip() for s in cfg["order"]]
    missing = [s for s in order if s not in mockups]
    extra = [s for s in mockups if s not in order]
    if missing or extra:
        die(f"config.order does not match mockups/ — missing {missing}, unlisted {extra}")

    # Frame heights come from the mockups themselves, never from a constant in
    # the page: the page shows each mockup whole, so a stale number slices it.
    sys.path.insert(0, str(ROOT / "lib"))
    import measure
    for slug, px in measure.heights({s: mockups[s]["_doc"] for s in order},
                                    ROOT / "lib" / "heights.json").items():
        mockups[slug]["_h"] = px

    (DIST / "work").mkdir(parents=True, exist_ok=True)
    written = []
    for slug in order:
        out = DIST / "work" / f"{slug}.html"
        out.write_text(mockups[slug]["_doc"], encoding="utf-8")
        written.append(out)

    page = substitute((ROOT / "page.html").read_text(), cfg, mockups)
    out = DIST / "index.html"
    out.write_text(page, encoding="utf-8")
    written.append(out)

    for w in written:
        print(f"wrote {w.relative_to(ROOT)}  {w.stat().st_size/1024:.0f} KB")
    for g in sweep(written):
        print(f"swept {g}")


if __name__ == "__main__":
    main()
