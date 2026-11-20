# Saturation scoring — shared brief

You are helping score the regenerated Antaeus tester experience with the owner's recovered original method. Apply it exactly. Do not add weights, formulas or keyword counts. Do not aim for any number.

## The method (verbatim, from `ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/02_ORIGINAL_SCORING_METHOD.md`)

> Each dimension is independently judged across the complete regenerated tester corpus on a **0.0–10.0 qualitative scale**: 0 means essentially absent; 10 means saturated throughout the language system. All nine dimensions have equal weight. The overall score is `Math.round(sum(scores) / 9 * 10)`.
>
> | Dimension | Original score | Original target | What is judged |
> |---|---:|---:|---|
> | Semantic compression | 9.4 | ≤2.5 | Hidden business/system meaning that short wording makes the reader unpack. |
> | Private / branded ontology | 9.9 | ≤1.5 | Antaeus-specific vocabulary required to operate ordinary sales/software concepts. |
> | Metaphorical abstraction | 9.8 | ≤2.0 | Metaphor functioning as the primary explanation of concrete business concepts. |
> | Declarative certainty | 9.3 | ≤3.0 | Heuristics, rankings, inferences and forecasts presented as established facts. |
> | Aphoristic cadence | 9.2 | ≤1.5 | Dramatic mini-maxims replacing explanations as the default voice. |
> | High-context dependence | 9.4 | ≤2.0 | Prior knowledge of Antaeus terms, states or unstated context needed to understand the interface. |
> | Paratactic compression | 9.1 | ≤2.0 | Adjacent clauses, punctuation and fragments leaving necessary logical relationships implicit. |
> | Personification / agency transfer | 9.3 | ≤1.5 | Abstract systems described as thinking, waking, seeing, deciding or dying in ways that obscure actual computation or evidence. |
> | Elliptical / fragmentary syntax | 8.7 | ≤2.5 | Omitted subjects, verbs and connective syntax requiring reconstruction in explanatory prose. |
>
> Baseline sum: **84.1**; mean: **9.344444…**; scaled: **93.444444…**; reported: **93/100**. […] the full app was worse because the dialect had spread into navigation, states and reasoning.
>
> Acceptance ceiling: **20/100**. Preferred destination: **15–20/100**. Do not target zero. Ordinary sales terms, useful short UI labels, explained branded names and occasional editorial personality are legitimate. Do not penalize every metaphor or fragment automatically.
>
> The evaluator must inspect the complete regenerated rendered experience, compare against the baseline behavior, cite representative examples and explain every score. Decimal judgments are permitted. Keyword frequencies, copy-audit counts and invented frequency weights are not the saturation score. Simple word substitution does not earn credit if conceptual opacity remains.
>
> The governing test remains: **Antaeus may have a point of view. It may not require translation.**

## What "the baseline behavior" was

At 93/100 the private dialect was the default voice of navigation, states and reasoning. Examples of the original text (from the original inventory): "TOUCH THE GROUND · SEE THE WHOLE MOTION", "The workspace is awake. It already found the first move that needs you.", "START HERE · THE SYSTEM'S PICK", "At the top because heat 62 and fresh signals.", "WHAT THE SYSTEM SAW WHILE YOU WERE AWAY", "You are the system", "THE CLIMB", "ITS BITE — HOW YOUR 29 WATCHED ACCOUNTS FIT", "SHARP MATCHES — WHERE IT BITES", "Nordstrom is headed to close-lost — inside the next 7 days if nothing changes.", "WHAT KILLS IT — THE EVIDENCE", "The thread went stale and urgency died.", "THE CUTS", "No calendar anchor means no deal.", "Carve a segment division", "going cold", "ALL FOUR FRONTS · THEIR ASK → YOUR LINE", "The blocking front is the deal's clock.", "air cover · never the opening scene", "4 deals will slip this week if you do nothing." The full original inventory is at `ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/original-working-set/01_USER_FACING_COPY_INVENTORY.json` (records carry `rooms`, `classifications`, `severity_0_to_5`).

## How to judge

- A score reflects BOTH how often a first-time founder or seller meets the phenomenon across what you read AND how much it obstructs understanding when they do. Judge the language system, not individual words.
- Score what is there. If the evidence supports a score above a dimension's original target, give that score. Do not round toward a target, and do not go low to be agreeable or high to look rigorous. A reader who checks your examples against the corpus should agree with your number.
- Legitimate, not to be penalized: ordinary sales terms; useful short UI labels; explained branded names (for example "Future Autopsy" beside a plain description); occasional editorial personality; conversational lines a seller says to a buyer; data rows joined with middle dots; not every metaphor or fragment.
- No credit for word substitution that leaves the idea opaque (for example a plain-looking label whose meaning still depends on knowing how Antaeus works).
- Also watch for the opposite failure and report it separately (it does not lower the score): generic or bland wording, lost judgment, verbosity, awkward literalism, contradictions, and explanations that do not match the logic shown.
- Evidence must be exact quotations with the area and state they came from. Give counter-examples too: passages that show the phenomenon is absent.
