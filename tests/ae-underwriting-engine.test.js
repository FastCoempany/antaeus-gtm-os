'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/ae-underwriting-engine.js');
const policy = require('../js/ae-policy.js');
const { makeCase } = require('./ae-fixtures.js');
let passed = 0;
const failures = [];
function test(name, fn) { try { fn(); passed++; } catch(error) { failures.push(name+': '+error.message); } }
function close(actual,expected,tolerance=1e-6) { assert.ok(typeof actual==='number'&&Math.abs(actual-expected)<=tolerance,actual+' differs from '+expected); }
function normalized(overrides) { return engine.normalizeInput(makeCase(overrides)); }
test('Section 11 exact arithmetic independently from the Appendix rate',()=>{
  const input=normalized();
  const capacity=engine.calculateExistingCapacity(input,policy);
  close(capacity.value,1350000);
  const contribution=engine.calculateHireContribution(input,0.21,policy);
  close(contribution.value,675000);
  close(contribution.months_available,10);
  const funnel=engine.calculateFunnelRequirements({contribution,acv:52000,winRate:0.21,meetingToOpp:0.35});
  close(funnel.wins_required,675000/52000);
  assert.equal(funnel.practical_wins_required,13);
  close(funnel.opps_required,675000/(52000*0.21));
  close(funnel.pipeline_required,675000/0.21);
  close(funnel.meetings_required,675000/(52000*0.21*0.35));
  close(engine.testDemandSufficiency({allocatable:2900000,required:funnel.pipeline_required,policy}).coverage,2900000/(675000/0.21));
});
test('calculated non-founder rate precedes supplied all-seller rate',()=>{
  const input=normalized({conversion:{qualified_opp_to_win_pct:0.35}});
  const result=engine.selectTransferableWinRate(input,policy);
  close(result.value,12/57); assert.equal(result.source,'non_founder_counts');
});
test('Section 11 full reference decision and measurable pipeline condition',()=>{
  const input=makeCase({conversion:{non_founder_wins_trailing_12m:21,non_founder_qualified_opps_trailing_12m:100,non_founder_qualified_opp_to_win_pct:0.21},repeatability:{wins_trailing_12m:23,non_founder_wins_trailing_12m:21},demand:{current_qualified_pipeline_value:4000000,current_qualified_pipeline_in_horizon:4000000}});
  const result=engine.underwrite(input);
  close(result.calculations.residual_gap,650000);close(result.calculations.proposed_ae_contribution,675000);
  close(result.calculations.qualified_pipeline_required,675000/0.21);
  close(result.calculations.demand_coverage,2900000/(675000/0.21));
  assert.equal(result.tests.economic_need.state,'supported');assert.equal(result.tests.demand_sufficiency.state,'near');
  assert.equal(result.tests.repeatability.state,'demonstrated');assert.equal(result.tests.timing_management.timing.state,'compatible');
  assert.equal(result.decision.state,'conditional');assert.equal(result.decision.primary_constraint,'pipeline_supply');
  close(result.conditions.find(c=>c.code==='pipeline_supply').gap,675000/0.21-2900000);
});
test('modest sensitivity flips lower confidence and request enhanced review',()=>{
  const result=engine.underwrite(makeCase());
  assert.ok(result.sensitivity_review.some(r=>r.modest_change&&r.decision_changed));
  assert.equal(result.decision.confidence,'low');assert.equal(result.enhanced_review_required,true);
});
test('latest viable start is a dated condition when timing fails',()=>{
  const result=engine.underwrite(makeCase({proposed_ae:{proposed_start_date:'2028-01-01'}}));
  assert.equal(result.tests.timing_management.timing.latest_viable_start,'2027-12-31');
});
test('incompatible revenue bases cannot yield a residual gap or funnel claim',()=>{
  const result=engine.underwrite(makeCase({proposed_ae:{quota_metric:'tcv'}}));
  assert.equal(result.calculations.residual_gap,null);assert.equal(result.calculations.qualified_pipeline_required,null);
});
test('unknown conversion still permits quota-dollar capacity and pipeline remains unknown',()=>{
  const input=normalized({conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null}});
  const rate=engine.selectTransferableWinRate(input,policy);
  assert.equal(rate.value,null);
  close(engine.calculateHireContribution(input,rate,policy).value,675000);
  assert.equal(engine.calculateFunnelRequirements({contribution:675000,acv:52000,winRate:rate}).pipeline_required,null);
});
test('missing attainment uses explicit declared quota assumption',()=>{
  const input=normalized({current_team:{sellers:[{annual_quota:900000,is_founder:false}]}});
  const result=engine.calculateExistingCapacity(input,policy);
  close(result.value,900000); assert.ok(result.assumptions.length);
});
test('finance plan remains separate from operating capacity',()=>{
  const result=engine.calculateExistingCapacity(normalized({current_team:{existing_team_committed_new_arr:2000000}}),policy);
  close(result.value,1350000); close(result.finance_plan,2000000); assert.ok(result.warnings.length);
});
test('replacement removes departing seller after month two',()=>{
  const input=normalized({decision:{hire_reason:'replacement'},current_team:{departing_seller_index:1,departure_month_index:2}});
  close(engine.calculateExistingCapacity(input,policy).value,900000*0.72+900000*0.78*2/12);
});
test('founder already in seller capacity is never added twice',()=>{
  const input=normalized({current_team:{founder_in_existing_team:true,founder_committed_new_arr:600000,founder_expected_to_remain_seller:true}});
  close(engine.calculateNonDuplicatedFounderContribution(input).value,0);
});
test('no founder sales is known zero but an unknown commitment stays unknown',()=>{
  close(engine.calculateNonDuplicatedFounderContribution(normalized()).value,0);
  assert.equal(engine.calculateNonDuplicatedFounderContribution(normalized({current_team:{founder_expected_to_remain_seller:true,founder_committed_new_arr:null}})).value,null);
});
test('company monthly schedule takes precedence over fallback ramp duration',()=>{
  const input=normalized({proposed_ae:{monthly_ramp_schedule:[0.25,0.5,0.75,1],ramp_months:9}});
  close(engine.calculateHireContribution(input,0.21,policy).value,900000/12*(0.25+0.5+0.75+7));
});
test('closed-bookings ramp never subtracts sales cycle',()=>{
  const short=engine.calculateHireContribution(normalized({economics:{average_sales_cycle_days:1}}),0.21,policy);
  const long=engine.calculateHireContribution(normalized({economics:{average_sales_cycle_days:730}}),0.21,policy);
  close(short.value,long.value);
});
test('pipeline-productivity ramp excludes generation that closes after horizon',()=>{
  const input=normalized({proposed_ae:{ramp_definition:'pipeline_productivity'},economics:{average_sales_cycle_days:90}});
  const result=engine.calculateHireContribution(input,0.21,policy);
  assert.equal(result.first_contribution_date,'2027-05-30');
  assert.ok(result.value<675000);assert.equal(result.trace.generation_cutoff,'2027-10-02');
});
test('unknown ramp returns two interpretations and a range',()=>{
  const result=engine.calculateHireContribution(normalized({proposed_ae:{ramp_definition:'unknown'}}),0.21,policy);
  assert.equal(result.value,null);assert.equal(result.ambiguous,true);assert.equal(result.range.length,2);assert.ok(result.range[0]<result.range[1]);
});
test('a nonqualified cycle is not substituted for qualified pipeline aging',()=>{
  const input=normalized({proposed_ae:{ramp_definition:'pipeline_productivity'},economics:{sales_cycle_definition:'first_touch_to_close'}});
  assert.equal(engine.calculateHireContribution(input,0.21,policy).value,null);
  assert.equal(engine.calculateDemandPool(input,policy).value,null);
});
test('zero rate gives an explicitly unbounded pipeline requirement',()=>{
  const result=engine.calculateFunnelRequirements({contribution:675000,acv:52000,winRate:0,meetingToOpp:0.35});
  assert.equal(result.pipeline_required,null);assert.equal(result.statuses.pipeline_required,'unbounded');
});
test('zero gap is not divided',()=>{
  const output=engine.underwrite(makeCase({target:{new_arr_target_horizon:1000000}}));
  assert.equal(output.calculations.gap_coverage,null);assert.equal(output.calculations.residual_gap,0);
});
test('allocation uses minimum supplied measure with existing-team surplus cap',()=>{
  const input=normalized({demand:{allocatable_qualified_pipeline:3000000,new_ae_pipeline_share_pct:0.5}});
  const result=engine.calculateAllocatablePipeline({input,demandPool:{value:10000000,current:3400000},existingDemand:8000000});
  close(result.value,2000000);
});
test('weighted pipeline is withheld from unweighted demand arithmetic',()=>{
  assert.equal(engine.calculateDemandPool(normalized({demand:{pipeline_value_type:'probability_weighted'}}),policy).value,null);
});
test('seasonal supplied series takes precedence over monthly extrapolation',()=>{
  const input=normalized({demand:{pipeline_creation_is_seasonal:true,monthly_qualified_pipeline_created_value:999999999,monthly_pipeline_series:[200000,220000,240000,300000,350000,400000,450000,500000,550000,900000,1100000,1300000]}});
  const result=engine.calculateDemandPool(input,policy);
  close(result.future,200000+220000+240000+300000+350000+400000+450000+500000+550000*28/30);
});
test('missing seasonal series values do not become zero',()=>{
  assert.equal(engine.calculateDemandPool(normalized({demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:[1,2]}}),policy).future,null);
});
test('partial leap month uses actual days',()=>{
  const input=normalized({target:{target_period_start:'2028-02-01',target_period_end:'2028-07-31'},decision:{analysis_horizon_months:6},proposed_ae:{proposed_start_date:'2028-02-15',ramp_months:0}});
  close(engine.calculateHireContribution(input,0.21,policy).value,75000*(15/29+5));
});
test('all mandatory sensitivity variables and required result columns are present',()=>{
  const output=engine.underwrite(makeCase());
  for(const variable of policy.sensitivity.variables) {
    const rows=output.sensitivity.filter(row=>row.variable===variable);
    assert.equal(rows.length,3);
    for(const row of rows)for(const key of ['proposed_ae_contribution','qualified_pipeline_required','demand_coverage','timing_status','decision_state'])assert.ok(Object.hasOwn(row,key));
  }
});
test('derived top-level calculations have a stored formula and input trace',()=>{
  const output=engine.underwrite(makeCase());
  for(const [key,val]of Object.entries(output.calculations))if(typeof val==='number') {
    assert.equal(typeof output.audit.formulas[key].formula,'string',key);assert.ok(output.audit.formulas[key].inputs);
  }
});
if(failures.length){failures.forEach(f=>console.error('FAIL '+f));process.exitCode=1;}
console.log(`AE engine: ${passed} passed, ${failures.length} failed`);
