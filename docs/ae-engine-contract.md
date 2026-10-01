# AE underwriting engine: implementation contract

Scope: Step 3, Step 4 and their tests only. Source: `deliverables/plans/ae_hiring_underwriting_master_spec.md` at commit `1114340`. The source filename uses underscores. The master spec has not been edited.

Current versions: `ae-engine-1.1.0`, `ae-policy-1.1.0`, schema `ae-underwriting-1.0`. The 1.1.0 remediation follows `deliverables/plans/pr315_ae_underwriting_engine_audit.md`; see [Remediation 1.1.0](#remediation-110-pr-315-audit).

## Run

```sh
npm run test:ae
```

No installation or added test framework is required. Node runs four suites: formulas/reference case and remediation regressions, validation, all 24 golden cases, and adversarial invariants (including an explicit §14 block). `npm test` runs this suite through `pretest` before the existing Vitest tests.

| Suite | 1.0.0 (PR #315) | 1.1.0 |
| --- | ---: | ---: |
| `tests/ae-underwriting-engine.test.js` | 26 | 92 |
| `tests/ae-validation.test.js` | 67 | 97 |
| `tests/ae-golden-cases.js` | 24 | 24 |
| `tests/ae-invariants.test.js` | 65 | 87 |
| Total | 182 | 300 |

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
| `demand.allocatable_current_qualified_pipeline` | Explicit allocation to the proposed seller of pipeline that exists today (inside the current cycle-eligible pool), used for monthly creation requirements. `allocatable_current_pipeline` is an alias. Never derived from horizon-wide allocation or surplus. |
| `demand.current_pipeline_reserved_for_existing_team` | Optional (1.1.0). Pipeline inside the current cycle-eligible pool that current sellers and a separately selling founder already own or need. Nonnegative currency or explicit unknown. Every current claim for the new seller plus this reservation must fit the current pool. A positive explicit current allocation is admitted only when this reservation is known, or when the existing team and founder have no pipeline demand. It does not change horizon allocation, whose existing-team demand is already netted through the surplus cap. |
| `demand.current_qualified_pipeline_in_horizon` | Type-checked from 1.1.0 (numbers or explicit unknown only) and must not exceed `current_qualified_pipeline_value`. |
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
- Latest viable start means the latest start that produces positive modeled contribution by the stated deadline. It does not promise to fill the entire revenue gap; the criterion is stored with the date. The deterministic search may return a date before the horizon (1.1.0); its floor is stored as `latest_start_search_floor`.

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

## Remediation 1.1.0 (PR #315 audit)

The audit is `deliverables/plans/pr315_ae_underwriting_engine_audit.md`. Each change below fixed a defect reproduced on `main` before the fix.

### Versions

| | Old | New | Reason |
| --- | --- | --- | --- |
| Policy | `ae-policy-1.0.0` | `ae-policy-1.1.0` | Decision rule change: founder late-stage requirement mapping (below). No threshold value changed. |
| Engine | `ae-engine-1.0.0` | `ae-engine-1.1.0` | Same input and policy now produce different outputs (creation tests reach the decision, current-allocation temporality, pre-horizon start search, pool-unknown gate). Replay of a 1.0.0 result needs the 1.0.0 engine. |
| Schema | `ae-underwriting-1.0` | unchanged | The only new input is optional; every 1.0 input remains valid. |

### 1. Demand creation reaches the decision

Before 1.1.0 the engine computed `pipeline_creation_ratio` only in top-level `calculations`, never computed an opportunity ratio, and `Decision.decide()` read `demand.pipeline_creation_ratio` / `demand.opportunity_creation_ratio`, which were always undefined. A seat with sufficient horizon pipeline but an inadequate monthly engine could be `supported`.

Now, before any decision call, the demand test carries:

| Field | Meaning |
| --- | --- |
| `required_monthly_pipeline_creation` | `max(0, qualified_pipeline_required - allocatable_current_pipeline) / eligible_creation_months` (§4.22). `0` when current allocation covers the requirement; `null` when unknown or unbounded. |
| `required_monthly_opps` | `required_monthly_pipeline_creation / average_acv` (§4.23; equal to remaining opportunities / eligible months). `0` when no creation is required. |
| `observed_monthly_pipeline_creation` | The supplied monthly value. When a `monthly_pipeline_series` is supplied, the series' creation inside the eligible window divided by `eligible_creation_months`, because a supplied series takes precedence over a single monthly value everywhere in the engine (§3.3 P). |
| `pipeline_creation_ratio` | `observed_monthly_pipeline_creation / required_monthly_pipeline_creation`. |
| `opportunity_creation_ratio` | `demand.monthly_qualified_opps_created / required_monthly_opps`. |
| `pipeline_creation_state`, `opportunity_creation_state` | `sufficient` (ratio ≥ `policy.demand.sufficientThreshold`), `short`, `not_required` (requirement 0), `unknown`, or `unbounded`. |
| `creation_unbounded_reason` | `zero_conversion` (observed conversion is 0, so no creation rate suffices) or `no_eligible_creation_month` (a positive remaining requirement but no month whose pipeline can close inside the horizon). |
| `creation_window_start` | Start of the eligible creation window (the horizon start). Creation conditions are dated here: the required rate is an average over the window, so it must hold from its start. |
| `pipeline_creation_missing`, `opportunity_creation_missing` | The specific inputs that would establish an `unknown` creation test (for example the current allocation, the reservation, the qualified cycle definition, ACV or the observed rate). They also appear in `evidence_gaps`. |

Both ratios are also in `calculations`, with `observed_monthly_pipeline_creation` and `monthly_opportunity_creation_gap`, and every one has a formula trace. A supplied zero creation rate is a known zero ratio. A zero requirement produces a `null` ratio with state `not_required`; it never becomes `Infinity`.

Decision rules: a `short` ratio adds a material `pipeline_creation` / `opportunity_creation` constraint with its normalized shortfall. `unknown` and `unbounded` add the same material constraint (shortfall 1 for unbounded, null for unknown) and name the missing evidence. Without that, removing adverse creation evidence would make the recommendation more aggressive than keeping it (§8.8). These constraints are material, never hard: creation shortfalls make a seat conditional; a horizon pipeline shortfall remains the hard demand failure. An `unknown` creation test also adds the low-confidence reason `creation_sufficiency_unknown` (§5.12: uncertain allocatable pipeline). Otherwise the unknown test would pin the decision at conditional, hide modest-sensitivity flips, and let a deletion raise confidence (§14.7). A decision flip in the `pipeline_creation` sensitivity scenario is coded `pipeline_creation`, not `pipeline_supply`. The remaining pipeline gap treats differences within `policy.validation.equalityTolerance` (relative, numerical equality only) as zero, so summation rounding never creates a fractional-cent creation requirement.

Evidence gate (1.1.0): when the demand pool is unknown because current pipeline, the qualified cycle or creation evidence is missing, the existing-team surplus cap disappears. If the known part of the pool cannot prove that cap non-binding (allocation ≤ known pool − existing-team demand, and ≤ known pool × any explicit share), the missing pool input is outcome-determinative and fails the gate. Before 1.1.0, deleting monthly creation, the cycle or the current pipeline value from a surplus-capped `not_yet_supported` case returned `conditional`. When the known pool already proves the cap non-binding, the gate still passes and the case stays conditional with the evidence gap listed.

### 2. Founder late-stage requirement is policy-owned

`founder_required_late_stage` records when the founder is required late-stage, not merely present. Before 1.1.0 any known value except `almost_always` could satisfy `demonstrated`, so `sometimes` and `often` could produce `supported`.

`policy.repeatability.founderLateStage`:

| Value | Class | Later-AE effect |
| --- | --- | --- |
| `rarely` | `demonstrated` | Eligible for `demonstrated` if every other criterion passes. |
| `sometimes`, `often` | `emerging` | Cannot be `demonstrated`; at best `emerging` (material transferability constraint, so never unconditional support). |
| `almost_always` | `dependent` | `founder_dependent`. |
| unknown or any unlisted value | `unknown` | Cannot be `demonstrated`; evidence-gate blocker and evidence gap. |

The class is returned as `tests.repeatability.founder_late_stage_class`. Decision code reads only the policy lists; a policy without the mapping throws a `TypeError` rather than guessing. An unrecognized supplied value (not `rarely`, `sometimes`, `often`, `almost_always` or unknown) raises the clarification `unrecognized_founder_late_stage`. A missing value blocks the evidence gate only when it could decide the case. If founder dependence is already established by other evidence (100% founder-primary share, or zero non-founder wins with company wins), the case stays `not_yet_supported` with the gap listed. A gate that fails only on repeatability evidence reports `transferability` as its primary constraint. The first-AE branch (§4A) is unchanged and does not consult this mapping.

### 3. Current supply cannot borrow from future pipeline

Before 1.1.0, `allocatable_current_qualified_pipeline` was capped only by the horizon-wide allocation, which can include future creation. A $1.5M current claim on a $1.0M current pool survived whenever the horizon allocation was larger, understating the monthly creation requirement.

Now the current pool is `demand.current_qualified_pipeline_in_horizon` (falling back to `current_qualified_pipeline_value`, the same pool the demand math uses). Current claims are the explicit current allocation and, when a share is supplied, `current pool × new_ae_pipeline_share_pct`.

Current allocation is the smallest claim only when two conditions hold. First, the largest claim plus `current_pipeline_reserved_for_existing_team` fits the current pool. An unknown reservation is used here only at its lower bound, zero, to detect a contradiction. Second, a positive explicit dollar claim has a known reservation, unless the existing team and founder have no pipeline demand. A dollar claim says nothing about what current sellers already hold, while an explicit share is itself a split of the pool.

When ownership is not established, current allocation is `null` with a specific warning:

- `current_allocation_exceeds_current_pool`: validation also raises the clarification of the same code, so no decision is reached until reconciled.
- `unknown_current_reservation`.
- `unknown_current_pipeline_pool`: a positive claim, or a share, against an unknown pool. A zero claim needs no pool evidence.
- `unknown_current_pipeline_allocation`: no claim at all.

Current allocation remains capped by the seller's total allocation. Current-pool comparisons tolerate floating-point rounding only, not any business tolerance.

### 4. Latest viable start can precede the horizon

Before 1.1.0 the binary search started at `target_period_start`, so a pipeline-productivity seat whose pipeline must be generated before the horizon (Jan 1 horizon, Feb 1 deadline, 94-day cycle) returned `null`.

The search domain now runs from a floor to the deadline `min(revenue_needed_by_date, target_period_end)`. The floor is `target_period_start − lag − (firstPositiveMonth + 1) × 31 days`, clamped to `0001-01-01`. `lag` is the ceiling of the qualified cycle for pipeline-productivity ramps; it is 0 for closed bookings, which receive no second delay. `firstPositiveMonth` is the first ramp month with a positive factor: 0 for a linear ramp, otherwise the index in the supplied schedule.

Why the floor is safe: a start whose first positive month falls on the last eligible generation day (deadline − lag) is always viable. So the latest viable start, if one exists, lies inside the domain; the extra month covers hire-date anniversary rounding.

Search method: binary search is used only where "positive by the deadline" is monotone in the start date, which holds for a linear ramp or a nondecreasing schedule ending at 1. Any other supplied schedule is scanned day by day from the deadline down, so the result is always the true latest start.

The criterion is unchanged and stored with the date. The domain floor is returned as `latest_start_search_floor`. A start after the horizon now produces a condition coded `late_start` (previously always `sales_cycle_timing`).

### Spec interpretations made explicit

1. §4.24 lists "founder is not `almost_always` required late-stage" as a `demonstrated` criterion, while its `emerging` examples include "founder is sometimes/often involved." 1.1.0 follows the audit's tighter, versioned rule (only `rarely` is eligible). The master spec text is unchanged; the conflict is recorded here and in the remediation PR.
2. §4.22 compares observed monthly creation with the requirement. With a supplied monthly series, the observed figure is the series' eligible-window average; for a constant monthly value this equals the supplied value.
3. `observed` creation is company-wide creation as supplied, compared with the new seat's requirement (§4.22's formula). It is not netted against the existing team's own creation needs; the existing team's share of supply is handled by the horizon surplus cap and the current reservation.
4. `revenue_needed_by_date` is a requirement parameter, not evidence. Without it the horizon end is the deadline, so removing it can relax timing. It is excluded from the missingness sweep for that reason.

## Boundaries

No intake screens, report renderer, commerce, persistence, analytics, operator override workflow or deployment was added. Private-data/payment invariants are outside this engine-only change; the engine has no communication or storage side effects. `enhanced_review_required` is data for a later operator workflow, not an implemented delivery or review system.

The engine exposes the mandatory six-variable scenario grid. With a company-specific monthly schedule, a hypothetical ramp-duration change is returned as unknown with a reason: no replacement company schedule was supplied. The supplied schedule is not silently rewritten. The public underwriting entry point always runs sensitivity.
