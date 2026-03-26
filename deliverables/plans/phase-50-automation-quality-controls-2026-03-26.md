# Phase 50 - Automation Quality Controls

Date: 2026-03-26

## Objective
Ensure automation never quietly lowers trust by defining the release rules for suggestions, inference, and generated outputs across the app.

## Why This Phase Exists
Phase 45 defined what should stay manual versus suggested, inferred, or auto-generated.

Phase 46 defined how truth should compound across modules.

Phase 47 defined where external integrations should and should not enter the system.

Phase 48 defined that the launch agent is not the core product.

Phase 49 defined a workspace-first seat model.

What was still missing was the actual trust-control layer.

Without it, later automation work could still fail in familiar ways:

- outputs sound confident when they are weak
- the product hides where a suggestion came from
- inferred values silently outrank explicit user truth
- generated summaries sound cleaner than the underlying evidence
- low-confidence automation gets shown with the same visual authority as high-confidence automation

Phase 50 exists to stop that.

## Core Rule
Automation is allowed to reduce friction.

Automation is not allowed to silently create false certainty.

If the product cannot explain:

- where the output came from
- why it is being suggested
- how confident it is
- what the fallback is when confidence is low

then the automation is not release-ready.

## The Five Quality-Control Layers

### 1. Quality thresholds
Every automated output must have a release threshold.

This applies to:

- suggestions
- inferences
- generated summaries
- ranked next moves
- score bands
- exported synthesis

The threshold question is:

- is this strong enough to be shown as a normal product output
- or should it be visibly treated as weak / provisional / unavailable

### 2. Explainability rules
The product must be able to answer:

- why this
- why now
- from what sources
- with what confidence

Not in a technical-debugging way.

In a product-legible way.

### 3. Source visibility
Automation should never pretend to know more than the evidence actually supports.

Users should be able to see whether the result comes from:

- onboarding context
- saved workspace records
- linked deals
- signal research
- manual logs
- calendar / email metadata later
- generated synthesis from existing inputs

### 4. Fallback behavior
When automation is weak, the product must degrade honestly.

That means:

- ask the user
- show a weaker state
- present 2-3 candidate options instead of 1 confident answer
- or suppress the automation entirely

It does not mean:

- fabricate certainty
- hide low confidence
- invent a generic answer and hope the user does not notice

### 5. Confidence-low states
Low confidence is not an error.

It is a product state.

The app needs explicit “confidence low” behavior instead of binary:

- success
- failure

Many of the best product surfaces should be able to say:

- this is forming
- this is thin
- this is provisional
- this needs one more real input

## Automation Output Classes

### Class A - Suggestions
Examples:

- suggested next move
- suggested advisor moment
- suggested thesis / tier
- suggested follow-up lane

Release rule:

- must show why it was suggested
- must allow the user to override
- must not silently commit itself as truth

Minimum quality threshold:

- at least 2 supporting signals or one high-confidence controlling signal

Fallback if weak:

- show multiple ranked options
- label as `forming`

### Class B - Inferences
Examples:

- inferred role or stage context
- inferred linked account / deal context
- inferred product category across modules
- inferred pressure from stale next-step state

Release rule:

- must be overrideable
- must never beat explicit user input without warning
- should show source when the inference materially changes module behavior

Minimum quality threshold:

- one clear authoritative source already saved in the workspace

Fallback if weak:

- ask the user explicitly
- or show `confirm context`

### Class C - Generated synthesis
Examples:

- motion brief
- agenda quality read
- proof-quality read
- readiness explanation
- handoff export summary
- worked-move summaries

Release rule:

- must expose input sources
- must never mask thin upstream evidence
- must inherit upstream weakness instead of smoothing it away

Minimum quality threshold:

- all required upstream fields present for the output type

Fallback if weak:

- show `partial`
- show missing inputs
- reduce polish rather than overstate certainty

### Class D - Scores and bands
Examples:

- ICP quality
- sourcing readiness
- qualification strength
- proof quality
- readiness score

Release rule:

- band must be explainable
- dimensions must be inspectable
- no single score should hide a critical weak prerequisite

Minimum quality threshold:

- source dimensions must exist
- missing dimensions must reduce certainty visibly

Fallback if weak:

- show incomplete / provisional band
- show which dimensions are missing

## Confidence Bands

### High confidence
Use when:

- the output is supported by strong saved evidence
- the app can clearly point to its sources
- the user would likely agree with the recommendation

UI behavior:

- normal display
- direct CTA
- strong next move

### Medium confidence
Use when:

- the output is probably useful
- but one or more dimensions are still forming

UI behavior:

- show recommendation
- include “why”
- make override easy

### Low confidence
Use when:

- the app has partial context
- the recommendation is plausible but not trustworthy enough to lead alone

UI behavior:

- softer label
- visible missing inputs
- multiple options or confirm step

