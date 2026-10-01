# PR #315 Audit — AE Underwriting + Decision Engine

**Repository:** `FastCoempany/antaeus-gtm-os`  
**PR:** `#315 — Implement AE underwriting and decision engines with golden tests`  
**PR head:** `159a475ab64591c4dada5ab6922c4d67dc51243a`  
**Merged to main:** `ea439365a7ea3ee3af4f94a2ac70bc81e855df64`  
**Audit date:** 2026-10-01  
**Audit basis:** `deliverables/plans/ae_hiring_underwriting_master_spec.md` plus adversarial review of the merged implementation.

---

# 1. Executive Verdict

## DO NOT PROCEED TO THE LANDING PAGE / INTAKE BUILD YET

PR #315 is **architecturally strong and directionally correct**, but the merged engine has **two decision-integrity defects and two supporting calculation/condition defects that should be fixed before the engine is treated as frozen**.

This is not a rewrite.

The implementation got a large amount right:

- deterministic, pure JavaScript engine
- browser + Node compatibility
- thresholds isolated in a versioned policy module
- no DOM/network/current-clock dependency
- versioned input/policy audit snapshots
- unknown-safe arithmetic
- zero-conversion handling without `Infinity`
- first-AE branch
- replacement-hire handling
- ARR/TCV and weighted-pipeline gates
- founder-capacity deduplication
- closed-bookings vs pipeline-productivity ramp branches
- sales-cycle double-count prevention
- explicit pipeline ownership/allocation logic
- GTM-pivot handling
- new-market transferability qualification
- seasonality support
- sensitivity analysis
- immutable output/audit state
- 24 golden cases
- monotonicity and missingness tests

The problem is that the current suite proves the cases it contains; it does not yet prove several important cases it **omits**.

### Current status

**Engine freeze:** ❌ not yet  
**Rewrite required:** ❌ no  
**Remediation PR required:** ✅ yes  
**Proceed to UI after remediation passes:** ✅ yes

---

# 2. CI / Process Findings

PR #315's CI was green.

The GitHub Actions run for the PR completed successfully across:

- Unit + component tests
- Vite build
- Typecheck
- Playwright E2E smoke tests

The AE-specific pretest reported:

```text
AE engine:      26 passed, 0 failed
AE validation:  67 passed
AE golden:      24/24 passed
AE invariants:  65 passed
--------------------------------
AE total:       182 passed
```

That is useful evidence that the implementation is stable **against its present suite**.

It is not evidence that the suite is complete.

## Merge-process issue

PR #315 merged at:

```text
2026-09-30 21:16:49 UTC
```

The automated Codex review containing the four defects below was submitted at:

```text
2026-09-30 21:20:56 UTC
```

The PR therefore merged roughly four minutes **before** the review findings existed.

### Process correction

For the AE underwriting product, do not merge future engine-policy PRs until all three are complete:

```text
1. CI green
2. Codex/GitHub review complete
3. adversarial product-logic review complete
```

A green CI run should not be the final gate for decision logic.

---

# 3. Merge-Blocking Finding 1 — Demand-Creation Shortfalls Never Reach the Decision Engine

**Severity:** P1  
**Files:**  
- `js/ae-underwriting-engine.js`
- `js/ae-decision-engine.js`

## Problem

The engine correctly calculates:

```js
pipeline_creation_ratio
```

inside the top-level `calculations` object.

It also calculates:

```js
required_monthly_opps
```

But neither the pipeline-creation ratio nor an opportunity-creation ratio is attached to the `demand` object that is passed to:

```js
Decision.decide(context, policy)
```

The decision engine explicitly checks:

```js
demand.pipeline_creation_ratio
demand.opportunity_creation_ratio
```

but those properties are never populated.

Therefore both checks silently behave as if the evidence does not exist.

## Current behavior

`js/ae-underwriting-engine.js` currently does approximately:

