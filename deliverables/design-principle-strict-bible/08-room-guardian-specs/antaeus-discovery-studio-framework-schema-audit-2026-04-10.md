# Antaeus Discovery Studio Framework Schema Audit

Status: runtime repair audit  
Date: 2026-04-11

Purpose: verify the current Discovery Studio runtime data against the locked 9-framework registry and the fixed 10-segment spine.

This remains a pass/fail audit, not a hope document.

## Executive verdict

Discovery Studio now **passes the locked runtime coverage audit**.

### What is now true

- The locked registry requires **9 product-category frameworks**.
- The current segment runtime now exposes **9 locked frameworks**.
- All **9 of the locked 9** are present in runtime data:
  - Legal / Legal Ops / Law Workflow
  - Recruiting / Talent / HR / People Workflow
  - Product / UX / Enablement / Knowledge Workflow
  - GovTech / Compliance / Public-Sector Operations / Trust and Safety
  - Customer Support / Operations / Vertical Workflow Software
  - Sales / Revenue Intelligence
  - Manufacturing / Supply Chain / Engineering
  - Data / Intelligence Infrastructure
  - AI-Native Buyer Discovery Framework
- Every locked framework now contains the fixed **10-segment spine**.
- Every locked framework now contains first-class:
  - `proof-threshold`
  - `post-call-routing`

## Runtime libraries now present

### Segment-native runtime

Primary Discovery Studio runtime:

- `window.DISCOVERY_SEGMENT_RUNTIME`

Source file:

- `js/discovery-segment-runtime.js`

Schema:

- `schemaVersion: "locked-10-segment"`

Coverage:

- 9 locked framework registry entries
- 9 framework payloads
- 10 segments per framework

### Legacy runtime

Legacy Discovery runtime remains loaded:

- `window.DISCOVERY_FRAMEWORKS`

Source file:

- `js/discovery-frameworks.js`

Meaning:

- still available as fallback / bridge data
- still relevant to other older code paths
- no longer the primary Discovery Studio contract

## Locked registry versus current runtime

| Locked category | Runtime source | Result |
|---|---|---|
| Legal / Legal Ops / Law Workflow | `DISCOVERY_SEGMENT_RUNTIME.frameworks.legal` | pass |
| Recruiting / Talent / HR / People Workflow | `DISCOVERY_SEGMENT_RUNTIME.frameworks.recruiting` | pass |
| Product / UX / Enablement / Knowledge Workflow | `DISCOVERY_SEGMENT_RUNTIME.frameworks.product-ux` | pass |
| GovTech / Compliance / Public-Sector Operations / Trust and Safety | `DISCOVERY_SEGMENT_RUNTIME.frameworks.govtech` | pass |
| Customer Support / Operations / Vertical Workflow Software | `DISCOVERY_SEGMENT_RUNTIME.frameworks.customer-support` | pass |
| Sales / Revenue Intelligence | `DISCOVERY_SEGMENT_RUNTIME.frameworks.sales-revenue` | pass |
| Manufacturing / Supply Chain / Engineering | `DISCOVERY_SEGMENT_RUNTIME.frameworks.manufacturing` | pass |
| Data / Intelligence Infrastructure | `DISCOVERY_SEGMENT_RUNTIME.frameworks.data-intelligence` | pass |
| AI-Native Buyer Discovery Framework | `DISCOVERY_SEGMENT_RUNTIME.frameworks.ai-native` | pass |

## Fixed 10-segment spine audit

Each locked framework now contains these first-class runtime segments:

1. `opening-frame`
2. `current-state-truth`
3. `pain-and-consequence`
4. `trigger-and-urgency`
5. `stakeholder-and-ownership`
6. `proof-threshold`
7. `current-vendor-and-displacement`
8. `decision-architecture`
9. `next-step-lock`
10. `post-call-routing`

### Result

- fixed segment spine exists in runtime
- segment count is consistent across all 9 frameworks
- proof and post-call routing are no longer inferred or improvised

## Renderer audit

Live room:

- `app/discovery-studio/index.html`

Current renderer state:

- now prefers `DISCOVERY_SEGMENT_RUNTIME`
- resolves framework selection through the locked registry
- reads the active room through a segment adapter
- still supports legacy runtime shapes as fallback

### Important nuance

The renderer has been repaired enough to run against the locked segment runtime, but some internal bridge naming still reflects the older implementation:

- `territory`
- `entry`
- `response`

Meaning:

- this is now a **working bridge renderer on top of the correct schema**
- it is **not yet a fully renamed segment-native renderer internally**

That is technical debt, not a contract failure.

## Remaining debt

Discovery Studio no longer fails on runtime coverage.

The remaining work is in renderer cleanup and behavior depth:

- remove legacy internal naming (`territory`) where it no longer matches the room contract
- deepen per-segment branch logic so the visible face can stay sparse while the move library grows richer
- decide whether the legacy `DISCOVERY_FRAMEWORKS` library should remain permanently as fallback or be retired once all Discovery-adjacent rooms are migrated

## Bottom line

Discovery Studio now has:

- the locked 9-framework registry
- the locked 10-segment runtime shape
- first-class proof-threshold
- first-class post-call-routing
- a live renderer that prefers the repaired runtime

So the old audit verdict is no longer true.

The runtime contract is now in place.  
The remaining work is product-surface refinement and deeper branch behavior, not missing framework coverage.
