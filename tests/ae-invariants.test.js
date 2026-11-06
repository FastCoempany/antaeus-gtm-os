'use strict';

// Independent adversarial checks of §§8.6–8.9, 9 and 14. No test framework.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../js/ae-underwriting-engine.js');
const policy = require('../js/ae-policy.js');
const { makeCase } = require('./ae-fixtures.js');
let passed = 0;
const failures = [];
const epsilon = 1e-7;
function test(name, run) {
  try { run(); passed += 1; }
  catch (error) { failures.push(name + ': ' + error.message); }
}
function clone(value) { return structuredClone(value); }
function run(input) { return engine.underwrite(input); }
function finite(value, location = 'output') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), location + ' must be finite');
  if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => finite(child, location + '.' + key));
}
function number(value, label) { assert.equal(typeof value, 'number', label); assert.ok(Number.isFinite(value), label); return value; }
function lessOrEqual(a, b, label) { number(a, label); number(b, label); assert.ok(a <= b + epsilon, `${label}: ${a} > ${b}`); }
function state(value) { return typeof value === 'string' ? value : value.state; }
function setRate(input, wins, opportunities) {
  Object.assign(input.conversion, { non_founder_wins_trailing_12m: wins, non_founder_qualified_opps_trailing_12m: opportunities, non_founder_qualified_opp_to_win_pct: wins / opportunities });
  Object.assign(input.repeatability, { wins_trailing_12m: wins + 2, non_founder_wins_trailing_12m: wins });
  input.conversion.qualified_opps_trailing_12m = null;
  input.conversion.closed_won_trailing_12m = null;
}
function dates(input) {
  Object.assign(input.target, { target_period_start: '2028-01-01', target_period_end: '2028-12-31' });
  input.proposed_ae.proposed_start_date = '2028-03-01';
  input.proposed_ae.start_month_index = null;
  return input;
}

test('identical inputs produce identical full outputs with no ambient timestamp', () => {
  assert.deepEqual(run(makeCase()), run(makeCase()));
});
test('caller timestamp is recorded and reproducible', () => {
  const options = { calculation_timestamp: '2026-09-30T12:34:56.000Z' };
  const first = engine.underwrite(makeCase(), policy, options);
  assert.equal(first.audit.calculation_timestamp, options.calculation_timestamp);
  assert.deepEqual(first, engine.underwrite(makeCase(), policy, options));
});
test('date-only calculations are identical across host time zones', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'UTC';
    const utc = run(dates(makeCase()));
    process.env.TZ = 'America/Los_Angeles';
    assert.deepEqual(run(dates(makeCase())), utc);
    process.env.TZ = 'Pacific/Auckland';
    assert.deepEqual(run(dates(makeCase())), utc);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test('input and mutable caller policy remain unchanged', () => {
  const input = makeCase();
  const custom = clone(policy);
  const inputBefore = clone(input), policyBefore = clone(custom);
  const output = engine.underwrite(input, custom);
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(custom, policyBefore);
  const outputBefore = clone(output);
  custom.demand.nearThreshold = 0.95;
  custom.version = 'test-later-policy';
  input.target.new_arr_target_horizon = 1;
  assert.deepEqual(output, outputBefore, 'later mutations cannot retroactively change an analysis');
  assert.equal(output.audit.policy_snapshot.version, policyBefore.version);
  assert.equal(output.audit.policy_snapshot.demand.nearThreshold, policyBefore.demand.nearThreshold);
});
test('browser UMD runs without DOM, storage, networking or current time', () => {
  class ClocklessDate extends Date {
    constructor(...args) { assert.ok(args.length > 0, 'no ambient clock construction'); super(...args); }
    static now() { throw new Error('No ambient clock'); }
  }
  const sandbox = { Date: ClocklessDate };
  for (const key of ['document', 'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest']) Object.defineProperty(sandbox, key, { get() { throw new Error('Forbidden browser dependency: ' + key); } });
  vm.createContext(sandbox);
  for (const name of ['ae-policy.js', 'ae-engine-input.js', 'ae-underwriting-math.js', 'ae-decision-engine.js', 'ae-underwriting-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name), 'utf8'), sandbox, { filename: name });
  }
  assert.equal(typeof sandbox.AEUnderwriting.underwrite, 'function');
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.AEUnderwriting.underwrite(makeCase()))), JSON.parse(JSON.stringify(run(makeCase()))));
});

test('demand states match exact policy boundaries', () => {
  for (const [ratio, expected] of [[0.849, 'short'], [0.850, 'near'], [0.999, 'near'], [1, 'sufficient'], [1.001, 'sufficient']]) {
    assert.equal(state(engine.testDemandSufficiency({ allocatable: ratio * 1000000, required: 1000000, policy })), expected);
  }
});
test('economic states match exact policy boundaries', () => {
  for (const [ratio, expected] of [[0, 'none'], [0.499, 'weak'], [0.5, 'partial'], [0.799, 'partial'], [0.8, 'supported'], [1.1, 'supported']]) {
    assert.equal(state(engine.testEconomicNeed({ revenueGap: ratio * 1000000, hireCapacity: 1000000, policy })), expected);
  }
});
test('threshold overrides actually come from supplied policy', () => {
  const custom = clone(policy);
  custom.version = 'test-policy-thresholds';
  custom.demand.nearThreshold = 0.9;
  custom.economic.fullUseThreshold = 0.9;
  assert.equal(state(engine.testDemandSufficiency({ allocatable: 880, required: 1000, policy: custom })), 'short');
  assert.equal(state(engine.testEconomicNeed({ revenueGap: 880, hireCapacity: 1000, policy: custom })), 'partial');
});

// Fixed-seed coverage: these pairs hold every unrelated input constant.
let seed = 7142026;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
for (let index = 0; index < 12; index += 1) {
  test('monotonicity pair ' + (index + 1), () => {
    const base = dates(makeCase());
    base.proposed_ae.ramp_months = 1 + Math.floor(random() * 6);
    base.proposed_ae.monthly_ramp_schedule = null;
    base.economics.average_acv = 10000 + Math.floor(random() * 90000);
    base.economics.average_sales_cycle_days = 30 + Math.floor(random() * 150);
    const original = run(base);
    const largerACV = clone(base); largerACV.economics.average_acv *= 1.2;
    lessOrEqual(run(largerACV).calculations.wins_required, original.calculations.wins_required, 'higher ACV cannot increase required wins');
    const slowerRamp = clone(base); slowerRamp.proposed_ae.ramp_months += 1;
    lessOrEqual(run(slowerRamp).calculations.proposed_ae_contribution, original.calculations.proposed_ae_contribution, 'longer ramp cannot increase contribution');
    const later = clone(base); later.proposed_ae.proposed_start_date = '2028-04-01';
    lessOrEqual(run(later).calculations.proposed_ae_contribution, original.calculations.proposed_ae_contribution, 'later start cannot increase contribution');
    const capacity = clone(base); capacity.current_team.sellers[0].annual_quota *= 1.2;
    lessOrEqual(run(capacity).calculations.residual_gap, original.calculations.residual_gap, 'existing capacity cannot increase residual gap');
    const lowerRate = clone(base); setRate(lowerRate, 20, 100);
    const higherRate = clone(base); setRate(higherRate, 30, 100);
    lessOrEqual(run(higherRate).calculations.qualified_pipeline_required, run(lowerRate).calculations.qualified_pipeline_required, 'higher win rate cannot increase pipeline requirement');
    const morePipeline = clone(base);
    morePipeline.demand.allocatable_qualified_pipeline = (base.demand.allocatable_qualified_pipeline ?? base.demand.pipeline_likely_open_at_ae_start) * 1.05;
    lessOrEqual(original.calculations.demand_coverage, run(morePipeline).calculations.demand_coverage, 'increasing allocation cannot reduce coverage');
    const closedLong = clone(base); closedLong.economics.average_sales_cycle_days += 30;
    assert.equal(run(closedLong).calculations.proposed_ae_contribution, original.calculations.proposed_ae_contribution, 'closed-bookings ramp must not add a cycle delay');
    const production = clone(base); production.proposed_ae.ramp_definition = 'pipeline_productivity';
    const productionLong = clone(production); productionLong.economics.average_sales_cycle_days += 30;
    lessOrEqual(run(productionLong).calculations.proposed_ae_contribution, run(production).calculations.proposed_ae_contribution, 'longer cycle cannot increase pipeline-productivity contribution');
    finite(original);
  });
}

