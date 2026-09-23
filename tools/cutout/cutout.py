#!/usr/bin/env python3
"""
Cut product shots out of their backgrounds into transparent PNGs.

The point is reuse: once a product is on transparent ground it can sit on any
wall, any brand colour, any layout, without a white or black rectangle around
it. Rectangular photographs lock a page's background to whatever the
photographer's sweep happened to be.

Model: birefnet-general-lite, chosen against u2net and isnet-general-use on a
Darkest Shades aviator with gradient lenses. u2net punched a hole through the
pale half of the left lens; isnet dropped both lenses entirely and returned the
frame as a wire outline. birefnet kept the lenses, held the frame edge, and
still cut the nose-bridge aperture, which is the one hole that IS meant to be
transparent. That aperture is also why a blanket "fill enclosed holes" pass is
wrong here and is not done.

Not every shot should be cut out. A whole object on a plain sweep should be. A
tight detail crop -- a woven label, a fabric macro -- has no figure to separate
from its ground; the frame IS the subject, and cutting it out produces a torn
scrap. Pass those through with keep_rect.

Usage:
    python3 cutout.py <src-glob-or-file> [...] --out DIR [--max 2000] [--pad 12]
"""
import argparse, glob, os, sys, io
import numpy as np
from PIL import Image

MODEL = "birefnet-general-lite"
_session = None


def session():
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session(MODEL)
    return _session


def prune(a, keep_ratio=0.02):
    """Drop specks. The model occasionally leaves a stray blob where a shadow or
    a dust mote on the sweep looked like a second object -- one Darkest Shades
    frame came back with a 1500-pixel fleck floating below the glasses. Anything
    smaller than keep_ratio of the largest region is not the product.

    Regions are kept whole, so a pair of sunglasses photographed at an angle
    keeps its detached far temple as long as that temple is a real part of the
    silhouette rather than a mote."""
    from scipy import ndimage

    lab, n = ndimage.label(a > 0)
    if n <= 1:
        return a
    sizes = ndimage.sum(a > 0, lab, range(1, n + 1))
    cutoff = sizes.max() * keep_ratio
    drop = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz < cutoff])
    if drop.any():
        a = a.copy()
        a[drop] = 0
    return a


def cut(img, max_side=2000, pad=12, floor=8, keep_ratio=0.02):
    """Return an RGBA image trimmed tight to the subject, or None if the mask
    came back empty (which means the model found no figure at all)."""
    from rembg import remove

    work = img.convert("RGB")
    if max(work.size) > max_side:
        work.thumbnail((max_side, max_side), Image.LANCZOS)

    out = remove(work, session=session()).convert("RGBA")
    a = np.array(out.split()[3])

    # Kill haze: near-zero alpha left around the subject reads as a grey smear
    # once the PNG sits on a dark ground. Anything under the floor is background.
    a[a < floor] = 0
    a = prune(a, keep_ratio)
    if a.max() == 0:
        return None
    out.putalpha(Image.fromarray(a))

    ys, xs = np.nonzero(a)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad),
           min(out.width, xs.max() + 1 + pad), min(out.height, ys.max() + 1 + pad))
    return out.crop(box)


def coverage(rgba):
    a = np.array(rgba.split()[3])
    return (a > 250).mean(), ((a >= 8) & (a <= 250)).mean()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("srcs", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max", type=int, default=2000)
    ap.add_argument("--pad", type=int, default=12)
    ap.add_argument("--prefix", default="")
    ap.add_argument("--keep", type=float, default=0.02,
                    help="drop regions smaller than this share of the largest")
    ap.add_argument("--crop", default="",
                    help="pre-crop the source as l,t,r,b fractions, e.g. .1,0,.8,1 -- "
                         "use it to cut a dress-form stand or a desk edge out of frame "
                         "BEFORE segmentation, which is far cleaner than trying to "
                         "subtract hardware the model has correctly identified as an object")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    files = []
    for s in args.srcs:
        files.extend(sorted(glob.glob(s)) if any(c in s for c in "*?[") else [s])

    for f in files:
        name = args.prefix + os.path.splitext(os.path.basename(f))[0] + ".png"
        dst = os.path.join(args.out, name)
        try:
            im = Image.open(f)
            if args.crop:
                l, t, rr, b = [float(x) for x in args.crop.split(",")]
                W, H = im.size
                im = im.crop((int(l * W), int(t * H), int(rr * W), int(b * H)))
            r = cut(im, args.max, args.pad, keep_ratio=args.keep)
        except Exception as e:
            print("FAIL %-34s %s" % (os.path.basename(f), str(e)[:70]))
            continue
        if r is None:
            print("EMPTY %-33s no subject found" % os.path.basename(f))
            continue
        r.save(dst, optimize=True)
        op, edge = coverage(r)
        print("%-30s -> %-26s %5s  solid %4.1f%%  edge %3.1f%%  %6.0fKB"
              % (os.path.basename(f), name, "%dx%d" % r.size,
                 op * 100, edge * 100, os.path.getsize(dst) / 1024))


if __name__ == "__main__":
    main()