```js
Object.assign(demand, {
  required_monthly_pipeline_creation: requiredMonthly,
  required_monthly_opps: requiredOpps,
  creation_cutoff_date: ...,
  allocation_uncertain: ...
});

const calculations = {
  ...
  pipeline_creation_ratio:
    divide(
      input.demand.monthly_qualified_pipeline_created_value,
      requiredMonthly
    ),
  ...
};
```

The ratio exists in:

```text
calculations.pipeline_creation_ratio
```

but not:

```text
demand.pipeline_creation_ratio
```

No equivalent:

```text
opportunity_creation_ratio
```

is calculated at all.

Then `js/ae-decision-engine.js` asks:

```js
if (
  numeric(demand.pipeline_creation_ratio) &&
  demand.pipeline_creation_ratio < policy.demand.sufficientThreshold
) {
  ...
}

if (
  numeric(demand.opportunity_creation_ratio) &&
  demand.opportunity_creation_ratio < policy.demand.sufficientThreshold
) {
  ...
}
```

Both can remain `undefined`.

## Why this is material

A company can have enough dollar-denominated horizon pipeline to produce:

```text
demand.state = sufficient
```

while its actual monthly engine is producing too few:

- qualified pipeline dollars, or
- qualified opportunities

to keep the new seller supplied.

Under the current implementation, that shortfall can fail to affect the final decision.

A case that should be:

```text
CONDITIONAL
Primary/secondary constraint: pipeline creation or opportunity creation
```

can incorrectly remain:

```text
SUPPORTED
```

## Required fix

Compute both ratios before the first decision call:

```js
const pipelineCreationRatio =
  divide(
    input.demand.monthly_qualified_pipeline_created_value,
    requiredMonthly
  );

const opportunityCreationRatio =
  divide(
    input.demand.monthly_qualified_opps_created,
    requiredOpps
  );
```

Attach them to **both** the demand test object and the calculations object:

```js
Object.assign(demand, {
  required_monthly_pipeline_creation: requiredMonthly,
  required_monthly_opps: requiredOpps,
  pipeline_creation_ratio: pipelineCreationRatio,
  opportunity_creation_ratio: opportunityCreationRatio,
  creation_cutoff_date: demandPool.creation_cutoff_date,
  allocation_uncertain: allocation.surplus === null
});
```

and:

```js
const calculations = {
  ...
  pipeline_creation_ratio: pipelineCreationRatio,
  opportunity_creation_ratio: opportunityCreationRatio,
  ...
};
```

The decision engine can then consume the values it already expects.

## Required regression tests

### Test A — Pipeline dollars currently sufficient, creation rate insufficient

Construct a case where:

```text
demand coverage                  > 1.00×
monthly pipeline creation ratio  < 1.00×
everything else                  supported
```

Expected:

```text
decision != supported
constraint includes pipeline_creation
```

### Test B — Pipeline dollars currently sufficient, opportunity creation insufficient

Construct:

```text
demand coverage                    > 1.00×
monthly qualified-opportunity rate < required
everything else                    supported
```

Expected:

```text
decision != supported
constraint includes opportunity_creation
```

### Test C — Zero opportunity creation

Set:

```js
monthly_qualified_opps_created = 0
```

while:

```text
required_monthly_opps > 0
```

Expected:

```text
opportunity_creation_ratio = 0
decision != supported
```

Zero must remain a known zero, not disappear through truthiness.

---

# 4. Merge-Blocking Finding 2 — “Often Founder-Required” Can Be Classified as Demonstrated Repeatability

**Severity:** P1 policy/semantic defect  
**File:** `js/ae-decision-engine.js`

## Problem

Later-AE repeatability currently becomes:

```text
demonstrated
```

when founder-late-stage involvement is merely **known**.

The condition is:

```js
known(r.founder_required_late_stage)
```

Therefore all of these satisfy the independence gate:

```text
rarely
sometimes
often
```

Only:

```text
almost_always
```

is explicitly classified as founder dependent.

