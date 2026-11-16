# Original qualitative saturation methodology

Recovered by the project owner on 2026-10-31. This supplies the original scoring details omitted from the earlier working set; it does not replace or relax that specification.

Each dimension is independently judged across the complete regenerated tester corpus on a **0.0–10.0 qualitative scale**: 0 means essentially absent; 10 means saturated throughout the language system. All nine dimensions have equal weight. The overall score is `Math.round(sum(scores) / 9 * 10)`.

| Dimension | Original score | Original target | What is judged |
|---|---:|---:|---|
| Semantic compression | 9.4 | ≤2.5 | Hidden business/system meaning that short wording makes the reader unpack. |
| Private / branded ontology | 9.9 | ≤1.5 | Antaeus-specific vocabulary required to operate ordinary sales/software concepts. |
| Metaphorical abstraction | 9.8 | ≤2.0 | Metaphor functioning as the primary explanation of concrete business concepts. |
| Declarative certainty | 9.3 | ≤3.0 | Heuristics, rankings, inferences and forecasts presented as established facts. |
| Aphoristic cadence | 9.2 | ≤1.5 | Dramatic mini-maxims replacing explanations as the default voice. |
| High-context dependence | 9.4 | ≤2.0 | Prior knowledge of Antaeus terms, states or unstated context needed to understand the interface. |
| Paratactic compression | 9.1 | ≤2.0 | Adjacent clauses, punctuation and fragments leaving necessary logical relationships implicit. |
| Personification / agency transfer | 9.3 | ≤1.5 | Abstract systems described as thinking, waking, seeing, deciding or dying in ways that obscure actual computation or evidence. |
| Elliptical / fragmentary syntax | 8.7 | ≤2.5 | Omitted subjects, verbs and connective syntax requiring reconstruction in explanatory prose. |

Baseline sum: **84.1**; mean: **9.344444…**; scaled: **93.444444…**; reported: **93/100**. The earlier product-page analysis was 89/100; the full app was worse because the dialect had spread into navigation, states and reasoning.

Acceptance ceiling: **20/100**. Preferred destination: **15–20/100**. Do not target zero. Ordinary sales terms, useful short UI labels, explained branded names and occasional editorial personality are legitimate. Do not penalize every metaphor or fragment automatically.

The evaluator must inspect the complete regenerated rendered experience, compare against the baseline behavior, cite representative examples and explain every score. Decimal judgments are permitted. Keyword frequencies, copy-audit counts and invented frequency weights are not the saturation score. Simple word substitution does not earn credit if conceptual opacity remains.

The governing test remains: **Antaeus may have a point of view. It may not require translation.**
