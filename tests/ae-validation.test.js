'use strict';

// Independent contract checks from §§3.5, 9, 10 and 14 of the master spec.
const assert = require('node:assert/strict');
const engine = require('../js/ae-underwriting-engine.js');
const { makeCase } = require('./ae-fixtures.js');
let passed = 0;
const failures = [];
function test(name, run) {
  try { run(); passed += 1; }
  catch (error) { failures.push(name + ': ' + error.message); }
}
function validation(input) { return engine.normalizeInput(input).validation; }
function allIssues(value) { return [...value.fatal_errors, ...value.clarifications]; }
function assertBlocked(input, fatal = false) {
  const check = validation(input);
  assert.ok((fatal ? check.fatal_errors : allIssues(check)).length > 0, 'invalid input needs an explicit validation issue');
  const result = engine.underwrite(input);
  assert.notEqual(result.decision?.state, 'supported', 'invalid/conflicting evidence cannot support a hire');
  if (fatal) assert.ok(result.decision?.state == null, 'fatal validation must stop before any verdict');
}
function assign(path, value) {
  const input = makeCase();
  const parts = path.split('.');
  let group = input;
  parts.slice(0, -1).forEach(part => { group = group[part]; });
  group[parts.at(-1)] = value;
  return input;
}

test('complete base has no fatal errors', () => {
  assert.equal(validation(makeCase()).fatal_errors.length, 0);
});
test('normalization distinguishes supplied zero, unknown and not applicable', () => {
  const input = makeCase({
    proposed_ae: {
      annual_quota: { value: 0, status: 'supplied', source: 'finance_model' },
      other_loaded_cost_estimate: { value: 123, status: 'unknown', source: 'unknown' }
    },
    economics: { gross_margin_pct: { value: null, status: 'not_applicable', source: 'unknown' } }
  });
  const normalized = engine.normalizeInput(input);
  assert.equal(normalized.proposed_ae.annual_quota, 0);
  assert.equal(normalized.proposed_ae.other_loaded_cost_estimate, null);
  assert.equal(normalized.economics.gross_margin_pct, null);
  assert.equal(normalized.field_status['economics.gross_margin_pct'].status, 'not_applicable');
  assert.equal(normalized.field_status['proposed_ae.annual_quota'].source, 'finance_model');
});
for (const missing of [null, undefined, '', 'unknown']) {
  test('unknown monetary value survives normalization: ' + String(missing), () => {
    const normalized = engine.normalizeInput(assign('proposed_ae.annual_quota', missing));
    assert.equal(normalized.proposed_ae.annual_quota, null);
  });
}
for (const [name, value] of [['NaN', NaN], ['Infinity', Infinity], ['negative', -1], ['numeric text', '900000'], ['boolean', true], ['array', [900000]], ['object', { amount: 900000 }]]) {
  test('quota rejects ' + name, () => assertBlocked(assign('proposed_ae.annual_quota', value), true));
}
for (const path of ['conversion.non_founder_qualified_opp_to_win_pct', 'conversion.meeting_to_qualified_opp_pct', 'demand.new_ae_pipeline_share_pct', 'repeatability.founder_primary_seller_share_pct']) {
  test('percent cannot use whole-number percent units: ' + path, () => assertBlocked(assign(path, 21), true));
}
for (const path of ['conversion.non_founder_qualified_opps_trailing_12m', 'conversion.non_founder_wins_trailing_12m', 'repeatability.wins_trailing_12m', 'repeatability.repeatable_use_cases_count', 'current_team.current_quota_carriers']) {
  test('count must be integral: ' + path, () => assertBlocked(assign(path, 1.5), true));
}
for (const [path, value] of [
  ['decision.analysis_horizon_months', 5], ['decision.analysis_horizon_months', 19],
  ['decision.analysis_horizon_months', 12.5], ['proposed_ae.ramp_months', 13],
  ['economics.average_sales_cycle_days', 0], ['economics.average_sales_cycle_days', 731],
  ['demand.current_qualified_pipeline_value', -1],
  ['proposed_ae.monthly_ramp_schedule', [0, 0.5, 1.01]],
  ['proposed_ae.monthly_ramp_schedule', [0, '0.5', 1]],
  ['proposed_ae.monthly_ramp_schedule', []],
  ['demand.monthly_pipeline_series', [100000, -1]],
  ['demand.monthly_pipeline_series', [100000, Infinity]]
]) test('invalid numeric range or series: ' + path + ' ' + JSON.stringify(value), () => assertBlocked(assign(path, value), true));