const confidenceRank = { insufficient: 0, low: 1, moderate: 2, high: 3 };
const decisionRank = { insufficient_evidence: 0, not_yet_supported: 1, conditional: 2, supported: 3 };
const missingCritical = [
  ['target', input => { input.target.new_arr_target_horizon = null; }],
  ['quota', input => { input.proposed_ae.annual_quota = null; }],
  ['start date', input => { input.proposed_ae.proposed_start_date = null; input.proposed_ae.start_month_index = null; input.timing.proposed_start_date = null; }],
  ['ramp', input => { input.proposed_ae.ramp_months = null; input.proposed_ae.monthly_ramp_schedule = null; input.proposed_ae.ramp_schedule = null; }],
  ['sales cycle', input => { input.economics.average_sales_cycle_days = null; }],
  ['conversion', input => { for (const key of Object.keys(input.conversion)) if (/wins|won|qualified_opps|qualified_opp_to_win/.test(key)) input.conversion[key] = null; }],
  ['pipeline allocation', input => { Object.assign(input.demand, { pipeline_likely_open_at_ae_start: null, allocatable_qualified_pipeline: null, allocatable_current_pipeline: null, new_ae_pipeline_share_pct: null, territory_reserved_for_new_ae: null }); }],
  ['current capacity', input => { Object.assign(input.current_team, { sellers: null, current_quota_carriers: null, aggregate_annual_quota: null, existing_team_committed_new_arr: null }); }]
];
for (const [name, erase] of missingCritical) test('removing critical evidence cannot strengthen result: ' + name, () => {
  const complete = makeCase(), missing = clone(complete);
  erase(missing);
  const before = run(complete), after = run(missing);
  assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], 'confidence increased after evidence removal');
  assert.ok((decisionRank[after.decision.state] ?? -1) <= decisionRank[before.decision.state], 'recommendation strengthened after evidence removal');
  finite(after);
});

const negativeMissingness = [
  ['short demand loses allocation evidence', makeCase({ demand: { allocatable_qualified_pipeline: 1000000, pipeline_likely_open_at_ae_start: 1000000 } }), input => {
    for (const key of ['allocatable_qualified_pipeline', 'allocatable_current_qualified_pipeline', 'pipeline_likely_open_at_ae_start', 'new_ae_pipeline_share_pct']) delete input.demand[key];
  }],
  ['founder dependency loses late-stage evidence', makeCase({ repeatability: { founder_required_late_stage: 'almost_always' } }), input => { delete input.repeatability.founder_required_late_stage; }],
  ['absent manager loses manager answer', makeCase({ management: { direct_manager_exists: false } }), input => { delete input.management.direct_manager_exists; }],
  ['missing onboarding owner loses owner answer', makeCase({ management: { onboarding_owner_named: false } }), input => { delete input.management.onboarding_owner_named; }],
  ['zero conversion loses conversion evidence', (() => { const input = makeCase(); setRate(input, 0, 20); return input; })(), input => {
    for (const key of ['non_founder_wins_trailing_12m', 'non_founder_qualified_opps_trailing_12m', 'non_founder_qualified_opp_to_win_pct']) delete input.conversion[key];
  }]
];
for (const [name, complete, erase] of negativeMissingness) test('removing adverse evidence cannot turn not-yet into conditional: ' + name, () => {
  const missing = clone(complete); erase(missing);
  const before = run(complete), after = run(missing);
  assert.equal(before.decision.state, 'not_yet_supported', 'negative control must actually be not-yet');
  assert.ok((decisionRank[after.decision.state] ?? -1) <= decisionRank[before.decision.state], 'missing adverse evidence strengthened the hiring recommendation');
  assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], 'missing adverse evidence increased confidence');
});
test('hiding a very thin denominator cannot raise confidence', () => {
  const input = makeCase(); setRate(input, 2, 2);
  const before = run(input);
  delete input.conversion.non_founder_qualified_opps_trailing_12m;
  delete input.conversion.non_founder_wins_trailing_12m;
  const after = run(input);
  assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence]);
});

test('leap-year partial months use actual calendar days', () => {
  const input = makeCase({ decision: { analysis_horizon_months: 6 }, target: { target_period_start: '2028-02-15', target_period_end: '2028-08-14' }, proposed_ae: { proposed_start_date: '2028-02-15', start_month_index: null, ramp_months: 0, monthly_ramp_schedule: null } });
  const actual = engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value;
  const expected = 900000 / 12 * (15 / 29 + 5 + 14 / 31);
  assert.ok(Math.abs(actual - expected) < epsilon, actual + ' versus ' + expected);
});
test('company schedule takes precedence over generic ramp duration', () => {
  const input = dates(makeCase({ proposed_ae: { monthly_ramp_schedule: [0, 0.25, 0.5, 1], ramp_months: 2 } }));
  const first = engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value;
  input.proposed_ae.ramp_months = 12;
  assert.equal(engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value, first);
});
for (const [year, startMonth, startDay, duration] of [[2027, 11, 30, 6], [2028, 2, 29, 12], [2028, 7, 31, 18], [2029, 1, 15, 9]]) {
  test(`dated schedule monotonicity from ${year}-${startMonth}-${startDay}, ${duration} months`, () => {
    const periodStart = new Date(Date.UTC(year, startMonth - 1, 1));
    const periodEnd = new Date(Date.UTC(year, startMonth - 1 + duration, 0));
    const hire = new Date(Date.UTC(year, startMonth - 1, startDay));
    const asDate = value => value.toISOString().slice(0, 10);
    const input = makeCase({ decision: { analysis_horizon_months: duration }, target: { target_period_start: asDate(periodStart), target_period_end: asDate(periodEnd) }, proposed_ae: { proposed_start_date: asDate(hire), start_month_index: null, monthly_ramp_schedule: [0.1, 0.25, 0.55, 0.8, 1], ramp_definition: 'closed_bookings' } });
    const prior = engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value;
    for (const delay of [1, 7, 30, 61]) {
      const later = clone(input);
      later.proposed_ae.proposed_start_date = asDate(new Date(hire.getTime() + delay * 86400000));
      lessOrEqual(engine.calculateHireContribution(engine.normalizeInput(later), 0.2, policy).value, prior, 'delayed explicit schedule');
    }
    input.proposed_ae.ramp_definition = 'pipeline_productivity';
    const shorter = engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value;
    input.economics.average_sales_cycle_days += 60;
    lessOrEqual(engine.calculateHireContribution(engine.normalizeInput(input), 0.2, policy).value, shorter, 'cycle-shifted explicit schedule');
  });
}