## Why this is too permissive

The field is not:

```text
founder participates late-stage
```

It is:

```text
founder REQUIRED late-stage
```

If the founder is **often required**, the motion has not demonstrated independent seller execution.

Calling that state:

```text
demonstrated
```

overstates transferability and can allow an otherwise strong case to become:

```text
SUPPORTED
```

## Important spec note

This is partly a weakness in the original policy language, not merely Codex deviating from the written document.

The master spec's first cut only explicitly ruled out:

```text
almost_always
```

for demonstrated repeatability.

The adversarial pass now makes the intended semantics clearer:

> “Demonstrated” should mean the rep motion is operationally independent, not merely that founder dependence is less than absolute.

The policy should be tightened deliberately and versioned.

## Recommended state mapping

### `rarely`

Can qualify as:

```text
demonstrated
```

if all other demonstrated-repeatability criteria pass.

### `sometimes`

Classify at best:

```text
emerging
```

### `often`

Classify:

```text
emerging
```

or `founder_dependent` if accompanied by other dependence evidence.

Recommended default:

```text
emerging
```

because “often required” is materially non-independent but is not identical to “almost always.”

### `almost_always`

```text
founder_dependent
```

### unknown

```text
evidence gap / unknown
```

## Keep this policy-driven

Do not hard-code only:

```js
r.founder_required_late_stage === 'rarely'
```

inside the decision logic.

Add a policy rule such as:

```js
repeatability: {
  demonstratedNonFounderWins: 5,
  documentedProcessMinimum: 2,
  firstAERelevantWins: 5,
  firstAEUseCasesMinimum: 1,

  founderLateStage: {
    demonstrated: ['rarely'],
    emerging: ['sometimes', 'often'],
    dependent: ['almost_always']
  }
}
```

Then classify from policy.

Because the decision rule changes, bump:

```text
ae-policy-1.0.0
```

to at least:

```text
ae-policy-1.1.0
```

Do **not** silently change a shipped policy version.

## Required regression tests

For an otherwise identical strong later-AE case:

```text
rarely         → demonstrated
sometimes      → emerging
often          → emerging
almost_always  → founder_dependent
unknown        → evidence gap / not unconditional
```

Also assert:

```text
sometimes/often cannot produce SUPPORTED solely because all other tests pass
```

---

# 5. Required Supporting Fix 1 — Current Allocatable Pipeline Can Borrow From Future Pipeline

**Severity:** P2 independently; functionally tied to Finding 1  
**File:** `js/ae-underwriting-math.js`

## Problem

`calculateAllocatablePipeline()` treats:

```js
demand.allocatable_current_qualified_pipeline
```

as current supply.

It then caps it only against:

```js
out.value
```

where `out.value` is a **horizon-wide allocation** that can include future pipeline creation.

Current code:

```js
var current =
  nonnegative(demand.allocatable_current_qualified_pipeline);

if (current !== null)
  out.current_allocatable = current;

...

if (
  out.current_allocatable !== null &&
  out.value !== null
)
  out.current_allocatable =
    Math.min(out.current_allocatable, out.value);
```

That permits a current allocation larger than the current pipeline pool so long as the horizon-wide allocation is larger.

## Consequence

`current_allocatable` feeds:

```text
pipelineGap
required_monthly_pipeline_creation
required_monthly_opps
```

A future pipeline amount can therefore masquerade as pipeline that already exists today.

That understates the amount the company still has to create.

Once Finding 1 is repaired and creation ratios actually affect the decision, this defect can directly contaminate the new decision constraint.

## Required fix

Current and future supply must remain temporally separate.

At minimum:

```text
current allocation <= current cycle-eligible pipeline
```

But the more defensible rule is:

```text
current new-AE allocation
+
current pipeline reserved for current sellers/founder
<=
current pipeline pool
```

Do not derive the new seller's current allocation from the horizon-wide surplus.

### Preferred contract extension

