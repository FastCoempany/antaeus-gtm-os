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

if (failures.length) {
  failures.forEach(failure => console.error('FAIL ' + failure));
  console.error(`AE invariants: ${passed} passed, ${failures.length} failed`);
  process.exitCode = 1;
} else console.log(`AE invariants: ${passed} passed`);