for (const [name, overrides] of [
  ['wins exceed opportunities', { conversion: { qualified_opps_trailing_12m: 10, closed_won_trailing_12m: 11 } }],
  ['non-founder wins exceed own opportunities', { conversion: { non_founder_qualified_opps_trailing_12m: 5, non_founder_wins_trailing_12m: 6 } }],
  ['non-founder wins exceed total wins', { conversion: { closed_won_trailing_12m: 5, qualified_opps_trailing_12m: 100 } }],
  ['non-founder opportunities exceed all opportunities', { conversion: { qualified_opps_trailing_12m: 20 } }],
  ['post-change wins exceed opportunities', { conversion: { post_change_qualified_opps: 2, post_change_wins: 3 } }],
  ['repeatability subset exceeds total', { repeatability: { wins_trailing_12m: 2, non_founder_wins_trailing_12m: 3 } }],
  ['mixed currency', { company: { currency: 'USD' }, proposed_ae: { currency: 'EUR' } }]
]) test(name, () => assertBlocked(makeCase(overrides), true));

for (const value of ['2026-02-30', '2025-02-29', '09/30/2026', '2026-01-01T00:00:00Z', 'recent']) {
  test('business date rejects ' + value, () => assertBlocked(assign('proposed_ae.proposed_start_date', value), true));
}
test('date-only leap day is valid', () => {
  assert.ok(!validation(assign('proposed_ae.proposed_start_date', '2028-02-29')).fatal_errors.some(issue => issue.code === 'invalid_date'));
});
test('horizon cannot end before it starts', () => assertBlocked(makeCase({ target: { target_period_start: '2026-12-31', target_period_end: '2026-01-01' } }), true));
test('evidence window cannot end before it starts', () => assertBlocked(makeCase({ conversion: { conversion_evidence_window_start: '2026-12-31', conversion_evidence_window_end: '2026-01-01' } }), true));
test('explicit in-horizon expectation conflicts with a later start', () => assertBlocked(makeCase({ proposed_ae: { proposed_start_date: '2099-01-01' }, timing: { expects_contribution_inside_horizon: true } }), true));

for (const [name, overrides] of [
  ['supplied rate contradicts counts', { conversion: { non_founder_qualified_opp_to_win_pct: 0.5 } }],
  ['same-window duplicate wins conflict', { repeatability: { non_founder_wins_trailing_12m: 1 } }],
  ['founder share conflicts with independent wins', { repeatability: { founder_primary_seller_share_pct: 1 } }],
  ['current carriers contradict aggregate capacity', { current_team: { current_quota_carriers: 0, aggregate_annual_quota: 900000 } }],
  ['metric basis mismatch', { proposed_ae: { quota_metric: 'tcv' }, economics: { contract_term_months_typical: 36 } }],
  ['ACV metric basis mismatch', { economics: { acv_metric: 'tcv' } }],
  ['pipeline metric basis mismatch', { demand: { pipeline_metric: 'tcv' } }],
  ['expansion mismatch', { proposed_ae: { quota_includes_expansion: true } }],
  ['ending ARR requires normalization', { target: { target_metric: 'ending_arr_growth' } }],
  ['renewal needs separation', { target: { target_includes_renewal: true } }],
  ['weighted pipeline needs separate path', { demand: { pipeline_value_type: 'probability_weighted' } }],
  ['forecast category needs separate path', { demand: { pipeline_value_type: 'forecast_category' } }],
  ['replacement requires departure details', { decision: { hire_reason: 'replacement' }, current_team: { departing_seller_index: null, departure_date: null, departure_month_index: null } }]
]) test(name, () => assertBlocked(makeCase(overrides)));

test('first revenue expected before start requires clarification', () => {
  assertBlocked(makeCase({ proposed_ae: { proposed_start_date: '2026-03-01' }, timing: { first_revenue_expected_by_company: '2026-02-01' } }));
});
test('declared allocation exceeding the available pool requires clarification', () => {
  assertBlocked(makeCase({ demand: { allocatable_qualified_pipeline: 1e9, pipeline_likely_open_at_ae_start: 1e9, monthly_qualified_pipeline_created_value: 0 } }));
});
test('attainment above 150 percent warns and is never silently capped', () => {
  const input = makeCase();
  input.current_team.sellers[0].trailing_attainment_pct = 1.6;
  const normalized = engine.normalizeInput(input);
  assert.equal(normalized.current_team.sellers[0].trailing_attainment_pct, 1.6);
  assert.equal(normalized.validation.fatal_errors.length, 0);
  assert.ok(normalized.validation.warnings.some(issue => issue.code === 'unusual_attainment'));
});
test('normalization does not mutate source input or admit prototype keys', () => {
  const input = makeCase();
  const before = JSON.stringify(input);
  engine.normalizeInput(input);
  assert.equal(JSON.stringify(input), before);
  const malicious = JSON.parse('{"company":{"__proto__":{"ae_polluted":true},"constructor":{"prototype":{"ae_polluted":true}}}}');
  const normalized = engine.normalizeInput(malicious);
  assert.equal({}.ae_polluted, undefined);
  assert.equal(Object.hasOwn(normalized.company, '__proto__'), false);
});

