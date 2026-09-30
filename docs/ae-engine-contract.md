# AE underwriting engine: implementation contract

Scope: Step 3, Step 4 and their tests only. Source: `deliverables/plans/ae_hiring_underwriting_master_spec.md` at commit `1114340`. The source filename uses underscores. The master spec has not been edited.

## Run

```sh
npm run test:ae
```

No installation or added test framework is required. Node runs four suites: formulas/reference case, validation, all 24 golden cases, and adversarial invariants. `npm test` runs this suite through `pretest` before the existing Vitest tests.

## Entry point

```js
const { underwrite } = require('../js/ae-underwriting-engine.js');
const policy = require('../js/ae-policy.js');
const result = underwrite(input, policy, {
  calculation_timestamp: '2026-09-30T20:00:00.000Z'
});
```

Browser script order: `ae-policy.js`, `ae-engine-input.js`, `ae-underwriting-math.js`, `ae-decision-engine.js`, `ae-underwriting-engine.js`. The entry point is `AEUnderwriting.underwrite`. The modules do not read DOM, storage, network, random values or the current clock.

The timestamp is caller supplied and is null when absent. It is never generated internally. Input and policy are copied; the result and its audit snapshots are recursively frozen. Replay uses the captured input, policy, timestamp and recorded engine version. Calculations retain precision; practical whole-deal counts are separate.

All operating thresholds, sample thresholds, sensitivity perturbations, validation limits, source-quality lists and constraint ordering live in `ae-policy.js`. A threshold change requires a policy version change and calibration review; the audit retains the complete policy used for each result.

## Input semantics

The groups follow the master spec. Scalars use decimal percentages (0.21 means 21%), ISO date-only business dates, and one declared currency (USD if omitted). Raw numeric strings are rejected. Unknown and not-applicable wrappers are supported:

```js
{ value: null, status: 'unknown', source: 'unknown' }
```

Arithmetic receives explicit nulls; `field_status` retains status/source metadata. Zero remains a known value. A zero conversion rate produces null numeric requirements with an `unbounded` calculation status, never Infinity or a fabricated zero requirement. Fatal validation produces `status: 'validation_stop'` with no decision. Clarification conflicts produce insufficient evidence and exact data requests.

Additional explicit fields needed to make the written semantics executable:

| Field | Meaning |
| --- | --- |
| `economics.acv_metric`, `demand.pipeline_metric` | Revenue basis, checked against target/quota. |
| `demand.current_qualified_pipeline_in_horizon` | Current pipeline expected to close in the horizon. |
| `demand.allocatable_qualified_pipeline` | Declared allocation to the proposed seller over the contribution horizon. |
| `demand.allocatable_current_qualified_pipeline` | Explicit current allocation, used for monthly creation conditions. `allocatable_current_pipeline` is an alias. |
| `decision.evaluating_first_professional_ae` | Distinguishes a first hire from a company that currently has no sellers after prior AE employment. |
| `repeatability.founder_can_articulate_path` | Explicit buyer/problem/trigger/close-path evidence required by §4A. |
| `current_team.founder_expected_to_remain_seller` | Positive founder commitments count only when continued selling is explicit. |
| `current_team.founder_in_existing_team` | Prevents duplicate founder capacity; a founder in the seller list also establishes this. |
| `current_team.departing_seller_index`, `departure_date` | Identifies replacement capacity removed after departure. |
| `conversion.post_change_wins`, `post_change_qualified_opps`, `post_change_non_founder` | A distinct post-pivot cohort; old wins cannot prove repeatability of the new motion. |
| `timing.expects_contribution_inside_horizon` | Makes an after-horizon start a fatal contradiction when in-period contribution is explicitly expected. |
| `demand.shortfall_closure_supported`, `closure_amount`, `closure_date`, `needed_by_date` | A short-demand exception requires a quantified closure amount and a deadline, not a bare assertion. |
| `management.overloaded`, `readiness_resolution_before_start` | Declared management constraints and their stated resolution. No rep-per-manager benchmark is inserted. |

`start_month_index` is a fixture convenience anchored to the supplied target start month. `departure_month_index` means the end of the stated month; G13 removes capacity after month two. The engine does not invent a calendar year. A missing revenue basis is decision-critical; compatible values must be explicitly supplied. TCV/ARR or weighted/unweighted normalization is not guessed from contract length.

## Calculation conventions

