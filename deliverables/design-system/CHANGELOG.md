# Antaeus Design System — Changelog

One entry per release, newest first. Versioning model: see README.md
Part IV and the scoping doc (deliverables/plans/design-system-deployment-
and-brand-scoping-2026-06-07.md Part VI) — major = breaking, minor =
additive, patch = non-functional.

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
