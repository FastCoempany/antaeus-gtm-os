# Antaeus Visual System Spec

Date: 2026-04-01

Status: canonical visual-system specification for the pre-beta rebuild

Purpose: translate the visual identity lock into exact token, component, and surface rules so future taste tests, architecture prototypes, and production implementation stop drifting.

This document is the bridge between:

- the visual identity lock
- the architecture truth
- the existing design-system taste-test artifact
- the future architecture-reset prototype

This is the implementation-grade visual spec.

---

## 1. Authority and Ordering

This spec is subordinate to:

- [antaeus-visual-identity-lock-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-visual-identity-lock-memo-2026-04-01.md)
- [antaeus-architecture-truth-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-truth-memo-2026-04-01.md)
- [antaeus-rebrand-truth-lock-memo-2026-03-31.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-rebrand-truth-lock-memo-2026-03-31.md)

This spec directly governs:

- the next rebuild of [jsx-design-system-taste-test.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/jsx-design-system-taste-test.jsx)
- the next rebuild of the architecture-reset prototype
- later production token extraction and replacement work

---

## 2. Executive System Position

Antaeus is a bright, modern, behaviorally disciplined operating instrument.

It is not:

- a dark founder admin shell
- a purple SaaS clone
- a CRM
- a generic B2B dashboard
- a component-library-first interface

The visual system must support:

- command-first work
- object continuity
- pre-cognitive attention anchoring
- one dominant next move
- visible gaps and tension
- dense inspection when the user goes deeper

The visual system must not support:

- equal-weight visual noise
- decorative abundance
- generic control styling
- box soup
- top-of-page essay density

---

## 3. System Architecture for Tokens

The visual system must use a layered token architecture.

### Layer 1: Primitives

Raw values only.

These include:

- hue ladders
- neutral ladders
- type families
- font sizes
- line heights
- spacing values
- radii
- shadows
- motion curves
- motion durations
- breakpoints

### Layer 2: Semantic aliases

These map primitives to meaning.

Examples:

- `color.page`
- `color.surface`
- `color.surfaceAlt`
- `color.textPrimary`
- `color.actionPrimary`
- `color.stateUrgentText`
- `color.stateUrgentSurface`
- `color.gapIndicator`
- `color.focusRing`

### Layer 3: State tokens

These precompute behavior for:

- default
- hover
- active / pressed
- selected
- disabled
- focus
- loading
- degraded

### Layer 4: Component tokens

These define exact component behavior.

Examples:

- `button.primary.height.md`
- `button.secondary.radius`
- `chip.urgent.surface`
- `sheet.header.padding`
- `commandCard.metric.size`
- `input.default.border`
- `rail.surface.bg`

### Rule

No raw primitive values inside component implementations except in the token registry.

---

## 4. Palette System

### 4.1 Base hue families

The locked core hues remain:

- Orange: `#E6701E`
- Blue: `#2471E7`
- Navy: `#0A1C40`

Supporting families:

- Green
- Red
- Neutral

### 4.2 Neutral ladder

This is the base structural ladder.

Recommended neutral ladder:

- `neutral.0` `#FFFFFF`
- `neutral.25` `#FBFCFE`
- `neutral.50` `#F6F8FC`
- `neutral.100` `#EDF2F9`
- `neutral.200` `#DDE6F2`
- `neutral.300` `#C6D3E3`
- `neutral.400` `#9BB0C8`
- `neutral.500` `#7A8DA8`
- `neutral.600` `#5D7290`
- `neutral.700` `#46607F`
- `neutral.800` `#253B5D`
- `neutral.900` `#0A1C40`

Meaning:

- `0-100` are surface and background territory
- `200-400` are borders and subtle separators
- `500-700` are muted, secondary, and support text
- `800-900` are high-authority text and structure

### 4.3 Orange ladder

Orange is a pressure/action ladder, not a full-environment ladder.

Recommended orange ladder:

- `orange.50` `#FFF6EF`
- `orange.100` `#FFE9D8`
- `orange.200` `#FFD3B0`
- `orange.300` `#F6B27F`
- `orange.400` `#EE8D47`
- `orange.500` `#E6701E`
- `orange.600` `#D26417`
- `orange.700` `#C55C12`
- `orange.800` `#9F470A`
- `orange.900` `#783305`

Meaning:

