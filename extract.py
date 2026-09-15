#!/usr/bin/env python3
"""Source extraction for phase 1 (brief 14).

Pulls measurable fact out of the source material so tokens and materials are
measured rather than remembered (hard rule 3). Reads sources.local.json for the
paths; never writes to a source repo.

  ./extract.py pdf-text  <file> [--pages 1-6]   text layer, if there is one
  ./extract.py pdf-pages <file> <outdir> [--dpi 110]
                                                render pages to PNG -- the only
                                                way to read a design export that
                                                carries no text layer at all
  ./extract.py sample    <image> <x> <y> <w> <h>
                                                mean and dominant colour of a
                                                patch, as hex
  ./extract.py swatches  <image> [--grid 4x3]   mean colour of a grid of patches
  ./extract.py step-bbox <file.step>            bounding box in mm from the
                                                CARTESIAN_POINT cloud
  ./extract.py svg-paths <file.svg>             path data, verbatim

PyMuPDF and Pillow are used when present; every command says plainly what it
could not do rather than guessing.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def sources() -> dict:
    p = ROOT / "sources.local.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def need(mod: str):
    try:
        return __import__(mod)
    except ImportError:
        sys.exit(f"extract.py: {mod} is not available; install it or measure by hand")


def parse_range(spec: str, n: int) -> list[int]:
    if "-" in spec:
        a, b = spec.split("-", 1)
        return list(range(int(a) - 1, min(int(b), n)))
    return [int(spec) - 1]


def cmd_pdf_text(args: list[str]) -> None:
    fitz = need("pymupdf")
    doc = fitz.open(args[0])
    pages = range(len(doc))
    if "--pages" in args:
        pages = parse_range(args[args.index("--pages") + 1], len(doc))
    empty = True
    for i in pages:
        t = doc[i].get_text().strip()
        if t:
            empty = False
            print(f"--- page {i + 1}\n{t}")
    if empty:
        print(
            "no text layer on those pages -- this is an image-only export.\n"
            "render it with pdf-pages and read the images.",
            file=sys.stderr,
        )


def cmd_pdf_pages(args: list[str]) -> None:
    fitz = need("pymupdf")
    src, outdir = args[0], Path(args[1])
    dpi = int(args[args.index("--dpi") + 1]) if "--dpi" in args else 110
    outdir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(src)
    for i in range(len(doc)):
        doc[i].get_pixmap(dpi=dpi).save(outdir / f"p{i + 1:02d}.png")
    print(f"{len(doc)} pages -> {outdir}")


def hexof(rgb) -> str:
    return "#{:02X}{:02X}{:02X}".format(*(int(round(v)) for v in rgb[:3]))


def cmd_sample(args: list[str]) -> None:
    PIL = need("PIL")
    from PIL import Image

    img = Image.open(args[0]).convert("RGB")
    x, y, w, h = (int(v) for v in args[1:5])
    patch = img.crop((x, y, x + w, y + h))
    px = list(patch.getdata())
    mean = [sum(c[i] for c in px) / len(px) for i in range(3)]
    dom = max(patch.getcolors(maxcolors=w * h) or [(0, (0, 0, 0))])[1]
    lum = sorted(int(0.2126 * r + 0.7152 * g + 0.0722 * b) for r, g, b in px)
    print(f"mean {hexof(mean)}  dominant {hexof(dom)}")
    print(f"luminance  min {lum[0]}  p10 {lum[len(lum)//10]}  "
          f"median {lum[len(lum)//2]}  p90 {lum[len(lum)*9//10]}  max {lum[-1]}")


def cmd_swatches(args: list[str]) -> None:
    need("PIL")
    from PIL import Image

    img = Image.open(args[0]).convert("RGB")
    cols, rows = 4, 3
    if "--grid" in args:
        cols, rows = (int(v) for v in args[args.index("--grid") + 1].split("x"))
    cw, ch = img.width // cols, img.height // rows
    for r in range(rows):
        line = []
        for c in range(cols):
            patch = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            px = list(patch.getdata())
            line.append(hexof([sum(p[i] for p in px) / len(px) for i in range(3)]))
        print("  ".join(line))


POINT_RE = re.compile(
    r"CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*([-\d.E+]+)\s*,\s*([-\d.E+]+)\s*,\s*([-\d.E+]+)"
)


def cmd_step_bbox(args: list[str]) -> None:
    text = Path(args[0]).read_text(errors="replace")
    pts = [(float(a), float(b), float(c)) for a, b, c in POINT_RE.findall(text)]
    if not pts:
        sys.exit("extract.py: no CARTESIAN_POINT found")
    for i, axis in enumerate("XYZ"):
        vals = [p[i] for p in pts]
        print(f"{axis}  {min(vals):9.3f} .. {max(vals):9.3f}   span {max(vals)-min(vals):9.3f} mm")
    print(f"points {len(pts)}")


def cmd_svg_paths(args: list[str]) -> None:
    text = Path(args[0]).read_text(errors="replace")
    vb = re.search(r'viewBox="([^"]+)"', text)
    if vb:
        print(f"viewBox {vb.group(1)}")
    for m in re.finditer(r'\sd="([^"]+)"', text):
        print(m.group(1).strip())
    for m in re.finditer(r"<stop[^>]*>", text):
        print(m.group(0))


COMMANDS = {
    "pdf-text": cmd_pdf_text,
    "pdf-pages": cmd_pdf_pages,
    "sample": cmd_sample,
    "swatches": cmd_swatches,
    "step-bbox": cmd_step_bbox,
    "svg-paths": cmd_svg_paths,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        sys.exit(__doc__)
    COMMANDS[sys.argv[1]](sys.argv[2:])


if __name__ == "__main__":
    main()