### Unknown / insufficient evidence
Use when:

- the app does not have enough to produce a credible output

UI behavior:

- no fake recommendation
- ask for the missing input
- say why the system cannot yet rank intelligently

## Source Visibility Rules

### Every automated output should map to visible source types
Source labels should come from a small stable vocabulary:

- `Onboarding`
- `Workspace`
- `ICP`
- `Signals`
- `Motion`
- `Deal`
- `Discovery`
- `Proof`
- `Quota`
- `Calendar` later
- `Email metadata` later
- `Generated synthesis`

### Do not expose raw internals to the user
Do not make the UI say things like:

- `gtmos_activation_context`
- `sequenceKey`
- `workspaceSummaryPromise`

Translate the source truth into product language instead.

### Generated outputs must not hide thin upstream truth
If the source is weak, the generated output should say so plainly:

- `This motion is still forming because the account signal depth is low.`
- `This proof plan is partial because readout ownership is still missing.`
- `This handoff section is weak because discovery evidence is sparse.`

## Fallback Rules

### If automation is weak, use one of four fallbacks

#### Fallback 1 - Ask
Use when one missing input would make the output credible.

Examples:

- select the linked deal
- confirm the primary buyer
- choose the top trigger

#### Fallback 2 - Offer ranked options
Use when the app has some signal but not enough to assert one answer confidently.

Examples:

- `Top likely next moves`
- `Most likely advisor moments`

#### Fallback 3 - Show partial state
Use when the generated output still has value, but must be labeled honestly.

Examples:

- `Partial agenda`
- `Forming motion`
- `Thin qualification`

#### Fallback 4 - Suppress
Use when any automation would likely mislead.

Examples:

- no confident next step on a deal with almost no information
- no proof-quality band when the PoC does not have criteria or owner

## Override Rules

### Explicit user truth outranks inference
If the user explicitly sets:

- stage
- ICP wedge
- proof boundary
- readout owner
- next-step owner

that explicit truth wins unless the user changes it again.

### Suggestions should not auto-promote themselves
The product may suggest.

It may not silently commit a suggestion into durable truth without a user action.

### Generated summaries should never become the only truth
The summary is a view over source truth.

It is not the source truth itself.

## Module-Level Control Expectations

### High-risk modules
These require the strictest controls:

- [deal-workspace](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [poc-framework](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- [advisor-deploy](c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)
- [founding-gtm](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)
- [readiness](c:/AppDev/v1AntaeusApp/Appv2_290126/app/readiness/index.html)

Why:

- they affect the handoff kit
- they affect trust in core strategic truth
- they could create severe false confidence if wrong

### Medium-risk modules

- [outbound-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/outbound-studio/index.html)
- [linkedin-playbook](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)
- [cold-call-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)
- [discovery-agenda](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)
- [discovery-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)

Why:

- these shape execution quality
- but user override and live truth are still close at hand

### Lower-risk modules

- [welcome](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [dashboard](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [settings](c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html)

Why:

- they can still mislead
- but the consequence is more directional than irreversible

## Release Gates For Future Automation Work

Before any new automation feature ships, it must answer:

1. What class of automation is this:
   - suggestion
   - inference
   - synthesis
   - score
2. What evidence does it use?
3. What confidence band is it allowed to show?
4. What happens when confidence is low?
5. Can the user see why?
6. Can the user override or inspect it?
7. Could it quietly create false certainty?

If those answers are weak, the feature is not ready.

## Diagnostics Requirement
Any new automation should, where practical, emit enough telemetry to support later QA:

- output shown
- low-confidence state shown
- override used
- fallback used
- automation suppressed

This aligns with the Phase 18 observability foundation instead of creating invisible magic.

## Product Sentence
If this phase needs one internal sentence, it is:

Antaeus can automate friction, but it cannot automate certainty beyond the evidence.

## Decision Summary

### Resolved
- quality thresholds: defined
- explainability rules: defined
- source visibility rules: defined
- fallback rules: defined
- low-confidence states: defined

### Final call
Automation is acceptable only when it is:

- inspectable
- confidence-banded
- source-grounded
- overrideable where needed
- honest when weak

## What This Phase Unlocks Next
Phase 50 gives the product a hard trust-control layer for:

- future inference work
- future ranking work
- future generated summaries
- future integration-driven automation
- later launch gates in Phase 51 and Phase 52

Without this phase, later automation would still risk sounding better than it is.

## Exit Criteria Read

### Met locally
- automation quality controls are explicit
- low-confidence states are now productized conceptually
- future automation work has a real release gate

### Still requires later implementation
- runtime confidence labeling where missing
- source badges / source blocks where missing
- fallback and suppression behavior on future automation surfaces
- QA enforcement against the new release gates

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-50-automation-quality-controls-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-50-automation-quality-controls-2026-03-26.md)

## Status
`local-patch`