Add an explicit input when needed:

```text
demand.current_pipeline_reserved_for_existing_team
```

Then validate:

```text
current_new_ae_allocation
+
current_existing_team_reservation
<=
current_pipeline_pool
```

If the company cannot establish current ownership/reservation:

```text
current_allocatable = unknown
```

for monthly-creation-condition purposes.

Do not silently assume future supply already exists.

## Required tests

### Test A

```text
current pipeline pool:                  $1.0M
declared current new-AE allocation:     $1.5M
horizon-wide allocation:                $3.0M
```

Expected:

```text
clarification OR current allocation <= $1.0M
```

Never:

```text
current allocation = $1.5M
```

### Test B

Add current-team reservation.

Assert:

```text
new-AE current allocation
<=
current pool - current-team reservation
```

### Test C

Confirm `required_monthly_pipeline_creation` increases when current allocation is reduced, while horizon demand coverage can remain unchanged.

This proves current-state creation math is separate from horizon coverage.

---

# 6. Required Supporting Fix 2 — Latest Viable Start Search Cannot Find Pre-Horizon Start Dates

**Severity:** P2  
**File:** `js/ae-underwriting-engine.js`

## Problem

When timing is incompatible, the engine searches for a latest viable start date using:

```js
low = target_period_start
high = revenue_needed_by_date / horizon end
```

This assumes the latest viable start must occur **inside** the target horizon.

That is false for pipeline-productivity models.

Example:

```text
target horizon starts: Jan 1
revenue needed:        Feb 1
qualified sales cycle: 94 days
```

The seller may need to start in the prior October.

The current search can return:

```text
latest_viable_start = null
```

even when a valid pre-horizon start exists.

## Why this matters

The report promises an actionable condition:

> “To contribute to the stated revenue window, the seat must start no later than DATE.”

Returning `null` because the search window is artificially truncated defeats that condition.

It does not necessarily change the verdict, but it degrades the finished paid artifact.

## Required fix

Allow the search window to extend before `target_period_start`.

Do not use an arbitrary one-off hard-coded date.

Use a bounded search derived from supported model limits, for example:

```text
search floor =
target_period_start
- max(supported ramp duration, explicit schedule length)
- max supported sales-cycle delay
```

or another explicit deterministic bound that guarantees the accepted input domain can be searched.

The criterion should remain exactly what the engine documents:

```text
latest start that yields positive modeled contribution by required date
```

Do not silently change it to “latest start that fills the full revenue gap.”

## Required regression test

Pipeline-productivity case:

```text
target start:       2027-01-01
revenue needed by:  2027-02-01
qualified cycle:    94 days
```

Expected:

```text
latest_viable_start < 2027-01-01
latest_viable_start != null
```

---

# 7. Why 182 Tests Did Not Catch These

The test suite is broad, but its coverage is shaped around the golden fixtures.

These exact adversarial conditions were absent.

## Missing test family 1

Repository search shows `monthly_qualified_opps_created` appears in:

- fixture data
- condition-generation copy

but there is no test that deliberately sets observed monthly opportunity creation below the calculated requirement while all other support conditions remain green.

Therefore:

```text
opportunity_creation_ratio
```

could be absent forever without failing a test.

---

## Missing test family 2

No test contains:

```text
founder_required_late_stage = sometimes
```

or:

```text
founder_required_late_stage = often
```

The suite tests the extreme:

```text
almost_always
```

but not the policy boundary immediately below it.

This is a classic boundary-coverage hole.

---

## Missing test family 3

The latest-start test currently verifies a late proposed start where the correct latest viable start is:

```text
2027-12-31
```

which is still inside the horizon.

There is no case whose correct answer must precede the horizon.

---

## Missing test family 4

There is no test asserting:

```text
allocatable_current_qualified_pipeline
<=
current pipeline available today
```

when horizon-wide future supply is larger.

The current tests validate horizon allocation, not the temporal boundary between current and future supply.

