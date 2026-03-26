# Phase 37 - PoC Framework

Date: 2026-03-26

## Objective
Make PoC Framework feel like a real proof-operating surface that is tied to deal stage, saves credible proof plans, and tracks whether the proof is strong enough to force a decision.

## Why This Phase Exists
PoC Framework already had useful generated content:

- scope doc
- kickoff agenda
- readout agenda
- proposal email

But it still had four product-feel gaps:

- it did not clearly tell the user when a PoC belongs in the deal
- save and download logic were looser than the surrounding modules
- proof plans were not visibly connected back to live deals
- proof tracking was too shallow to feel like a durable operating system

Phase 37 closes that gap.

## Changes Implemented

### 1. Added a Stage-Aware PoC Bridge
Updated [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html) so the module now opens with a bridge that explains:

- whether a PoC is best run now, later, or only carefully
- the linked deal stage
- the current proof standard
- the current pressure point
- the one-session win

This makes the relation between PoC design and deal timing much more explicit.

### 2. Added Linked Deal Context
The module now supports linking the proof plan to a real deal record.

That linkage is used to:

- prefill account context
- infer readout ownership
- evaluate whether the PoC belongs at the current deal stage
- hand back into Deal Workspace and Future Autopsy

This reduces the chance that the proof plan stays detached from the pipeline.

### 3. Added Proof Quality Scoring
PoC Framework now computes an explicit proof quality read based on:

- vendor/account completeness
- number of success criteria
- number of scope boundaries
- readout owner presence
- linked deal presence
- linked deal stage

The result is shown as:

- `Ready now`
- `Workable`
- `Thin`

This makes the module feel more like a proof standard and less like a document generator.

### 4. Tightened Save Logic
Saved PoCs now include:

- linked deal id
- linked deal stage
- readout owner
- quality score
- quality band
- updated timestamp

If a linked deal exists, the current proof state is also synced back into that deal record so the proof plan becomes part of deal truth.

### 5. Tightened Download Logic
The old `PDF / DOCX / CSV` selector implied export formats the page was not actually producing honestly.

Phase 37 changes that to:

- `TXT`
- `CSV`
- `JSON`

The download now uses:

- the selected format
- a cleaner file name
- format-appropriate content

This makes the export path more trustworthy.

### 6. Improved Proof Tracking
The side panel now tracks more than raw volume:

- total PoCs
- converted
- in progress
- linked to deals
- current proof standard
- recent saved proofs

This makes the page feel like a proof tracker, not just a one-off generator.

## Exit Criteria Read

### Met locally
- the module now explains when a PoC should happen
- linked deal context is visible and usable
- proof quality is explicit
- save logic is richer and tied into deal truth
- download logic is more honest
- proof tracking is meaningfully better

### Still requires live validation
- confirm linked-deal sync feels correct in browser
- confirm proof quality bands feel honest against real deals
- confirm the recent-proof tracker stays useful once the workspace grows
- confirm users now understand when a PoC is helping a deal versus stalling it

## Files Changed
- [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-37-poc-framework-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-37-poc-framework-2026-03-26.md)

## Status
`local-patch`