test('calculated non-founder conversion takes priority over supplied rates', () => {
  const input = engine.normalizeInput(makeCase({ conversion: { non_founder_qualified_opp_to_win_pct: 0.9, qualified_opp_to_win_pct: 0.8 } }));
  const selected = engine.selectTransferableWinRate(input);
  assert.equal(selected.value, 12 / 57);
  assert.equal(selected.denominator, 57);
  assert.ok(input.validation.clarifications.length > 0, 'contradictory supplied rate must remain visible');
});
test('credible supplied non-founder rate is the fallback when counts are absent', () => {
  const input = engine.normalizeInput(makeCase({ conversion: { non_founder_wins_trailing_12m: null, non_founder_qualified_opps_trailing_12m: null, non_founder_qualified_opp_to_win_pct: 0.24, qualified_opp_to_win_pct: 0.4 } }));
  const selected = engine.selectTransferableWinRate(input);
  assert.equal(selected.value, 0.24);
  assert.equal(selected.denominator, null, 'missing count cannot be fabricated');
});
test('a memory-based non-founder rate is not selected ahead of supplied counts', () => {
  const input = engine.normalizeInput(makeCase({ conversion: { non_founder_wins_trailing_12m: null, non_founder_qualified_opps_trailing_12m: null, non_founder_qualified_opp_to_win_pct: 0.5, qualified_opps_trailing_12m: 40, closed_won_trailing_12m: 10 }, provenance: { conversion: 'memory_estimate' } }));
  const selected = engine.selectTransferableWinRate(input);
  assert.equal(selected.value, 0.25);
  assert.equal(selected.scenario_only, true, 'founder-inclusive fallback needs qualification');
});
for (const [denominator, expected] of [[9, 'very_thin'], [10, 'thin'], [19, 'thin'], [20, 'not_thin']]) test('sample boundary at ' + denominator, () => {
  const input = makeCase(); setRate(input, 2, denominator);
  assert.equal(engine.selectTransferableWinRate(engine.normalizeInput(input)).sample, expected);
});
test('post-pivot counts take priority over old transferable counts', () => {
  const input = engine.normalizeInput(makeCase({ conversion: { material_gtm_change_date: '2026-09-01', post_change_wins: 2, post_change_qualified_opps: 13 } }));
  const selected = engine.selectTransferableWinRate(input);
  assert.equal(selected.value, 2 / 13);
  assert.equal(selected.denominator, 13);
  assert.notEqual(selected.sample, 'not_thin');
});
test('pre-pivot history and a new market each remain scenario evidence', () => {
  for (const overrides of [{ conversion: { material_gtm_change_date: '2026-09-01' } }, { decision: { new_ae_market_same_as_history: 'no' } }]) {
    const selected = engine.selectTransferableWinRate(engine.normalizeInput(makeCase(overrides)));
    assert.equal(selected.scenario_only, true);
    assert.ok(selected.assumptions.length > 0);
  }
});
test('stage denominator mismatch cannot produce a supported decision', () => {
  const output = run(makeCase({ demand: { pipeline_stage_basis: 'proposal' } }));
  assert.notEqual(output.decision.state, 'supported');
  assert.ok(output.validation.clarifications.some(issue => issue.code === 'stage_basis_conflict'));
});
for (const [group, field] of [['target', 'target_metric'], ['target', 'target_includes_expansion'], ['target', 'target_includes_renewal'], ['proposed_ae', 'quota_metric'], ['proposed_ae', 'quota_includes_expansion'], ['demand', 'pipeline_value_type']]) {
  test('missing required revenue-basis evidence cannot support a hire: ' + group + '.' + field, () => {
    const input = makeCase({ target: { new_arr_target_horizon: 3000000 }, demand: { current_qualified_pipeline_value: 5000000, current_qualified_pipeline_in_horizon: 5000000, monthly_qualified_pipeline_created_value: 2000000, allocatable_qualified_pipeline: 6000000, pipeline_likely_open_at_ae_start: 6000000 } });
    assert.equal(run(input).decision.state, 'supported', 'control must satisfy support before evidence removal');
    delete input[group][field];
    const output = run(input);
    assert.notEqual(output.decision.state, 'supported', 'unknown revenue basis cannot be assumed compatible');
    assert.ok(output.evidence_gaps.length > 0 || output.validation.clarifications.length > 0 || output.validation.fatal_errors.length > 0, 'missing basis must identify required clarification');
  });
}

