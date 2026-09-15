# Design

The token plan, the material plan, and the review against the brief's list of
generic tells.

## 1. The chrome

The page's own design system exists so five brand worlds can share one room. It
is nearly invisible; everything striking on this page belongs to a frame.

Ground `#000000`. Primary text `#F4F4F0`. Secondary `#8E8E89`. **No page
accent** — colour belongs to the frames. Button is `#F4F4F0` fill on `#000000`
text, no border. Radii are zero across the chrome except the button. No cards,
no borders around sections, no dividers between them: space and scale do the
separating.

Chrome face is **Schibsted Grotesk**, used by none of the five sources.

## 2. Typefaces, and what the substitutions cost

Everything Antaeus and AESDR use is on Google Fonts and is exact. Three of the
five faces the physical brands specify are not available for the web, so each
is substituted on metrics — x-height, width, contrast, terminal treatment — and
recorded here rather than swapped quietly.

| brand | real face | stands in | what is lost |
|---|---|---|---|
| DARKEST SHADES | Owners Wide | Archivo Expanded | Owners is wider and heavier at the same optical size, with tighter apertures. Archivo's terminals are slightly softer. The brand's own wordmark may be a modified cut in any case — the founder asked which face it was and never got an answer — so a real lockup should be recreated from the vector, never re-typeset. |
| DARKEST SHADES | Stolzl | Hanken Grotesk | Stolzl's bowls are rounder and its feel more single-storey. Hanken is a close geometric humanist; the difference shows most at large sizes. |
| PUFF JUNCTION | Arnet | Archivo, italic | Arnet is licensed at €85 a weight and the system uses three, italic only. Archivo's italic is an oblique rather than a true italic, so the terminals differ. Arnet is also wider; the frame sets Archivo tighter to match the measured lockup width. |
| DIGS | The Old Falcons | Caveat | The Old Falcons is a dry-marker graffiti hand with chisel-flat strokes, ragged edges and wildly mixed case. Caveat is a clean pen hand — it carries the *voice* but not the texture. The embedded font in the source is a **demo cut** in any case; a real use needs a licence or drawn letterforms. |

DIGS's Alexandria is on Google Fonts and is exact.

## 3. The material plan

A material is a reusable recipe for a real surface. Frames compose materials;
frames do not re-derive them. Each recipe carries its source file, its
measurements, and an honest statement of its limits — the table is in
`SOURCES.md` §4.

The layer exists because it is where the fidelity lives. Five of the twelve
recipes were wrong on the first pass and only a side-by-side proof sheet caught
it: a knurl that read as corrugation, a brushed face that read as a sunburst, a
tortoise that read first as clouds, then as snow, then as droplets, a knit
whose pinholes never rendered, and a harlequin that came out as two solid
blocks. None of those were visible from the code.

Two structural lessons, both now in the recipe headers:

- **A repeating-linear-gradient pair cannot carry a closed cell.** Neither the
  knurl's diamond nor the knit's pinhole survived as gradients; both are SVG
  patterns now.
- **A conic brush grain diverges into rays at frame scale.** Fine concentric
  rings are what a radially brushed flat face actually shows.

## 4. Motion

Easing is a property of the material, not a decoration on top of it. Metal
turns at constant velocity, so the knurl's rake and the cast shadow are linear.
Fabric settles, so the knit's light decelerates. A drawn line arrives, so the
tech pack's leaders snap. An interface state snaps too.

One frame has no loop at rest: `live-edge`, where the interaction *is* the
loop. It is the one declared exception to the 6–10 second rule and it is logged
in `ASSUMPTIONS.md`.

## 5. Review against the generic tells

BRIEF.md §2 rule 10, line by line, for the chrome only — frames follow their
source's real tokens.

| tell | verdict |
|---|---|
| cream ground with a serif display and a terracotta accent | Not present. The chrome is black with one sans. Near-collision worth naming: AESDR *is* cream with a serif display and a crimson accent — but that is inside a frame, where the rule explicitly does not apply, and it is that brand's real identity rather than a default reached for. |
| tinted near-black standing in for black | The stage is `#000000` exactly. Verified: no `#0B0B0B`, `#111` or `#0A0A0A` in the chrome. |
| a single bright acid or vermilion accent on the black | The chrome has no accent at all. |
| broadsheet hairlines and newspaper columns | Not present. |
| identical rounded cards with the same grey shadow; gradient washes as decoration | No cards in the chrome. The only gradients are inside frames and every one of them is a measured material. |
| tracked-out ALL-CAPS eyebrow labels above headings | Not present. The source labels under gallery captions are small caps, which is a label rather than an eyebrow, and they carry real information. |
| meta strings joined with middle dots; labels built as "WORD — fragment" | Not present. |
| monospace for chrome labels | Not present. Mono appears only inside Antaeus and AESDR frames, where it is their real token. |
| "→" appended to links or buttons | Not present. |
| a single word in a headline in a different colour or italic | Not present in the chrome. Frame 4 ignites one word in the iris, which is that brand's own reservation rule — the single accent word is exactly what the iris is permitted to do. |
| numbered markers except where the content is a sequence | "How it works" is numbered and it is a genuine sequence. The reel's ticks are one per frame, which is also a sequence. Nothing else is numbered. |

## 6. The free axes, chosen

- Header is static, not fixed. A fixed bar competes with a full-bleed stage.
- Button radius is 4, not a pill. A pill reads friendlier than the page is.
- The source label sits **beneath** the frame, beside the caption, like a
  museum label. Inside the frame it would sit on someone else's composition.
