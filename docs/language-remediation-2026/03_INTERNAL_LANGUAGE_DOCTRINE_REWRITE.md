# Antaeus Internal Language Doctrine Rewrite

## Why this file exists

The user-facing rewrite will regress if the internal product doctrine continues to describe Antaeus through the same private ontology. Coding models, designers, and future copy passes will imitate nearby language. Internal metaphors therefore need to be translated even when they are not visible to customers.

## New internal rule

**Internal architecture names may be technical, but they must not be used as a source of customer-facing language.**

Prefer names that describe the function:

| Deprecated doctrine language | Internal replacement |
|---|---|
| Command Chamber | Dashboard ranking system |
| Decision Bench | decision-support workflow |
| System Ledger | readiness / quota synthesis |
| Live Instrument | execution workflow |
| heavy-seeding | comprehensive onboarding |
| seeding flow | onboarding data collection |
| wake-up | enrichment completion |
| seed→alive | initial data enrichment |
| living rooms | active product areas |
| one move | highest-priority recommended action |
| motion | sales process / activity / pipeline, as applicable |
| Ground | workspace navigation |
| heat | account-priority score / signal strength |
| sharp / sharpness | ICP specificity / ICP quality |
| climb | readiness progression |
| summit | highest readiness level |
| face-off | current blocking issue |
| fronts | negotiation workstreams |
| your line | proposed negotiation position |
| relay | forwarded introduction / network request |
| machine | automation / system |
| thread | account/deal history, as applicable |

## Prompt standard for AI-generated product copy

Use explicit business nouns. Prefer causal explanation over rhetorical compression. Distinguish observed evidence from inference. State recommendations directly. Avoid slogans, metaphors, fragments, personification, clever parallelism, compressed aphorisms, and invented Antaeus terminology.

### Required output model for analytic surfaces

1. **Object** — the account, deal, person, or plan.
2. **Observation** — what is directly true in the data.
3. **Evidence** — the inputs supporting the observation.
4. **Assessment** — what Antaeus infers from those inputs.
5. **Forecast** — only when predicting a future state.
6. **Recommended action** — the specific action.
7. **Expected effect** — what the action is intended to change.

Facts, calculations, inferences, forecasts, and recommendations must not share the same grammatical register.

## CTA standard

Buttons must predict the resulting action.

Prefer:
- Open workspace map
- Review readiness
- Create segment
- Add account
- Draft outbound
- Log call
- Update next step
- Review deal risk
- Create signature plan
- Download workspace

Retire:
- Touch the Ground
- Wake it up
- Carve it
- Run it
- Make it real
- Keep the pace
- Act here

## Epistemic standard

Avoid converting a ranking or model output into an absolute claim.

Bad:
> The most valuable move on your board.

Better:
> Highest-priority recommended action.

Bad:
> Nordstrom will be close-lost in seven days.

Better:
> Nordstrom has a high risk of being lost. No dated next step, no identified economic buyer, and 21 days without recorded buyer activity are driving the assessment.

## Punctuation standard

Use middle dots for compact data rows when useful. Do not use punctuation as a substitute for causal or logical language. An em dash must not be required to infer why one clause follows another.

## Acceptance test for every new string

A first-time seller should understand the string without knowing Antaeus vocabulary. If the string only works after learning a branded term, rewrite it.
