# Antaeus Information Architecture Reset Phase 2

Date: 2026-03-31

Status: implemented

Phase: command-layer reset

Primary surface:

- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)

---

## 1. Purpose

Phase 2 turns Dashboard into the formal command surface for the beta-stretch IA reset.

This phase does **not** rename or collapse core assets.

Explicitly preserved:

- `Signal Console`
- `Future Autopsy`

The reset work here is about how the system is read and prioritized, not about erasing the product's strongest names.

---

## 2. What Changed

Dashboard now supports three explicit command modes:

- `Brief`
- `Grid`
- `Queue`

Those modes all read the same what is actually happening, but with different behavioral jobs:

### Brief

- narrative morning read
- strongest for orientation
- shows:
  - operating headline
  - primary intervention
  - operating lanes
  - risk queue
  - next-move queue

### Grid

- dense field scan
- strongest for pattern recognition
- shows:
  - source-map truth
  - primary pressure
  - compact metrics
  - lane map
  - recovery field
  - move field

### Queue

- ranked execution order
- strongest for least-resistance behavior
- shows:
  - one ordered work sequence
  - a single serial stack of what matters now
  - why the queue is ranked that way

---

## 3. Added Command Memory

Dashboard now stores:

- the selected command mode
- the last recorded command snapshot for the current browser

That allows the dashboard to render a `Since you were gone` layer instead of behaving like each visit starts from zero.

The delta layer currently tracks shifts in:

- stage
- active deals
- signals
- logged motions
- risk queue size
- sync warning count

---

## 4. Why This Matters

The IA reset brief argues that Antaeus should become:

- more object-centric
- more pressure-ranked
- less module-flat

Phase 2 is the first concrete runtime step in that direction.

Instead of Dashboard being one static board, it now behaves more like:

- a command read
- a scan field
- a ranked queue

depending on what the operator needs in the moment.

---

## 5. Guardrails

This phase intentionally does **not** do the following:

- collapse Signal Console into Dashboard
- rename Future Autopsy
- remove current module entry points
- turn command mode into a required navigation dependency

The beta-safe rule remains:

- preserve familiar entry points
- change the behavior underneath them

---

## 6. Validation Needed

Implementation is complete.

To call the phase live-validated, the deployed app should be checked for:

1. `Brief / Grid / Queue` toggle switching cleanly
2. mode persistence after refresh
3. `Since you were gone` showing without layout breakage
4. no dashboard clipping or queue overlap on laptop-width screens
5. empty-state dashboard behaving correctly in all three modes