- `50-100` = urgent tints and action glows
- `500` = primary action fill
- `600` = hover
- `700` = active / pressed and text-safe urgent copy
- `800+` = rare high-contrast urgent text if needed

### 4.4 Blue ladder

Blue is the structure, information, and focus ladder.

Recommended blue ladder:

- `blue.50` `#F3F7FF`
- `blue.100` `#E7F0FF`
- `blue.200` `#D1E2FF`
- `blue.300` `#A8C9FF`
- `blue.400` `#6E9EFF`
- `blue.500` `#2471E7`
- `blue.600` `#1E64D1`
- `blue.700` `#1858BA`
- `blue.800` `#12428B`
- `blue.900` `#0B2D5E`

Meaning:

- `50-100` = info tints and selected surfaces
- `500` = selected state, structural active state, focus family
- `600` = hover
- `700` = active / pressed / strong link
- `800+` = text-safe structural blue if needed

### 4.5 Navy ladder

Navy is authority, not background heaviness.

Recommended navy ladder:

- `navy.50` `#F2F5FA`
- `navy.100` `#E9EEF8`
- `navy.200` `#D3DDEE`
- `navy.300` `#A9B9D2`
- `navy.400` `#6F86AB`
- `navy.500` `#3E577F`
- `navy.600` `#253B5D`
- `navy.700` `#182B48`
- `navy.800` `#10213D`
- `navy.900` `#0A1C40`

Meaning:

- `50-100` = soft structural tints
- `600-900` = primary text, deep labels, authority accents

### 4.6 Green ladder

Green is health and completion.

Recommended green ladder:

- `green.50` `#F1FBF7`
- `green.100` `#E3F6EE`
- `green.200` `#CBECDC`
- `green.300` `#98D7BB`
- `green.400` `#4CB88A`
- `green.500` `#129266`
- `green.600` `#0F8059`
- `green.700` `#0C6A49`
- `green.800` `#0A543B`
- `green.900` `#083F2D`

### 4.7 Red ladder

Red is blocked, broken, or truly failing.
It should be rarer than orange.

Recommended red ladder:

- `red.50` `#FFF3F3`
- `red.100` `#FFE4E4`
- `red.200` `#FFCACA`
- `red.300` `#F59D9D`
- `red.400` `#E26767`
- `red.500` `#C84141`
- `red.600` `#B43636`
- `red.700` `#982B2B`
- `red.800` `#772121`
- `red.900` `#581818`

---

## 5. Semantic Color Role Map

The following semantic aliases are locked.

### Page and surface

- `color.page = neutral.50`
- `color.surface = neutral.0`
- `color.surfaceAlt = blue.50`
- `color.surfaceSoft = orange.50`
- `color.surfaceStrong = navy.100`

### Borders

- `color.border = neutral.200`
- `color.borderStrong = neutral.300`
- `color.borderSelected = blue.500`

### Text

- `color.textPrimary = navy.900`
- `color.textSecondary = neutral.700`
- `color.textMuted = neutral.500`
- `color.textInverse = neutral.0`

### Action

- `color.actionPrimary = orange.500`
- `color.actionPrimaryHover = orange.600`
- `color.actionPrimaryPressed = orange.700`
- `color.actionPrimaryText = neutral.0`

- `color.actionSecondary = neutral.0`
- `color.actionSecondaryHover = neutral.50`
- `color.actionSecondaryPressed = neutral.100`
- `color.actionSecondaryText = navy.900`
- `color.actionSecondaryBorder = neutral.300`

### Information and focus

- `color.info = blue.500`
- `color.focus = blue.500`
- `color.link = blue.700`

### States

- `color.stateUrgentText = orange.700`
- `color.stateUrgentSurface = orange.50`
- `color.stateUrgentBorder = orange.200`

- `color.stateActiveText = blue.700`
- `color.stateActiveSurface = blue.50`
- `color.stateActiveBorder = blue.200`

- `color.stateHealthyText = green.700`
- `color.stateHealthySurface = green.50`
- `color.stateHealthyBorder = green.200`

- `color.stateBlockedText = red.700`
- `color.stateBlockedSurface = red.50`
- `color.stateBlockedBorder = red.200`

### Gap

- `color.gapText = orange.700`
- `color.gapSurface = orange.50`
- `color.gapBorder = orange.200`

---

## 6. Typography System

### 6.1 Families

