# Antaeus Design System — Changelog

One entry per release, newest first. Versioning model: see README.md
Part IV and the scoping doc (deliverables/plans/design-system-deployment-
and-brand-scoping-2026-06-07.md Part VI) — major = breaking, minor =
additive, patch = non-functional.

## 1.3.0 — 2026-06-13

Additive: the composition layer (step 5.5, part 1). Closes the gap the
2026-06-13 adversarial pass found — the leaf catalog was built but the
geometry the rooms sit on was not.

- Layout & grid primitives (spec 05): `src/components/layout.tsx` —
  PageFrame (centered 1200px column + 40px gutter + the calm sub-1024
  desktop notice), Grid + GridCell (the 12-column alignment grid,
  24px gutters, span clamped 1–12), Measure (the 66ch reading cap),
  BandStack (vertical rhythm, absent bands collapse), and the three
  archetypes — SingleColumn, FocalRail (8/4), ObjectControls — each
  collapsing to single column below 1024.
- HandoffStrip (spec 03 §3.4) — the missing Navigation catalog member:
  verb-shape cross-room routes, one primary (orange), the rest
  secondary, each threading continuity params.
- RiskCard (spec 03 §4.1 System) — the missing System catalog member:
  a Grounded card at recovery scale (account + cause + score + move).
- Token cleanup: `--ds-orange-strong`, `--ds-on-ink`, `--ds-scrim`
  declared; the three literal colors in components.css retired.
- Proof sheet gains LAYOUT / RISK sections + a HandoffStrip footer.

Still owed for step 5.5 part 2: the density system (spec 02 §249 —
`workspace_profile.density_state`, `src/lib/density/`, the Settings
toggle, the Phase F handler, wiring `affordanceSliceIndex`).

## 1.2.0 — 2026-06-12

Additive: brand round 3 + the catalog tail.

- Sibling spec 10 (brand identity) — the Grounded A's locked geometry,
  weight ladder, lockups, favicon files, usage rules.
- `src/components/brand.tsx` — BrandMark (size-aware stroke ladder,
  no-bar at 16) + BrandLockup (L2 caps); the WayfinderBar's home
  affordance now carries the lockup.
- Favicons shipped: `public/favicon.svg` + 32/16 PNGs +
  apple-touch-icon; linked from every entry HTML (31 files).
- Catalog tail: Stamp, Avatar (initials only; orange decider, blue
  advisor), Tooltip (gone in Step back), Table (one offset row may
  break rank), Progress (milestone ladder + real-things count), and
  the System cards — PatternCard (claim + evidence + how-sure),
  ProposalCard (accept / snooze / dismiss), ReadinessReadout
  (plain-sentence state, no bars).
- Proof sheet gains BRAND / TAIL / STRUCTURE / SYSTEM sections.

## 1.1.0 — 2026-06-12

Additive: the component library exists as code.

- `src/components/` — the spec 03 catalog's core, implemented: Kicker,
  Heading (display/title/control), Stat, StatusChip, Gauge, Card (the
  Grounded primitive with all five data states + the offset variant +
  the unsaved marker), Button (accent/primary/secondary/ghost with
  disabled-why), IconButton, CrossRoomLink, Toggle, TextInput, Select,
  FormField (density-aware microcopy + inline error), Toast, Alert,
  Drawer, Modal, WayfinderBar (the locked un-nav, summoning the
  existing Ctrl+K palette), SegmentedControl, and Meter (the one
  admitted data-viz, bar + read sentence). Each declares the §4.2
  contract; interaction states per §4.8 live in components.css; every
  built-in string is t()-declared.
- `/design-system/` — the proof sheet: the built library composed on
  one internal page, the implementation-review counterpart to the
  icon inventory sheet.
- One additive token: `--ds-space-45` (18px), already named in the
  spec's spacing scale, previously missing from tokens.css.

## 1.0.0 — 2026-06-08

The first locked release. Establishes the baseline:

- The ten siblings (00 charter, 01 voice, 02 density, 03 component
  library, 04 today surface, 05 layout & grid, 06 surface patterns,
  07 lexicon, 08 motion, 09 iconography) plus the README front door.
- Three rendered mockups as visual sources of truth (component library
  un-nav full, today surface, iconography).
- Canonical runtime tokens at `src/styles/tokens.css`.
- The vocabulary decisions of 2026-06-07: "signal spine" renamed to
  "the gauge"; "spine" and "earned" banned; the product claim locked;
  pipeline-never-promises; the operator watches / the system reads.
- The seven founder decisions of 2026-06-08 recorded in the scoping doc
  (all-internal brand, Preact icon library, Option A rollout, waivers
  with a 10-active ceiling, the t() migration, internal glyphs, the
  visitor register).
