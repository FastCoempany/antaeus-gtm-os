# Where the material came from

Five brands, five pages. Everything on those pages that could come from the
real brand does — the renders, the photographs, the vector marks, the
palettes, the measured dimensions, the words. This file says, per page, what
is quoted and what is ours, so the claim on the page ("the material is
theirs") can be checked rather than believed.

Two rules held throughout:

- **No person's name appears anywhere.** Not in a file, a comment, a commit
  message, a caption or a shipped asset. Assets are cited by filename only,
  never by a folder path, because the folder paths in the archives carry
  contractors' names. `accept.py` check 1 enforces this against a set of
  hashed names on every build.
- **Sensitive material was never opened.** The archives also hold invoices,
  international bank details, payment receipts and a signed contract. None of
  it was read for this work and none of it is anywhere near `dist/`.

The archives themselves are GitHub pre-release assets on private
repositories. `sources.local.json` maps them to local paths and is gitignored.

---

## What is real on each page

### Puff Junction — a product page

| On the page | Where it came from |
|---|---|
| Palette (`#D6FD4A` slime, `#FF8FF1`, `#A5E4FF`, `#FEF200`, black) | the 22-page brand guide, verbatim |
| The `puff JUNCTION` lockup | the real vector, 13 paths, both weights — the dark mark on the white header, the slime mark on the black footer |
| The grinder: three renders | the render set, cropped, nothing retouched |
| "ALL THE STUFF FOR ALL THE PUFF." / "1-800-CALL-PUFF" | the brand guide's own lines |
| 85 × 85 mm, Ø63 mm brass, eleven parts, 1.26 mm knurl pitch | derived from the bill of materials and the CAD |
| Ticker lines ("THE BEST IS YET TO COME", "UP, UP, AND AWAY", "LET THE GOOD TIMES ROLL") | the brand guide |
| $180, "Stash · 2", the four colourway dots | **ours.** There is no shop, so there is no price and no stock. |

### Darkest Shades — a brand landing

| On the page | Where it came from |
|---|---|
| `DARKEST ●● SHADES` lockup | rebuilt from the logo files as two overlapping discs |
| "NOT JUST SUNGLASSES. A STATEMENT." | the 45-page brand guide, verbatim |
| "TO EMPOWER INDIVIDUALS TO EXPRESS THEIR UNIQUE STYLE…" | the guide's positioning statement, verbatim |
| Individuality / Privacy / Cultural connection, with their lines | the guide's three values, verbatim |
| Three product photographs | the real prototypes, shot on a lightbox; chosen from 317 frames, cropped, not retouched |
| "Nine frames · Sampled and sewn" | the archive records nine models, physically sampled |
| The three captions (rounded wayfarer / chunky rectangle / one-piece shield, with their colourways) | the archive's own model table, matched to the photographs |
| The frames are not named. | The brand's naming language exists but the archive does not map a name to a model, so no name was invented. |

### DIGS — a technical document

| On the page | Where it came from |
|---|---|
| The flats, front and back | the real technical drawing |
| ISO stitch callouts (ISO #514, ISO #605, 1/4" needle spacing, 2-ply foldover rib) | the real tech pack |
| Graded spec, rows A/B/C/D/I/O/P across S–XL | the real graded spec, figures unchanged |
| Colourways: Off White `#F8F0E8` (Pantone 19-3943 TXC), Sand Blue `#6176A3` | the real colourway page |
| The change-log entry and the out-of-tolerance flags | the real comments and change log, quoted |
| Page count, sample size, status | the real pack's own front matter |
| Nothing about the garment is invented. | |

### AESDR — a course landing

| On the page | Where it came from |
|---|---|
| Palette (`#8B1A1A` crimson, `#FAF7F2` cream, `#1A1A1A` ink) and the seven-stop iris gradient | the product's own token file, verbatim |
| The AE/SDR fork and its two sides | the product's own landing |
| "Every month or quarter, they reset your number to zero." | quoted |
| "Sober, fun, practical training built by people who carried bags." | quoted |
| The content warning | quoted |
| Twelve course names, call numbers `658.85 / L01`–`L12`, day tags, margin notes | the real curriculum map |
| One margin note is missing. | It named a person, so it was dropped rather than altered. |
| No price, no testimonial, no course description appears. | The page shows only surfaces the product records. Nothing was written to fill a gap. |

### Antaeus — an app screen

| On the page | Where it came from |
|---|---|
| Field, ink, the one-orange-move rule, the type trio | the product's design system |
| Five readiness states, in order | the product's own ladder |
| The Live Edge rail: its tags (you / the machine / the buyers) and line templates | the product's own templates |
| One ranked move with its reason, and the standing row | the product's own shape |
| The sample account and its numbers | **ours.** They are the shape of the product's demo data, not anyone's pipeline. |

---

## Fonts

Four of the five brands specify a face with no web licence here. Each is set
in the nearest available face and said so in `ASSUMPTIONS.md`. Everything
else is the real one.

| Page | Set in |
|---|---|
| Puff Junction | Archivo 900 italic (for Arnet), Work Sans |
| Darkest Shades | Archivo expanded (for Owners Wide), Hanken Grotesk (for Stolzl) |
| DIGS | Archivo, JetBrains Mono |
| AESDR | Playfair Display, Source Serif 4, Barlow Condensed, Space Mono |
| Antaeus | DM Serif Display, Public Sans, JetBrains Mono — the product's own trio |
| The page itself | Instrument Serif, Inter, JetBrains Mono |

---

## A correction to the previous version

The second version's notes said the source folders held no vector art, and
built marks by hand on that basis. That was wrong: it was reading the
repositories, and the art is in the pre-release archives, not in the
repositories. The real lockups were in the archives the whole time. This
version uses them.
