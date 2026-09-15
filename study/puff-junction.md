# PUFF JUNCTION — what the brand actually is

Research report from `/home/user/puffjunction`. Everything below is sourced from files in that archive. Assets are cited **by filename only**. Where the files don't say something, I say so.

**The single most important finding up front:** this archive contains **two visually incompatible brands under one name**, made ~9 months apart by different people:

1. **The paper brand** (Feb 2024) — a loud neon pop-art identity: acid-green, halftone Lichtenstein comics, clouds, heavy italic type.
2. **The object brand** (2024–25) — a severe, monochrome, architectural product language: dark grey faux-concrete, brushed brass, diamond knurl, harlequin corner pattern, white studio sweep.

The founder himself flagged the gap on 30 Oct 2024 and asked to move "*subtly from a vibrant and somewhat playful neon feel to a subtler, more refined aesthetic*." That reconciliation was never designed. Any new work has to choose a position between them — I'd argue the object brand is the real one and the paper brand is the (excellent, reusable) accent system.

---

## 1. THE PRODUCTS

### 1.1 The concrete-and-brass grinder — "Puff Junction Grinder" / `Weed Grinder_V01`
**The hero object.** A square block of dark faux-concrete, split horizontally into two equal halves, with a circular brushed-brass knurled knob sunk into a bore in the top face. Renders: `Grinder_1.png`, `Grinder_2.png`, `Grinder_3.png` (each 2560×2560 PNG, 3.6–4.3 MB; JPG twins `Grinder_1_jpg.jpg` etc. at 1.2–1.5 MB are the web-usable versions).

**Real dimensions — authoritative BOM** from the manufacturer's DFM review deck (`412513_coe_081424_DFM.pptx`, 12 slides, one part per slide):

| Part | mm | Material as specified |
|---|---|---|
| Top Lid | 63.000 × 63.000 × 22.000 | Brass (factory offered **A380 die-cast** as substitute) |
| Magnet (2) | 5.000 × 5.000 × 3.000 | magnet |
| Spacer | 62.800 × 62.800 × 0.400 | **Silicone 60A**, compression-moulded |
| Middle Lid | 63.000 × 63.000 × 20.900 | Brass (or A380) |
| Magnet (1) | 5.000 × 5.000 × 1.900 | magnet |
| Lid Threaded | 63.000 × 63.000 × 17.800 | Brass (or A380) |
| Mesh | 58.000 × 58.000 × 0.500 | metal mesh |
| Mesh Holder | 60.000 × 60.000 × 1.500 | **PC**, injection-moulded, glued in |
| Bottom | 63.000 × 63.000 × 11.000 | Brass (or A380) |
| Concrete Top | 85.000 × 85.000 × 20.900 | concrete |
| Concrete Bottom | 85.000 × 85.000 × 20.900 | concrete |
| **Full assembly `weed_grinder_v01`** | **85.000 × 85.000 × 57.200** | |

So: **85 mm square footprint, 57.2 mm tall** (3.35″ × 3.35″ × 2.25″). The concrete stack is 41.8 mm; the brass knob stands **15.4 mm proud**. The knob is Ø63 on an 85 mm face — **74% of the face width**, a deliberately dominant circle-in-square.