---

# 8. Recommended Remediation PR

Create a new branch from current `main`.

Suggested branch:

```text
codex/ae-engine-review-fixes
```

Suggested PR title:

```text
Fix AE demand-creation, repeatability, and timing edge cases
```

## Scope

Only modify:

```text
js/ae-policy.js
js/ae-decision-engine.js
js/ae-underwriting-engine.js
js/ae-underwriting-math.js
js/ae-engine-input.js          # only if current-pipeline reservation field is added
docs/ae-engine-contract.md
tests/ae-underwriting-engine.test.js
tests/ae-validation.test.js
tests/ae-invariants.test.js
tests/ae-golden-cases.js       # only if an existing golden expectation changes
tests/ae-fixtures.js           # only as necessary
```

Do not proceed into:
- landing page
- intake UI
- report renderer
- commerce

inside this fix PR.

---

# 9. Codex Remediation Prompt

Use the following as the next Codex instruction.

```text
Read the authoritative master specification at:

deliverables/plans/ae_hiring_underwriting_master_spec.md

Then read PR #315's merged implementation and:
docs/ae-engine-contract.md

This is a narrow remediation pass. Do not build UI, intake, report rendering, persistence, analytics, or commerce.

Fix the four reviewed defects below and add regression tests that demonstrate each defect before/after the correction.

1. DEMAND-CREATION RATIOS

In js/ae-underwriting-engine.js, the engine calculates pipeline_creation_ratio only in the top-level calculations object, while js/ae-decision-engine.js expects demand.pipeline_creation_ratio and demand.opportunity_creation_ratio.

Calculate:
- pipeline_creation_ratio =
  observed monthly qualified pipeline creation /
  required monthly qualified pipeline creation
- opportunity_creation_ratio =
  observed monthly qualified opportunities /
  required monthly qualified opportunities

Attach both ratios to the demand object BEFORE Decision.decide() runs and expose both in top-level calculations.

Preserve zero as a known zero.

Add tests proving:
- sufficient horizon pipeline + inadequate monthly pipeline creation cannot return supported;
- sufficient horizon pipeline + inadequate monthly opportunity creation cannot return supported;
- monthly_qualified_opps_created = 0 produces ratio 0 when requirement > 0 and cannot disappear as unknown.

2. FOUNDER LATE-STAGE DEPENDENCE

The current demonstrated-repeatability branch only checks that founder_required_late_stage is known, so "sometimes" and "often" can become demonstrated.

Make the mapping explicit and policy-owned:
- rarely -> eligible for demonstrated
- sometimes -> emerging
- often -> emerging
- almost_always -> founder_dependent
- unknown -> evidence gap

Do not bury the values in decision code; put the mapping in ae-policy.js.

This changes a decision policy, so bump the policy version from ae-policy-1.0.0 to ae-policy-1.1.0.

Add boundary tests for every enum value and prove sometimes/often cannot yield an unconditional SUPPORTED result in an otherwise-green later-AE case.

3. CURRENT VS FUTURE PIPELINE

calculateAllocatablePipeline currently allows allocatable_current_qualified_pipeline to be capped only by horizon-wide allocation, which can include future pipeline.

Current supply cannot borrow from future pipeline.

Make current allocation independently defensible:
- it must never exceed the current cycle-eligible pipeline pool;
- it must not double-count pipeline reserved for current sellers/founder;
- if current ownership/reservation cannot be established, current allocation for monthly-creation calculations must remain unknown rather than borrowing from horizon-wide future supply.

If the cleanest contract requires an explicit current existing-team reservation field, add it, validate it, document it, and add the minimum necessary fixture data. Do not infer arbitrary ownership percentages.

Add tests where current pool < declared current allocation < horizon allocation and prove future supply is not treated as current.

4. PRE-HORIZON LATEST VIABLE START

The latest-viable-start binary search starts at target_period_start, so it cannot return a required start before the horizon.

Extend the deterministic search domain backward far enough to cover the accepted ramp + sales-cycle input domain. Keep the existing criterion:
"latest start that produces positive modeled contribution by the required date."

Add a pipeline-productivity regression case where:
- target horizon starts Jan 1,
- revenue is needed Feb 1,
- qualified-opportunity sales cycle is 94 days,
and assert latest_viable_start is a non-null date before Jan 1.

ADVERSARIAL REQUIREMENTS

After implementing:
- rerun all existing 182 AE tests;
- add the new tests above;
- run npm test, typecheck, build, and E2E;
- confirm all Section 14 monotonicity invariants still hold;
- add targeted missingness tests so removing creation-rate evidence cannot make the decision more aggressive;
- update docs/ae-engine-contract.md with the corrected semantics;
- do not edit the master spec silently. If you believe a master-spec sentence conflicts with the corrected founder-dependence rule, surface the exact conflict in the PR description rather than weakening the correction.

Return:
- exact files changed;
- test counts before/after;
- each new regression case;
- any remaining ambiguity.
```

