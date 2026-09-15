# Sources

What was opened, what was measured, and where every value came from.

This file and `study/` are the evidence base for hard rule 3 — *fidelity is
measured, not remembered*. They index private codebases and name real asset
files, so **neither is ever published**. Only `dist/` is.

Assets are cited by filename only throughout. Several source folders are named
after the contractors who made the work; no contractor's name appears here, in
`study/`, in any frame, or in any commit message.

---

## 1. What was opened

| source | what was read |
|---|---|
| PUFF JUNCTION | the three 2560×2560 studio renders and the darker render set; the knurl macro; the 22-page brand guide, rendered to page images and read; the A3 technical drawings for the grinder assembly, top lid, middle lid, threaded lid and bottom; the manufacturer's DFM deck; the STEP files for the grinder, herb pouch, scoop, lighter box and the five Rhino surface iterations; the official logo SVGs; the marker concept sketches; the workbench photographs of real production parts |
| DARKEST SHADES | the 45-page brand guidelines, the graphic-elements deck, the font-pairs document, both moodboards and the 39-page render presentation — **all rendered to page images, because the guidelines carry no text layer at all**; the nine A3 1:1 dimension sheets; the Eclipse emblem SVGs and their provenance notes; the photograph of a manufactured temple; the voice and tone guide; the brand story; the geographic launch deck |
| DIGS | the 38-page style guide; every revision of the AC-LST-001 tech pack, and the 6-15-25 revision in full; the DXF pattern exports; the garment photography and fabric closeups, sampled with PIL; the sourced-blank sets; the colour cards; the founder's brand strategy document; the development threads |
| AESDR | the shipped `app/` and `components/`, the token file verbatim, the brand and mascot canon, the icon component, the 18-glyph set, the standalone tools, the lesson player's own design system, the production Lighthouse report and the screenshot embedded in it, and a sample of the 49 mockups |
| Antaeus GTM OS | the canon, the token file, the component library, the icon set, the brand mark and favicon, the design-system specs, and sixteen settled 2026-07 mockups **rendered at 1440×900 and read as images**, because what a surface looks like is not fully recoverable from its CSS |

The studies are in `study/`, one file per source. Where this file and a study
disagree, the study wins.

## 2. How things were measured

`extract.py` is what makes rule 3 enforceable rather than aspirational:

| command | used for |
|---|---|
| `pdf-text` | the text layer, and it says plainly when a document has none |
| `pdf-pages` | rendering an image-only export to PNGs — the only way to read the Darkest Shades guidelines |
| `sample` | mean and dominant colour of a patch, with its luminance spread |
| `swatches` | a grid of patches at once |
| `step-bbox` | real dimensions in millimetres out of a CAD point cloud |
| `svg-paths` | path data and gradient stops, verbatim |

Cross-checked where two sources could disagree. The grinder's STEP file returns
a bounding box of 85.000 × 85.000 mm on X and Y, which is what the
manufacturer's own bill of materials says. The knurl's stated 1.26 mm pitch
reconciles with its 1.65 × 1.9 mm lands to within 0.014 mm
(1.65 × 1.9 / √(1.65² + 1.9²) = 1.246). The Darkest Shades mark was traced and
the trace verified at 99.78% pixel agreement against the original.

## 3. Tokens

One file per source in `tokens/`. Every value carries the measurement or the
quotation it came from in a comment, and the caution that goes with it:

- **Antaeus** reads from the settled 2026-07 mockups rather than its own token
  file. The shipped rooms reference token names that do not exist and fall
  through to hard-coded fallbacks, `--ds-forest` is declared twice with the
  second winning, and the mockups' amber `#b5790f` and red `#c0392b` are far
  more on-brand than the tokens' bright alert colours.
- **AESDR** is Gen 2 only. Four visual generations live in that repo and three
  of them are explorations the repo's own README says not to build from.
- **DIGS** keeps its two palettes apart. The identity is `#0042E5` / `#000000`
  / `#F0F5FF` with no greys; the product is sage, off-white and a navy thread.
  Nothing in the archive reconciles them.
- **PUFF JUNCTION** carries both of its brands, with the slime rationed.
- **DARKEST SHADES** holds `#BF835E` in reserve; it is a moodboard swatch that
  appears in none of the executions, so spending it extends the system.

## 4. Materials

One recipe per surface in `materials/`. Each header records the source file, the
measurements taken, the asset policy it needs, and — the part worth reading —
what the recreation does not do.

