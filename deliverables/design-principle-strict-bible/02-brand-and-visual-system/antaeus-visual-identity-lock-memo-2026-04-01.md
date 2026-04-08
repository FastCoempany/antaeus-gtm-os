# Antaeus Visual Identity Lock Memo

Date: 2026-04-01

Status: canonical visual identity lock for the pre-beta rebuild

Purpose: lock the actual visual identity of Antaeus so future prototypes, redesign work, architecture-reset surfaces, and implementation phases stop drifting back toward the old interface DNA.

This memo governs:

- palette direction
- neutral strategy
- accent strategy
- typography
- button geometry
- card and surface behavior
- sheet and rail treatment
- density and spacing rhythm
- motion and focus behavior
- what Antaeus must not look like again

This memo does **not** lock the final architecture by itself.
It locks the visual system the architecture must be born inside.

---

## 1. Source Stack

The visual identity lock is derived from five source layers, in order of authority.

### Source Layer 1: Empirical visual-system research

- [deep-research-report.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deep-research-report.md)
- [Color Systems in Dominant US Digital Products.pdf](/c:/AppDev/v1AntaeusApp/Appv2_290126/Color%20Systems%20in%20Dominant%20US%20Digital%20Products.pdf)
- [The Definitive Color Census of Americas Dominant Digital Products.pdf](/c:/AppDev/v1AntaeusApp/Appv2_290126/The%20Definitive%20Color%20Census%20of%20Americas%20Dominant%20Digital%20Products.pdf)

These govern:

- shade ladders
- contrast safety
- state math
- surface layering
- component heights
- corner radii
- motion ladders
- semantic token logic

### Source Layer 2: Brand truth

- [antaeus-rebrand-truth-lock-memo-2026-03-31.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-rebrand-truth-lock-memo-2026-03-31.md)

This governs:

- emotional territory
- tone
- seriousness
- what the product should feel like
- what the product must never drift into

### Source Layer 3: Architecture truth

- [antaeus-architecture-truth-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-truth-memo-2026-04-01.md)
- [antaeus-information-architecture-reset-program-2026-03-31.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-information-architecture-reset-program-2026-03-31.md)

This governs:

- how surfaces behave
- what command, sheet, workspace, and graph should feel like
- what must be loud and what must stay quiet
- what components are serving behavior vs. just filling UI

### Source Layer 4: Product and psychology truth

- [antaeus-app-academy-v2.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-app-academy-v2.md)
- the behavioral psychology framework synthesized from the research and founder discussion

This governs:

- least-resistance interaction
- visible progress
- tension migration
- one dominant next move
- pre-cognitive metric anchoring

### Source Layer 5: Live design-lab artifacts

- [jsx-design-system-taste-test.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/jsx-design-system-taste-test.jsx)
- [jsx-design-system-taste-test-preview.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/jsx-design-system-taste-test-preview.html)

These govern:

- what visual-system work has already been explored
- which token and section structures are salvageable
- which interaction and component experiments are useful inputs
- what still feels too close to the old interface DNA

Important boundary:

the taste-test artifact is a **working lab source**, not the final authority.

That means:

- it is downstream of the research and truth memos
- it can inform the spec
- it cannot override the locked brand and architecture direction

### Source Layer 6: Rejection logic

- the current/old interface itself

This governs what we are explicitly leaving behind.

---

## 2. Executive Visual Truth

Antaeus should not look like:

- a dark founder-built admin shell
- a generic CRM
- a dashboard bundle
- a purple SaaS product
- a safe B2B template

Antaeus should look like:

- bright
- modern
- structurally intelligent
- calm under pressure
- visually tempting
- expensive
- specific

The key phrase is:

**premium operating instrument**

Not:

**modular software suite**

---

## 3. What The Old Interface Got Wrong

The old/current interface carries too much of the following:

- dark-heavy surfaces
- warm-heavy atmosphere
- box-after-box card accumulation
- too much border-defined containment
- too much explanatory text at the surface
- too many equal-weight visual regions
- too much “builder UI” energy

The result is that even when the product is strategically strong, the interface still risks feeling:

- heavier than it should
- more cluttered than it should
- more local and stitched than it should
- less desirable than it should

This is now explicitly rejected.

---

## 4. Visual Design Thesis

Antaeus should feel like a strategic operating room for founder-led sales, rendered in a bright, high-conviction visual language where urgency, confidence, and compounding are legible at a glance.

The interface should create:

- clarity before explanation
- attraction before instruction
- consequence before decoration

The user should feel:

- invited in
- not overwhelmed
- not managed
- not lectured
- not trapped in admin

They should feel:

- “this system sees the work clearly”
- “this feels smarter than the tools I am used to”
- “this looks expensive and alive”

---

## 5. Palette Lock

### 5.1 Core direction

Antaeus is no longer dark-first.