---

# 10. Acceptance Criteria for the Remediation PR

Do not freeze the engine until all are true.

## Demand creation

- [ ] `demand.pipeline_creation_ratio` populated
- [ ] `demand.opportunity_creation_ratio` populated
- [ ] top-level calculations contain both ratios
- [ ] zero observed creation produces ratio `0`
- [ ] pipeline creation shortfall can force Conditional
- [ ] opportunity creation shortfall can force Conditional
- [ ] supported verdict impossible when a material creation constraint exists

## Repeatability

- [ ] `rarely` eligible for demonstrated
- [ ] `sometimes` cannot be demonstrated
- [ ] `often` cannot be demonstrated
- [ ] `almost_always` founder dependent
- [ ] policy mapping centralized
- [ ] policy version bumped
- [ ] all five enum states covered by tests

## Pipeline temporality

- [ ] current allocation cannot exceed current pool
- [ ] current allocation cannot double-count current-team reservation
- [ ] future creation cannot be treated as current pipeline
- [ ] required monthly creation uses corrected current allocation
- [ ] unknown ownership remains unknown

## Timing

- [ ] latest viable start can predate target horizon
- [ ] search remains bounded/deterministic
- [ ] current late-start test still passes
- [ ] pipeline-productivity pre-horizon regression passes

## System

- [ ] existing 182 tests remain green or are deliberately version-adjusted
- [ ] all new regression tests green
- [ ] `npm test` green
- [ ] typecheck green
- [ ] build green
- [ ] Playwright smoke green
- [ ] no new UI/product scope added

---

# 11. What Does NOT Need to Be Reworked

Do not destabilize these areas unless a new failing test proves a defect:

- metric-basis compatibility gate
- weighted-pipeline block
- conversion source priority
- post-pivot conversion handling
- new-market scenario qualification
- first-AE branch
- founder capacity deduplication
- replacement capacity removal
- closed-bookings ramp logic
- pipeline-productivity cycle logic
- zero-conversion unbounded requirement
- immutable audit snapshots
- policy externalization
- sensitivity framework
- validation-stop behavior
- unknown-vs-zero representation
- evidence-gap model
- strategic-hire separation
- deterministic/browser-safe architecture

The remediation should be surgical.

---

# 12. Final Assessment

PR #315 is a **good foundation with incomplete adversarial coverage**, not a failed implementation.

The most important concern is not the number of defects. It is their location:

```text
demand sufficiency
repeatability
hiring conditions
```

Those are precisely the areas that determine whether the product can defensibly tell a customer:

```text
SUPPORTED
```

The correct sequence is now:

```text
PR #315
    ↓
remediation PR
    ↓
adversarial re-audit
    ↓
freeze engine/policy v1
    ↓
landing page
    ↓
intake
    ↓
report renderer
```

Do not build the customer-facing layers against the current merged engine until the remediation PR is green and re-audited.