Locked families:

- display: `Plus Jakarta Sans`
- body: `Outfit`
- system: `Space Mono`

### 6.2 Type tiers

Recommended scale:

- `display.hero` `56/60`
- `display.h1` `48/52`
- `display.h2` `40/44`
- `display.h3` `32/36`
- `display.h4` `24/28`

- `metric.xl` `52/52`
- `metric.lg` `42/44`
- `metric.md` `32/36`
- `metric.sm` `24/28`

- `body.lg` `18/30`
- `body.md` `16/26`
- `body.sm` `14/22`
- `body.xs` `13/20`

- `system.md` `11/16`
- `system.sm` `10/14`

### 6.3 Weight rules

- hero / major display: `800`
- object title / primary anchor: `800`
- primary metric: `800`
- standard heading: `700`
- body emphasis: `600`
- body default: `500`
- muted/system: `500`

### 6.4 Typographic behavior rules

1. The primary metric should hit before the label.
2. Object names should feel stronger than section names.
3. Supporting explanation should remain quieter than the number or action.
4. Surface text should shrink, but depth text in sheet/workspace can be more explanatory.

---

## 7. Spacing, Radius, and Height

### 7.1 Spacing

Base rhythm:

- 4px base

Recommended scale:

- `1 = 4`
- `2 = 8`
- `3 = 12`
- `4 = 16`
- `5 = 20`
- `6 = 24`
- `7 = 32`
- `8 = 40`
- `9 = 48`
- `10 = 64`

### 7.2 Radius

Locked hierarchy:

- `radius.control = 6`
- `radius.button = 6`
- `radius.surfaceSm = 16`
- `radius.surfaceMd = 18`
- `radius.surfaceLg = 24`
- `radius.sheet = 28`
- `radius.full = 999`

### 7.3 Heights

Locked component heights:

- `height.sm = 32`
- `height.md = 36`
- `height.lg = 40`
- `height.xl = 48`

Mappings:

- chip / compact filter: `32`
- segmented control / dense control: `36`
- default button and input: `40`
- major CTA or onboarding field: `48`

---

## 8. Elevation and Surface Texture

### 8.1 Elevation tiers

Recommended elevation tokens:

- `shadow.none = none`
- `shadow.sm = 0 8px 24px rgba(10,28,64,0.06)`
- `shadow.md = 0 18px 44px rgba(10,28,64,0.08)`
- `shadow.lg = 0 30px 80px rgba(10,28,64,0.12)`

### 8.2 Surface rules

- page = soft bright field
- primary surfaces = white
- alternate surfaces = cool or warm tints when meaning justifies it
- inspection sheet = stronger elevation and larger corner treatment
- graph reward = slightly more atmospheric, but still bright-family

### 8.3 Texture rule

Texture must be subtle.

Allowed:

- faint tint shifts
- occasional dashed lines for graph/gap logic
- restrained shadows

Avoid:

- heavy gradients
- obvious glassmorphism
- ornamental noise
- overworked textures

---

## 9. Motion and Focus

### 9.1 Motion durations

Locked motion ladder:

- `50ms` micro feedback
- `100ms` press and toggle
- `150ms` standard hover/focus transition
- `200ms` menu/dropdown/tool surface appear
- `250ms` sheet rise / panel morph
- `300ms` workspace mode transition

### 9.2 Motion curves

- `curve.interaction = cubic-bezier(0.25, 0.1, 0.25, 1)`
- `curve.enter = cubic-bezier(0.16, 1, 0.3, 1)`
- `curve.exit = cubic-bezier(0.4, 0, 1, 1)`

### 9.3 Focus

Locked focus treatment:

- 2px focus ring
- blue-led ring
- optional soft outer glow at low opacity

Focus must be:

- keyboard-legible
- premium
- consistent across all controls

---

## 10. Density Modes

The system must support multiple render densities of the same truth.

### Comfortable

Used for:

- Brief
- sheet
- onboarding
- public trust surfaces

### Compact

Used for:

- grid
- queue
- high-density internal scanning surfaces

### Rule

Density changes:

- spacing
- padding
- visible quantity

Density does **not** change:

- visual identity
- semantics
- token logic

---

## 11. Component System Rules

### 11.1 Buttons

Locked button classes:

- primary next move
- secondary fallback
- tertiary text / inline
- segmented mode toggle
- icon utility