// Current-vs-future pipeline ownership (PR #315 audit, defect 3).
const currentPool = overrides => makeCase({ demand: Object.assign({ current_qualified_pipeline_in_horizon: 1000000, current_qualified_pipeline_value: 1000000, allocatable_qualified_pipeline: 3000000 }, overrides) });
const ownershipConflict = input => validation(input).clarifications.some(issue => issue.code === 'current_allocation_exceeds_current_pool');
for (const [name, overrides] of [
  ['current allocation exceeds current pool', { allocatable_current_qualified_pipeline: 1500000 }],
  ['current allocation plus reservation exceeds current pool', { allocatable_current_qualified_pipeline: 500000, current_pipeline_reserved_for_existing_team: 600000 }],
  ['current share plus reservation exceeds current pool', { allocatable_current_qualified_pipeline: null, new_ae_pipeline_share_pct: 0.5, current_pipeline_reserved_for_existing_team: 600000 }],
  ['reservation alone exceeds current pool', { allocatable_current_qualified_pipeline: null, current_pipeline_reserved_for_existing_team: 1000001 }],
  ['current allocation from a pool that is all future creation', { current_qualified_pipeline_in_horizon: 0, current_qualified_pipeline_value: 0, allocatable_current_qualified_pipeline: 1 }]
]) test('current ownership clarification: ' + name, () => {
  assert.ok(ownershipConflict(currentPool(overrides)));
  assertBlocked(currentPool(overrides));
});
for (const [name, overrides] of [
  ['allocation equal to the pool', { allocatable_current_qualified_pipeline: 1000000 }],
  ['allocation plus reservation equal to the pool', { allocatable_current_qualified_pipeline: 400000, current_pipeline_reserved_for_existing_team: 600000 }],
  ['share plus reservation equal to the pool up to rounding', { current_qualified_pipeline_in_horizon: 3, current_qualified_pipeline_value: 3, allocatable_qualified_pipeline: 3, allocatable_current_qualified_pipeline: null, new_ae_pipeline_share_pct: 0.1, current_pipeline_reserved_for_existing_team: 2.7 }],
  ['unknown reservation with an admissible allocation', { allocatable_current_qualified_pipeline: 900000, current_pipeline_reserved_for_existing_team: { value: null, status: 'unknown', source: 'unknown' } }]
]) test('current ownership fits the current pool: ' + name, () => assert.equal(ownershipConflict(currentPool(overrides)), false));
for (const [name, value] of [['numeric text', '600000'], ['negative', -1], ['NaN', NaN], ['boolean', true]]) {
  test('current existing-team reservation rejects ' + name, () => assertBlocked(assign('demand.current_pipeline_reserved_for_existing_team', value), true));
}
test('unknown current existing-team reservation stays unknown, never zero', () => {
  const normalized = engine.normalizeInput(assign('demand.current_pipeline_reserved_for_existing_team', { value: 123, status: 'unknown', source: 'unknown' }));
  assert.equal(normalized.demand.current_pipeline_reserved_for_existing_team, null);
  assert.ok(normalized.unknowns.includes('demand.current_pipeline_reserved_for_existing_team'));
  assert.equal(engine.normalizeInput(makeCase()).demand.current_pipeline_reserved_for_existing_team, null);
});

for (const [name, value] of [['numeric text', '1000000'], ['boolean', true], ['bare object without a status', { value: 1000000 }], ['negative', -1]]) {
  test('in-horizon current pipeline rejects ' + name, () => assertBlocked(assign('demand.current_qualified_pipeline_in_horizon', value), true));
}
test('in-horizon current pipeline wrapped as explicit unknown stays unknown', () => {
  const normalized = engine.normalizeInput(assign('demand.current_qualified_pipeline_in_horizon', { value: 5, status: 'unknown', source: 'unknown' }));
  assert.equal(normalized.demand.current_qualified_pipeline_in_horizon, null);
  assert.equal(normalized.validation.fatal_errors.length, 0);
});
test('in-horizon current pipeline cannot exceed total current pipeline', () => {
  const input = makeCase({ demand: { current_qualified_pipeline_in_horizon: 3400001, current_qualified_pipeline_value: 3400000 } });
  assert.ok(validation(input).clarifications.some(issue => issue.code === 'current_horizon_pipeline_exceeds_current_pipeline'));
  assertBlocked(input);
  assert.ok(!validation(makeCase({ demand: { current_qualified_pipeline_in_horizon: 3400000, current_qualified_pipeline_value: 3400000 } })).clarifications.some(issue => issue.code === 'current_horizon_pipeline_exceeds_current_pipeline'));
});
for (const value of ['never', 'Often', ' rarely', 7]) test('unrecognized founder late-stage answer cannot support a later AE: ' + JSON.stringify(value), () => {
  const result = engine.underwrite(assign('repeatability.founder_required_late_stage', value));
  assert.notEqual(result.decision.state, 'supported');
  assert.equal(result.tests.repeatability.founder_late_stage_class, 'unknown');
  assert.ok(result.evidence_gaps.some(gap => gap.field === 'repeatability.founder_required_late_stage'));
});

if (failures.length) {
  failures.forEach(failure => console.error('FAIL ' + failure));
  console.error(`AE validation: ${passed} passed, ${failures.length} failed`);
  process.exitCode = 1;
} else console.log(`AE validation: ${passed} passed`);
