'use strict';

// The landing page publishes a sample decision (master spec §18, §2.4 §6).
// It must be what the frozen engine actually returns for that sample, so the
// page can never drift into numbers the product would not produce.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../js/ae-underwriting-engine.js');
const { makeCase } = require('./ae-fixtures.js');

let passed = 0;
const failures = [];
function test(name, run) {
  try { run(); passed += 1; } catch (error) { failures.push(name + ': ' + error.message); }
}

const html = fs.readFileSync(path.join(__dirname, '..', 'should-we-hire-an-ae', 'index.html'), 'utf8');
const sample = engine.underwrite(makeCase()); // Appendix B fixture = the published sample company.
const published = name => {
  const match = html.match(new RegExp('data-sample="' + name + '">([^<]+)<'));
  assert.ok(match, 'landing page is missing data-sample="' + name + '"');
  return match[1];
};
const money = value => value >= 1e6 ? '$' + (value / 1e6).toFixed(2) + 'M' : '$' + Math.round(value / 1000) + 'k';

test('published decision state and constraint match the engine', () => {
  assert.equal(sample.decision.state, 'conditional');
  assert.equal(sample.decision.primary_constraint, 'pipeline_supply');
  assert.match(html, /CONDITIONAL[\s\S]*Pipeline supply is the limiting condition\./);
  assert.match(html, /Primary constraint: pipeline supply/);
});
test('published next-AE economics match the engine', () => {
  const c = sample.calculations;
  assert.equal(published('annual_quota'), money(sample.audit.input_snapshot.proposed_ae.annual_quota));
  assert.equal(published('contribution'), money(c.proposed_ae_contribution));
  assert.equal(published('wins'), '≈' + Math.round(c.wins_required));
  assert.equal(published('opps'), '≈' + Math.round(c.qualified_opps_required));
  assert.equal(published('pipeline'), money(c.qualified_pipeline_required));
});
test('published lane states match the engine tests', () => {
  assert.equal(sample.tests.economic_need.state, 'supported');
  assert.ok(['near', 'short'].includes(sample.tests.demand_sufficiency.state), 'demand is shown as THIN');
  assert.equal(sample.tests.repeatability.state, 'demonstrated');
  assert.equal(sample.tests.timing_management.timing.state, 'compatible');
  assert.equal(sample.tests.timing_management.management.state, 'ready');
});
test('published workback arithmetic is correct', () => {
  assert.equal(Math.round(1200000 / 75000), 16);
  assert.equal(Math.round(16 / 0.24), 67);
  assert.equal((67 * 75000 / 1e6).toFixed(1), '5.0');
  assert.match(html, /= 16 wins[\s\S]*= 67 qualified opportunities[\s\S]*= \$5\.0M qualified pipeline/);
});
test('every sample on the page is labeled as illustrative', () => {
  assert.match(html, /SAMPLE · AE CAPACITY DECISION/);
  assert.match(html, /FICTIONAL EXAMPLE/);
  assert.equal((html.match(/Illustrative sample\. Not a benchmark and not a customer result\./g) || []).length, 2);
});

if (failures.length) {
  failures.forEach(failure => console.error('FAIL ' + failure));
  console.error(`AE landing sample: ${passed} passed, ${failures.length} failed`);
  process.exitCode = 1;
} else console.log(`AE landing sample: ${passed} passed`);
