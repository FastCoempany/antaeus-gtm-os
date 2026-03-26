# Phase 39 - Quota Workback

Date: 2026-03-26

## Objective
Turn target revenue into operational math that the rest of the app can actually trust and act on.

## Why This Phase Exists
Quota Workback already had useful math:

- quota
- ACV
- win rate
- conversion assumptions
- coverage

But the surface still behaved like a calculator.

That meant three important things were still weak:

- the output was not legible enough as a weekly operating plan
- the benchmark posture was too implicit
- the numbers were not clearly handing pressure into the downstream execution modules

Phase 39 closes that gap.

## Changes Implemented

### 1. Reframed the Module Around Revenue-to-Execution Logic
Updated [app/quota-workback/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/quota-workback/index.html) so the page now opens with an explicit bridge that explains:

- what this module is for
- what a one-session win looks like
- why quota cannot stay abstract
- where the pressure belongs next

This makes the module feel like an operating surface instead of a math widget.

### 2. Made the Output More Legible as a Real Plan
The module now translates the core math into more usable planning targets, including:

- touches per week
- meetings per week
- opps per quarter
- deals per quarter
- weekly revenue target
- account pressure

The existing monthly math still exists, but the module now surfaces the weekly and quarterly targets that users actually need to run against.

### 3. Made Benchmark Posture Explicit
The page now shows a clearer benchmark read based on ACV band and current assumptions.

It calls out:

- current benchmark band
- whether the workback feels ready now / workable / thin
- whether the current win, meeting-conversion, and cycle assumptions still look benchmark-close or custom enough to watch

This makes the math easier to trust or challenge.

### 4. Added Explicit Downstream Handoffs
The module now includes a dedicated downstream handoff layer for:

- Outbound Studio
- Cold Call Studio
- Dashboard
- Deal Workspace

Each handoff explains:

- what target the next module should absorb
- why that target matters
- what the user should do next

That closes the gap between planning and execution.

### 5. Persisted a Stronger Planning Object
In addition to the existing quota inputs and outbound seed object, the module now saves a dedicated `gtmos_quota_targets` object containing:

- monthly target
- weekly target
- deal/opportunity targets
- touch targets
- active-account target
- benchmark band
- quality score

That gives the rest of the product a cleaner planning object to consume later.

## Exit Criteria Read

### Met locally
- the module now explains itself clearly
- the output is more legible as a weekly operating plan
- default assumptions are easier to understand
- downstream module handoffs are explicit
- a stronger quota-target object is now persisted

### Still requires live validation
- confirm the quality band feels believable across several ACV bands
- confirm the weekly targets feel useful in browser, not just logically correct
- confirm the downstream handoff copy feels strong enough to change user behavior
- confirm the new quota-target object is safe for future downstream consumption

## Files Changed
- [app/quota-workback/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/quota-workback/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-39-quota-workback-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-39-quota-workback-2026-03-26.md)

## Status
`local-patch`
