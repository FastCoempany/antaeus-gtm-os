# Brand cutouts

Product shots with their backgrounds removed, so a photograph can sit on any
ground instead of dragging the photographer's sweep along with it. The
Darkest Shades lightbox frames are on white, the Puff Junction renders are on
near-black, and the Digs sample was shot in a room — three incompatible
rectangles that could never share a wall. As cutouts they share any wall.

18 files, WebP with alpha, longest edge 1400px, ~1.9MB total. The same set as
lossless PNG runs 14.9MB; the content is photographic, so PNG spends most of
that on noise.

| Prefix | Brand | What it is |
|---|---|---|
| `ds-` | Darkest Shades | 11 frames from the lightbox set. Colourways, angles, and `ds-IMG_3477` which carries the name stamped into the temple. |
| `digs-` | Digs | The AC-LST-001 thermal sample, four views. Shot with the dress form lying horizontal, so all four are rotated upright. `digs-thermal-wordmark` carries the wordmark at the neck. |
| `pj-` | Puff Junction | Three grinder renders and two frames of the 3D-printed pouch prototype. |

## Regenerating

    python3 tools/cutout/cutout.py '<glob>' --out <dir> [--crop l,t,r,b] [--keep 0.02]

`tools/cutout/cutout.py` documents the model choice and why a blanket
fill-enclosed-holes pass is wrong for eyewear. Two flags matter in practice:

**`--crop`** runs before segmentation. Use it when something real but unwanted
shares the frame — the Digs shots were taken on a dress form, and the model was
right to call the form's arm an object. Cropping it out of frame is clean;
trying to subtract it afterwards is not.

**`--keep`** drops regions below a share of the largest. One Darkest Shades
frame came back with a speck of shadow floating under the glasses; at the
default 0.02 it goes, and a genuinely detached temple arm stays.

## What not to run through it

A tight detail crop has no figure to separate from its ground — the frame *is*
the subject. The Digs woven-label close-up, the waffle-knit macro and the
folded-cuff frame are used as rectangles for exactly that reason. The last one
was cut and then dropped: it fills its own frame and runs off three edges, so
the cut-out was a ragged rectangle rather than an object.

Provenance matters as much as technique. Nothing from `THERMAL.LONG.SLEEVE.zip`
is in here — that folder is a benchmark set (Buck Mason, Vince, a Ralph
Lauren-style crest, one still wearing a price sticker), the garments the Digs
thermal was specced against rather than ours.