Rejected for default product system:

- generic floating action button

Unless a later specific use case earns it.

### 11.2 Chips / tags / tokens

Locked uses:

- state
- object type
- filter
- gap count
- confidence
- mode label

Not allowed:

- decorative chip spam

### 11.3 Cards

Cards are containment vessels, not the architecture.

They are valid for:

- brief blocks
- grid cards
- stats summaries
- compact context panels

They are not valid as:

- the dominant answer to every layout problem

### 11.4 Input controls

Locked input classes:

- text field
- select
- checkbox
- radio
- toggle
- segmented control
- slider only if clearly justified

Every input must inherit:

- height token
- radius token
- focus token
- semantic state tokens

### 11.5 Navigation components

Navigation is architecture-driven.

Allowed core navigation components:

- command density toggle
- sheet
- object-anchored workspace tab strip
- top utility bar
- hidden graph trigger

The old full module sidebar is not the future center of gravity.

### 11.6 Communication components

Allowed:

- state badge
- inline warning
- inline success
- progress pulse
- sync/degraded banner
- save confirmation

Disallowed:

- noisy snackbar churn
- decorative status clutter

---

## 12. Surface-Specific Rules

### 12.1 Command layer

The command layer must:

- feel immediate
- show one dominant move per object
- use large metrics
- keep narrative short
- use state chips and gap indicators consistently

It must not:

- feel like dashboard widgets
- feel like generic card masonry

### 12.2 Sheet layer

The sheet must:

- feel denser than the command block that opened it
- open with narrative context
- show explicit gaps
- show explicit connections
- show explicit next-loop consequence

It must not:

- feel airy and under-informative

### 12.3 Workspace layer

The workspace must:

- keep object continuity visible
- preserve strategic depth
- reduce top-of-surface text burden
- feel like an instrument

It must not:

- look like the old module shell with new paint

### 12.4 Graph layer

The graph must:

- feel special
- feel hidden
- feel rewarding

It must not:

- become the daily default surface

---

## 13. Taste-Test Salvage and Rejection

### 13.1 What to keep from the current taste test

Keep:

- single-file JSX lab format
- section navigation model
- token architecture experimentation
- scenario-driven specimens
- semantic role thinking
- command / sheet / rail / workspace vocabulary

### 13.2 What to reject from the current taste test

Reject:

- dark operating-theme center of gravity
- old neutral ladder dominance
- gold-heavy legacy shell energy
- residual purple logic
- component-lab emphasis over architecture truth
- any part that still feels too close to the old app shell

### 13.3 What the rebuilt taste test must prove

It must prove:

- the new bright identity
- the full token system
- the command/sheet/workspace/graph relationship
- object pressure hierarchy
- large-metric anchoring
- gap visibility
- the actual surface family behavior

---

## 14. Production Component Mapping

This is the intended future mapping from system to production.

### Command family

- brief block
- grid card
- queue row
- density toggle
- state pill
- gap badge
- next-move strip

### Inspection family

- object sheet
- gap panel
- connection panel
- quick action row

### Workspace family

- object header
- context rail
- lens tab strip
- deep-work surface

### Trust family

- auth hero
- onboarding activation header
- purchase / methodology / public trust surface

### Diagnostic family

- graph reward trigger
- graph legend
- graph relationship node

---

## 15. Implementation Sequence

This spec should be applied in this order:

1. rebuild the taste-test artifact against this spec
2. review and lock the new visual system in rendered form
3. rebuild the architecture-reset prototype in this visual system
4. only then begin production token extraction / replacement work

---

## 16. Definition of Done

The visual system spec is successfully realized when:

1. the rebuilt taste test clearly no longer feels like the old interface
2. the architecture prototype feels born in the new brand, not translated into it
3. the command layer is visually desirable, not just functionally correct
4. sheets feel richer and denser than cards
5. workspace surfaces feel more focused and expensive than the old shell
6. Signal Console and Future Autopsy still feel premium and distinct
7. the entire system reads as one product family

---

## 17. Bottom Line

This spec locks the actual build language for Antaeus:

- bright base
- navy authority
- blue structure
- orange pressure
- green health
- Plus Jakarta Sans + Outfit + Space Mono
- sharper controls
- softer surfaces
- command-first density
- architecture-serving components

The next artifacts must now prove this visually, not just describe it.