- Horizon endpoints are inclusive. Month fractions use actual calendar days, including leap days. Ramp age is measured from hire-date monthly anniversaries. A fractional sales-cycle day is rounded upward for date eligibility.
- Existing sellers without a start date are treated as already active at horizon start. A seller with a ramp plan requires its ramp start. Unknown attainment uses declared quota and an explicit assumption, as required by §4.8.
- A supplied ramp schedule takes precedence. A complete schedule ending at 1 stays at 1 afterward. An unfinished schedule ending below 1 does not invent a tail. The default schedule is the specified linear progression.
- Closed-bookings ramp receives no second cycle delay. Pipeline-productivity ramp only recognizes generated pipeline whose lagged close falls inside the horizon. A first-touch/first-meeting cycle cannot silently substitute for a qualified-opportunity cycle.
- The default current-pipeline fallback is labeled as an assumption about horizon eligibility. Future creation respects the qualified-cycle cutoff. A supplied monthly series takes precedence over a monthly average. Missing series entries remain unknown; seasonal linear extrapolation is disclosed and limits confidence.
- Founder capacity already in the team is never added again. Separately selling founders also consume pipeline supply; that supply is not simultaneously allocated to the new seller.
- Allocation requires an explicit amount or share. Mathematical surplus alone cannot prove reassignment. Supported allocation measures are capped by current-team/founder demand and the available pool.
- Finance-plan capacity remains separate from operating capacity, with a difference warning. Cost ratios are informational and do not introduce a hire/no-hire threshold.
- Unknown ramp meaning returns both interpretations and a contribution range. Conflicting branch decisions cannot yield supported.
- Latest viable start means the latest start that produces positive modeled contribution by the stated deadline. It does not promise to fill the entire revenue gap; the criterion is stored with the date.

## Surfaced spec conflicts and fixture corrections

These conflicts were surfaced before adopting corrected fixtures. The user instructed the implementation to continue. The literal Appendix B base is retained in `tests/ae-fixtures.js`; explicit test data is added separately.

1. **G02 supply versus the surplus rule.** The literal base, using 94-day cycle eligibility, has an approximately $9.207M pool and $6.413M existing-team requirement. Allocation is capped around $2.794M, or 0.871× of the new seat requirement, even if $4.2M is declared. The corrected strong-case fixture supplies $1M/month of creation so that the declared $4.2M remains supported after reservation and individual downside sensitivities. Thresholds and the surplus formula were retained.
2. **Open pipeline versus allocation.** `pipeline_likely_open_at_ae_start` is not automatically pipeline assigned to the new seller. The fixtures now supply explicit allocation fields. This follows the ownership safeguard in §9.2 rather than treating theoretical surplus as reassignment evidence.
3. **Stale values after deep merge.** G05/G07/G20 explicitly clear the inherited non-founder supplied rate. G06/G07/G21/G22 keep duplicate evidence-window counts consistent. Contradictory raw versions remain covered by validation tests.
4. **Fixture-only missing facts.** Tests supply ISO dates, compatible ACV/pipeline bases, explicit first-AE intent and founder-path evidence. G16 replaces `recent` with a dated pivot and identifies its post-pivot cohort. G12 supplies a revenue-needed deadline so that the intended ramp interpretation disagreement actually exists.
5. **G08 versus fatal date validation.** A start after the horizon yields zero contribution and not-yet-supported. It is a fatal contradiction only when an explicit input also expects in-period contribution, matching the condition attached to §3.5's fatal example.
6. **Reference rate versus Appendix rate.** The §11 fixture uses literal 21% evidence. The Appendix fixture retains 12/57. Neither rate is rounded to manufacture a match. The complete reference test verifies $675,000 contribution, $3,214,285.714 pipeline required, the conditional decision and the $314,285.714 pipeline condition.
7. **Reference confidence versus sensitivity rules.** The reference's illustrative moderate/high confidence cannot override §§5.12/14 when a modest change flips the decision. The engine lowers confidence for those cases while preserving the reference math and verdict. The mandatory ±20% grid is separate from the Appendix C ±10% enhanced-review check.
8. **Partial onboarding.** It is a conditional, nonmaterial gap when the named manager, owner and weekly capacities are ready. That remains eligible for support under §5.6. It is not treated as an unknown answer.
9. **Missingness versus conditional defaults.** Removing an answer to an outcome-determinative blocking question cannot turn a negative recommendation into a conditional hire. Missing allocation, later-AE founder dependence evidence, manager existence, onboarding ownership, or pipeline-review capacity fails the evidence gate. This preserves the mandatory missingness invariant instead of treating unknown as a favorable answer.
10. **Conversion selection order.** Step 3's calculated non-founder count priority governs the engine over the earlier intake summary. Post-change evidence takes priority over old history; founder-inclusive and new-market rates are explicitly scenario evidence.

## Boundaries

No intake screens, report renderer, commerce, persistence, analytics, operator override workflow or deployment was added. Private-data/payment invariants are outside this engine-only change; the engine has no communication or storage side effects. `enhanced_review_required` is data for a later operator workflow, not an implemented delivery or review system.

The engine exposes the mandatory six-variable scenario grid. With a company-specific monthly schedule, a hypothetical ramp-duration change is returned as unknown with a reason: no replacement company schedule was supplied. The supplied schedule is not silently rewritten. The public underwriting entry point always runs sensitivity.