The core environment is now:

- light / bright base
- deep navy for authority
- structured blue for information and system state
- warm orange for urgency, primary moves, and pressure
- supportive green for healthy/complete states

### 5.2 Primary palette

Locked base hues:

- Orange: `#E6701E`
- Blue: `#2471E7`
- Navy: `#0A1C40`

These remain the identity anchors.

### 5.3 How each hue behaves

#### Navy

Role:

- primary text
- high-authority headings
- structural seriousness
- deep contrast without pure black harshness

Navy is not the base page fill.
It is the authority color.

#### Blue

Role:

- informational state
- structural selection
- active surface mode
- links and focus
- graph/diagnostic entry

Blue is the system-intelligence color.
It is not the generic CTA color everywhere.

#### Orange

Role:

- primary action
- urgent state
- visible pressure
- gap salience
- behavioral attention point

Orange is rationed.
If everything is orange, nothing is important.

#### Green

Role:

- healthy state
- completion
- verified system confidence

### 5.4 Neutral strategy

The product should use:

- white and off-white backgrounds
- pale cool tints for layering
- deep navy-charcoal text
- soft blue-gray borders

Avoid:

- stark black text on pure white everywhere
- heavy gray sludge
- muddy beige warmth

The neutrals should feel:

- clean
- sharp
- modern
- breathable

---

## 6. Semantic Color Logic

Color is not chosen by hue alone.
It is chosen by semantic role.

### Locked semantic roles

- `page`
- `surface`
- `surface-alt`
- `surface-soft`
- `border`
- `border-strong`
- `text-primary`
- `text-secondary`
- `text-muted`
- `action-primary`
- `action-secondary`
- `focus`
- `info`
- `urgent`
- `active`
- `healthy`
- `blocked`
- `warning`

### Key lock

We do **not** use raw hue names as component logic.

Wrong:

- “make this orange”

Right:

- “make this urgent”
- “make this primary action”
- “make this informational”

This prevents the system from collapsing into color taste instead of structured meaning.

---

## 7. Contrast and Accessibility Lock

Accessibility must be structural.

That means:

- text-safe shades are defined ahead of time
- state variants are defined ahead of time
- focus is tokenized
- icon-only contrast is not guessed

### Contrast rules

- normal text must meet WCAG AA minimum
- icons and strokes must meet their minimum contrast threshold
- orange used as text must use a darker accessible text-safe orange, not the same orange used for CTA fills

### Focus lock

Focus is visible and deliberate.

Recommended lock:

- 2px focus ring
- blue-led focus color
- soft outer glow only as reinforcement

Focus must feel:

- modern
- crisp
- keyboard-legible

Not:

- browser-default accident

---

## 8. Typography Lock

The old typography direction is not the future.

### Locked type families

#### Display / major attention / primary metric

- `Plus Jakarta Sans`

Job:

- object names
- hero statements
- oversized metrics
- major command-surface anchors

It should feel:

- bold
- modern
- geometric
- decisive

#### Body / interface / reading layer

- `Outfit`

Job:

- body copy
- interface labels
- sheet paragraphs
- control labels

It should feel:

- lighter
- cleaner
- more modern
- less heavy than the old stack

#### System / meta / machine layer

- `Space Mono`

Job:

- system labels
- state microcopy
- density toggles
- pill labels
- graph/diagnostic framing

It should feel:

- technical
- characterful
- restrained

### Typography behavior lock

The main metric or primary attention point should always hit before the explanatory copy.

That means:

- oversized numeric anchors
- high weight
- strong contrast
- supporting copy quieter and secondary

This is a behavioral rule, not just a typography preference.

---

## 9. Shape and Geometry Lock

### 9.1 Buttons and controls

Buttons and controls should be sharper than the old UI, not softer.

Locked direction:

- interactive controls: tighter corners
- large surfaces: softer corners
- pills: full rounded

### 9.2 Radius hierarchy

Recommended lock:

- buttons: `6px`
- inputs: `6px`
- small controls: `6px`
- cards/surfaces: `16-18px`
- large sheets: `24-28px`
- pills: `full`

Behavioral meaning:

- controls feel like instruments
- surfaces feel like environments
- pills feel like classified state units

### 9.3 Component heights

Locked height tiers:

- `32`
- `36`
- `40`
- `48`

These should govern:

- chips
- small controls
- standard buttons and inputs
- prominent actions and hero controls

No ad hoc component heights.

---

## 10. Surface Strategy Lock

Antaeus should not be card soup.

That means:

- not every grouping becomes a boxed card
- not every section gets the same border treatment
- not every surface deserves equal visual weight

### Surface hierarchy

#### Page background

Bright, soft, quiet.

#### Primary surface

White or near-white.
Subtle shadow.
Minimal border.

#### Secondary surface

Cool tint or warm tint where meaning supports it.