test('zero conversion is unbounded demand evidence, never finite fabricated coverage', () => {
  const input = makeCase(); setRate(input, 0, 20);
  const output = run(input);
  finite(output);
  assert.notEqual(output.decision.state, 'supported');
  assert.notEqual(output.calculations.qualified_pipeline_required, 0, 'zero conversion cannot imply no pipeline needed');
});
test('late start produces zero contribution and cannot be supported', () => {
  const output = run(makeCase({ proposed_ae: { proposed_start_date: '2099-01-01' } }));
  assert.equal(output.calculations.proposed_ae_contribution, 0);
  assert.equal(output.decision.state, 'not_yet_supported');
  assert.equal(output.decision.primary_constraint, 'late_start');
  finite(output);
});
test('zero meeting conversion never emits nonfinite output', () => finite(run(makeCase({ conversion: { meeting_to_qualified_opp_pct: 0 } }))));
test('changing pipeline to weighted cannot silently retain primary formula path', () => {
  const ordinary = run(makeCase()), weighted = run(makeCase({ demand: { pipeline_value_type: 'probability_weighted' } }));
  assert.notEqual(weighted.decision.state, 'supported');
  assert.notDeepEqual(weighted.tests.demand_sufficiency, ordinary.tests.demand_sufficiency);
  finite(weighted);
});
test('no allocation evidence cannot be replaced by theoretical surplus', () => {
  const output = run(makeCase({ demand: { pipeline_likely_open_at_ae_start: null, allocatable_qualified_pipeline: null, allocatable_current_pipeline: null, new_ae_pipeline_share_pct: null, territory_reserved_for_new_ae: false } }));
  assert.notEqual(output.tests.demand_sufficiency.state, 'sufficient');
  assert.notEqual(output.decision.state, 'supported');
});
test('removing all core evidence preserves unknowns and identifies evidence gaps', () => {
  const output = run({});
  finite(output);
  assert.equal(output.decision.state, 'insufficient_evidence');
  assert.equal(output.calculations.residual_gap, null);
  assert.equal(output.calculations.proposed_ae_contribution, null);
  assert.ok(output.evidence_gaps.length > 0);
});
test('conditional and not-yet decisions carry named change conditions', () => {
  for (const input of [makeCase(), makeCase({ target: { new_arr_target_horizon: 0 } }), makeCase({ demand: { allocatable_qualified_pipeline: 100000, pipeline_likely_open_at_ae_start: 100000 } })]) {
    const output = run(input);
    if (['conditional', 'not_yet_supported'].includes(output.decision.state)) assert.ok(output.conditions.length > 0);
  }
});
test('every derived calculation carries a formula and input trace', () => {
  const output = run(makeCase());
  for (const [key, value] of Object.entries(output.calculations)) {
    const trace = output.audit.formulas[key];
    assert.ok(trace, 'missing trace for ' + key);
    assert.equal(typeof trace.formula, 'string', 'formula missing for ' + key);
    assert.ok(trace.formula.length > 0, 'empty formula for ' + key);
    assert.ok(trace.inputs, 'input reference missing for ' + key);
    assert.equal(trace.value, value, 'trace and calculated value disagree for ' + key);
  }
});
test('all six required sensitivities contain the modeled outcomes', () => {
  const output = run(makeCase());
  for (const variable of policy.sensitivity.variables) {
    const scenarios = output.sensitivity.filter(row => row.variable === variable);
    assert.equal(scenarios.length, 3, variable + ' needs downside, base and upside scenarios');
    for (const scenario of scenarios) {
      for (const key of ['proposed_ae_contribution', 'qualified_pipeline_required', 'demand_coverage', 'timing_status', 'decision_state']) assert.ok(Object.hasOwn(scenario, key), variable + ' missing ' + key);
      if (variable === 'win_rate' && scenario.value !== null) assert.ok(scenario.value >= 0 && scenario.value <= 1);
      if (variable === 'ramp_duration' && scenario.value !== null) assert.ok(scenario.value >= 0);
      if (variable === 'sales_cycle' && scenario.value !== null) assert.ok(scenario.value >= 1);
      finite(scenario);
    }
  }
});

// ---------------------------------------------------------------------------
// Explicit §14 / remediation invariants (PR #315 audit). Scenarios are fixed so
// every run is reproducible; each invariant names the property it proves.
const { deepMerge } = require('./ae-fixtures.js');
const STRONG = { target: { new_arr_target_horizon: 2200000 }, demand: { pipeline_likely_open_at_ae_start: 4200000, allocatable_qualified_pipeline: 4200000, monthly_qualified_pipeline_created_value: 1000000 } };
const DEEP_POOL = { demand: { current_qualified_pipeline_in_horizon: 12000000, current_qualified_pipeline_value: 12000000 } };
const strong = (...overrides) => makeCase(overrides.reduce((all, next) => deepMerge(all, next), STRONG));
const FIRST_AE = { decision: { evaluating_first_professional_ae: true }, current_team: { current_quota_carriers: 0, sellers: [], founder_committed_new_arr: 650000, founder_expected_to_remain_seller: true }, conversion: { non_founder_qualified_opps_trailing_12m: null, non_founder_wins_trailing_12m: null, non_founder_qualified_opp_to_win_pct: null, qualified_opps_trailing_12m: 42, closed_won_trailing_12m: 11, qualified_opp_to_win_pct: 11 / 42 }, repeatability: { wins_trailing_12m: 11, non_founder_wins_trailing_12m: 0, founder_primary_seller_share_pct: 1, sales_stages_documented: 'partial', rep_can_run_discovery_without_founder: 'unknown', founder_required_late_stage: 'almost_always', repeatable_use_cases_count: 2, founder_can_articulate_path: true } };
// Remediation scenario catalogue: supported, creation-short, opportunity-short,
// founder-limited, ownership-conflicted, pre-horizon timing and surplus-capped cases.
const SCENARIOS = {
  strong: () => strong(),
  creationShort: () => strong(DEEP_POOL, { demand: { monthly_qualified_pipeline_created_value: 300000 } }),
  opportunityShort: () => strong({ demand: { monthly_qualified_opps_created: 5 } }),
  zeroOpportunity: () => strong({ demand: { monthly_qualified_opps_created: 0 } }),
  noEligibleCreation: () => strong(DEEP_POOL, { economics: { average_sales_cycle_days: 400 } }),
  founderSometimes: () => strong({ repeatability: { founder_required_late_stage: 'sometimes' } }),
  founderOften: () => strong({ repeatability: { founder_required_late_stage: 'often' } }),
  ownershipConflict: () => strong({ demand: { current_qualified_pipeline_in_horizon: 1000000, current_qualified_pipeline_value: 1000000, allocatable_current_qualified_pipeline: 1500000 } }),
  preHorizonTiming: () => strong({ proposed_ae: { ramp_definition: 'pipeline_productivity' }, timing: { revenue_needed_by_date: '2027-02-01' } }),
  surplusCapped: () => strong({ demand: { monthly_qualified_pipeline_created_value: 100000 } }),
  firstAE: () => makeCase(FIRST_AE),
  reference: () => makeCase(),
  // Review additions: a pipeline-productivity base (G10), a base whose opportunity
  // creation sits just above requirement, and a base with an admitted positive
  // current allocation backed by a known reservation.
  pipelineProductivity: () => makeCase({ proposed_ae: { ramp_definition: 'pipeline_productivity' } }),
  nearOpportunity: () => strong({ demand: { monthly_qualified_opps_created: 7 } }),
  currentReserved: () => strong(DEEP_POOL, { demand: { allocatable_current_qualified_pipeline: 1000000, current_pipeline_reserved_for_existing_team: 6000000 } })
};
const all = () => Object.entries(SCENARIOS).map(([name, build]) => [name, run(build())]);
const repeatabilityRank = { founder_dependent: 0, unknown: 1, emerging: 2, demonstrated: 3 };
const creationRank = { unbounded: 0, unknown: 0, short: 1, sufficient: 2, not_required: 2 };