*(For cross-checking: `Weed Grinder_V01.step` has an exact X/Y bounding box of 85.00 × 85.00 mm — X and Y run precisely −42.50 to +42.50 — and a Z span of 72.00 mm. The DFM 57.2 mm is the assembled height; the STEP's extra Z is construction/extension geometry. Trust 57.2.)*

**Detail dimensions** from the A3 technical drawings (title block: BOUNCE DESIGN e.U., www.bounce-design.com; assembly `Weed Grinder_V01.pdf` dated 12.08.2024; `Weed Grinder_Top Lid_V02.pdf` dated 15.01.2025):

- **Concrete Top / Bottom** — 85 × 85 outline, **R3** corner radii, **Ø63** bore, heights 20.9 and 11, further radii R1 and R0.5. Notes: "Concrete Top merged with Middle Lid", "Concrete Bottom merged with Lid Threaded", "Top Lid can be set into the Concrete Top".
- **Top Lid** — two-tier brass puck: lower flange **Ø62.75**, upper knurled section **Ø50.83**, heights 10 / 12 / **22** total, **R.2** fillets on all edges, a 135° chamfer. Underside disc Ø61.11 inside Ø62.75, central **Ø5 magnet pocket in a Ø7 boss**.
- **Middle Lid** — Ø63 / Ø60.85 / Ø58.85, 20.9 tall, thread **M62 × 1.5 mm × 4 mm height**, Ø5 × 1.9 mm deep magnet pocket.
- **Lid Threaded** — Ø63, 17.8 tall, **M62 × 1.5 mm** in both 2 mm and 4 mm heights.
- **Bottom** — Ø63, 11 tall, M62 × 1.5 × 2 mm thread, R29.5 / R31.5 internal.
- **Mesh / Mesh Holder** — "Mesh (Metal) put inside of the Lid Threaded. Secured by Mesh Holder (Plastic) glued in."

**What it does** — four chambers, specified in the founder's own day-one brief sheet (`top cover twists.pdf`), verbatim:
> "GRINDING CHAMBER: THE TOPMOST PART, WITH TEETH OR PEGS FOR CRUSHING AND SLICING THE HERB… STORAGE CHAMBER: SITUATED BELOW THE GRINDING CHAMBER… SIFTING CHAMBER: SEPARATED BY A FINE MESH SCREEN TO SIFT SMALLER PARTICLES FROM THE GROUND HERB. KIEF CATCHER: THE BOTTOM CHAMBER FOR COLLECTING KIEF."

And the mechanism, also verbatim from that sheet:
> "TOP COVER TWISTS THE TOP HALF WHEN TURNED COMPLETELY CLOSED TO THE RIGHT"

The brass knob is magnet-coupled (Magnet 1 / Magnet 2) to the Middle Lid, so twisting the exposed knob drives the grinding chamber inside the concrete. The chambers screw together on M62 × 1.5 threads.

**The teeth.** Detail D on the Top Lid drawing: each tooth is a **rhombus with 49.4° / 130.6° internal angles, 5 mm across the long diagonal, 2.75 mm side, 2.3 mm across the short diagonal**. Roughly 32–34 of them are arrayed on the lid's underside in a loose radial scatter, each progressively rotated — not a rigid grid. The Middle Lid plate combines these diamond teeth with **rings of circular sift holes** (visible in `4.PNG`, `5.PNG`, `6.PNG`).

**Variants that exist in the files:** an `A.C.` script-monogram lid (`18.png`), a first machined sample in **brushed nickel/steel rather than brass** (`34e799f4-a7ad-4496-83cf-e43b34f7ba26.jpeg`), and **black-anodised internals** (`7a87fdc9-…jpeg`, `e41b9710-…jpeg`). Real production parts exist: `370afe0c-…jpeg` is a hand holding a finished concrete-body grinder with brass cap; `5658aab4-…jpeg` is a machined brass grinder half with milled teeth and knurled band.

### 1.2 The Herb Pouch
A **rigid vessel shaped like a cloth pouch pulled shut with a drawstring** — a plump, round-bottomed body gathered into a cinched, threaded neck, with soft vertical gather-folds radiating from the neck and a lobed/scalloped plan. Drawing: `Herb Pouch_V03_update_Drawing_V01.pdf` (V01, 06.12.2024).

Real dimensions, from the drawing and `Herb Pouch_V03_update_V01.step`:
- **Overall height 191.88 mm** (drawing) / STEP Z span 194.91 mm
- **Maximum body diameter ≈ 158 mm**, at ~30 mm above the base; base Ø ≈ 79 mm; neck Ø ≈ 32–40 mm
- Neck height 50.41 mm; a stated 38.3 mm across the thread collar and 41.91 mm across a base feature
- **Cap: Ø33.16 × 14.3 mm high**, thread bore **Ø28.59**, diamond-knurled band over a smooth flange, logo debossed on the top face
- Bottom view shows an 8-lobed scalloped plan with a small circular logo medallion debossed in the centre of the base

**What the cap does** — founder, in his own words:
> "The top will be identical to the brass one on the weed grinder's, and when the cap is spun off and pulled out, there is a **brass spoon welded to the cap's underside**."

**The scoop.** `Herb Pouch_Scoop_V04.step` measures **13.49 × 185.00 × 12.95 mm** — a **Ø7.00 mm shaft, 185 mm long**, swelling to a ~13.5 × 11 mm scoop bowl at the tip. The drawing `Herb Pouch_Scoop_V04_Drawing_V01.pdf` (16.01.2025) states 184.67 mm overall / 155 mm shaft. Three scoop options were prototyped and photographed: a channel rail, a triangular shovel scoop, and a ratchet-notched shaft.

**Evolution** (all in the files): an AI-generated origin concept (`Screenshot 2024-10-30 at 12.26.55 PM.png` — matte black gathered bag with a white cloud-shaped PUFF JUNCTION badge) → **V01, a symmetric "garlic bulb" with even vertical flutes** (`Herb Pouch_V01_1.png`) → V03 gathered/pleated → an **asymmetric "held trash bag" pivot** (`IMG_0979.png` is a Midjourney screenshot with the prompt legible: *"A bag of trash thrown over a man's shoulder held with his…"*) → an **overmolded soft-touch version with an embedded magnet and a brass wedge stand** (`6216E809-…png`). `Imperfection_1.PNG` is a deliberate asymmetry study.

### 1.3 The five `Rhino_*.step` variants — what they actually are
Not five products. From the thread: *"It is just some iterations of the Herb Pouch — tried different surfaces with a new software."* The founder replied: *"**Rhino_Loose is the one that's my favorite iteration**. I think I want to push forward with that one."*

The names are Rhino's five loft styles. All five are the same pouch body (no neck), ~135 mm tall. Measured max diameter at each height (mm, from the STEP point clouds):

| z (mm) | Straight | **Loose** | Normal | Tight | Uniform |
|---|---|---|---|---|---|
| 0 | 116.7 | **116.7** | 124.2 | 124.2 | 119.8 |
| 20 | 137.2 | **137.2** | 148.9 | 149.0 | 142.4 |
| **40 (widest)** | 145.0 | **145.0** | 161.8 | 161.7 | 154.9 |
| 60 | 138.6 | **135.8** | 152.1 | 152.0 | 145.0 |
| 100 | 64.9 | **63.7** | 75.1 | 75.2 | 80.6 |
| 120 (neck) | 39.8 | **39.8** | 47.1 | 47.1 | 48.8 |
| surface points | 8,905 | **13,086** | 46,927 | 23,569 | 61,512 |

They differ by **how full the belly is and how taut the shoulder/neck transition is** — a ~17 mm (12%) spread in max diameter — plus surface density. `Straight` and `Loose` are the slimmest and smoothest; `Normal`/`Tight` are the most inflated and are near-identical to each other (within 0.1 mm); `Uniform` sits between and has the widest neck. **The chosen one, `Loose`, is the slimmest and tightest-necked of the five.** That is a directly usable proportional fact: the brand's preferred silhouette is the *least* inflated one.

### 1.4 The bottle (a parallel interpretation of the same vessel)
`Bottle.298–301.png` — a **gloss black onion/sphere body with carved teardrop flutes** radiating from the neck and tapering to points at the equator, on a **stepped brass ringed neck with a fine diamond-knurled brass screw cap**. Same DNA, hard-surface execution. Shot on pure white with a soft contact shadow.

### 1.5 The lighter
A **Zippo-format flip-top** with an unusual trench-lighter element. Renders: `Zippo Lighter.286–290.png`, `2.204.png`, `TEST 1.120.png`, `image_12.png`, `top cover twists.jpg`.
- Chassis: rounded-rectangle with heavily radiused corners, in **matte black** or **polished chrome** (both rendered)
- **Brass/gold hardware**: hinge, lid cap, a small pin, and a **cylindrical mesh-faced barrel** riding beside the hinge (the trench-lighter chimney)
- The front face carries a **framed printed graphic panel** — a thin magenta keyline enclosing a full-bleed pop-art poster
- `Lighter box 2.step` measures **64.09 × ~64 × 15.35 mm** with a small 7.5 mm-wide tab extending to 72 mm — a flat, roughly square case ~2.5″ × 2.5″ × 0.6″
- `Lighter box 3D.pdf` is a 3D-annotation PDF and renders blank statically

---

## 2. THE MATERIALS

This is the part to get right. All hex values below were sampled from the actual pixels of the named renders (mean of a patch), not judged by eye.

### The concrete — "faux concrete", dark neutral grey, matte, mottled
The founder's spec, verbatim: *"The exterior must have a concrete feel to the touch and the heft/weight should be similar"*; *"Made of concrete and brushed brass"*; *"Water and dirt resistant concrete base"*; *"We are looking for a concrete-like finish… This finish should convey a premium, high-end feel"*; *"potential materials could include a high-density resin or a composite that mimics the appearance of concrete."* When a factory offered marble instead, he replied: **"It has to be (faux) concrete. Not interested in marble."**

Measured (`Grinder_3.png`, the best-lit view):
| surface | mean | local range within one face |
|---|---|---|
| top face (lit, catching brass bounce) | **#69635C** | #1E1710 → #A9A8A6 |
| front face, upper | **#565656** | #090909 → #696969 |
| front face, lower | **#585858** | #353535 → #A8A8A8 |
| left face | **#555555** | #0A0A0A → #7D7D7D |

In the lower-key `Grinder_1.png` the same material sits at **#444444–#4B4947**.

For a CSS/WebGL recreation:
- **Fully achromatic.** R = G = B in nearly every sample. Do not add a hue. The only warmth anywhere is the brass bounce on the top face (#69635C, where R exceeds B by 13).
- **Base albedo ≈ #565656**, sitting in a band of roughly **#44 to #60** depending on exposure.
- **Roughness very high, ~0.85.** There is no specular highlight anywhere on the concrete — only a broad, soft luminance gradient. Fresnel at grazing angles on the radiused corners is the only sheen.
- **Two scales of texture, both essential:**
  1. Broad cloudy mottling — soft patches ±10–15 levels of grey, cell size roughly 15–25 mm on the object. This is what makes it read as *cast* rather than painted.
  2. Fine dark aggregate speckle — pinpricks around #35–#3A, sparse, 0.3–0.8 mm.
  3. On the top face only, a faint directional troweled/brushed streak.
- **Edges:** the vertical corners carry a generous radius (the drawing calls **R3**, but the renders read noticeably larger — treat R3 as the spec and the render as the intent). Top and bottom edges are crisply eased (R1 / R0.5). The **parting seam** between the two halves is a 1–1.5 px crisp dark line with the faintest chamfer either side — it reads as a machined joint, not a crack.

Under real workshop light (`370afe0c-…jpeg`) the production part reads about **#61687F** — but that is a fluorescent colour cast, not the brand colour. Do not use it.

### The brass — brushed, warm, and **two-faced**
The single most useful material observation in this whole archive: **on flat faces this brass reads as a pale warm near-neutral; on the knurled and cylindrical surfaces it reads as saturated antique gold.**

Measured (`Grinder_3.png`):
| surface | mean | range |
|---|---|---|
| **flat top face** (the logo plateau) | **#D1CAC1** | #42362B → #E6E4E2 |
| **knurled band** | **#816437** | #0A0602 → #E8DCB8 |
| **smooth flange** | **#795930** | #070402 → #DDCB9F |

`Grinder_1.png` agrees: flat top **#D1C8BB**, knurl **#7D5A2B**. The macro shot `23B6BFFD-…png` (on black) gives knurl land **#675125**, groove shadow **#563B12**. `Bottle.301.png` gives cap knurl **#CCB276** and neck ring **#C3A565**.

How to build it:
- Metal, **base albedo about #B8934E / #C9A227**, **roughness ~0.28–0.35** (satin, not mirror), with a **fine circumferential brush grain** on the cylindrical surfaces and a **radial/concentric brush grain** on the flat top (clearly visible in `0002.png` and in the real machined sample `34e799f4-…jpeg`).
- The flat top washes out to **#D1CAC1** because it is mirroring a large bright studio source almost head-on. If you paint the top face gold you will get it wrong — it should be a pale champagne that only *reads* as gold in context.
- The knurl's dynamic range is enormous — **#0A0602 in the groove bottoms to #E8DCB8 on the facet crowns**, a 230-level swing across ~1 mm. That extreme micro-contrast is what makes it look expensive.
- In the darker render set (`0001–0008.png`, `23B6BFFD-…png`) the brass is pushed far more saturated and the bevels go near-mirror. That's a second, moodier treatment of the same material.

Brand-wide instruction from the founder: *"Brushed brass… protected from abrasion and oxidation."* **Brushed, never polished.**

### Other materials named in the files
- **Silicone 60A** — the 62.8 × 62.8 × 0.4 mm spacer, compression-moulded
- **Polycarbonate (PC)** — the Ø60 × 1.5 mm mesh holder, injection-moulded, glued to a metal mesh Ø58 × 0.5
- **A380 aluminium** — the factory's proposed die-cast substitute for the brass parts
- **Black anodised aluminium** — used on real internal prototype parts (`7a87fdc9-…jpeg`, `e41b9710-…jpeg`): dead matte, slightly warm-black, no sheen
- **Brushed nickel/steel** — the first machined cap sample, **#9EA8A4** (`34e799f4-…jpeg`); a cool, grey-green satin
- **Gloss black** — the bottle body, a very tight **#2E2E2E → #353535** range, i.e. flat black with hard narrow specular streaks
- **Anodised aluminium in colour** — the supplier catalogue `2024 Aluminum Grinder-2024 New Grinder Quotation.pdf` shows the commodity landscape the brand is positioning against; not the brand's own material
- **No glass, no rubber and no plating** is specified anywhere in the product files. Glass appears only as fictional e-commerce copy in the brand guide.

---

## 3. THE PATTERNS AND MARKS

### 3.1 The harlequin / diamond-checker on the concrete

**Provenance, which matters:** it is lifted from a **limited-edition Davidoff/"Churchill" concrete cube table lighter** — a grey concrete cube with a gold flip burner on top, a gold diamond plaque bearing a hatted smoking profile, an **embossed diamond-check corner pattern**, and a "484/600" edition plate on the base. Two files hold the reference: `chuchill table lighter.jpg` and `chuchill table lighter_.jpg`, the latter with **hand-drawn blue annotation circles** around exactly two things — the vertical edge where the harlequin runs, and the diamond plaque. A 48-second 4K video of the real object exists (`IMG_0499.mov`, on the media release, not in the tree).

**Geometry as built on the Puff Junction grinder** (measured off `Grinder_1.png` and `Grinder_3.png` at native resolution, scaled against the known 20.9 mm concrete half):

- A **diagonal checkerboard (harlequin)**: cells are squares rotated 45°, meeting **corner to corner**, alternate cells filled. No outlines, no gutters, no grout.
- **Cell size ≈ 13–14 mm on point** — that's **~3 cells over the 41.8 mm body height** and **~6 across the 85 mm face**. This is a *big, bold* harlequin, not a fine argyle.
- **Aspect ratio:** in the most frontal render the cells project as **1 : 1 squares on point** (measured 252 px wide × 247 px tall). On the source Davidoff lighter the lozenges are clearly **taller than wide**. Safe construction: a square on point, optionally stretched vertically 1.1–1.3×.
- **It dissolves.** Solid and dense at one **vertical corner** of the block, thinning diagonally away with a **ragged staircase front**. Individual cells drop out entirely — it is never an opacity fade.
- **It wraps the radiused vertical corner** onto the adjacent face and continues, and it **crosses the horizontal parting seam** with perfect registration between the two separately-cast halves.
- **The dark cells are not black.** They are **#414141 against #565656 concrete** in the bright render, **#181818 against #444444** in the low-key one — i.e. roughly **25–35% darker than the adjacent concrete**, matte, perfectly flush, catching the same light. Model it as a **value shift on the same material**, never as a black fill.
- **Depth:** the reference lighter's pattern is *embossed* relief; the founder's brief says **"TEXT AND IMAGES WILL BE ETCHED INTO"** the concrete; but the delivered renders show it **flat and flush with no edge shadow**. All three readings are in the files and they disagree. Flush-darker is what the hero renders actually show.

### 3.2 The brass knurl
A **diamond cross-knurl**, dimensioned in Detail A (5:1) of `Weed Grinder_Top Lid_V02.pdf`:

- **1.26 mm** — the pitch measured perpendicular to a groove. This is also exactly the side length of the diamond cell (√((1.65/2)² + (1.9/2)²) = 1.258), which cross-validates the reading.
- **1.65 mm** circumferential × **1.9 mm** axial across the diamond land (the flat crown).
- **2.11 mm** circumferential × **2.48 mm** axial across the full cell repeat including the groove.
- Diamonds are **point-up and slightly taller than wide** (1.9 / 1.65 = 1.15, i.e. grooves crossing at about **49° from horizontal** — the same angle as the 49.4° teeth, which is either deliberate or a happy consistency).
- In practice: roughly a **1.2 mm-pitch / ~20 TPI diamond knurl** — fine enough to read as texture at arm's length, coarse enough to individuate at 300 mm.

Visually (`23B6BFFD-…png`, the best macro): the diamonds have **flat brushed crowns with a small radius**, not sharp pyramids; the grooves are V-shaped with rounded bottoms and go nearly black. The band terminates cleanly top and bottom with a small flat margin. Below it, a **smooth brushed flange with visible circumferential grain**. The knurl wraps the full cylindrical side of the upper puck.

### 3.3 The wordmark on the object — **debossed, three stepped terraces, 0.2 mm total**
Detail E (15:1) on the same drawing, with two notes verbatim:
> **"puff" on First Layer (flush with the top layer of this part: 0,0mm depth)**
> **"JUNCTION" on Second Layer (0,1mm depth)**

Depths: First 0.0 / Second 0.1 / Third 0.2 mm. So the logo is a **three-step relief milled into the flat brass face**:
- the **"puff" letterforms stay at the original top surface** (0.0 mm)
- the halo/gap around them and the **"JUNCTION"** line are cut **0.1 mm**
- the outer field is cut a further 0.1 mm to **0.2 mm**

It is technically a deboss, but perceptually the letters are the high points — so it reads as embossed. **It is astonishingly shallow.** In `Grinder_1.png` and `Grinder_3.png` it is barely legible, catching light on one edge only. If you rebuild this, the mark should be a *whisper* — one raking-light edge, almost invisible from the wrong angle. That restraint is the whole character of the piece.

**Placement:** centred on the brass top face, occupying roughly 60% of the Ø55 face width, its own baseline horizontal to the block. The full lockup including the sticker contour is rendered — the contour becomes an engraved channel.

On the herb pouch the same lockup is debossed on the **cap top** and again as a small circular medallion in the **centre of the base**. On the later soft pouch (`6216E809-…png`) only "puff" is embossed on the cap.

### 3.4 The logo itself, as a drawing
From the official SVGs in `Logos-20240508T190453Z-001.zip`:
- **Puff Junction lockup: 895 × 439** (2.039 : 1). **Puff-only lockup: 895 × 408** (2.194 : 1). `JUNCTION` adds only 31 units of height because it tucks up inside the contour's lower edge.
- **13 paths** in the full lockup = 1 contour + `p u f f` + 8 letters of `JUNCTION`.
- **Only two colours exist in the official asset set: `#000000` and `#D6FD4A` (Slime).** There is **no white logo**. The files named "Light" are the *slime* version.
- Construction ratios, measured off `Puff-Only-Dark.png`: **letter stem 61–62 px : gap 18–19 px : contour stroke 16–18 px** ≈ **3.6 : 1.1 : 1**. Normalised to logo width: stroke ≈ 1.9%, gap ≈ 2.1%, stem ≈ 6.8%.
- The contour is a **single merged silhouette offset down-and-left** from the letterforms, stroked black with the background colour showing through the gap. The guide describes it as *"The three-dimensional design of the Puff cleverly plays on the word, adding depth to our brand identity."*
- "puff" is a very heavy geometric italic lowercase with a huge x-height, rounded terminals, tight letterfit, and the two `f` crossbars merging into one horizontal bar. "JUNCTION" is a lighter uppercase set at very wide tracking, optically matching the width of "puff".
- **Clearspace: "The empty space should be at least the size of the letter 'p' in our logo."**

---

## 4. THE BRAND SYSTEM (from `Puff Junction Brand Guide Compressed.pdf`, 22 pages, 1920 × 1080pt, 10.8 MB)

### Palette — quoted exactly as printed
| Name | HEX | RGB | CMYK |
|---|---|---|---|
| **SLIME** | `D6FD4A` | 214 253 74 | 20 0 87 0 |
| **DREAM** | `A5E4FF` | 165 228 255 | 31 0 0 0 |
| **FLAMINGO** | `FF8FF1` | 255 143 241 | 10 49 0 0 |
| **PINEAPPLE** | `FEF200` | 254 242 0 | 4 0 93 0 |
| **WHITE** | `FFFFFF` | 255 255 255 | 0 0 0 0 |
| **BLACK** | `000000` | 0 0 0 | 100 100 100 100 |

> *"Puff Junction's color palette marries minimalism with bold impact. Anchored in classic black and white, our brand gains depth and vibrancy from four lively colors inspired by the spirited nature of pop art."*

**Text colour rules (3.2):** on white — black headline, black body, black bold+underlined hyperlinks. On any colour except black — same, all black. On black — headline/body/links in **all colours except black**. There is no grey in the system at all.

### Typefaces — by name
- **Primary: Arnet** — *"takes center stage in three powerful weights: **Bold, Black, and Super, all elegantly presented in italics**. This distinctive typographic choice reinforces Puff Junction's bold identity. Arnet's italicized forms add a touch of dynamism and uniqueness."* It is a wide, heavy neo-grotesque with a large x-height and sheared terminals. **Italic only — there is no roman in the system.** Licensed from **ultra-kuhl.com**, three weights at €85 each, €255 total (`Screenshot 2025-09-16 at 9.21.39 AM.png`).
- **Secondary: Work Sans** — *"offers a contemporary feel, reflecting our commitment to a vibrant and forward-looking brand. Its readability enhances communication."* Weights shown: Medium, SemiBold, Bold, ExtraBold.

### Type hierarchy (2.3) — verbatim
H1 96/92 · H2 64/65 · H3 48/48 · H4 34/34 · H5 28/28 · H6 24/26 — all **Arnet Bold Italic, Uppercase, Italics**. Subtitle 1 18/23 and Subtitle 2 16/24, Arnet Bold Italic uppercase. Body 1 18/28 and Body 2 16/23, **Work Sans Medium**, sentence case. Button 16/20 **Arnet Semibold** uppercase. Caption 13/16 Work Sans Semibold. Overline 10/12 Work Sans Semibold uppercase.

### Visual-language rules — the guide's own words
- **Imagery (4.3):** *"Puff Junction's imagery embraces surrealism, infusing our visual identity with an otherworldly allure. We prioritize high-quality photography, be it product shots or model imagery… **Symbolizing the act of smoking, we welcome the incorporation of clouds**, adding depth and meaning to our visuals."*
- **Key elements (4.2):** *"Color, Typography, Imagery, Illustrations, and the strategic use of **half-tones**."*
- **Illustrations (4.4):** *"Whether drawing from pop art aesthetics or employing modern vector-based designs with clean strokes… bold, unconventional, and lively."*
- **Iconography (4.5):** *"thick strokes and rounded corners, projecting a confident and playful personality."* Spec'd as **bold strokes, transparent fill, slightly rounded corners**.
- **Buttons (4.6):** *"an **outline stroke**… The inclusion of a **sharp-edged shadow** behind the button container adds dimension."* Concretely: a solid colour fill, a ~3 px black outline, a small corner radius, and a **hard offset shadow down-right with zero blur**.
- **Background textures (4.7):** *"We select illustrations and images featuring **halftones, bold text, and lively colors**."*

### The layout system, read off the pages
Every page is built from **rounded-rectangle panels with a heavy black keyline** (radius ~24–32 px at 1920 wide), tiled edge-to-edge with a thin white gutter. Rotated mono microtype runs vertically up the left margin (`THE BEST IS YET TO COME`, `BRAND GUIDELINES`) and along the top-right (`LET THE GOOD TIMES ROLL`). Two **circular badges** recur bottom-right: `I ♥ PJ's` (slime fill, black ink) and a black type-ring reading `PUFF JUNCTION PUFF JUNCTION` around a cloud with X-X eyes. Cut-out photography sits on halftoned slime cloud-shapes.

---

## 5. THE PHOTOGRAPHY AND RENDER LANGUAGE

Two distinct treatments exist. **The first is the one to match.**

### A. The white-sweep studio set — `Grinder_1/2/3.png` (2560 × 2560, square 1:1)
Measured precisely:
- **Backdrop: a seamless infinity cove.** Perfectly **flat #EDEDED (237) horizontally** — I sampled across the full width at 8% height and got 237 at every point. Vertically it holds 237 down to ~40% of the frame, then falls smoothly: 40%→235, 50%→228, 60%→220, **70%→200–205 (darkest)**, then **lifts slightly again to 213–221 at the bottom**. That final lift is the floor catching bounce. No colour cast, no vignette, no visible horizon line.
- **Contact shadow:** broad, soft, feathered, no penumbra edge. Bottoms out around **#BBBBBB–#CBCBCB**. It sits directly under and slightly forward, implying a very large soft source almost overhead.
- **Key light:** one big soft source from the upper front, slightly off to one side — a bright top face with a smooth graduated falloff down the visible walls. No hard specular anywhere on the concrete; only the brass carries a highlight.
- **Warm bounce:** the brass throws a faint gold cast onto the concrete immediately around it (the top face reads #69635C vs #565656 on the walls).
- **Camera:** long lens, minimal convergence. Three-quarter view, roughly **35–45° elevation**. `Grinder_2/3` share a lower, sharper angle than `Grinder_1`.
- **Framing:** object + shadow occupies **x 0.148 → 0.880** (73% of width) and **y 0.30 → 0.811**. That leaves **~30% headroom above, ~19% below**, and the object sits **slightly left of centre and low**. Generous, calm, luxury-goods framing.
- One object, one surface, nothing else in frame. No props, no context, no hands.

### B. The dark set — `0001–0008.png` (2160 × 2160), `23B6BFFD-…png`, `84962639-…png`
Black or near-black ground (#000000–#393939), far more saturated brass with near-mirror bevels, a single hard top light, and a strong falloff into the background. Moodier, jewellery-like. Also includes exploded and sectioned technical views rendered in the same lighting — an excellent, underused device.

### C. Other languages present
- **Marker concept sketches** (`Storage.jpg`, `Storage-2/3/4.jpg`, `IMG_9245.jpeg`) — black fineliner line, cool-grey markers for the body, **warm tan/ochre marker for the brass**, hatched ellipse ground shadows, hand-lettered caps annotations, photographed on white paper with the paper edge and a stray pen in frame. Real, warm, and very on-brand for an "authored object" story.
- **Workbench documentation** (`IMG_9870/9871.jpeg`, `370afe0c-…jpeg`) — 3D-printed and production parts on a **green cutting mat** with visible grid, under flat workshop light. Honest, process-y.
- **The brand guide's own photography** — surrealist collage: models seated on clouds on hot-pink infinity, cloud-for-head figures on slime/blue split fields, low-angle sky shots.

---

## 6. WHAT IT CLAIMS — in its own words

From the brand guide (this paragraph is the brand's manifesto and appears on three separate pages):
> *"At Puff Junction, we are not just creating another cannabis lifestyle brand; we are reimagining the very essence of what it means to interact with, consume, and experience cannabis in a society that is on the cusp of transformative change."*

> *"Our vision is to turn the cannabis industry on its head, blending art, culture, and a touch of irreverence to craft experiences and products that challenge norms and provoke thought."*

> *"We're not just in the business of selling cannabis accessories; **we're in the business of creating cultural artifacts**."*

> *"Our narrative is not written; it is painted, sculpted, coded, and sometimes, whispered."*

> *"We aimed to create an identity that stands alone as a piece of art."*

**Taglines and copy that actually exist in the files:**
- `THE BEST IS YET TO COME` / `LET THE GOOD TIMES ROLL` (the two recurring marginal lines)
- `THE INTERSECTION WHERE HIGH ART MEETS HIGH TIMES.`
- `HIGH ART ⟷ HIGH TIMES`
- `This is Nothin' but half baked ideas`
- `All the stuff for all the puff.`
- `Up, up, and away` / `For those that desire only the highest, your next adventure awaits.`
- `Take a trip` (the primary CTA)
- `THE HIGHEST OF HIGHS` / `ELEVATED GOODS`
- `DO YOU WANT THE BEST FOR YOUR BUD?` / `1-800-CALL-PUFF`
- `Add to Stash` (the cart CTA), `Wishlist`
- `CAUTION! FRAGILE HANDLE WITH CARE` (shipping-label graphic, slime on black)
- `PUFF PASS` (packing tape)
- `I ♥ PJ's`, `PUFF !` (a triangular caution sign)
- Fictional catalogue entries used in mockups: `TERPICANA GLASS $150 USD`, `THUNDER CLOUD — GRAVITY BONG — GLASS — $2,500`

**The founder's own positioning language** (from the brand-development thread, worth quoting because it is sharper than the guide):
> *"'**sophisticated minimalism with edge**', where we're utilizing clean lines and asymmetrical shapes… '**monochrome with strategic color splashes**', where we consider using a primarily monochromatic palette with intentional splashes of bold colors… '**high-concept product presentation**', where our products are framed as **collector's items or limited editions**, but [sometimes] items with which you 'can toy with if you choose'."*

> *"We want to put forth a status of art but **without veering into the realm of playfulness or kitsch**."*

**The brand story** the identity was briefed against is a **speakeasy**: *"a dimly lit, cobbled street at dusk… the rich aroma of aged wood and a hint of jasmine… a nondescript door… soft, golden light, contrasting with the deep, velvet curtains… An antique chandelier glimmers overhead… With a tinge of reckless abandon and unbridled impulsiveness, the atmosphere hints at the unexpected."* Three named audience personas were written — an architect in her mid-30s, a 40-year-old graphic designer, a writer in her late 20s.

**Product claims, from the original grinder brief:** *"Made of concrete and brushed brass · Water and dirt resistant concrete base · Brushed brass… protected from abrasion and oxidation."* Target price to manufacture: **$10–20/unit FOB**; a quote around $700/unit was rejected as far too expensive. **No health, efficacy, or performance claim appears anywhere in the archive.**

---

## 7. THE BEST INGREDIENTS — ranked

1. **The circle-in-square silhouette.** A Ø63 brass disc on an 85 mm square face — 74% coverage — with a 15.4 mm proud stand. The single most recognisable shape in the brand, and it works at any scale from favicon to hero. Source: `Grinder_3.png`, `image.png` (top ortho view).
2. **The diamond cross-knurl.** 1.26 mm pitch, 1.65 × 1.9 mm lands, point-up, flat-crowned, with a ~230-level luminance swing across 1 mm. It appears on *every* product — grinder cap, pouch cap, bottle cap — and it is the brand's true signature texture. It tiles perfectly and is trivially reproducible as a CSS/WebGL normal map. Source: `23B6BFFD-…png` (the macro), Detail A of `Weed Grinder_Top Lid_V02.pdf`.
3. **The dissolving harlequin.** A ~13–14 mm diagonal checkerboard at 25–35% value-drop, dense at a corner, dissolving diagonally with a staircase front, wrapping radii and crossing seams. Rare, ownable, and it carries a real provenance story. Source: `Grinder_1.png`, `Grinder_3.png`, `chuchill table lighter_.jpg`.
4. **The two-value brass.** Pale champagne **#D1CAC1** on flats, saturated antique gold **#7D5A2B–#816437** on curves. Getting this split right is the difference between "expensive metal" and "gold plastic".
5. **The mottled dark faux-concrete.** Achromatic **#565656** base, roughness ~0.85, two scales of texture, generous corner radii, crisp parting seam. A perfect quiet foil for everything else.
6. **The 0.2 mm whisper deboss.** A three-terrace relief where the letters stay at the surface. A logo that is barely there is a more confident statement than one that shouts — and it is the exact inverse of the paper brand.
7. **The `puff` sticker lockup.** 895 × 439, 13 paths, black or `#D6FD4A` only, contour offset down-left, clearspace = the height of the `p`. Complete, licensed-free-of-ambiguity, and already vectorised.
8. **Slime `#D6FD4A` used as a single ration.** In the object world it never appears; in the paper world it is everything. One slime element inside an otherwise monochrome scene is the most obvious unexploited move in this brand.
9. **The white-sweep studio grammar.** Flat #EDEDED wall → soft fall to #C8 at 70% → lift at the floor; huge soft key; 73%-width crop with 30% headroom. Fully specified above; reproducible exactly.
10. **The halftone.** Coarse black dot screens over photographic clouds and faces, plus halftone dissolves at the edges of colour shapes. The one element that legitimately belongs to *both* halves of the brand.
11. **The cloud.** Stated in the guide as the brand's smoking symbol, used as a head-replacement, a badge shape, a texture, and a mascot with X-X eyes. Photographic, never illustrated, always cut out.
12. **The gathered-pouch silhouette.** The `Rhino_Loose` profile — slimmest of five, max Ø145 at 40 mm, neck Ø39.8 — plus the 185 mm Ø7 concealed brass scoop. A genuinely strange, memorable form.

---

## 8. CONTRADICTIONS AND CAUTIONS

**The big one — two brands.** The 2024 identity is neon pop-art; the products are monochrome industrial. The founder explicitly asked (30 Oct 2024) to move *"not completely, but subtly from a vibrant and somewhat playful neon feel to a subtler, more refined aesthetic… **'core aesthetic adjustments'** that align with a bit more sophistication."* That refresh was never delivered — the brand designer's engagement tapered into an unstarted website proposal. There is no resolved system in this archive that unites them.

**Self-contradiction inside the brief.** The founder wrote *"without veering into the realm of playfulness or kitsch"* in Dec 2023, and the identity delivered in Feb 2024 is the most playful, kitsch-adjacent thing in the archive. Both are genuinely his brand. Choose deliberately.

**A large amount of the artwork is AI-generated and has garbled type.** `Design-01.jpg` and `Design.pdf` (the pop-art side-wrap), the whole `0001–0008.png` render set, `Herb Pouch.PNG`, `R1.png`, `D65C753D-…webp`, `d760ce47-…webp`, and every lighter render contain nonsense words: **"PIGH", "CANKTION", "PIHTH D, JUPH SNND", "JOIUE BIES", "DOGRAOK", "CLNDEN", "Ted Rothlo", "PUFF JUDF JUNCTION", "PUNDE", "HENLOWID"**. These are placeholders, not copy. Never reproduce them. They also introduce **orange and cyan**, which are *not* in the brand palette.

**Two different graphic treatments for the concrete body exist and were never reconciled:** (a) the **restrained harlequin dissolve** (`Grinder_1/2/3.png`) and (b) an **all-over pop-art comic wrap** (`0001–0008.png`, `R1.png`, `Design-01.jpg`). The harlequin renders are later, cleaner and were the ones shown to the brand designer as the new direction. The wrap is concept-stage.

**Three disagreeing accounts of how the graphic is applied.** The founder's brief says *"TEXT AND IMAGES WILL BE ETCHED INTO"*; the source Davidoff lighter's pattern is *embossed* relief; the delivered renders show it **flat and flush**. Pick flush-darker if you want to match the hero renders.

**Corner radius mismatch.** The drawings call **R3** on the 85 mm concrete block; the renders read a visibly larger radius (roughly 7–10 mm). Spec says R3.

**Height figures.** Use **57.2 mm** (DFM deck, assembled). The `Weed Grinder_V01.step` Z bounding box is 72.00 mm; the original brief targeted **70 × 70 × 90 mm, 0.741 kg** — those were the *reference lighter's* specs, not the delivered design. All three numbers appear in the archive.

**The "Rhino" files are not products.** They are five Rhino loft-style surface iterations of the pouch body. `Rhino_Loose` is the chosen one.

**Not Puff Junction at all** — several files are the contractors' portfolio samples and will mislead anyone scanning by filename: `rw_cloudy_renderings_lightroom-2.png` is a **hair dryer**; `IMG_1541/1542/1543.png` are screenshots of a **prosthesis, carbon fibre and radiator** portfolio; `BOUNCE DESIGN_Portfolio_2024_.pdf` is a studio portfolio; `Candle Rocker.png`, `Test_2 Belts.5.png` and `Prothese_Animation_*.mp4` are unrelated; `2024 Aluminum Grinder-2024 New Grinder Quotation.pdf` is a Chinese supplier's commodity catalogue.

**Retired or one-off variants.** The `A.C.` script monogram lid (`18.png`) is a personalisation study, not brand type. The first machined cap sample is **brushed nickel/steel (#9EA8A4)**, not brass — the brass came later. Early CAD (`1.PNG`–`9.png`) shows a purely **cylindrical** grinder before the concrete cube existed.

**No white logo exists.** The official set is black and `#D6FD4A` only, in four lockups (Puff Junction / Puff Only × Dark / Light) across SVG, PNG, retina PNG and JPG. The five `.fig` files are byte-identical duplicates of one Figma file containing the brand guide's logo page.

**Nothing shipped.** The website (a $2,000 four-milestone engagement) reached an interactive Figma prototype and stalled; the component/handoff milestone was never started. The grinder reached production samples and then paused. The lighter never left CAD. Treat the whole archive as a rich, unfinished kit of parts rather than a live system.

**Concrete is faux concrete.** The founder rejected marble outright — *"It has to be (faux) concrete. Not interested in marble."* — but the real material was to be a high-density resin or composite that mimics concrete. Weight and touch were the actual requirements, not literal cement.

---

### Web-usable asset sizes (filenames only)
`Puff Junction Brand Guide Compressed.pdf` 10.8 MB · `Grinder_1/2/3.png` 3.6–4.3 MB each · **`Grinder_1/2/3_jpg.jpg` 1.2–1.5 MB — use these** · `thumb_Grinder_1_jpg.jpg` 15 KB · `thumb_Grinder_2.png` 91 KB · `0002.png` 7.0 MB (heaviest) · `23B6BFFD-…png` 1.2 MB (the knurl macro) · `6216E809-…png` 1.4 MB · `F7988B7C-…png` 2.8 MB · `Herb Pouch_V01_1.png` 370 KB · `Bottle.301.png` 880 KB · `Zippo Lighter.290.png` 1.7 MB · `Design-01.jpg` 1.3 MB / `Design.pdf` 510 KB (vector) · `chuchill table lighter.jpg` 30 KB · `IMG_9245.jpeg` 4.1 MB · `Storage.jpg` 3.8 MB · `R1.png` 1.3 MB · the two real-part photos `34e799f4-…jpeg` and `370afe0c-…jpeg` 50 KB each. The logo SVGs inside `Logos-20240508T190453Z-001.zip` are ~10–12 KB and are the only truly resolution-independent assets in the archive.

*Nothing in `/home/user/puffjunction` was modified. All working files were written to the session scratchpad.*