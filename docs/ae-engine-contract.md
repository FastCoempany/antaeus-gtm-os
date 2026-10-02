# AE underwriting engine: implementation contract

Scope: Step 3, Step 4 and their tests only. Source: `deliverables/plans/ae_hiring_underwriting_master_spec.md` at commit `1114340`. The source filename uses underscores. The master spec has not been edited.

Current versions: `ae-engine-1.3.0`, `ae-policy-1.1.0`, schema `ae-underwriting-1.0`. The 1.1.0 remediation follows `deliverables/plans/pr315_ae_underwriting_engine_audit.md`; see [Remediation 1.1.0](#remediation-110-pr-315-audit). The 1.2.0 second hardening pass follows the PR #316 second adversarial audit; see [Second hardening 1.2.0](#second-hardening-120-pr-316-second-audit). The 1.3.0 final pre-merge correction follows the PR #316 final pre-merge audit; see [Final pre-merge correction 1.3.0](#final-pre-merge-correction-130).

## Run

```sh
npm run test:ae
```

No installation or added test framework is required. Node runs four suites: formulas/reference case and remediation regressions, validation, all 24 golden cases, and adversarial invariants (including an explicit §14 block). `npm test` runs this suite through `pretest` before the existing Vitest tests.

| Suite | 1.0.0 (PR #315) | 1.1.0 | 1.2.0 | 1.3.0 |
| --- | ---: | ---: | ---: | ---: |
| `tests/ae-underwriting-engine.test.js` | 26 | 100 | 129 | 143 |
| `tests/ae-validation.test.js` | 67 | 91 | 106 | 106 |
| `tests/ae-golden-cases.js` | 24 | 24 | 24 | 24 |
| `tests/ae-invariants.test.js` | 65 | 87 | 98 | 100 |
| Total | 182 | 302 | 357 | 373 |

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
| `demand.current_pipeline_reserved_for_existing_team` | Optional (1.1.0). Pipeline inside the current cycle-eligible pool that current sellers and a separately selling founder already own or need. Nonnegative currency or explicit unknown. Every current claim for the new seller plus this reservation must fit the current pool. A positive explicit current allocation is admitted only when this reservation is known, when the existing team and founder have no pipeline demand, or when the claim fits inside an explicit `new_ae_pipeline_share_pct` of the current pool. It does not change horizon allocation, whose existing-team demand is already netted through the surplus cap. |
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
| `observed_monthly_pipeline_creation` | The supplied monthly value. When a `monthly_pipeline_series` is supplied, the series' creation inside the eligible window divided by `eligible_creation_months` (§3.3 P). Without a series, the single monthly value counts only when `pipeline_creation_is_seasonal` is `false`; otherwise observed creation is unknown (1.3.0, below). |
| `pipeline_creation_ratio` | `observed_monthly_pipeline_creation / required_monthly_pipeline_creation`. |
| `opportunity_creation_ratio` | `demand.monthly_qualified_opps_created / required_monthly_opps`. |
| `pipeline_creation_state`, `opportunity_creation_state` | `sufficient` (ratio ≥ `policy.demand.sufficientThreshold`), `short`, `not_required` (requirement 0), `unknown`, or `unbounded`. |
| `creation_unbounded_reason` | `zero_conversion` (observed conversion is 0, so no creation rate suffices) or `no_eligible_creation_month` (a positive remaining requirement but no month whose pipeline can close inside the horizon). |
| `creation_window_start` | Start of the eligible creation window (the horizon start). Creation conditions are dated here: the required rate is an average over the window, so it must hold from its start. |
| `pipeline_creation_missing`, `opportunity_creation_missing` | The specific inputs that would establish an `unknown` creation test (for example the current allocation, the reservation, the qualified cycle definition, ACV or the observed rate). They also appear in `evidence_gaps`. |

Both ratios are also in `calculations`, with `observed_monthly_pipeline_creation` and `monthly_opportunity_creation_gap`, and every one has a formula trace. A supplied zero creation rate is a known zero ratio. A zero requirement produces a `null` ratio with state `not_required`; it never becomes `Infinity`.

Decision rules: a `short` ratio adds a material `pipeline_creation` / `opportunity_creation` constraint with its normalized shortfall. `unknown` and `unbounded` add the same material constraint (shortfall 1 for unbounded, null for unknown) and name the missing evidence. Without that, removing adverse creation evidence would make the recommendation more aggressive than keeping it (§8.8). These constraints are material, never hard: creation shortfalls make a seat conditional; a horizon pipeline shortfall remains the hard demand failure. An `unknown` creation test also adds the low-confidence reason `creation_sufficiency_unknown` (§5.12: uncertain allocatable pipeline). Otherwise the unknown test would pin the decision at conditional, hide modest-sensitivity flips, and let a deletion raise confidence (§14.7). A sensitivity flip whose scenario fails on monthly creation (and any flip in the `pipeline_creation` variable) is coded `pipeline_creation` / `opportunity_creation` in the demand dimension, not `pipeline_supply`. Sensitivity rows carry the scenario's `primary_constraint`. Creation conditions are due at the eligible window start, or at `timing.decision_date` if that is later. The remaining pipeline gap treats differences within `policy.validation.equalityTolerance` (relative, numerical equality only) as zero, so summation rounding never creates a fractional-cent creation requirement.

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

The class is returned as `tests.repeatability.founder_late_stage_class`. Decision code reads only the policy lists; a policy without the mapping throws a `TypeError` rather than guessing. A missing or unrecognized value (anything other than `rarely`, `sometimes`, `often` or `almost_always`) blocks the evidence gate only when it could decide the case, that is, for a later AE whose dependence is not already established by other evidence. Other evidence means a 100% founder-primary share, or zero non-founder wins with company wins. In that case the decision is the same as for every recognized value (`founder_dependency`: not-yet when the seller is expected to run independently, conditional otherwise), and the gap is listed as `informational`. An unrecognized value's evidence gap asks for the value to be replaced, not supplied. When repeatability evidence is the only gate failure and no conversion or capacity gap is present, the primary constraint is `transferability`. The first-AE branch (§4A) is unchanged and never reads this field.

### 3. Current supply cannot borrow from future pipeline

Before 1.1.0, `allocatable_current_qualified_pipeline` was capped only by the horizon-wide allocation, which can include future creation. A $1.5M current claim on a $1.0M current pool survived whenever the horizon allocation was larger, understating the monthly creation requirement.

Now the current pool is `demand.current_qualified_pipeline_in_horizon` (falling back to `current_qualified_pipeline_value`, the same pool the demand math uses). Current claims are the explicit current allocation and, when a share is supplied, `current pool × new_ae_pipeline_share_pct`.

Current allocation is the smallest claim only when two conditions hold. First, the largest claim plus `current_pipeline_reserved_for_existing_team` fits the current pool. An unknown reservation is used here only at its lower bound, zero, to detect a contradiction. Second, a positive explicit dollar claim has a known reservation, unless the existing team and founder have no pipeline demand or the claim fits within the explicit share of the current pool. A dollar claim says nothing about what current sellers already hold, while an explicit share is itself a split of the pool.

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

Search method: binary search is used only where "positive by the deadline" is monotone in the start date, which holds for a linear ramp or a nondecreasing schedule ending at 1. Any other supplied schedule is scanned day by day from the deadline down, so the result is always the true latest start. A schedule with no positive month has no viable start and skips the search. Since 1.2.0 validation rejects decreasing schedules (A4), so the scan only serves nondecreasing schedules that do not end at 1.

The criterion is unchanged and stored with the date. The domain floor is returned as `latest_start_search_floor`. A start after the horizon now produces a condition coded `late_start` (previously always `sales_cycle_timing`).

### Spec interpretations made explicit

1. §4.24 lists "founder is not `almost_always` required late-stage" as a `demonstrated` criterion, while its `emerging` examples include "founder is sometimes/often involved." 1.1.0 follows the audit's tighter, versioned rule (only `rarely` is eligible). The master spec text is unchanged; the conflict is recorded here and in the remediation PR.
2. §4.22 compares observed monthly creation with the requirement. With a supplied monthly series, the observed figure is the series' eligible-window average; for a constant monthly value this equals the supplied value. (1.3.0: a supplied series is authoritative and the single value is reference metadata; see the 1.3.0 section.)
3. `observed` creation is company-wide creation as supplied, compared with the new seat's requirement (§4.22's formula). It is not netted against the existing team's own creation needs; the existing team's share of supply is handled by the horizon surplus cap and the current reservation.
4. `revenue_needed_by_date` is a requirement parameter, not evidence. Without it the horizon end is the deadline, so removing it can relax timing. It is excluded from the missingness sweep for that reason.

## Second hardening 1.2.0 (PR #316 second audit)

The PR #316 second adversarial audit found nine further cases where removed or mis-read evidence could strengthen a decision or mislabel its cause. Every fix below was reproduced on the PR #316 head `cf342d2` before the change, and every regression test named here fails on that head.

### Versions

| | Old | New | Reason |
| --- | --- | --- | --- |
| Engine | `ae-engine-1.1.0` | `ae-engine-1.2.0` | Identical normalized inputs now produce different outputs (A1–A5, B1–B4). Replay of a 1.1.0 result needs the 1.1.0 engine. |
| Policy | `ae-policy-1.1.0` | unchanged | No rule or value in `js/ae-policy.js` changed. The audit snapshot (`audit.policy_snapshot`) is byte-identical to 1.1.0, so a new policy version would label two identical policy objects differently. Every 1.2.0 change is validation, evidence-gate or attribution logic in the engine; the materiality used by A5 is the existing `validation.equalityTolerance`. |
| Schema | `ae-underwriting-1.0` | unchanged | No new input field. New outputs are additive. |

### A1. Timing reads the calculated current allocation

`testTiming()` read the raw alias `demand.allocatable_current_pipeline`. A supplied alias of `0` (not `null`) suppressed the first-close plausibility check, while the canonical `allocatable_current_qualified_pipeline` of `0` did not, so alias choice changed the decision. Timing now takes the calculated `allocation.current_allocatable`. Only an established positive current allocation can make a first close before `start + qualified cycle` plausible; zero, unknown and unestablished claims inherit nothing. The six-way matrix (canonical/alias × null/0/positive) produces identical decisions pairwise.

### A2. Missing transferable conversion is insufficient evidence

`selectTransferableWinRate()` now records `conversion_basis`: `non_founder`, `founder_inclusive_fallback`, `post_change_founder_inclusive`, `pre_change_history`, `first_ae_founder_inclusive` or `unknown`. The basis is kept separately from `transferability_assumption`, which a later market or stage qualification can overwrite. For a seat with positive modeled contribution, a basis of `unknown`, `founder_inclusive_fallback`, `post_change_founder_inclusive` or `pre_change_history` cannot establish the demand requirement. The case is then `insufficient_evidence` with primary `unknown_conversion` and the missing non-founder inputs listed. The exception is an independent hard blocker that already proves `not_yet_supported` (any hard constraint other than `pipeline_supply`, which itself depends on conversion), which keeps that result. The founder-inclusive rate is still used for the illustrative calculations, so it remains visible as a scenario. The first-AE branch (§4A) is unchanged.

### A3. Current supply must still be open at the AE start

Current allocation is now also bounded by `demand.pipeline_likely_open_at_ae_start`: current supply = `min(established current claim, pipeline likely open at AE start)`. A positive current claim with that answer unknown is `null` (`unknown_pipeline_open_at_ae_start`), so the creation test is unknown and names the field. V1 defines no "materially later" threshold. Any positive claim needs the survival answer, because exempting short delays would let deleting the answer lift a capped claim. A known zero claim needs no survival evidence. Horizon-wide allocation and coverage are unchanged; only the current share that reduces the monthly creation requirement is bounded. Trace fields are `pipeline_open_at_ae_start` and `current_claim_before_start_survival`.

### A4. Ramp schedules must be nondecreasing

Validation rejects a supplied `monthly_ramp_schedule` (or its `ramp_schedule` alias) whose factor ever decreases, with the fatal error `non_monotone_ramp_schedule`. The range rule (`invalid_ramp_schedule`: every factor finite and within 0..1) is unchanged. §14.3 (a later start never adds in-horizon contribution) is tested across every accepted shape in both ramp modes.

### A5. A monthly series and a single monthly value must agree (superseded in 1.3.0)

*Superseded by [Final pre-merge correction 1.3.0](#final-pre-merge-correction-130): the equality comparison below treated two differently scoped numbers as one measurement. It is no longer applied.*

When both `monthly_pipeline_series` and `monthly_qualified_pipeline_created_value` are supplied, the series' eligible-window average is compared with the single value. Two cases raise the clarification `creation_source_conflict` (with `series_window_average` and `single_monthly_value`), and no decision is reached until it is reconciled:

- the two differ by more than `validation.equalityTolerance` (relative);
- the series has unknown months inside the window.

V1 deliberately has no business-materiality band. Any band lets deleting the less favorable source strengthen the result by up to the band. When they agree, the series drives the temporal math. When only one is supplied, it is used as given.

### B1. Unknown management or seasonality cannot raise confidence

Any unanswered `direct_manager_exists`, `weekly_1to1_capacity`, `weekly_pipeline_review_capacity`, `onboarding_owner_named` or `onboarding_plan_exists` adds the low-confidence reason `management_evidence_unknown`. Previously an unanswered question pinned the decision at conditional, hid modest-sensitivity flips and lifted confidence. An unknown `pipeline_creation_is_seasonal` with no monthly series adds the moderate reason `seasonality_unknown`, equal to the declared-seasonal penalty. Both are covered by one-field-at-a-time deletion sweeps.

### B2. Zero existing-team conversion is explicit

`existingWinRate()` returns `{ value, source }` and tests numeric type, never truthiness. At a known zero team rate with positive existing or founder bookings, the existing-team pipeline requirement is unbounded: `existing_pipeline_requirement_status = 'unbounded'` and `existing_pipeline_required = null` (never `Infinity`). The theoretical surplus cap is `0`, never dropped. When that zero is supplied for the team itself (existing-team rate, all-seller counts or the supplied all-seller rate), it contradicts the team's positive bookings and raises the clarification `existing_team_zero_conversion`. When it only comes from the zero transferable fallback (the proposed seller's own zero conversion), there is no clarification. The zero-conversion `not_yet_supported` rule still applies, and allocation stays flagged uncertain because the team rate itself is not observed. New calculations: `existing_team_conversion_rate` and `existing_pipeline_requirement_status`.

### B3. Unknown ramp keeps both interpretations

With `ramp_definition` unknown, both interpretations are evaluated end to end: tests, sensitivity, decision, the zero-conversion rule and the latest viable start. The reported decision is the weaker of the two branches, capped at conditional. 1.1.0 forced `conditional` whenever branches differed, which let a pipeline-productivity `not_yet_supported` become `conditional` once `ramp_definition` was deleted. The governing branch's primary constraint is kept. Every other operating constraint from either branch is preserved in the secondaries, and `ramp_ambiguity` is added alongside them, never in place of the operating constraint. `decision.ramp_branches` (also `ramp_interpretations`) carries each branch's decision, primary, secondaries, confidence, timing and latest viable start. `tests.timing_management.timing` carries `latest_viable_start_by_ramp`, a `latest_viable_start_range`, and a single `latest_viable_start` (1.3.0 refines how a branch's `null` is read; see below). Outputs (tests, calculations, conditions) come from the governing branch.

### B4. Low confidence is attributed to its cause

Low confidence no longer becomes a `transferability` constraint by default. Each reason maps to the constraint it describes:

| Reasons | Constraint | Dimension |
| --- | --- | --- |
| `very_thin_conversion_sample` | `thin_conversion_sample` | repeatability |
| `transferability_unproven`, `unknown_conversion`, `unknown_conversion_sample`, `conversion_source_weak_or_unknown` | `transferability` | repeatability |
| `unknown_pipeline_allocation`, `pipeline_source_weak_or_unknown` | `unknown_pipeline_allocation` | demand |
| `creation_sufficiency_unknown` | `pipeline_creation` / `opportunity_creation` | demand |
| `ramp_ambiguity` | `ramp_ambiguity` | timing |
| `management_evidence_unknown` | `management_capacity` | management |
| `attainment_source_weak_or_unknown` | `unknown_current_capacity` | economic need |

Reasons with their own constraint source (unknown core test, sensitivity flip, unresolved conflict) are not duplicated. If low confidence has no attributable cause and no other material constraint exists, the generic `evidence_confidence` is used. The `transferability` condition for a later AE now fires on low confidence only when a repeatability or conversion reason is present.

### Golden fixtures changed in 1.2.0

- **G07** (founder-inclusive rate only): now `insufficient_evidence` / `unknown_conversion` (A2). The master spec's G07 expects `conditional`; see ambiguity 1.
- **G12** (unknown ramp, branches differ): now `not_yet_supported` / `sales_cycle_timing`, the pipeline-productivity branch (B3). The allowed list gained `not_yet_supported`. The spec's G12 requirement ("never supported without resolving the ambiguity") still holds.
- **G24** (seasonal series): 1.2.0 dropped Appendix B's single monthly value; 1.3.0 restores the spec's literal fixture (series plus the recent single value), and the series drives the math with the single value as reference.

### Remaining ambiguities (founder decision before freeze)

1. A2 vs master spec §4.4 Priority 5 and G07: the spec allows a founder-inclusive-only rate to support a conditional decision as an illustrative scenario. 1.2.0 follows the audit: the rate stays illustrative, but the decision is insufficient evidence.
2. A5 strictness: resolved in 1.3.0 by source semantics rather than a tolerance band (see below).
3. A3 strictness: every positive current claim needs `pipeline_likely_open_at_ae_start`, with no "materially later" exemption.
4. B3 reports outputs from the governing (weaker) ramp branch, so calculations for an unknown ramp can come from the pipeline-productivity branch rather than always from closed bookings.
5. Company-wide versus seat-allocatable creation (audit §16) was settled on 2026-10-02 as company-wide; the §4.24 founder-dependence wording (audit §17) is reconciled after merge. See [Product decisions](#product-decisions-founder-2026-10-02).

## Final pre-merge correction 1.3.0

The PR #316 final pre-merge audit found two semantic defects in 1.2.0. Both were corrected on this branch, and every 1.2.0 regression still passes.

### Versions

| | Old | New | Reason |
| --- | --- | --- | --- |
| Engine | `ae-engine-1.2.0` | `ae-engine-1.3.0` | Identical normalized inputs produce different outputs. Minor bump, matching the 1.1.0 and 1.2.0 convention for output-changing corrections. |
| Policy | `ae-policy-1.1.0` | unchanged | No rule or value in `js/ae-policy.js` changed. |
| Schema | `ae-underwriting-1.0` | unchanged | No new input field. New outputs are additive. |

### 1. Monthly series vs single monthly value: source semantics, not equality

1.2.0 compared a series' eligible-window average with the single monthly value and raised `creation_source_conflict` unless they were numerically equal. For seasonal data that is wrong. The single value is often a recent month, which legitimately differs from a multi-month seasonal average (§4.22: use a series, do not extrapolate one month). 1.3.0 removes the comparison and the clarification. The two inputs now have explicit, distinct meanings:

| Input | Meaning |
| --- | --- |
| `demand.monthly_pipeline_series` | The monthly creation pattern, indexed from the horizon start. When supplied it is **authoritative** for all creation modeling. Unknown months inside the eligible window make creation unknown, with warning `incomplete_monthly_pipeline_series` and the series named as an evidence gap. |
| `demand.monthly_qualified_pipeline_created_value` | A single monthly creation figure, which the intake should label as **recent / typical monthly creation**. Its role is recorded as `audit.math.demand.single_monthly_value_role`. |

The role of the single value depends on what else is supplied:

| Inputs | Role | Effect |
| --- | --- | --- |
| A series is supplied | `reference` | Kept for audit only; never compared with the series and never changes the result. |
| No series, `pipeline_creation_is_seasonal === false` | `modeling` | Extrapolated flat across the eligible window, as before. |
| No series, seasonality `true` or unanswered | `illustrative` | Shown as `illustrative_flat_future`, but creation and the future pool are unknown. Warning `seasonal_creation_requires_series` or `creation_seasonality_unconfirmed`. The evidence gaps name the series, and also the seasonality answer when it is unanswered. |

An unanswered seasonality question is treated like a seasonal one, because B1 requires that deleting `pipeline_creation_is_seasonal` can never strengthen a decision. If an unanswered flag let the single value prove creation, deleting a `true` flag would lift the result. The single value therefore establishes creation only when creation is confirmed not seasonal.

When the future pool is unknown and the known part of the pool cannot prove the existing-team surplus cap non-binding, the existing 1.1.0 pool-unknown gate makes the case `insufficient_evidence`. Otherwise creation is unknown: a material constraint plus low confidence.

Guarantees:

- deleting a seasonal series (with or without the seasonality answer) never strengthens the decision or raises confidence;
- with a series supplied, the single value never changes the decision.

The differential corpus found 52 deletion pairs on `e4e3060` where removing evidence strengthened the result, including G02 going from not-yet to supported when its seasonal series was deleted. 1.3.0 has none.

### 2. Unknown-ramp latest viable start: `null` read with branch state

1.2.0 discarded every `null` branch date and reported the other branch's date as "viable under both interpretations." A `null` means different things, so each branch now carries `latest_start_status`:

- `not_needed`: timing compatible, no corrective date;
- `date`;
- `none`: the search ran and no start works;
- `unknown`: the search could not run.

`reconcileRampLatestStart()` (exported) produces the combined result:

| Branch statuses | `latest_viable_start` | `latest_viable_start_reason` |
| --- | --- | --- |
| both `date` | the earlier date | `null` |
| `not_needed` + `date` | the dated branch | `null` |
| any `none` | `null` | `no_common_viable_start_across_ramp_interpretations` |
| any `unknown` (no `none`) | `null` | `latest_start_unknown_for_a_ramp_interpretation` |
| both `not_needed` | `null` | `null`; no corrective timing condition is created |

Branch detail is kept in `latest_viable_start_by_ramp` and `latest_start_status_by_ramp`. A known ramp whose search finds nothing reports `latest_viable_start_reason: 'no_viable_start'`.

When only the non-governing interpretation needs a timing correction, its timing condition is still reported, dated with the combined latest start. The governing-branch rule from 1.2.0 (the weaker decision governs; ties go to closed bookings) is unchanged.

Not every combination occurs end to end. Both branches share the deadline, and pipeline productivity's search floor is never later than closed bookings', so a dated closed-bookings branch implies a dated pipeline-productivity branch. "One `none`, one `date`" is therefore covered by direct tests of the exported function.

### Product decisions (founder, 2026-10-02)

These settle the open items from the final pre-merge audit. They are intake and report wording plus scope. No engine code changes.

1. **Single monthly value label.** The intake asks: *"Over the last few months, how much new pipeline do you create per month?"* This is the meaning the engine already assumes for `demand.monthly_qualified_pipeline_created_value`.
2. **Seasonality is a required question.** It feeds `demand.pipeline_creation_is_seasonal`; without a monthly series, an unanswered flag leaves creation unknown.
   - Question: *"Does your new pipeline change a lot by season?"*
   - Help text: *"Say yes if some months are much busier than others. This keeps us from guessing a whole year from a few months."*
3. **Pipeline open at AE start is asked when deals are handed over.** Whenever positive current pipeline is claimed for the new AE, the intake asks for `demand.pipeline_likely_open_at_ae_start` (A3). Proposed wording, not yet confirmed by the founder:
   - Question: *"Which of these deals will still be open on the new hire's first day?"*
   - Help text: *"Deals that close before they start can't be handed to them."*
4. **Creation scope: company-wide.** Observed creation counts all new pipeline the company creates, compared with the new seat's requirement (§4.22 as written). This closes audit §16; the engine already behaves this way.
5. **Master spec reconciliation after merge.** Update G07 (A2) and the §4.24 founder-dependence wording to match engine 1.3.0 and policy 1.1.0.

## Boundaries

No intake screens, report renderer, commerce, persistence, analytics, operator override workflow or deployment was added. Private-data/payment invariants are outside this engine-only change; the engine has no communication or storage side effects. `enhanced_review_required` is data for a later operator workflow, not an implemented delivery or review system.

The engine exposes the mandatory six-variable scenario grid. With a company-specific monthly schedule, a hypothetical ramp-duration change is returned as unknown with a reason: no replacement company schedule was supplied. The supplied schedule is not silently rewritten. The public underwriting entry point always runs sensitivity.