| material | measured from | the honest limit |
|---|---|---|
| `pj-concrete` | the two render sets | corners want a Fresnel lift; this gives them a gradient, and real aggregate sits *in* the material rather than on it |
| `pj-brass` | the renders and the knurl macro | a real brushed metal's highlight travels with the viewer; this is a fixed light |
| `pj-knurl` | Detail A of the top-lid drawing, and the macro | fixed light, so it holds at one viewing angle |
| `pj-harlequin` | the hero renders, scaled against the known 20.9 mm half | carries one cell's appearance; the dissolve is structure and is generated per cell in the frame |
| `pj-sweep` | the three studio renders, sampled across the full width | a real cove carries a soft floor reflection of the object's colour; this carries none |
| `ds-sweep` | the render presentation's page images | the real shadow is cast geometry; this is a blurred ellipse |
| `ds-lens` | the same | a real polarised lens shifts with viewing angle; this is a fixed sheen on a fixed fill |
| `ds-acetate` | the same | real sub-surface scattering carries light through a volume; the flecks also run smaller and more evenly spread than the source, and the gap is density, not colour |
| `digs-knit` | the garment photography and fabric closeups | a flat plane with a fixed light; the half-drop is a background offset rather than a real stagger of yarns |
| `ae-paper` | the shipped CSS, quoted | the real aged stock is photographed paper with fibre; this is three background layers |
| `ae-iris` | `app/globals.css`, verbatim | the real shimmer runs continuously; under reduced motion it holds a still frame, which loses the thing the material is for |
| `an-field` | the settled auth gate, verbatim | the real field sits under live content that breaks it up; alone at frame scale the regularity is more visible than it ever is in the product |

## 5. The frames

Each frame answers the three tests from BRIEF.md §4.3: name the authentic
materials it is built from, prove the composition exists nowhere in the source,
prove it claims nothing the source does not support.

| # | frame | source | built from | new because | claims |
|---|---|---|---|---|---|
| 1 | `knurl-wall` | PUFF JUNCTION | `pj-knurl` (1.26 mm pitch, 1.65 × 1.9 lands, 49° grooves), `pj-brass` (the 0.2 mm three-terrace deboss) | the knurl has only ever been a band on a 63 mm knob; it has never been the subject | none — no text but the wordmark, which is the real lockup |
| 2 | `ground-line` | Antaeus | the Grounded-A's exact paths and lift transform, `an-field` (34 px grid, two washes, vignette) | the auth gate does this at 118 px as a login affordance; here the line is a horizon | none |
| 3 | `blackout` | DARKEST SHADES | `ds-lens` blackout recipe | the lens stops being a component and becomes the surface | one tagline, verbatim: *See Everything. Reveal Nothing.* |
| 4 | `iris-seam` | AESDR | `ae-iris` (seven stops, 300%, 4 s), `ae-paper`, the shell and ear glyphs | the iris is always an accent on something; here the ration is the composition | one positioning line, verbatim; four real accent words |
| 5 | `waffle` | DIGS | `digs-knit` (waffle, overlock ridge, seam-highlighter wash) | the fabric becomes architecture and the wash becomes weather | none |
| 6 | `harlequin` | PUFF JUNCTION | `pj-concrete`, `pj-harlequin` | on the product this is a corner detail at 13 mm | none |
| 7 | `prismatic` | DARKEST SHADES | the verified ten-vertex mark, `ds-sweep` | it was quoted, scoped, deferred and never made | none |
| 8 | `tech-pack` | DIGS | the real graded spec, the tech pack's own layout system | a tech pack is a static document; this one annotates itself | every number and the style string are verbatim from the 6-15-25 revision |
| 9 | `tortoise` | DARKEST SHADES | `ds-acetate` blue tortoise, the chamfer | the deck never goes macro on this surface | none |
| 10 | `margin` | AESDR | `ae-paper` (margin rail, strike, insert), the Caveat voice, the recovery glyph | the rail is a component of a finished artifact; here the annotation is the event | body copy verbatim from two shipped zoom cards |
| 11 | `reconciliation` | PUFF JUNCTION | `pj-sweep`, `pj-concrete`, `pj-harlequin`, `pj-knurl`, `pj-brass` | the founder asked for it in October 2024 and nobody built it | none; the proportions are the real ones and the view is straight on so no perspective is invented |
| 12 | `live-edge` | Antaeus | `an-field`'s ground and ink ladder, the forest and orange roles, the rail's construction and its three-beat switch | almost nothing in software makes *off* legible as a state | none; the wire's lines are generic operator motion, no account, person or figure |

## 6. What did not cross into `dist/`

No render, photograph, screenshot or CAD file. No source path. No contractor's
name. No out-of-scope brand — not the third-party eyewear advertising found in
the Darkest Shades folder, not the contractors' portfolio samples in the Puff
Junction folder, not the stock placeholder photography the DIGS brand book
marks as not for external use, and not the AI-generated concepts with garbled
wordmarks in either.

No customer, prospect, deal value or demo-seed company name from either
software source.
