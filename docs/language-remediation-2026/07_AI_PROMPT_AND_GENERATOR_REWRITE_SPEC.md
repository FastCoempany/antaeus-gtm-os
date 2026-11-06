# AI Prompt and Generated-Language Rewrite Specification

## Purpose

Static UI changes are insufficient if generated analysis continues to recreate the deprecated Antaeus dialect. Every prompt, template, deterministic text generator, and summary builder that can produce user-visible language must follow this specification.

## Search the repo for prompt/style instructions that encourage

- vivid
- punchy
- provocative
- editorial
- command voice
- operator voice
- no hedging
- one move
- sharp
- heat
- motion
- pressure
- alive / awake
- system saw / system read
- die / dying / decay
- thread
- carve
- ground
- machine
- climb / summit
- face-off / front
- relay / backchannel
- aphoristic
- terse fragments
- slogan-like
- memorable line
- strong declarative

Do not delete these automatically. Review each instruction and replace it when it governs user-visible language.

## New generated-language system prompt

Use explicit business nouns and ordinary sales terminology.

1. State observed facts as facts.
2. State calculations as calculations.
3. State inferences as assessments.
4. State future outcomes as forecasts, not facts.
5. State recommendations as recommendations.
6. Give the evidence immediately next to an assessment.
7. Prefer a complete causal sentence over an aphorism.
8. Do not personify the workspace, data, accounts, deals, or system.
9. Do not invent branded Antaeus terminology.
10. Do not use metaphors as the only explanation of a feature or state.
11. Do not use dramatic words such as dying, hot, cold, sharp, alive, awake, pressure, or decay as primary state labels.
12. Do not narrate the act of analysis when the result can be stated directly.
13. Do not imply causal certainty from correlation.
14. Use short prose when possible, but retain the logical connective tissue needed to understand why a conclusion follows.

## Required schema for analytical outputs

### Object
The account, deal, segment, plan, or other object.

### Observation
Directly supported by stored or retrieved data.

### Evidence
Specific dates, counts, people, events, stages, fields, or calculations.

### Assessment
The interpretation Antaeus makes from the evidence.

### Forecast
Only if the system is predicting a future outcome.

### Recommended action
The specific next action.

### Expected effect
Optional. Describe what the action is intended to improve; do not promise that it will.

## Example

Bad:
> Nordstrom is dying. The thread went stale and urgency died. Lock a real next step.

Good:
> **Deal risk: High**
>
> No buyer activity has been recorded for 21 days, no dated next step is set, and no economic buyer is identified.
>
> **Recommended action:** Get a dated next meeting with the buyer and confirm who owns final approval.

## Briefing-specific rule

Briefing may sound editorial, but every item must still expose:
- what changed;
- evidence;
- why it matters;
- confidence, if modeled;
- recommended action.

`The data disagrees` becomes `Evidence that conflicts with an assumption`.

## Copy-generation temperature

Prefer consistency and semantic precision over stylistic novelty. Generated copy should not seek a new turn of phrase for the same product concept.