test('§14.1 a higher win rate cannot increase required pipeline or required monthly creation', () => {
  for (const [lower, higher] of [[10, 15], [15, 21], [21, 30], [30, 45]]) {
    const low = strong(DEEP_POOL); setRate(low, lower, 100);
    const high = strong(DEEP_POOL); setRate(high, higher, 100);
    const a = run(low).calculations, b = run(high).calculations;
    lessOrEqual(b.qualified_pipeline_required, a.qualified_pipeline_required, 'pipeline requirement');
    lessOrEqual(b.required_monthly_pipeline_creation, a.required_monthly_pipeline_creation, 'monthly creation requirement');
  }
});
test('§14.2 a higher ACV cannot increase required wins or required monthly opportunities', () => {
  for (const acv of [20000, 52000, 90000]) {
    const a = run(strong({ economics: { average_acv: acv } })).calculations, b = run(strong({ economics: { average_acv: acv * 1.25 } })).calculations;
    lessOrEqual(b.wins_required, a.wins_required, 'wins'); lessOrEqual(b.required_monthly_opps, a.required_monthly_opps, 'monthly opportunities');
  }
});
test('§14.3 delaying the start cannot increase in-horizon contribution, including pre-horizon starts', () => {
  for (const mode of ['closed_bookings', 'pipeline_productivity']) {
    let prior = Infinity;
    for (const start of ['2026-06-01', '2026-09-15', '2026-10-30', '2026-12-31', '2027-01-01', '2027-03-01', '2027-07-15', '2027-12-31', '2028-01-01']) {
      const input = engine.normalizeInput(makeCase({ proposed_ae: { ramp_definition: mode, proposed_start_date: start } }));
      const value = engine.calculateHireContribution(input, 12 / 57, policy, mode).value;
      assert.ok(value <= prior + epsilon, mode + ' ' + start); prior = value;
    }
  }
});
test('§14.4 lengthening ramp cannot increase in-horizon contribution in either ramp mode', () => {
  for (const mode of ['closed_bookings', 'pipeline_productivity']) for (let months = 0; months < 12; months += 1) {
    const shorter = engine.normalizeInput(makeCase({ proposed_ae: { ramp_definition: mode, ramp_months: months } }));
    const longer = engine.normalizeInput(makeCase({ proposed_ae: { ramp_definition: mode, ramp_months: months + 1 } }));
    lessOrEqual(engine.calculateHireContribution(longer, 0.21, policy, mode).value, engine.calculateHireContribution(shorter, 0.21, policy, mode).value, mode + ' ramp ' + months);
  }
});
test('§14.5 more allocatable pipeline cannot reduce coverage; more current allocation or creation cannot worsen the creation test', () => {
  for (const amount of [1000000, 2900000, 4200000]) lessOrEqual(run(strong(DEEP_POOL, { demand: { allocatable_qualified_pipeline: amount } })).calculations.demand_coverage, run(strong(DEEP_POOL, { demand: { allocatable_qualified_pipeline: amount * 1.1 } })).calculations.demand_coverage, 'coverage');
  for (const current of [0, 500000, 1000000, 2000000]) lessOrEqual(run(strong(DEEP_POOL, { demand: { allocatable_current_qualified_pipeline: current + 250000, current_pipeline_reserved_for_existing_team: 6000000 } })).calculations.required_monthly_pipeline_creation, run(strong(DEEP_POOL, { demand: { allocatable_current_qualified_pipeline: current, current_pipeline_reserved_for_existing_team: 6000000 } })).calculations.required_monthly_pipeline_creation, 'current allocation');
  let priorRatio = -Infinity, priorState = -Infinity;
  for (const created of [0, 100000, 300000, 358000, 360000, 800000]) {
    const demand = run(strong(DEEP_POOL, { demand: { monthly_qualified_pipeline_created_value: created } })).tests.demand_sufficiency;
    assert.ok(demand.pipeline_creation_ratio >= priorRatio - epsilon); assert.ok(creationRank[demand.pipeline_creation_state] >= priorState);
    priorRatio = demand.pipeline_creation_ratio; priorState = creationRank[demand.pipeline_creation_state];
  }
});
test('§14.6 more existing-team capacity cannot increase the residual gap', () => {
  for (const factor of [1.05, 1.2, 1.5]) {
    const base = strong(), more = strong(); more.current_team.sellers[1].annual_quota *= factor;
    lessOrEqual(run(more).calculations.residual_gap, run(base).calculations.residual_gap, 'residual gap');
  }
});
const EVIDENCE = [
  ['monthly pipeline creation', i => { i.demand.monthly_qualified_pipeline_created_value = null; }],
  ['monthly opportunity creation', i => { i.demand.monthly_qualified_opps_created = null; }],
  ['monthly pipeline series', i => { i.demand.monthly_pipeline_series = null; }],
  ['current allocation', i => { i.demand.allocatable_current_qualified_pipeline = null; i.demand.allocatable_current_pipeline = null; }],
  ['current existing-team reservation', i => { i.demand.current_pipeline_reserved_for_existing_team = null; }],
  ['current pipeline pool', i => { i.demand.current_qualified_pipeline_value = null; i.demand.current_qualified_pipeline_in_horizon = null; }],
  ['qualified sales cycle', i => { i.economics.average_sales_cycle_days = null; }],
  ['average ACV', i => { i.economics.average_acv = null; }],
  ['founder late-stage requirement', i => { i.repeatability.founder_required_late_stage = null; }],
  // Second hardening pass (1.2.0): A2, A3, A5, B1, B3 evidence.
  ['non-founder conversion counts', i => { i.conversion.non_founder_wins_trailing_12m = null; i.conversion.non_founder_qualified_opps_trailing_12m = null; }],
  ['all non-founder conversion evidence', i => { i.conversion.non_founder_wins_trailing_12m = null; i.conversion.non_founder_qualified_opps_trailing_12m = null; i.conversion.non_founder_qualified_opp_to_win_pct = null; }],
  ['pipeline likely open at AE start', i => { i.demand.pipeline_likely_open_at_ae_start = null; }],
  ['ramp definition', i => { i.proposed_ae.ramp_definition = null; }],
  ['pipeline creation seasonality', i => { i.demand.pipeline_creation_is_seasonal = null; }],
  ...['direct_manager_exists', 'weekly_1to1_capacity', 'weekly_pipeline_review_capacity', 'onboarding_owner_named', 'onboarding_plan_exists']
    .map(field => ['management.' + field, i => { i.management[field] = null; }])
  // revenue_needed_by_date is deliberately absent: it is a nullable requirement
  // parameter (§3.3 I), not evidence. Without it the horizon end is the deadline,
  // so removing it changes the question being underwritten.
];
test('§14.7 / §14.20 removing remediation-area evidence never raises confidence or strengthens the decision', () => {
  let bases = 0;
  for (const [name, build] of Object.entries(SCENARIOS)) {
    const before = run(build());
    // §8.8 measures missingness from complete cases. A base with a recorded
    // contradiction is resolved through clarification (§7.12), where deleting
    // one side of the conflict is a legitimate edit, not lost evidence.
    if (before.validation.clarifications.length || before.validation.fatal_errors.length) { assert.notEqual(before.decision.state, 'supported', name); continue; }
    bases += 1;
    for (const [field, erase] of EVIDENCE) {
      const input = build(); erase(input);
      const after = run(input);
      assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${name} minus ${field}: ${before.decision.state} -> ${after.decision.state}`);
      assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `${name} minus ${field}: confidence ${before.decision.confidence} -> ${after.decision.confidence}`);
    }
  }
  assert.ok(bases >= 13, 'the sweep must cover the complete remediation scenarios');
});
test('§14.8 weighted pipeline cannot reach the unweighted creation formula silently', () => {
  const output = run(strong({ demand: { pipeline_value_type: 'probability_weighted' } }));
  assert.equal(output.calculations.pipeline_pool, null); assert.equal(output.calculations.allocatable_current_pipeline, null);
  assert.notEqual(output.tests.demand_sufficiency.pipeline_creation_state, 'sufficient'); assert.notEqual(output.decision.state, 'supported');
});
test('§14.9 zero denominators never produce Infinity or NaN in remediation outputs', () => {
  for (const input of [strong({ economics: { average_acv: 0 } }), strong(DEEP_POOL, { economics: { average_sales_cycle_days: 400 } }), strong(DEEP_POOL, { demand: { allocatable_current_qualified_pipeline: 3300000 } }), strong({ demand: { monthly_qualified_opps_created: 0 } }), strong({ demand: { current_qualified_pipeline_in_horizon: 0, current_qualified_pipeline_value: 0 } }), (() => { const i = strong(); setRate(i, 0, 20); return i; })()]) finite(run(input));
});
test('§14.10 every derived calculation in every remediation scenario carries a formula and input trace', () => {
  for (const [name, output] of all()) for (const [key, value] of Object.entries(output.calculations)) {
    const trace = output.audit.formulas[key];
    assert.ok(trace && typeof trace.formula === 'string' && trace.formula.length && trace.inputs, name + ' ' + key);
    assert.equal(trace.value, value, name + ' ' + key);
  }
});
test('§14.11 a failed evidence gate cannot produce SUPPORTED', () => {
  for (const input of [SCENARIOS.ownershipConflict(), strong({ repeatability: { founder_required_late_stage: null } }), (() => { const i = SCENARIOS.surplusCapped(); i.demand.monthly_qualified_pipeline_created_value = null; return i; })()]) {
    const output = run(input);
    assert.equal(output.decision.state, 'insufficient_evidence'); assert.equal(output.decision.confidence, 'insufficient');
  }
  for (const [, output] of all()) if (output.decision.can_decide === false) assert.notEqual(output.decision.state, 'supported');
});
test('§14.12 materially insufficient demand, including monthly creation shortfalls, cannot produce SUPPORTED', () => {
  for (const name of ['creationShort', 'opportunityShort', 'zeroOpportunity', 'noEligibleCreation', 'surplusCapped']) {
    const output = run(SCENARIOS[name]());
    assert.notEqual(output.decision.state, 'supported', name);
  }
  for (const [name, output] of all()) {
    const demand = output.tests.demand_sufficiency;
    if (demand.state === 'short' || ['short', 'unknown', 'unbounded'].includes(demand.pipeline_creation_state) || ['short', 'unknown', 'unbounded'].includes(demand.opportunity_creation_state)) assert.notEqual(output.decision.state, 'supported', name);
  }
});
test('§14.13 incompatible timing cannot produce SUPPORTED', () => {
  for (const input of [SCENARIOS.preHorizonTiming(), strong({ proposed_ae: { proposed_start_date: '2028-01-01' } }), strong({ timing: { revenue_needed_by_date: '2027-02-01' } })]) {
    const output = run(input);
    assert.equal(output.tests.timing_management.timing.state, 'incompatible'); assert.notEqual(output.decision.state, 'supported');
  }
});
test('§14.14 a first AE cannot fail merely because no non-founder AE existed', () => {
  const output = run(SCENARIOS.firstAE());
  assert.equal(output.tests.repeatability.first_ae, true); assert.equal(output.tests.repeatability.state, 'transferable_evidence_strong');
  assert.ok(![output.decision.primary_constraint, ...output.decision.secondary_constraints].includes('founder_dependency'));
  assert.notEqual(output.decision.state, 'not_yet_supported');
});
test('§14.15 founder-inclusive conversion is never treated as proven transferable', () => {
  const output = run(strong({ conversion: { non_founder_qualified_opps_trailing_12m: null, non_founder_wins_trailing_12m: null, non_founder_qualified_opp_to_win_pct: null, qualified_opps_trailing_12m: 30, closed_won_trailing_12m: 9, qualified_opp_to_win_pct: 0.3 }, repeatability: { wins_trailing_12m: 9, non_founder_wins_trailing_12m: null } }));
  assert.equal(output.conversion.scenario_only, true); assert.notEqual(output.tests.repeatability.state, 'demonstrated');
  assert.notEqual(output.decision.state, 'supported'); assert.notEqual(output.decision.confidence, 'high');
});
test('§14.16 strategic desire cannot manufacture economic need', () => {
  for (const reason of policy.strategicReasons) {
    const output = run(strong({ target: { new_arr_target_horizon: 1250000 }, decision: { hire_reason: reason } }));
    assert.equal(output.decision.revenue_capacity_case, 'not_established'); assert.equal(output.decision.strategic_hiring_case.declared, true);
    assert.notEqual(output.tests.economic_need.state, 'supported'); assert.notEqual(output.decision.state, 'supported');
  }
});
test('§14.17 unknown never becomes zero in the remediation fields', () => {
  const unknownOpps = run(strong({ demand: { monthly_qualified_opps_created: { value: 12, status: 'unknown', source: 'unknown' } } }));
  assert.equal(unknownOpps.tests.demand_sufficiency.observed_monthly_opps_created, null); assert.equal(unknownOpps.calculations.opportunity_creation_ratio, null);
  const unknownCurrent = run(strong({ demand: { allocatable_current_qualified_pipeline: null } }));
  assert.equal(unknownCurrent.calculations.allocatable_current_pipeline, null); assert.equal(unknownCurrent.calculations.required_monthly_pipeline_creation, null);
  const unknownCreation = run(strong(DEEP_POOL, { demand: { monthly_qualified_pipeline_created_value: null } }));
  assert.equal(unknownCreation.calculations.observed_monthly_pipeline_creation, null); assert.equal(unknownCreation.calculations.pipeline_creation_ratio, null);
  assert.equal(run(strong({ demand: { monthly_qualified_opps_created: 0 } })).calculations.opportunity_creation_ratio, 0, 'a supplied zero remains zero');
});
test('§14.18 policy and engine version changes are explicit and recorded', () => {
  assert.equal(policy.version, 'ae-policy-1.1.0');
  const output = run(strong());
  assert.equal(output.policy_version, 'ae-policy-1.1.0'); assert.equal(output.engine_version, 'ae-engine-1.3.0'); assert.equal(engine.engine_version, 'ae-engine-1.3.0');
  assert.deepEqual(JSON.parse(JSON.stringify(output.audit.policy_snapshot)), JSON.parse(JSON.stringify(policy)));
});
test('§14.19 low-confidence evidence cannot yield SUPPORTED', () => {
  for (const [name, output] of all()) if (['low', 'insufficient'].includes(output.decision.confidence)) assert.notEqual(output.decision.state, 'supported', name);
});
test('remediation: more founder late-stage dependence never improves the later-AE repeatability state', () => {
  let prior = Infinity;
  for (const value of ['rarely', 'sometimes', 'often', 'almost_always']) {
    const output = run(strong({ repeatability: { founder_required_late_stage: value } }));
    assert.ok(repeatabilityRank[output.tests.repeatability.state] <= prior, value); prior = repeatabilityRank[output.tests.repeatability.state];
    assert.ok(decisionRank[output.decision.state] <= decisionRank[run(strong()).decision.state], value);
  }
});
let ownershipSeed = 31_2026;
function ownershipRandom() { ownershipSeed = (Math.imul(ownershipSeed, 1103515245) + 12345) >>> 0; return ownershipSeed / 4294967296; }
test('remediation: current allocation never exceeds the current pool net of the existing-team reservation', () => {
  for (let index = 0; index < 200; index += 1) {
    const pool = Math.round(ownershipRandom() * 3000000), reserved = ownershipRandom() < 0.3 ? null : Math.round(ownershipRandom() * 3000000);
    const explicit = ownershipRandom() < 0.3 ? null : Math.round(ownershipRandom() * 3000000), share = ownershipRandom() < 0.5 ? null : Math.round(ownershipRandom() * 100) / 100;
    const input = engine.normalizeInput(makeCase({ demand: { current_qualified_pipeline_in_horizon: pool, current_qualified_pipeline_value: pool, current_pipeline_reserved_for_existing_team: reserved, allocatable_current_qualified_pipeline: explicit, new_ae_pipeline_share_pct: share, allocatable_qualified_pipeline: 9000000 } }));
    const existingDemand = ownershipRandom() < 0.5 ? 0 : 500000;
    const result = engine.calculateAllocatablePipeline({ input, demandPool: engine.calculateDemandPool(input, policy), existingDemand });
    if (result.current_allocatable !== null) {
      lessOrEqual(result.current_allocatable + (reserved ?? 0), pool, 'current claim + reservation');
      if (explicit !== null && explicit > 0 && reserved === null) assert.ok(existingDemand === 0 || (share !== null && explicit <= pool * share), 'an unknown reservation admits a positive dollar claim only with no existing demand or inside an explicit share');
      assert.equal(input.validation.clarifications.some(issue => issue.code === 'current_allocation_exceeds_current_pool'), false);
    } else if (explicit !== null || share !== null) assert.ok(input.validation.clarifications.some(issue => issue.code === 'current_allocation_exceeds_current_pool') || result.warnings.length > 0);
  }
});
test('remediation: latest viable start is the true latest positive start and never later for an earlier deadline', () => {
  let prior = null;
  for (const need of ['2027-01-15', '2027-02-01', '2027-03-15', '2027-04-05', '2027-06-30', '2027-09-30']) for (const cycle of [30, 94, 180]) {
    const input = strong({ proposed_ae: { ramp_definition: 'pipeline_productivity', proposed_start_date: '2027-12-01' }, economics: { average_sales_cycle_days: cycle }, timing: { revenue_needed_by_date: need } });
    const timing = run(input).tests.timing_management.timing;
    assert.notEqual(timing.latest_viable_start, null, need + ' ' + cycle);
    assert.ok(timing.latest_viable_start >= timing.latest_start_search_floor);
    const probe = (start, positive) => { const p = engine.normalizeInput(clone(input)); p.proposed_ae.proposed_start_date = start; p.target.target_period_end = need; assert.equal(engine.calculateHireContribution(p, 12 / 57, policy, 'pipeline_productivity').value > 0, positive, need + ' ' + cycle + ' ' + start); };
    probe(timing.latest_viable_start, true);
    probe(new Date(Date.parse(timing.latest_viable_start + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10), false);
    if (cycle === 94) { if (prior !== null) assert.ok(timing.latest_viable_start >= prior); prior = timing.latest_viable_start; }
  }
});

// Second hardening pass (engine 1.2.0).
// A2: a known short-demand case built on adverse non-founder conversion. The
// all-seller (founder-inclusive) rate is far higher, so any silent fallback to it
// would lift the decision.
const ADVERSE_NF = { conversion: { non_founder_wins_trailing_12m: 5, non_founder_qualified_opps_trailing_12m: 57, non_founder_qualified_opp_to_win_pct: 5 / 57, qualified_opps_trailing_12m: 80, closed_won_trailing_12m: 30, qualified_opp_to_win_pct: 30 / 80 }, repeatability: { wins_trailing_12m: 30, founder_primary_seller_share_pct: 0.3, non_founder_wins_trailing_12m: 5 } };
const NO_NF = { conversion: { non_founder_wins_trailing_12m: null, non_founder_qualified_opps_trailing_12m: null, non_founder_qualified_opp_to_win_pct: null } };
const PIVOT = { conversion: { material_gtm_change_date: '2026-06-01', post_change_wins: 3, post_change_qualified_opps: 40, post_change_non_founder: true } };
const A2_CASES = [
  ['count-based non-founder rate removal', [ADVERSE_NF], NO_NF],
  ['supplied credible non-founder rate removal', [ADVERSE_NF, { conversion: { non_founder_wins_trailing_12m: null, non_founder_qualified_opps_trailing_12m: null } }], { conversion: { non_founder_qualified_opp_to_win_pct: null } }],
  ['post-pivot non-founder attribution removal', [ADVERSE_NF, PIVOT], { conversion: { post_change_non_founder: null } }],
  ['post-pivot non-founder count removal', [ADVERSE_NF, PIVOT], { conversion: { post_change_wins: null, post_change_qualified_opps: null } }],
  ['founder-inclusive fallback after removing every non-founder input', [ADVERSE_NF], deepMerge(NO_NF, { repeatability: { non_founder_wins_trailing_12m: null } })],
  ['new-market scenario conversion', [ADVERSE_NF, { decision: { new_ae_market_same_as_history: 'no' } }], NO_NF]
];
for (const [name, base, removal] of A2_CASES) {
  test('A2 ' + name + ' never strengthens the decision or raises confidence', () => {
    const before = run(strong(...base));
    assert.equal(before.validation.clarifications.length, 0, name + ' base must be complete');
    assert.equal(before.decision.state, 'not_yet_supported', name + ' base is known short demand');
    const after = run(strong(...base, removal));
    assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${before.decision.state} -> ${after.decision.state}`);
    assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `confidence ${before.decision.confidence} -> ${after.decision.confidence}`);
    // With no independent hard blocker the seat cannot be underwritten.
    assert.equal(after.decision.state, 'insufficient_evidence'); assert.equal(after.decision.primary_constraint, 'unknown_conversion');
  });
}
test('A2 the sweep holds across demand levels and scenario overlays', () => {
  for (const allocation of [1000000, 2900000, 4200000, 8000000]) for (const overlay of [{}, { decision: { new_ae_market_same_as_history: 'no' } }, PIVOT, { proposed_ae: { ramp_definition: 'pipeline_productivity' } }]) {
    const base = [ADVERSE_NF, overlay, { demand: { allocatable_qualified_pipeline: allocation, pipeline_likely_open_at_ae_start: allocation } }];
    const before = run(strong(...base));
    if (before.validation.clarifications.length) continue;
    for (const removal of [NO_NF, { conversion: { non_founder_qualified_opp_to_win_pct: null, non_founder_wins_trailing_12m: null } }, { conversion: { post_change_non_founder: null } }, { conversion: { post_change_wins: null } }]) {
      const after = run(strong(...base, removal));
      assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${allocation} ${JSON.stringify(removal)}: ${before.decision.state} -> ${after.decision.state}`);
      assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `${allocation} confidence`);
    }
  }
});
// A4: §14.3 for every accepted (nondecreasing) schedule shape.
const ACCEPTED_SHAPES = [[1], [0.25, 0.5, 0.75, 1], [0.5, 0.5, 0.5, 1], [0, 0, 1], [0, 0.5, 0.5, 1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1], [0.3, 1, 1, 1]];
test('A4 §14.3 delaying the start cannot increase contribution for any accepted schedule shape', () => {
  const starts = ['2026-06-01', '2026-11-20', '2027-01-01', '2027-01-31', '2027-02-28', '2027-04-15', '2027-07-01', '2027-10-10', '2027-12-31', '2028-01-01'];
  for (const shape of ACCEPTED_SHAPES) for (const mode of ['closed_bookings', 'pipeline_productivity']) {
    assert.equal(engine.normalizeInput(makeCase({ proposed_ae: { monthly_ramp_schedule: shape, ramp_months: null } })).validation.fatal_errors.length, 0, JSON.stringify(shape));
    let prior = Infinity;
    for (const start of starts) {
      const input = engine.normalizeInput(makeCase({ proposed_ae: { ramp_definition: mode, monthly_ramp_schedule: shape, ramp_months: null, proposed_start_date: start } }));
      const value = engine.calculateHireContribution(input, 12 / 57, policy, mode).value;
      assert.ok(value <= prior + epsilon, `${JSON.stringify(shape)} ${mode} ${start}: ${value} > ${prior}`); prior = value;
    }
  }
});
test('A4 a non-monotone schedule never reaches the contribution model', () => {
  for (const shape of [[1, 0, 1], [0.5, 0.25, 0.75], [0.5, 1, 0.75]]) {
    const output = run(makeCase({ proposed_ae: { monthly_ramp_schedule: shape, ramp_months: null } }));
    assert.equal(output.status, 'validation_stop'); assert.deepEqual(output.calculations, {});
  }
});
// B1: one management or seasonality answer removed at a time, across scenarios.
test('B1 removing one management or seasonality answer never raises confidence or strengthens the decision', () => {
  const fields = [['management', 'direct_manager_exists'], ['management', 'weekly_1to1_capacity'], ['management', 'weekly_pipeline_review_capacity'], ['management', 'onboarding_owner_named'], ['management', 'onboarding_plan_exists'], ['demand', 'pipeline_creation_is_seasonal']];
  const bases = { ...SCENARIOS, reference: () => makeCase(), seasonal: () => strong({ demand: { pipeline_creation_is_seasonal: true } }), productivity: () => makeCase({ proposed_ae: { ramp_definition: 'pipeline_productivity' } }) };
  let checked = 0;
  for (const [name, build] of Object.entries(bases)) {
    const before = run(build());
    if (before.validation.clarifications.length || before.validation.fatal_errors.length) continue;
    for (const [group, field] of fields) {
      const input = build(); input[group][field] = null;
      const after = run(input); checked += 1;
      assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${name} minus ${field}: ${before.decision.state} -> ${after.decision.state}`);
      assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `${name} minus ${field}: ${before.decision.confidence} -> ${after.decision.confidence}`);
    }
  }
  assert.ok(checked >= 90);
});
// B3: an unknown ramp meaning is never stronger than either known meaning.
test('B3 removing the ramp definition never strengthens the decision across scenarios', () => {
  for (const [name, build] of Object.entries(SCENARIOS)) for (const mode of ['closed_bookings', 'pipeline_productivity']) {
    const known = build(); known.proposed_ae.ramp_definition = mode;
    const before = run(known); if (before.validation.clarifications.length) continue;
    const unknown = build(); unknown.proposed_ae.ramp_definition = null;
    const after = run(unknown);
    assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${name} ${mode}: ${before.decision.state} -> ${after.decision.state}`);
    assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `${name} ${mode} confidence`);
  }
});

// Final pre-merge correction (engine 1.3.0): series vs single monthly value.
test('A5 (1.3.0) removing a seasonal series, or the seasonality answer, never strengthens any scenario', () => {
  const SERIES = [200000, 220000, 240000, 300000, 350000, 400000, 450000, 500000, 550000, 900000, 1100000, 1300000];
  let checked = 0;
  for (const [name, build] of Object.entries(SCENARIOS)) for (const scale of [0.5, 1, 3]) {
    const withSeries = () => { const input = build(); Object.assign(input.demand, { pipeline_creation_is_seasonal: true, monthly_pipeline_series: SERIES.map(v => v * scale) }); return input; };
    const before = run(withSeries());
    if (before.validation.clarifications.length || before.validation.fatal_errors.length) continue;
    assert.ok(!before.validation.clarifications.some(c => c.code === 'creation_source_conflict'), name);
    for (const [label, erase] of [['series', i => { i.demand.monthly_pipeline_series = null; }], ['series and seasonality', i => { i.demand.monthly_pipeline_series = null; i.demand.pipeline_creation_is_seasonal = null; }], ['single value', i => { i.demand.monthly_qualified_pipeline_created_value = null; }]]) {
      const input = withSeries(); erase(input);
      const after = run(input); checked += 1;
      assert.ok(decisionRank[after.decision.state] <= decisionRank[before.decision.state], `${name} x${scale} minus ${label}: ${before.decision.state} -> ${after.decision.state}`);
      assert.ok(confidenceRank[after.decision.confidence] <= confidenceRank[before.decision.confidence], `${name} x${scale} minus ${label}: ${before.decision.confidence} -> ${after.decision.confidence}`);
    }
  }
  assert.ok(checked >= 120);
});
test('A5 (1.3.0) the single monthly value never changes the result while a series is supplied', () => {
  for (const [name, build] of Object.entries(SCENARIOS)) for (const seasonal of [true, false, null]) {
    const a = build(), b = build();
    for (const input of [a, b]) Object.assign(input.demand, { pipeline_creation_is_seasonal: seasonal, monthly_pipeline_series: Array(12).fill(700000) });
    a.demand.monthly_qualified_pipeline_created_value = 50000; b.demand.monthly_qualified_pipeline_created_value = 5000000;
    const x = run(a), y = run(b);
    assert.deepEqual([x.decision.state, x.decision.primary_constraint, x.decision.confidence, x.calculations.pipeline_pool, x.calculations.observed_monthly_pipeline_creation], [y.decision.state, y.decision.primary_constraint, y.decision.confidence, y.calculations.pipeline_pool, y.calculations.observed_monthly_pipeline_creation], name + ' ' + seasonal);
  }
});

if (failures.length) {
  failures.forEach(failure => console.error('FAIL ' + failure));
  console.error(`AE invariants: ${passed} passed, ${failures.length} failed`);
  process.exitCode = 1;
} else console.log(`AE invariants: ${passed} passed`);