#### Inspection layer / sheet

Highest density.
Highest clarity.
Clear elevation.

#### Workspace surface

Broader canvas.
Fewer decorative dividers.
More structural grouping.

### Border vs shadow rule

Use:

- subtle shadow for elevation
- light borders for separation

Do not rely on:

- thick outlines
- dark panels stacked endlessly

---

## 11. Button and Action Logic Lock

Buttons are not generic components first.
They are behavioral instruments.

### Primary action

One true primary move per important surface.

Visual treatment:

- orange fill
- white text
- elevated enough to feel desirable
- never duplicated casually

### Secondary action

Quiet fallback.

Visual treatment:

- white or pale surface
- navy text
- structured border

### Tertiary / ghost / inline actions

Used for:

- low-cost inspection
- filtering
- supporting actions

### Explicit rejection

Do not import generic button taxonomies without product logic.

That means:

- no meaningless rainbow action set
- no loud tertiary buttons
- no unearned FAB behavior by default

Floating action buttons are not part of the locked desktop product language unless a later specific use case earns them.

---

## 12. Chip, Badge, and Gap Logic Lock

Chips and badges are central to Antaeus because the system is state-heavy.

They should be used for:

- state
- object type
- gaps
- filters
- confidence
- mode

They should not be used as:

- decorative clutter
- novelty labels

### Gap indicator lock

The `⊘` system remains.

It is one of the clearest behavioral devices in the product because it turns missing truth into visible tension.

That is preserved.

---

## 13. Input Control Lock

Inputs should feel:

- clean
- crisp
- expensive
- not generic browser admin fields

They should use:

- consistent heights
- tight radii
- explicit focus treatment
- ample internal spacing
- minimal chrome

They should not feel:

- heavy
- sunken
- noisy
- over-outlined

---

## 14. Navigation and Sheet Lock

Navigation components should derive from the architecture reset, not from generic sidebars and menus.

### Command layer

The main top-level interaction is the command surface.

### Sheet layer

The sheet must feel:

- denser than the source block
- like a micro-brief for one object
- like a threshold into deep work

### Workspace layer

The workspace should not visually resemble the old module shell with superficial improvements.

It should feel:

- object-anchored
- focused
- less text-heavy at the top
- more instrument-like

### Graph layer

The graph should feel:

- hidden
- rewarding
- cool
- diagnostic

Not:

- admin
- required
- system map homework

---

## 15. Communication Component Lock

Badges, progress, snackbars, banners, and notices must communicate actual truth.

They are allowed for:

- save confirmation
- degraded state
- sync truth
- progress in a meaningful process
- confidence change

They are not allowed as:

- ambient interface chatter
- generic success confetti
- productivity theater

---

## 16. Density and Spacing Lock

The product should pursue calm density.

That means:

- high information clarity
- not empty luxury
- not clutter

### Spacing base

Locked rhythm:

- 4px base

### Macro rhythm

Larger grouping should still feel deliberate and generous.

### Density behavior

The command layer should support multiple densities of the same truth:

- Brief
- Grid
- Queue

The visual system should support that without changing identity.

---

## 17. Motion Lock

Motion should feel:

- modern
- quick
- physical enough to feel intentional
- never gimmicky

### Motion roles

- micro feedback
- control response
- sheet rise
- workspace transition
- graph reveal

### Motion rule

Motion reinforces state change and continuity.
It does not exist to decorate emptiness.

---

## 18. What Antaeus Must Never Look Like Again

The following are now visually prohibited directions:

- dark brown / dark gold shell dominance
- generic dark founder-admin aesthetic
- heavy card grids with equal-weight everything
- purple-heavy SaaS styling
- overly warm, moody, dim interfaces
- inflated whitespace without command clarity
- ornate gradients as a substitute for hierarchy
- component-library-first visuals that ignore product behavior

---

## 19. Visual Identity Definition of Done

The visual identity is only truly locked when all of the following are true:

1. the palette is defined with semantic roles and accessible variants
2. the typography stack is fixed
3. control geometry is fixed
4. surface hierarchy is fixed
5. the product no longer visually resembles the old interface DNA
6. a rebuilt taste-test artifact proves the system
7. the architecture prototype is rebuilt in the new identity, not the old one

---

## 20. Immediate Next Steps

From here, the sequence is:

1. lock this memo
2. write the visual system spec from it
3. rebuild the taste-test artifact in the locked identity
4. rebuild the architecture prototype in the locked identity
5. only then continue with architecture-reset prototyping and implementation planning

---

## 21. Bottom Line

The architecture truth is mostly clear.
The visual identity truth was not.

This memo corrects that.

Antaeus is now locked to move toward a bright, high-conviction, semantically structured, behaviorally disciplined visual identity that feels like a premium operating instrument, not a dressed-up version of the old app shell.
