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

// ---------------------------------------------------------------------------
// Remediation regressions (PR #315 audit). Each case states the defect it pins.
// STRONG is the G02 strong later-AE case: every dimension supported.
const { deepMerge } = require('./ae-fixtures.js');
const STRONG={target:{new_arr_target_horizon:2200000},demand:{pipeline_likely_open_at_ae_start:4200000,allocatable_qualified_pipeline:4200000,monthly_qualified_pipeline_created_value:1000000}};
// A large current in-horizon pool keeps the horizon surplus cap non-binding, so
// horizon demand coverage stays > 1.00x while monthly creation varies.
const DEEP_POOL={demand:{current_qualified_pipeline_in_horizon:12000000,current_qualified_pipeline_value:12000000}};
const strong=(...overrides)=>makeCase(overrides.reduce((all,next)=>deepMerge(all,next),STRONG));
const codes=result=>(result.decision.constraints||[]).map(c=>c.code);
const decisionCodes=result=>[result.decision.primary_constraint,...result.decision.secondary_constraints];
const rank={insufficient_evidence:0,not_yet_supported:1,conditional:2,supported:3};
const confidenceRank={insufficient:0,low:1,moderate:2,high:3};

test('control: the strong later-AE case is supported with both creation ratios populated and sufficient',()=>{
  const r=engine.underwrite(strong());
  assert.equal(r.decision.state,'supported');
  const d=r.tests.demand_sufficiency;
  assert.ok(d.pipeline_creation_ratio>=1&&d.opportunity_creation_ratio>=1);
  assert.equal(d.pipeline_creation_state,'sufficient');assert.equal(d.opportunity_creation_state,'sufficient');
});
test('defect 1: demand object and calculations carry both creation ratios with the specified formulas',()=>{
  const r=engine.underwrite(strong());const d=r.tests.demand_sufficiency,c=r.calculations;
  close(d.pipeline_creation_ratio,1000000/d.required_monthly_pipeline_creation);
  close(d.opportunity_creation_ratio,12/d.required_monthly_opps);
  assert.equal(c.pipeline_creation_ratio,d.pipeline_creation_ratio);assert.equal(c.opportunity_creation_ratio,d.opportunity_creation_ratio);
  close(c.required_monthly_opps,c.required_monthly_pipeline_creation/52000);
  for(const key of ['pipeline_creation_ratio','opportunity_creation_ratio','observed_monthly_pipeline_creation','monthly_opportunity_creation_gap'])assert.equal(typeof r.audit.formulas[key].formula,'string',key);
});
test('defect 1 case A: horizon coverage > 1 with monthly pipeline creation below requirement cannot be supported',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:300000}}));
  assert.ok(r.calculations.demand_coverage>1,'horizon coverage must stay sufficient');
  assert.equal(r.tests.demand_sufficiency.state,'sufficient');
  assert.ok(r.calculations.pipeline_creation_ratio<1);
  assert.notEqual(r.decision.state,'supported');assert.equal(r.decision.state,'conditional');
  assert.ok(decisionCodes(r).includes('pipeline_creation'));
  const condition=r.conditions.find(c=>c.code==='pipeline_creation');
  close(condition.gap,r.calculations.required_monthly_pipeline_creation-300000);
});
test('defect 1 case B: horizon coverage > 1 with monthly opportunity creation below requirement cannot be supported',()=>{
  const r=engine.underwrite(strong({demand:{monthly_qualified_opps_created:5}}));
  assert.ok(r.calculations.demand_coverage>1);assert.ok(r.calculations.pipeline_creation_ratio>=1);
  assert.ok(r.calculations.opportunity_creation_ratio<1);
  assert.notEqual(r.decision.state,'supported');
  assert.ok(decisionCodes(r).includes('opportunity_creation'));
  close(r.conditions.find(c=>c.code==='opportunity_creation').gap,r.calculations.required_monthly_opps-5);
});
test('defect 1 case C: zero observed opportunity creation is a known zero ratio, never unknown',()=>{
  const r=engine.underwrite(strong({demand:{monthly_qualified_opps_created:0}}));
  assert.ok(r.calculations.required_monthly_opps>0);
  assert.equal(r.calculations.opportunity_creation_ratio,0);assert.equal(r.tests.demand_sufficiency.opportunity_creation_ratio,0);
  assert.equal(r.tests.demand_sufficiency.opportunity_creation_state,'short');
  assert.notEqual(r.decision.state,'supported');assert.ok(decisionCodes(r).includes('opportunity_creation'));
});
test('defect 1: zero observed pipeline creation is a known zero ratio and blocks support',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:0}}));
  assert.equal(r.calculations.pipeline_creation_ratio,0);assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'short');
  assert.ok(r.calculations.demand_coverage>1);assert.notEqual(r.decision.state,'supported');
  assert.ok(decisionCodes(r).includes('pipeline_creation'));
});
test('defect 1 boundary: creation exactly at requirement is sufficient; one dollar below is short',()=>{
  const required=engine.underwrite(strong(DEEP_POOL)).calculations.required_monthly_pipeline_creation;
  const at=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:required}}));
  assert.equal(at.calculations.pipeline_creation_ratio,1);assert.equal(at.tests.demand_sufficiency.pipeline_creation_state,'sufficient');
  assert.ok(!(at.decision.constraints||[]).some(c=>c.code==='pipeline_creation'&&c.reason==='Monthly pipeline creation is below the calculated requirement.'),'a ratio of exactly 1.00x is not a creation shortfall');
  const below=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:required-1}}));
  assert.ok(below.calculations.pipeline_creation_ratio<1);assert.equal(below.tests.demand_sufficiency.pipeline_creation_state,'short');
  assert.ok(codes(below).includes('pipeline_creation'));assert.notEqual(below.decision.state,'supported');
});
test('defect 1 boundary: the creation test uses the policy sufficiency threshold at exactly 1.00x',()=>{
  assert.equal(engine.testCreationSufficiency({observed:7,required:7,policy}).state,'sufficient');
  assert.equal(engine.testCreationSufficiency({observed:7-1e-9,required:7,policy}).state,'short');
  assert.equal(engine.testCreationSufficiency({observed:0,required:7,policy}).ratio,0);
  assert.equal(engine.testCreationSufficiency({observed:5,required:0,policy}).state,'not_required');
  assert.equal(engine.testCreationSufficiency({observed:null,required:7,policy}).state,'unknown');
  assert.equal(engine.testCreationSufficiency({observed:5,required:null,unbounded:true,policy}).state,'unbounded');
});
test('defect 1: creation above requirement adds no creation constraint',()=>{
  const r=engine.underwrite(strong({demand:{monthly_qualified_opps_created:40}}));
  assert.ok(r.calculations.opportunity_creation_ratio>1);assert.ok(!codes(r).some(c=>/creation/.test(c)));
  assert.equal(r.decision.state,'supported');
});
test('defect 1: high future creation cannot rescue materially short horizon pipeline',()=>{
  const r=engine.underwrite(strong({demand:{allocatable_qualified_pipeline:1500000,monthly_qualified_pipeline_created_value:5000000,monthly_qualified_opps_created:100}}));
  assert.equal(r.tests.demand_sufficiency.state,'short');assert.ok(r.calculations.pipeline_creation_ratio>1);
  assert.equal(r.decision.state,'not_yet_supported');assert.equal(r.decision.primary_constraint,'pipeline_supply');
});
test('defect 1: unknown opportunity creation is unknown (not zero), names the evidence and cannot be supported',()=>{
  const r=engine.underwrite(strong({demand:{monthly_qualified_opps_created:null}}));
  assert.equal(r.calculations.opportunity_creation_ratio,null);assert.equal(r.tests.demand_sufficiency.opportunity_creation_state,'unknown');
  assert.notEqual(r.decision.state,'supported');assert.ok(codes(r).includes('opportunity_creation'));
  assert.ok(r.evidence_gaps.some(g=>g.field==='demand.monthly_qualified_opps_created'));
  assert.ok(r.conditions.find(c=>c.code==='opportunity_creation').evidence_required.includes('demand.monthly_qualified_opps_created'));
});
test('defect 1: a supplied monthly series takes precedence over the single monthly value for observed creation',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:1000000,pipeline_creation_is_seasonal:true,monthly_pipeline_series:Array(12).fill(200000)}}));
  close(r.calculations.observed_monthly_pipeline_creation,200000);
  assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'short');assert.notEqual(r.decision.state,'supported');
});
test('defect 1: no eligible creation month makes the remaining requirement unbounded, not zero or infinite',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{economics:{average_sales_cycle_days:400}}));
  assert.equal(r.calculations.eligible_creation_months,0);
  assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'unbounded');
  assert.equal(r.calculations.pipeline_creation_ratio,null);assert.equal(r.calculations.required_monthly_pipeline_creation,null);
  assert.ok(codes(r).includes('pipeline_creation'));assert.notEqual(r.decision.state,'supported');
  for(const v of Object.values(r.calculations))if(typeof v==='number')assert.ok(Number.isFinite(v));
});
test('defect 1: current allocation covering the requirement needs no creation and adds no creation constraint',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:3300000,current_pipeline_reserved_for_existing_team:6000000}}));
  assert.equal(r.calculations.required_monthly_pipeline_creation,0);assert.equal(r.calculations.required_monthly_opps,0);
  assert.equal(r.calculations.pipeline_creation_ratio,null);assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'not_required');
  assert.ok(!codes(r).some(c=>/creation/.test(c)));assert.equal(r.decision.state,'supported');
});
for(const [name,base,erase] of [
  ['pipeline creation value from a creation-short case',strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:300000}}),i=>{i.demand.monthly_qualified_pipeline_created_value=null;}],
  ['opportunity creation from an opportunity-short case',strong({demand:{monthly_qualified_opps_created:5}}),i=>{delete i.demand.monthly_qualified_opps_created;}],
  ['opportunity creation from the supported case',strong(),i=>{i.demand.monthly_qualified_opps_created=null;}],
  ['current allocation from a creation-short case',strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:300000}}),i=>{i.demand.allocatable_current_qualified_pipeline=null;}],
  ['seasonal series from a series-short case',strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:null,pipeline_creation_is_seasonal:true,monthly_pipeline_series:Array(12).fill(200000)}}),i=>{i.demand.monthly_pipeline_series=null;}],
  ['pipeline creation value when the surplus cap made demand short',strong({demand:{monthly_qualified_pipeline_created_value:100000}}),i=>{i.demand.monthly_qualified_pipeline_created_value=null;}],
  ['sales cycle when the surplus cap made demand short',strong({demand:{monthly_qualified_pipeline_created_value:100000}}),i=>{i.economics.average_sales_cycle_days=null;}],
  ['current pipeline pool when the surplus cap made demand short',strong({demand:{monthly_qualified_pipeline_created_value:100000}}),i=>{i.demand.current_qualified_pipeline_value=null;i.demand.current_qualified_pipeline_in_horizon=null;}]
]) test('defect 1 missingness: removing '+name+' cannot strengthen the recommendation',()=>{
  const before=engine.underwrite(base),missing=structuredClone(base);erase(missing);const after=engine.underwrite(missing);
  assert.ok(rank[after.decision.state]<=rank[before.decision.state],before.decision.state+' became '+after.decision.state);
  assert.ok(confidenceRank[after.decision.confidence]<=confidenceRank[before.decision.confidence],'confidence increased');
  assert.notEqual(after.decision.state,'supported');
});
test('defect 1 missingness control: the surplus-cap case is not-yet before evidence removal',()=>{
  assert.equal(engine.underwrite(strong({demand:{monthly_qualified_pipeline_created_value:100000}})).decision.state,'not_yet_supported');
});
test('defect 1 precision: unknown creation does not fail the gate when the known current pool already proves the surplus cap non-binding',()=>{
  const input=strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:null}});
  const r=engine.underwrite(input);
  assert.equal(r.decision.state,'conditional');assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'unknown');
  assert.ok(r.evidence_gaps.some(g=>g.field==='demand.monthly_qualified_pipeline_created_value'));
});

const LATER_AE_LATE_STAGE=[['rarely','demonstrated','supported'],['sometimes','emerging','conditional'],['often','emerging','conditional'],['almost_always','founder_dependent','not_yet_supported']];
for(const [value,repeatability,decision] of LATER_AE_LATE_STAGE) test('defect 2 boundary: founder required late-stage '+value,()=>{
  const r=engine.underwrite(strong({repeatability:{founder_required_late_stage:value}}));
  assert.equal(r.tests.repeatability.state,repeatability);assert.equal(r.decision.state,decision);
  if(value!=='rarely'){assert.notEqual(r.decision.state,'supported');assert.notEqual(r.tests.repeatability.state,'demonstrated');}
  if(repeatability==='emerging')assert.ok(decisionCodes(r).includes('transferability'));
  if(value==='almost_always')assert.equal(r.decision.primary_constraint,'founder_dependency');
});
for(const value of [null,'unknown','never','Often']) test('defect 2 boundary: unknown or unrecognized late-stage evidence cannot be demonstrated or supported: '+value,()=>{
  const r=engine.underwrite(strong({repeatability:{founder_required_late_stage:value}}));
  assert.notEqual(r.tests.repeatability.state,'demonstrated');assert.equal(r.tests.repeatability.founder_late_stage_class,'unknown');
  assert.equal(r.decision.state,'insufficient_evidence');
  assert.ok(r.evidence_gaps.some(g=>g.field==='repeatability.founder_required_late_stage'));
});
test('defect 2: abundant non-founder wins and full documentation cannot offset an often-required founder',()=>{
  const input=strong({conversion:{non_founder_wins_trailing_12m:40,non_founder_qualified_opps_trailing_12m:100,non_founder_qualified_opp_to_win_pct:0.4},repeatability:{wins_trailing_12m:42,non_founder_wins_trailing_12m:40,founder_required_late_stage:'often'}});
  assert.equal(engine.normalizeInput(input).repeatability.qualification_documented,'yes');
  const r=engine.underwrite(input);
  assert.equal(r.tests.repeatability.state,'emerging');assert.equal(r.decision.state,'conditional');
});
test('defect 2: the late-stage mapping is policy-owned and versioned',()=>{
  assert.equal(policy.version,'ae-policy-1.1.0');
  assert.deepEqual([...policy.repeatability.founderLateStage.demonstrated],['rarely']);
  assert.deepEqual([...policy.repeatability.founderLateStage.emerging],['sometimes','often']);
  assert.deepEqual([...policy.repeatability.founderLateStage.dependent],['almost_always']);
  assert.ok(Object.isFrozen(policy.repeatability.founderLateStage.demonstrated));
  const r=engine.underwrite(strong());
  assert.equal(r.policy_version,'ae-policy-1.1.0');assert.equal(r.audit.policy_snapshot.repeatability.founderLateStage.emerging.length,2);
  const custom=structuredClone(policy);custom.version='test-policy-late-stage';custom.repeatability.founderLateStage={demonstrated:['rarely','sometimes'],emerging:['often'],dependent:['almost_always']};
  assert.equal(engine.underwrite(strong({repeatability:{founder_required_late_stage:'sometimes'}}),custom).tests.repeatability.state,'demonstrated','classification must come from the supplied policy');
  const missing=structuredClone(policy);missing.version='test-policy-no-mapping';delete missing.repeatability.founderLateStage;
  assert.throws(()=>engine.underwrite(strong(),missing),/founderLateStage/);
});
test('defect 2: the first-AE branch is unchanged by the later-AE late-stage mapping',()=>{
  const firstAE={decision:{evaluating_first_professional_ae:true},current_team:{current_quota_carriers:0,sellers:[],founder_committed_new_arr:650000,founder_expected_to_remain_seller:true},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:42,closed_won_trailing_12m:11,qualified_opp_to_win_pct:11/42},repeatability:{wins_trailing_12m:11,non_founder_wins_trailing_12m:0,founder_primary_seller_share_pct:1,sales_stages_documented:'partial',repeatable_use_cases_count:2,founder_can_articulate_path:true}};
  for(const value of ['almost_always','often','sometimes',null]) {
    const r=engine.underwrite(makeCase(deepMerge(firstAE,{repeatability:{founder_required_late_stage:value}})));
    assert.equal(r.tests.repeatability.first_ae,true);assert.equal(r.tests.repeatability.state,'transferable_evidence_strong',String(value));
    assert.notEqual(r.decision.state,'insufficient_evidence','first-AE late-stage involvement is not a later-AE evidence gate');
  }
});

const temporal=(demand,horizon=3000000)=>engine.normalizeInput(makeCase({demand:Object.assign({current_qualified_pipeline_in_horizon:1000000,current_qualified_pipeline_value:1000000,allocatable_qualified_pipeline:horizon,monthly_qualified_pipeline_created_value:1000000},demand)}));
const allocate=input=>engine.calculateAllocatablePipeline({input,demandPool:engine.calculateDemandPool(input,policy),existingDemand:0});
test('defect 3 case A: current allocation above the current pool is never treated as current supply',()=>{
  const input=temporal({allocatable_current_qualified_pipeline:1500000});
  const result=allocate(input);
  close(result.value,3000000);assert.equal(result.current_allocatable,null);
  assert.ok(result.warnings.includes('current_allocation_exceeds_current_pool'));
  assert.ok(input.validation.clarifications.some(c=>c.code==='current_allocation_exceeds_current_pool'));
  const r=engine.underwrite(makeCase({demand:{current_qualified_pipeline_in_horizon:1000000,current_qualified_pipeline_value:1000000,allocatable_qualified_pipeline:3000000,allocatable_current_qualified_pipeline:1500000,monthly_qualified_pipeline_created_value:1000000}}));
  assert.notEqual(r.calculations.allocatable_current_pipeline,1500000);assert.equal(r.decision.state,'insufficient_evidence');
});
test('defect 3 case B: current allocation never double-counts the existing team reservation',()=>{
  const fits=allocate(temporal({allocatable_current_qualified_pipeline:300000,current_pipeline_reserved_for_existing_team:600000}));
  close(fits.current_allocatable,300000);assert.ok(fits.current_allocatable<=1000000-600000);
  const exact=allocate(temporal({allocatable_current_qualified_pipeline:400000,current_pipeline_reserved_for_existing_team:600000}));
  close(exact.current_allocatable,400000);
  for(const demand of [{allocatable_current_qualified_pipeline:500000,current_pipeline_reserved_for_existing_team:600000},{new_ae_pipeline_share_pct:0.5,current_pipeline_reserved_for_existing_team:600000},{allocatable_current_qualified_pipeline:0,current_pipeline_reserved_for_existing_team:1200000}]) {
    const input=temporal(demand),result=allocate(input);
    assert.equal(result.current_allocatable,null,JSON.stringify(demand));
    assert.ok(input.validation.clarifications.some(c=>c.code==='current_allocation_exceeds_current_pool'),JSON.stringify(demand));
  }
  const share=allocate(temporal({allocatable_current_qualified_pipeline:null,new_ae_pipeline_share_pct:0.3,current_pipeline_reserved_for_existing_team:600000}));
  close(share.current_allocatable,300000);
});
test('defect 3 case C: lowering current allocation raises required monthly creation while horizon coverage is unchanged',()=>{
  const higher=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:1000000,current_pipeline_reserved_for_existing_team:6000000}}));
  const lower=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:0,current_pipeline_reserved_for_existing_team:6000000}}));
  assert.equal(higher.calculations.allocatable_pipeline,lower.calculations.allocatable_pipeline);
  assert.equal(higher.calculations.demand_coverage,lower.calculations.demand_coverage);
  assert.ok(lower.calculations.required_monthly_pipeline_creation>higher.calculations.required_monthly_pipeline_creation);
  close(lower.calculations.required_monthly_pipeline_creation-higher.calculations.required_monthly_pipeline_creation,1000000/lower.calculations.eligible_creation_months);
});
test('defect 3: current allocation equal to the current pool is admissible',()=>{
  close(allocate(temporal({allocatable_current_qualified_pipeline:1000000})).current_allocatable,1000000);
});
test('defect 3: future creation cannot become current supply when the current pool is zero',()=>{
  const input=temporal({current_qualified_pipeline_in_horizon:0,current_qualified_pipeline_value:0,allocatable_current_qualified_pipeline:250000,monthly_qualified_pipeline_created_value:5000000});
  const result=allocate(input);
  assert.ok(result.value>0);assert.equal(result.current_allocatable,null);
  assert.ok(input.validation.clarifications.some(c=>c.code==='current_allocation_exceeds_current_pool'));
  close(allocate(temporal({current_qualified_pipeline_in_horizon:0,current_qualified_pipeline_value:0,allocatable_current_qualified_pipeline:0})).current_allocatable,0);
});
test('defect 3: unknown current ownership stays unknown and cannot support the hire',()=>{
  const none=allocate(temporal({allocatable_current_qualified_pipeline:null,new_ae_pipeline_share_pct:null}));
  assert.equal(none.current_allocatable,null);assert.ok(none.warnings.includes('unknown_current_pipeline_allocation'));
  const noPool=engine.normalizeInput(makeCase({demand:{current_qualified_pipeline_in_horizon:null,current_qualified_pipeline_value:null,allocatable_current_qualified_pipeline:250000}}));
  const unknownPool=engine.calculateAllocatablePipeline({input:noPool,demandPool:engine.calculateDemandPool(noPool,policy),existingDemand:0});
  assert.equal(unknownPool.current_allocatable,null);assert.ok(unknownPool.warnings.includes('unknown_current_pipeline_pool'));
  const zeroClaim=engine.normalizeInput(makeCase({demand:{current_qualified_pipeline_in_horizon:null,current_qualified_pipeline_value:null,allocatable_current_qualified_pipeline:0}}));
  assert.equal(engine.calculateAllocatablePipeline({input:zeroClaim,demandPool:engine.calculateDemandPool(zeroClaim,policy),existingDemand:0}).current_allocatable,0);
  const r=engine.underwrite(strong({demand:{allocatable_current_qualified_pipeline:null}}));
  assert.equal(r.calculations.allocatable_current_pipeline,null);assert.equal(r.calculations.required_monthly_pipeline_creation,null);
  assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'unknown');assert.notEqual(r.decision.state,'supported');
  assert.ok(r.evidence_gaps.some(g=>g.field==='demand.allocatable_current_qualified_pipeline'));
});
test('defect 3: an explicit current share uses the current pool, never the horizon pool',()=>{
  const result=allocate(temporal({allocatable_current_qualified_pipeline:null,new_ae_pipeline_share_pct:0.25},3000000));
  close(result.current_allocatable,250000);
});

const productivity=(overrides={})=>makeCase(deepMerge({proposed_ae:{ramp_definition:'pipeline_productivity'}},overrides));
const timingOf=result=>result.tests.timing_management.timing;
function positiveBy(input,start,limit,mode) {
  const probe=engine.normalizeInput(structuredClone(input));
  probe.proposed_ae.proposed_start_date=start;probe.target.target_period_end=limit;
  return engine.calculateHireContribution(probe,12/57,policy,mode).value>0;
}
const dayAfter=date=>new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
test('defect 4: latest viable start can precede the horizon for pipeline-productivity ramp',()=>{
  const input=productivity({timing:{revenue_needed_by_date:'2027-02-01'}});
  const t=timingOf(engine.underwrite(input));
  assert.equal(t.state,'incompatible');assert.notEqual(t.latest_viable_start,null);
  assert.ok(t.latest_viable_start<'2027-01-01');assert.equal(t.latest_viable_start,'2026-10-30');
  assert.ok(positiveBy(input,t.latest_viable_start,'2027-02-01','pipeline_productivity'));
  assert.ok(!positiveBy(input,dayAfter(t.latest_viable_start),'2027-02-01','pipeline_productivity'),'must be the latest positive start');
  assert.ok(t.latest_start_search_floor<t.latest_viable_start);
  assert.equal(t.latest_start_criterion,'positive modeled contribution by the required date; does not promise to close the full revenue gap');
});
test('defect 4: a viable start inside the horizon is still found',()=>{
  const input=productivity({proposed_ae:{proposed_start_date:'2027-06-01'},timing:{revenue_needed_by_date:'2027-08-01'}});
  const t=timingOf(engine.underwrite(input));
  assert.equal(t.latest_viable_start,'2027-04-29');
  assert.ok(!positiveBy(input,dayAfter(t.latest_viable_start),'2027-08-01','pipeline_productivity'));
});
test('defect 4: a latest viable start exactly on the horizon start is found',()=>{
  const t=timingOf(engine.underwrite(productivity({timing:{revenue_needed_by_date:'2027-04-05'}})));
  assert.equal(t.state,'incompatible');assert.equal(t.latest_viable_start,'2027-01-01');
});
test('defect 4: no viable start inside the bounded search domain stays null',()=>{
  const input=productivity({conversion:{non_founder_wins_trailing_12m:0,non_founder_qualified_opps_trailing_12m:20,non_founder_qualified_opp_to_win_pct:0},repeatability:{non_founder_wins_trailing_12m:0},timing:{revenue_needed_by_date:'2027-02-01'}});
  const t=timingOf(engine.underwrite(input));
  assert.equal(t.state,'incompatible');assert.equal(t.latest_viable_start,null);assert.equal(typeof t.latest_start_search_floor,'string');
});
test('defect 4: closed-bookings latest start receives no duplicate cycle delay',()=>{
  const short=timingOf(engine.underwrite(makeCase({economics:{average_sales_cycle_days:30},timing:{revenue_needed_by_date:'2027-02-01'}})));
  const long=timingOf(engine.underwrite(makeCase({economics:{average_sales_cycle_days:400},timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.equal(short.state,'incompatible');assert.equal(short.latest_viable_start,'2027-02-01');assert.equal(long.latest_viable_start,'2027-02-01');
});
test('defect 4: pipeline-productivity latest start still carries the qualified-cycle delay',()=>{
  const base=timingOf(engine.underwrite(productivity({timing:{revenue_needed_by_date:'2027-02-01'}})));
  const longer=timingOf(engine.underwrite(productivity({economics:{average_sales_cycle_days:124},timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.equal(base.latest_viable_start,'2026-10-30');assert.equal(longer.latest_viable_start,'2026-09-30');
});
test('defect 4: the search floor is deterministic and derived from the ramp and cycle domain',()=>{
  const first=timingOf(engine.underwrite(productivity({timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.deepEqual(first,timingOf(engine.underwrite(productivity({timing:{revenue_needed_by_date:'2027-02-01'}}))));
  // Linear ramp: the first month is already positive, so floor = start - 94-day lag - 1 month (31 days) of slack.
  const expected=new Date(Date.parse('2027-01-01T00:00:00Z')-(94+31)*86400000).toISOString().slice(0,10);
  assert.equal(first.latest_start_search_floor,expected);
  const schedule=timingOf(engine.underwrite(productivity({proposed_ae:{monthly_ramp_schedule:[...Array(20).fill(0),1]},timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.ok(schedule.latest_start_search_floor<first.latest_start_search_floor,'leading zero months in a supplied schedule extend the floor');
  assert.notEqual(schedule.latest_viable_start,null);
  const long=timingOf(engine.underwrite(productivity({proposed_ae:{monthly_ramp_schedule:Array(24000).fill(1)},timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.equal(long.latest_start_search_floor,expected,'a long schedule whose first month is positive does not move the floor');
  assert.equal(long.latest_viable_start,'2026-10-30');
});
test('defect 4: the existing after-horizon start condition keeps its latest viable start',()=>{
  const r=engine.underwrite(makeCase({proposed_ae:{proposed_start_date:'2028-01-01'}}));
  assert.equal(timingOf(r).latest_viable_start,'2027-12-31');
  const condition=r.conditions.find(c=>c.code==='late_start');
  assert.ok(condition,'a late start carries a late_start condition');assert.equal(condition.deadline,'2027-12-31');
});

// ---------------------------------------------------------------------------
// Adversarial-review hardening (findings verified on the remediation branch).
test('review: unknown creation sufficiency lowers confidence so deleting creation evidence cannot raise it',()=>{
  const base=makeCase({proposed_ae:{ramp_definition:'pipeline_productivity'}});
  const before=engine.underwrite(base);
  for(const erase of [i=>{i.demand.monthly_qualified_opps_created=null;},i=>{i.economics.average_acv=null;},i=>{i.demand.allocatable_current_qualified_pipeline=null;}]) {
    const input=structuredClone(base);erase(input);const after=engine.underwrite(input);
    assert.ok(confidenceRank[after.decision.confidence]<=confidenceRank[before.decision.confidence],before.decision.confidence+' -> '+after.decision.confidence);
    assert.ok(after.confidence.reasons.includes('creation_sufficiency_unknown'));
  }
});
test('review: a positive current claim needs the existing-team reservation when current sellers need pipeline',()=>{
  const unknown=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:3300000}}));
  assert.equal(unknown.calculations.allocatable_current_pipeline,null,'an unknown reservation is never treated as zero');
  assert.equal(unknown.audit.math.allocation.current_available_to_new_ae,null);
  assert.equal(unknown.tests.demand_sufficiency.pipeline_creation_state,'unknown');assert.notEqual(unknown.decision.state,'supported');
  assert.ok(unknown.evidence_gaps.some(g=>g.field==='demand.current_pipeline_reserved_for_existing_team'));
  const known=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:3300000,current_pipeline_reserved_for_existing_team:6000000}}));
  close(known.calculations.allocatable_current_pipeline,3300000);close(known.audit.math.allocation.current_available_to_new_ae,6000000);
  const shareOnly=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:null,new_ae_pipeline_share_pct:0.4}}));
  close(shareOnly.calculations.allocatable_current_pipeline,4200000,1e-6);
});
test('review: with no existing-team pipeline demand a positive current claim needs no reservation',()=>{
  const input=engine.normalizeInput(makeCase({demand:{current_qualified_pipeline_in_horizon:1000000,current_qualified_pipeline_value:1000000,allocatable_current_qualified_pipeline:400000}}));
  const pool=engine.calculateDemandPool(input,policy);
  close(engine.calculateAllocatablePipeline({input,demandPool:pool,existingDemand:0}).current_allocatable,400000);
  const withDemand=engine.calculateAllocatablePipeline({input,demandPool:pool,existingDemand:500000});
  assert.equal(withDemand.current_allocatable,null);assert.ok(withDemand.warnings.includes('unknown_current_reservation'));
});
test('review: a share against an unknown current pool names the missing pool',()=>{
  const input=engine.normalizeInput(makeCase({demand:{current_qualified_pipeline_in_horizon:null,current_qualified_pipeline_value:null,allocatable_current_qualified_pipeline:null,new_ae_pipeline_share_pct:0.5}}));
  const result=engine.calculateAllocatablePipeline({input,demandPool:engine.calculateDemandPool(input,policy),existingDemand:0});
  assert.equal(result.current_allocatable,null);assert.ok(result.warnings.includes('unknown_current_pipeline_pool'));
  assert.ok(!result.warnings.includes('unknown_current_pipeline_allocation'));
});
test('review: in-horizon current pipeline larger than total current pipeline is a contradiction',()=>{
  const r=engine.underwrite(strong({demand:{current_qualified_pipeline_in_horizon:12000000,current_qualified_pipeline_value:1000000,allocatable_current_qualified_pipeline:3300000,current_pipeline_reserved_for_existing_team:0}}));
  assert.ok(r.validation.clarifications.some(c=>c.code==='current_horizon_pipeline_exceeds_current_pipeline'));
  assert.equal(r.decision.state,'insufficient_evidence');
});
test('review: late-stage evidence does not block when founder dependence is already established',()=>{
  const dependent={repeatability:{founder_primary_seller_share_pct:1,non_founder_wins_trailing_12m:0},conversion:{non_founder_wins_trailing_12m:0,non_founder_qualified_opps_trailing_12m:20,non_founder_qualified_opp_to_win_pct:0}};
  for(const value of ['often','almost_always',null]) {
    const r=engine.underwrite(strong(dependent,{repeatability:{founder_required_late_stage:value}}));
    assert.equal(r.tests.repeatability.state,'founder_dependent');assert.equal(r.decision.state,'not_yet_supported',String(value));
    if(value===null)assert.ok(r.evidence_gaps.some(g=>g.field==='repeatability.founder_required_late_stage'));
  }
});
test('review: a repeatability-only evidence gap is labeled transferability; an unrecognized value is named as such',()=>{
  const missing=engine.underwrite(strong({repeatability:{founder_required_late_stage:null}}));
  assert.equal(missing.decision.state,'insufficient_evidence');assert.equal(missing.decision.primary_constraint,'transferability');
  for(const value of ['never','Often',' rarely',7]) {
    const r=engine.underwrite(strong({repeatability:{founder_required_late_stage:value}}));
    assert.equal(r.decision.state,'insufficient_evidence',String(value));assert.equal(r.decision.primary_constraint,'transferability');
    assert.match(r.evidence_gaps.find(g=>g.field==='repeatability.founder_required_late_stage').required,/unrecognized value/);
  }
});
test('review: the transferability label never masks another gate failure',()=>{
  const capacity=engine.underwrite(strong({repeatability:{founder_required_late_stage:null},current_team:{sellers:null,current_quota_carriers:null,aggregate_annual_quota:null}}));
  assert.equal(capacity.decision.state,'insufficient_evidence');assert.equal(capacity.decision.primary_constraint,'unknown_current_capacity');
  const conversion=engine.underwrite(strong({repeatability:{founder_required_late_stage:null},conversion:{non_founder_wins_trailing_12m:null,non_founder_qualified_opps_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null}}));
  assert.notEqual(conversion.decision.primary_constraint,'transferability');
  const target=engine.underwrite(strong({repeatability:{founder_required_late_stage:null},target:{new_arr_target_horizon:null}}));
  assert.notEqual(target.decision.primary_constraint,'transferability');
});
test('review: an unrecognized late-stage answer does not block the first-AE branch, which never reads it',()=>{
  const firstAE={decision:{evaluating_first_professional_ae:true},current_team:{current_quota_carriers:0,sellers:[],founder_committed_new_arr:650000,founder_expected_to_remain_seller:true},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:42,closed_won_trailing_12m:11,qualified_opp_to_win_pct:11/42},repeatability:{wins_trailing_12m:11,non_founder_wins_trailing_12m:0,founder_primary_seller_share_pct:1,sales_stages_documented:'partial',repeatable_use_cases_count:2,founder_can_articulate_path:true}};
  const known=engine.underwrite(makeCase(deepMerge(firstAE,{repeatability:{founder_required_late_stage:'almost_always'}})));
  const odd=engine.underwrite(makeCase(deepMerge(firstAE,{repeatability:{founder_required_late_stage:'Almost always'}})));
  assert.equal(odd.decision.state,known.decision.state);assert.equal(odd.decision.confidence,known.decision.confidence);
});
test('review: a non-determinative late-stage gap is informational',()=>{
  const r=engine.underwrite(strong({repeatability:{founder_required_late_stage:null,founder_primary_seller_share_pct:1,non_founder_wins_trailing_12m:0},conversion:{non_founder_wins_trailing_12m:0,non_founder_qualified_opps_trailing_12m:20,non_founder_qualified_opp_to_win_pct:0}}));
  assert.equal(r.evidence_gaps.find(g=>g.field==='repeatability.founder_required_late_stage').severity,'informational');
});
test('review: an explicit current claim inside an admitted share needs no separate reservation',()=>{
  const both=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:1000000,new_ae_pipeline_share_pct:0.4}}));
  close(both.calculations.allocatable_current_pipeline,1000000);
  const shareOnly=structuredClone(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:1000000,new_ae_pipeline_share_pct:0.4}}));delete shareOnly.demand.allocatable_current_qualified_pipeline;
  const after=engine.underwrite(shareOnly);
  assert.ok(confidenceRank[after.decision.confidence]<=confidenceRank[both.decision.confidence]||after.calculations.allocatable_current_pipeline>=both.calculations.allocatable_current_pipeline);
  const outside=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:5000000,new_ae_pipeline_share_pct:0.4}}));
  assert.equal(outside.calculations.allocatable_current_pipeline,null,'a dollar claim beyond the share still needs the reservation');
});
test('review: unknown pool and unknown reservation are requested together',()=>{
  const r=engine.underwrite(strong({demand:{current_qualified_pipeline_in_horizon:null,current_qualified_pipeline_value:null,allocatable_current_qualified_pipeline:500000}}));
  const fields=r.evidence_gaps.map(g=>g.field);
  assert.ok(fields.includes('demand.current_qualified_pipeline_value'));assert.ok(fields.includes('demand.current_pipeline_reserved_for_existing_team'));
});
test('review: any sensitivity flip whose scenario fails on monthly creation is coded as creation',()=>{
  const required=engine.underwrite(strong(DEEP_POOL)).calculations.required_monthly_pipeline_creation;
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:required*1.05}}));
  const rows=[...r.sensitivity,...r.sensitivity_review].filter(row=>row.decision_changed&&['pipeline_creation','opportunity_creation'].includes(row.primary_constraint));
  assert.ok(rows.length>0);
  for(const row of rows)assert.ok((r.decision.constraints||[]).some(c=>['pipeline_creation','opportunity_creation'].includes(c.code)&&c.reason.indexOf('The '+row.variable+' model scenario')===0),row.variable);
  assert.notEqual(r.decision.primary_constraint,'pipeline_supply','horizon coverage is sufficient, so a creation-driven flip is not a pipeline supply constraint');
});
test('review: creation conditions are never due before the decision date',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:300000},timing:{decision_date:'2027-02-15'}}));
  assert.equal(r.conditions.find(c=>c.code==='pipeline_creation').deadline,'2027-02-15');
});
test('review: a schedule with no positive month skips the latest-start search',()=>{
  const r=engine.underwrite(makeCase({proposed_ae:{monthly_ramp_schedule:Array(600).fill(0)},timing:{revenue_needed_by_date:'2027-02-01'}}));
  assert.equal(r.tests.timing_management.timing.latest_viable_start,null);
});
test('review: a decision flip from the pipeline creation scenario is attributed to pipeline creation',()=>{
  const required=engine.underwrite(strong(DEEP_POOL)).calculations.required_monthly_pipeline_creation;
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:required*1.05}}));
  assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'sufficient');
  const flips=(r.decision.constraints||[]).filter(c=>/pipeline_creation model scenario/.test(c.reason));
  assert.ok(flips.length>0,'the -20% creation scenario flips this case');
  assert.ok(flips.every(c=>c.code==='pipeline_creation'));
});
test('review: creation conditions are due at the start of the eligible creation window',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{monthly_qualified_pipeline_created_value:300000,monthly_qualified_opps_created:5}}));
  for(const code of ['pipeline_creation','opportunity_creation'])assert.equal(r.conditions.find(c=>c.code===code).deadline,'2027-01-01',code);
  assert.equal(r.tests.demand_sufficiency.creation_window_start,'2027-01-01');
});
test('review: zero conversion explains an unbounded creation requirement by the conversion, not the window',()=>{
  const r=engine.underwrite(strong({conversion:{non_founder_wins_trailing_12m:0,non_founder_qualified_opps_trailing_12m:20,non_founder_qualified_opp_to_win_pct:0},repeatability:{non_founder_wins_trailing_12m:0}}));
  const d=r.tests.demand_sufficiency;
  assert.equal(d.pipeline_creation_state,'unbounded');assert.equal(d.creation_unbounded_reason,'zero_conversion');
  assert.ok(r.calculations.eligible_creation_months>0);
  assert.ok((r.decision.constraints||[]).filter(c=>c.code==='pipeline_creation').every(c=>/zero conversion/.test(c.reason)));
  assert.match(r.conditions.find(c=>c.code==='pipeline_creation').retest_trigger,/conversion is above zero/);
  const window=engine.underwrite(strong(DEEP_POOL,{economics:{average_sales_cycle_days:400}}));
  assert.equal(window.tests.demand_sufficiency.creation_unbounded_reason,'no_eligible_creation_month');
});
test('review: creation evidence gaps name the real cause',()=>{
  const definition=engine.underwrite(strong(DEEP_POOL,{economics:{sales_cycle_definition:'first_meeting_to_close'}}));
  assert.ok(definition.evidence_gaps.some(g=>g.field==='economics.sales_cycle_definition'));
  assert.ok(!definition.tests.demand_sufficiency.pipeline_creation_missing.includes('economics.average_sales_cycle_days'));
  const zeroACV=engine.underwrite(strong({economics:{average_acv:0}}));
  assert.equal(zeroACV.tests.demand_sufficiency.opportunity_creation_state,'unknown');
  assert.ok(zeroACV.tests.demand_sufficiency.opportunity_creation_missing.includes('economics.average_acv'));
});
test('review: floating-point noise in the requirement is not a remaining creation gap',()=>{
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:675000/(12/57),current_pipeline_reserved_for_existing_team:6000000}}));
  assert.equal(r.calculations.required_monthly_pipeline_creation,0);assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'not_required');
  assert.ok(!(r.decision.constraints||[]).some(c=>c.code==='pipeline_creation'&&c.normalized_shortfall===1));
});
function bruteLatest(input,limit,mode) {
  const normalized=engine.normalizeInput(structuredClone(input));
  for(let day=Date.parse(limit+'T00:00:00Z');day>=Date.parse('2024-01-01T00:00:00Z');day-=86400000) {
    const probe=structuredClone(normalized);probe.proposed_ae.proposed_start_date=new Date(day).toISOString().slice(0,10);probe.target.target_period_end=limit;
    if(engine.calculateHireContribution(probe,12/57,policy,mode).value>0)return probe.proposed_ae.proposed_start_date;
  }
  return null;
}
for(const [name,overrides,limit,mode] of [
  ['schedule not ending at 1',{proposed_ae:{monthly_ramp_schedule:[0.25,0.5,0.75],proposed_start_date:'2028-01-01'},timing:{revenue_needed_by_date:'2027-02-15'}},'2027-02-15','closed_bookings'],
  ['zero-led nondecreasing schedule',{proposed_ae:{monthly_ramp_schedule:[0,0,0,0.25,1],proposed_start_date:'2028-01-01'},timing:{revenue_needed_by_date:'2027-03-16'}},'2027-03-16','closed_bookings'],
  ['schedule with flat steps',{proposed_ae:{monthly_ramp_schedule:[0,0.5,0.5,0.5,1],proposed_start_date:'2027-03-01'},timing:{revenue_needed_by_date:'2027-02-01'}},'2027-02-01','closed_bookings'],
  ['zero-led pipeline-productivity schedule',{proposed_ae:{ramp_definition:'pipeline_productivity',monthly_ramp_schedule:[0,0.2,0.2,1]},timing:{revenue_needed_by_date:'2027-02-01'}},'2027-02-01','pipeline_productivity']
]) test('review: latest viable start matches brute force for a '+name,()=>{
  const input=makeCase(overrides);
  const t=timingOf(engine.underwrite(input));
  assert.notEqual(t.state,'compatible');
  assert.equal(t.latest_viable_start,bruteLatest(input,limit,mode));
  assert.notEqual(t.latest_viable_start,null);
});

// ---------------------------------------------------------------------------
// Second hardening pass (PR #316 second adversarial audit, engine 1.2.0).
const EARLY_CLOSE={timing:{first_revenue_expected_by_company:'2027-04-15'},demand:{current_pipeline_reserved_for_existing_team:1500000}};
const CURRENT_VARIANTS={
  'canonical null':{demand:{allocatable_current_qualified_pipeline:null}},
  'alias null':{demand:{allocatable_current_qualified_pipeline:null,allocatable_current_pipeline:null}},
  'canonical 0':{demand:{allocatable_current_qualified_pipeline:0}},
  'alias 0':{demand:{allocatable_current_qualified_pipeline:null,allocatable_current_pipeline:0}},
  'positive canonical':{demand:{allocatable_current_qualified_pipeline:1500000}},
  'positive alias':{demand:{allocatable_current_qualified_pipeline:null,allocatable_current_pipeline:1500000}}
};
const summary=r=>({state:r.decision.state,primary:r.decision.primary_constraint,secondary:r.decision.secondary_constraints,confidence:r.decision.confidence,timing:r.tests.timing_management.timing.state,reason:r.tests.timing_management.timing.reason,current:r.calculations.allocatable_current_pipeline});
test('A1: alias and canonical current allocation produce identical timing and decisions',()=>{
  const out=Object.fromEntries(Object.entries(CURRENT_VARIANTS).map(([k,v])=>[k,summary(engine.underwrite(strong(EARLY_CLOSE,v)))]));
  assert.deepEqual(out['alias null'],out['canonical null']);
  assert.deepEqual(out['alias 0'],out['canonical 0']);
  assert.deepEqual(out['positive alias'],out['positive canonical']);
});
test('A1: a supplied zero current allocation inherits nothing and keeps the first-close plausibility check',()=>{
  for(const name of ['canonical 0','alias 0','canonical null','alias null']) {
    const t=engine.underwrite(strong(EARLY_CLOSE,CURRENT_VARIANTS[name])).tests.timing_management.timing;
    assert.equal(t.state,'tight',name);assert.equal(t.reason,'first_close_plausibility',name);
  }
  const zero=engine.underwrite(strong(EARLY_CLOSE,CURRENT_VARIANTS['alias 0']));
  assert.notEqual(zero.decision.state,'supported');assert.equal(zero.calculations.allocatable_current_pipeline,0);
});
test('A1: only an established positive current allocation lifts the first-close plausibility check',()=>{
  for(const name of ['positive canonical','positive alias']) {
    const r=engine.underwrite(strong(EARLY_CLOSE,CURRENT_VARIANTS[name]));
    assert.equal(r.calculations.allocatable_current_pipeline,1500000,name);assert.equal(r.tests.timing_management.timing.reason,null,name);
  }
  // A positive claim that is not established (no pipeline open at start) inherits nothing.
  const unproven=engine.underwrite(strong(EARLY_CLOSE,CURRENT_VARIANTS['positive alias'],{demand:{pipeline_likely_open_at_ae_start:null}}));
  assert.equal(unproven.calculations.allocatable_current_pipeline,null);
  assert.equal(unproven.tests.timing_management.timing.reason,'first_close_plausibility');
});
test('A1: timing reads the calculated allocation, never the raw alias field',()=>{
  const input=engine.normalizeInput(strong(EARLY_CLOSE,CURRENT_VARIANTS['alias 0']));
  const hire=engine.calculateHireContribution(input,12/57,policy);
  assert.equal(engine.testTiming(input,hire,policy,0).reason,'first_close_plausibility');
  assert.equal(engine.testTiming(input,hire,policy,null).reason,'first_close_plausibility');
  assert.equal(engine.testTiming(input,hire,policy,1500000).reason,null);
});
const SURVIVAL=likely=>strong({demand:{current_qualified_pipeline_in_horizon:3000000,current_qualified_pipeline_value:3000000,pipeline_likely_open_at_ae_start:likely,allocatable_current_qualified_pipeline:2000000,current_pipeline_reserved_for_existing_team:1000000,allocatable_qualified_pipeline:4000000}});
test('A3: current supply is bounded by pipeline still open at the AE start ($3M / $1M / $2M / $4M)',()=>{
  const r=engine.underwrite(SURVIVAL(1000000));
  assert.equal(r.calculations.allocatable_current_pipeline,1000000);
  assert.notEqual(r.calculations.allocatable_current_pipeline,2000000);
  assert.equal(r.calculations.allocatable_pipeline,4000000);
  assert.ok(r.warnings.includes('current_allocation_limited_by_pipeline_open_at_ae_start'));
  assert.equal(r.audit.math.allocation.pipeline_open_at_ae_start,1000000);
  assert.equal(r.audit.math.allocation.current_claim_before_start_survival,2000000);
});
test('A3: less pipeline surviving to start raises monthly creation while horizon coverage is unchanged',()=>{
  const ample=engine.underwrite(SURVIVAL(3000000)),thin=engine.underwrite(SURVIVAL(1000000));
  assert.equal(ample.calculations.allocatable_current_pipeline,2000000);
  assert.equal(thin.calculations.demand_coverage,ample.calculations.demand_coverage);
  assert.equal(thin.calculations.allocatable_pipeline,ample.calculations.allocatable_pipeline);
  assert.ok(thin.calculations.required_monthly_pipeline_creation>ample.calculations.required_monthly_pipeline_creation);
  close(thin.calculations.required_monthly_pipeline_creation-ample.calculations.required_monthly_pipeline_creation,1000000/thin.calculations.eligible_creation_months);
});
test('A3: unknown pipeline open at start never assumes every current deal survives',()=>{
  const r=engine.underwrite(SURVIVAL(null));
  assert.equal(r.calculations.allocatable_current_pipeline,null);
  assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'unknown');
  assert.ok(r.tests.demand_sufficiency.pipeline_creation_missing.includes('demand.pipeline_likely_open_at_ae_start'));
  assert.ok(r.evidence_gaps.some(g=>g.field==='demand.pipeline_likely_open_at_ae_start'));
  assert.ok(rank[r.decision.state]<=rank[engine.underwrite(SURVIVAL(3000000)).decision.state]);
  // A known zero claim needs no survival evidence.
  assert.equal(engine.underwrite(strong({demand:{pipeline_likely_open_at_ae_start:null,allocatable_current_qualified_pipeline:0}})).calculations.allocatable_current_pipeline,0);
});
test('A3: pipeline open at start larger than the claim leaves the claim unchanged',()=>{
  for(const likely of [2000000,2500000,3000000])assert.equal(engine.underwrite(SURVIVAL(likely)).calculations.allocatable_current_pipeline,2000000);
});
// A5: monthly series vs single monthly creation value.
const FLAT=n=>Array(12).fill(n);
const windowAverage=series=>engine.underwrite(strong({demand:{monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:null}})).calculations.observed_monthly_pipeline_creation;
const SEASONAL=[200000,220000,240000,300000,350000,400000,450000,500000,550000,900000,1100000,1300000];
test('A5: matching series and single value use the series',()=>{
  for(const series of [FLAT(1000000),SEASONAL]) {
    const average=windowAverage(series);
    const r=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:series===SEASONAL,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:average}}));
    assert.ok(!r.validation.clarifications.some(c=>c.code==='creation_source_conflict'));
    assert.equal(r.calculations.observed_monthly_pipeline_creation,average);
    assert.equal(r.audit.math.demand.future.length,r.audit.math.demand.future.filter(m=>m.series_index!==undefined).length);
  }
});
test('A5 (1.3.0): a seasonal series with a different recent single value is not a conflict; the series drives the math',()=>{
  const r=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:SEASONAL,monthly_qualified_pipeline_created_value:1300000}}));
  assert.ok(!r.validation.clarifications.length);
  assert.equal(r.calculations.observed_monthly_pipeline_creation,windowAverage(SEASONAL));
  assert.notEqual(r.calculations.observed_monthly_pipeline_creation,1300000);
  assert.equal(r.audit.math.demand.single_monthly_value_role,'reference');
  assert.equal(r.audit.math.demand.single_monthly_value,1300000);
  const seriesOnly=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:SEASONAL,monthly_qualified_pipeline_created_value:null}}));
  assert.equal(r.decision.state,seriesOnly.decision.state);assert.equal(r.calculations.pipeline_pool,seriesOnly.calculations.pipeline_pool);
});
test('A5 (1.3.0): a nonseasonal series and a single value use deterministic series precedence without a conflict',()=>{
  for(const [series,scalar] of [[FLAT(300000),1000000],[FLAT(1300000),300000]]) {
    const r=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:false,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:scalar}}));
    assert.ok(!r.validation.clarifications.length);
    assert.equal(r.calculations.observed_monthly_pipeline_creation,windowAverage(series));
    assert.equal(r.audit.math.demand.single_monthly_value_role,'reference');
    const seriesOnly=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:false,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:null}}));
    assert.deepEqual([r.decision.state,r.decision.primary_constraint,r.calculations.pipeline_pool],[seriesOnly.decision.state,seriesOnly.decision.primary_constraint,seriesOnly.calculations.pipeline_pool]);
  }
});
test('A5 (1.3.0): a series with an unknown eligible month leaves creation unknown with an evidence gap, not a conflict',()=>{
  const series=SEASONAL.slice();series[4]=null;
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:1300000}}));
  assert.ok(!r.validation.clarifications.length);
  assert.equal(r.calculations.observed_monthly_pipeline_creation,null);
  assert.ok(r.warnings.includes('incomplete_monthly_pipeline_series'));
  assert.ok(r.evidence_gaps.some(g=>g.field==='demand.monthly_pipeline_series'));
  assert.notEqual(r.decision.state,'supported');
});
test('A5 (1.3.0): without a series, a single value proves creation only when creation is confirmed not seasonal',()=>{
  const confirmed=engine.underwrite(strong(DEEP_POOL,{demand:{pipeline_creation_is_seasonal:false}}));
  assert.equal(confirmed.calculations.observed_monthly_pipeline_creation,1000000);assert.equal(confirmed.audit.math.demand.single_monthly_value_role,'modeling');
  for(const seasonal of [true,null]) {
    const r=engine.underwrite(strong(DEEP_POOL,{demand:{pipeline_creation_is_seasonal:seasonal}}));
    assert.equal(r.audit.math.demand.single_monthly_value_role,'illustrative',String(seasonal));
    assert.equal(r.calculations.observed_monthly_pipeline_creation,null);
    assert.equal(r.tests.demand_sufficiency.pipeline_creation_state,'unknown');
    assert.ok(r.audit.math.demand.illustrative_flat_future>0);
    assert.ok(r.evidence_gaps.some(g=>g.field==='demand.monthly_pipeline_series'));
    assert.ok(rank[r.decision.state]<=rank[confirmed.decision.state]);assert.ok(confidenceRank[r.decision.confidence]<=confidenceRank[confirmed.decision.confidence]);
  }
  assert.ok(engine.underwrite(strong(DEEP_POOL,{demand:{pipeline_creation_is_seasonal:null}})).evidence_gaps.some(g=>g.field==='demand.pipeline_creation_is_seasonal'));
});
test('A5 (1.3.0): deleting a seasonal series never strengthens the decision or raises confidence',()=>{
  for(const extra of [{},DEEP_POOL,{demand:{allocatable_qualified_pipeline:2900000,pipeline_likely_open_at_ae_start:2900000}}]) for(const series of [SEASONAL,SEASONAL.map(v=>v*3),FLAT(400000)]) for(const scalar of [1300000,200000,null]) {
    const base=strong(extra,{demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:scalar}});
    const before=engine.underwrite(base);
    const input=structuredClone(base);input.demand.monthly_pipeline_series=null;
    const after=engine.underwrite(input);
    assert.ok(rank[after.decision.state]<=rank[before.decision.state],`${before.decision.state} -> ${after.decision.state}`);
    assert.ok(confidenceRank[after.decision.confidence]<=confidenceRank[before.decision.confidence],`confidence ${before.decision.confidence} -> ${after.decision.confidence}`);
    assert.notEqual(after.tests.demand_sufficiency.pipeline_creation_state,'sufficient');
  }
});
test('A5: deleting either source of an agreeing pair cannot strengthen the decision (seasonal and nonseasonal)',()=>{
  for(const [series,seasonal] of [[FLAT(1000000),false],[FLAT(500000),false],[SEASONAL,true]]) {
    const average=windowAverage(series);
    const both=strong(DEEP_POOL,{demand:{pipeline_creation_is_seasonal:seasonal,monthly_pipeline_series:series,monthly_qualified_pipeline_created_value:average}});
    const before=engine.underwrite(both);
    assert.equal(before.validation.clarifications.length,0);
    for(const drop of ['monthly_pipeline_series','monthly_qualified_pipeline_created_value']) {
      const input=structuredClone(both);input.demand[drop]=null;
      const after=engine.underwrite(input);
      assert.ok(rank[after.decision.state]<=rank[before.decision.state],drop+': '+before.decision.state+' -> '+after.decision.state);
      assert.ok(confidenceRank[after.decision.confidence]<=confidenceRank[before.decision.confidence],drop+' confidence');
    }
  }
});
test('A5: only one source supplied is used as given',()=>{
  const scalarOnly=engine.underwrite(strong());
  assert.equal(scalarOnly.calculations.observed_monthly_pipeline_creation,1000000);
  assert.ok(!scalarOnly.validation.clarifications.length);
  const seriesOnly=engine.underwrite(strong({demand:{monthly_pipeline_series:SEASONAL,monthly_qualified_pipeline_created_value:null}}));
  assert.ok(!seriesOnly.validation.clarifications.length);assert.equal(seriesOnly.calculations.observed_monthly_pipeline_creation,windowAverage(SEASONAL));
});
// B2: zero existing-team conversion.
test('B2: zero vs null vs small existing-team conversion',()=>{
  const at=rate=>engine.underwrite(makeCase({conversion:{existing_team_qualified_opp_to_win_pct:rate}}));
  const zero=at(0),missing=at(null),small=at(0.01);
  assert.equal(zero.calculations.existing_team_conversion_rate,0);
  assert.equal(zero.calculations.existing_pipeline_requirement_status,'unbounded');
  assert.equal(zero.calculations.existing_pipeline_required,null);
  assert.equal(zero.calculations.theoretical_pipeline_surplus,0,'the surplus cap is kept at zero, never dropped');
  assert.ok(zero.validation.clarifications.some(c=>c.code==='existing_team_zero_conversion'));
  assert.equal(zero.decision.state,'insufficient_evidence');
  assert.equal(missing.calculations.existing_pipeline_requirement_status,'calculated');
  assert.ok(!missing.validation.clarifications.some(c=>c.code==='existing_team_zero_conversion'));
  assert.equal(small.calculations.existing_pipeline_requirement_status,'calculated');
  close(small.calculations.existing_pipeline_required,small.calculations.existing_capacity/0.01);
  assert.ok(small.calculations.theoretical_pipeline_surplus<=missing.calculations.theoretical_pipeline_surplus);
  assert.ok(rank[zero.decision.state]<=rank[small.decision.state]&&rank[small.decision.state]<=rank[missing.decision.state]+1);
});
test('B2: zero all-seller wins over positive opportunities is a known zero, not absent',()=>{
  const r=engine.underwrite(makeCase({conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:0.21,qualified_opps_trailing_12m:40,closed_won_trailing_12m:0,qualified_opp_to_win_pct:null},repeatability:{wins_trailing_12m:0,non_founder_wins_trailing_12m:null}}));
  assert.equal(r.validation.fatal_errors.length,0);
  assert.equal(r.calculations.existing_team_conversion_rate,0);
  assert.equal(r.calculations.theoretical_pipeline_surplus,0);
  assert.ok(r.validation.clarifications.some(c=>c.code==='existing_team_zero_conversion'&&c.fields.includes('conversion.closed_won_trailing_12m')));
});
test('B2: a zero transferable fallback rate keeps the cap at zero without a clarification and stays uncertain',()=>{
  const r=engine.underwrite(makeCase({conversion:{non_founder_qualified_opps_trailing_12m:20,non_founder_wins_trailing_12m:0,non_founder_qualified_opp_to_win_pct:0},repeatability:{non_founder_wins_trailing_12m:0}}));
  assert.equal(r.calculations.existing_pipeline_requirement_status,'unbounded');assert.equal(r.calculations.theoretical_pipeline_surplus,0);
  assert.ok(!r.validation.clarifications.some(c=>c.code==='existing_team_zero_conversion'));
  assert.equal(r.decision.state,'not_yet_supported');assert.equal(r.tests.demand_sufficiency.allocation_uncertain,true);
});
// B3: unknown ramp keeps both interpretations.
const G12_LIKE={proposed_ae:{ramp_definition:'unknown',start_month_index:5},demand:{pipeline_likely_open_at_ae_start:3100000,allocatable_qualified_pipeline:3100000},timing:{revenue_needed_by_date:'2027-06-01'}};
test('B3: each interpretation keeps its decision, constraints and latest viable start',()=>{
  const r=engine.underwrite(makeCase(G12_LIKE));
  const b=r.decision.ramp_branches;
  assert.ok(b&&b.closed_bookings&&b.pipeline_productivity);
  assert.notEqual(b.closed_bookings.decision,b.pipeline_productivity.decision);
  for(const branch of Object.values(b)){assert.ok('primary_constraint' in branch&&Array.isArray(branch.secondary_constraints)&&'latest_viable_start' in branch);}
  assert.deepEqual(r.ramp_interpretations,b);
  // The weaker interpretation governs; its operating constraint is preserved.
  const weaker=rank[b.closed_bookings.decision]<=rank[b.pipeline_productivity.decision]?b.closed_bookings:b.pipeline_productivity;
  assert.equal(r.decision.state,weaker.decision);assert.equal(r.decision.primary_constraint,weaker.primary_constraint);
  assert.notEqual(r.decision.primary_constraint,'ramp_ambiguity');
  assert.ok(r.decision.secondary_constraints.includes('ramp_ambiguity'));
  for(const branch of Object.values(b))if(branch.primary_constraint&&branch.primary_constraint!==r.decision.primary_constraint)assert.ok(r.decision.secondary_constraints.includes(branch.primary_constraint));
  assert.equal(new Set(r.decision.secondary_constraints).size,r.decision.secondary_constraints.length);
  assert.ok(!r.decision.secondary_constraints.includes(r.decision.primary_constraint));
});
test('B3: latest viable start is reported per interpretation with a conservative single value',()=>{
  const r=engine.underwrite(makeCase(deepMerge(G12_LIKE,{proposed_ae:{start_month_index:null,proposed_start_date:'2027-09-01'}})));
  const t=r.tests.timing_management.timing;
  assert.ok(t.latest_viable_start_by_ramp);
  const values=[t.latest_viable_start_by_ramp.closed_bookings,t.latest_viable_start_by_ramp.pipeline_productivity];
  assert.ok(values.every(v=>v!==null));assert.notEqual(values[0],values[1]);
  assert.deepEqual(t.latest_viable_start_range,[...values].sort());
  assert.equal(t.latest_viable_start,[...values].sort()[0]);
});
test('B3: an unknown ramp is never stronger than either known interpretation',()=>{
  for(const extra of [{},G12_LIKE,{demand:{pipeline_likely_open_at_ae_start:1000000,allocatable_qualified_pipeline:1000000}},STRONG,{economics:{average_sales_cycle_days:180}}]) {
    const unknown=engine.underwrite(makeCase(deepMerge(extra,{proposed_ae:{ramp_definition:'unknown'}})));
    for(const mode of ['closed_bookings','pipeline_productivity']) {
      const known=engine.underwrite(makeCase(deepMerge(extra,{proposed_ae:{ramp_definition:mode}})));
      assert.ok(rank[unknown.decision.state]<=rank[known.decision.state],mode+': '+known.decision.state+' vs unknown '+unknown.decision.state);
      assert.ok(confidenceRank[unknown.decision.confidence]<=confidenceRank[known.decision.confidence],mode+' confidence');
    }
    assert.notEqual(unknown.decision.state,'supported');
  }
});
// B4: low confidence is attributed to its cause.
test('B4: demand-only low confidence creates no transferability constraint or condition',()=>{
  const r=engine.underwrite(strong({demand:{monthly_qualified_opps_created:null}}));
  assert.equal(r.decision.confidence,'low');
  assert.ok(r.confidence.reasons.includes('creation_sufficiency_unknown'));
  assert.ok(!r.confidence.reasons.some(x=>['transferability_unproven','very_thin_conversion_sample','unknown_conversion','unknown_conversion_sample'].includes(x)));
  assert.equal(r.tests.repeatability.state,'demonstrated');
  assert.ok(!codes(r).includes('transferability'));assert.ok(!r.conditions.some(c=>c.code==='transferability'));
  assert.ok(codes(r).includes('opportunity_creation'));
  assert.equal(r.decision.constraints.find(c=>c.code==='opportunity_creation').dimension,'demand_sufficiency');
});
test('B4: ramp-only low confidence is a timing constraint, not transferability',()=>{
  const r=engine.underwrite(strong({proposed_ae:{ramp_definition:'unknown'}}));
  assert.ok(r.confidence.reasons.includes('ramp_ambiguity'));
  assert.ok(!r.confidence.reasons.some(x=>['transferability_unproven','very_thin_conversion_sample','unknown_conversion'].includes(x)));
  assert.ok(!codes(r).includes('transferability'));assert.ok(!r.conditions.some(c=>c.code==='transferability'));
  assert.equal(r.decision.constraints.find(c=>c.code==='ramp_ambiguity').dimension,'timing');
});
test('B4: weak pipeline evidence is a demand constraint, not transferability',()=>{
  const r=engine.underwrite(strong({provenance:{pipeline:'founder_estimate'}}));
  assert.deepEqual(r.confidence.reasons.filter(x=>!['linear_ramp_assumption'].includes(x)),['pipeline_source_weak_or_unknown']);
  assert.equal(r.decision.state,'conditional');assert.equal(r.decision.primary_constraint,'unknown_pipeline_allocation');
  assert.deepEqual(r.decision.constraints.map(c=>c.dimension),['demand_sufficiency']);
  assert.ok(!codes(r).includes('transferability'));assert.ok(!r.conditions.some(c=>c.code==='transferability'));
});
test('B4: conversion causes still map to repeatability',()=>{
  const thin=engine.underwrite(strong({conversion:{non_founder_qualified_opps_trailing_12m:2,non_founder_wins_trailing_12m:2,non_founder_qualified_opp_to_win_pct:1},repeatability:{non_founder_wins_trailing_12m:2}}));
  assert.ok(codes(thin).includes('thin_conversion_sample'));
  assert.equal(thin.decision.constraints.find(c=>c.code==='thin_conversion_sample').dimension,'repeatability');
  const scenario=engine.underwrite(strong({decision:{new_ae_market_same_as_history:'no'}}));
  assert.ok(scenario.confidence.reasons.includes('transferability_unproven'));
  assert.equal(scenario.decision.constraints.find(c=>c.code==='transferability'&&c.severity>=2).dimension,'repeatability');
  assert.ok(scenario.conditions.some(c=>c.code==='transferability'));
});
// B1: management and seasonality answers.
test('B1: unanswered management questions keep confidence low',()=>{
  for(const field of ['direct_manager_exists','weekly_1to1_capacity','weekly_pipeline_review_capacity','onboarding_owner_named','onboarding_plan_exists']) {
    const r=engine.underwrite(strong({management:{[field]:null}}));
    assert.ok(['low','insufficient'].includes(r.decision.confidence),field);
    assert.notEqual(r.decision.state,'supported',field);
  }
});
test('B1: unknown seasonality never carries more confidence than a declared flag',()=>{
  const declared=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:false}}));
  const unknown=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:null}}));
  assert.ok(unknown.confidence.reasons.includes('seasonality_unknown')||unknown.confidence.reasons.includes('evidence_gate_failed'));
  assert.ok(confidenceRank[unknown.decision.confidence]<=confidenceRank[declared.decision.confidence]);
  assert.ok(rank[unknown.decision.state]<=rank[declared.decision.state]);
  const seasonal=engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:true}}));
  assert.ok(confidenceRank[unknown.decision.confidence]<=confidenceRank[seasonal.decision.confidence]||seasonal.decision.confidence===unknown.decision.confidence);
  assert.ok(!engine.underwrite(strong({demand:{pipeline_creation_is_seasonal:null,monthly_pipeline_series:FLAT(1000000),monthly_qualified_pipeline_created_value:null}})).confidence.reasons.includes('seasonality_unknown'));
});
// A2: transferable conversion basis.
test('A2: conversion basis is recorded independently of market or stage qualification',()=>{
  const rate=o=>engine.selectTransferableWinRate(engine.normalizeInput(makeCase(o)),policy);
  assert.equal(rate({}).conversion_basis,'non_founder');
  assert.equal(rate({conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:30,closed_won_trailing_12m:9},repeatability:{wins_trailing_12m:9,non_founder_wins_trailing_12m:null}}).conversion_basis,'founder_inclusive_fallback');
  assert.equal(rate({decision:{new_ae_market_same_as_history:'no'},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:30,closed_won_trailing_12m:9}}).conversion_basis,'founder_inclusive_fallback');
  assert.equal(rate({conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opp_to_win_pct:null}}).conversion_basis,'unknown');
  assert.equal(rate({conversion:{material_gtm_change_date:'2026-06-01',post_change_wins:3,post_change_qualified_opps:40,post_change_non_founder:true}}).conversion_basis,'non_founder');
  assert.equal(rate({conversion:{material_gtm_change_date:'2026-06-01',post_change_wins:3,post_change_qualified_opps:40}}).conversion_basis,'post_change_founder_inclusive');
  assert.equal(rate({conversion:{material_gtm_change_date:'2026-06-01'}}).conversion_basis,'pre_change_history');
});
test('A2: unknown transferable conversion is insufficient evidence for a positive-contribution seat',()=>{
  const r=engine.underwrite(strong({conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opp_to_win_pct:null}}));
  assert.equal(r.decision.state,'insufficient_evidence');assert.equal(r.decision.primary_constraint,'unknown_conversion');
  assert.ok(r.evidence_gaps.some(g=>g.field==='conversion.qualified_opportunity_win_rate'));
});
test('A2: an independent hard blocker keeps NOT YET SUPPORTED without usable conversion',()=>{
  const r=engine.underwrite(makeCase({target:{new_arr_target_horizon:1250000},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:30,closed_won_trailing_12m:9},repeatability:{wins_trailing_12m:9,non_founder_wins_trailing_12m:null}}));
  assert.equal(r.conversion.conversion_basis,'founder_inclusive_fallback');
  assert.equal(r.decision.state,'not_yet_supported');assert.equal(r.decision.primary_constraint,'no_capacity_gap');
  const late=engine.underwrite(makeCase({proposed_ae:{start_month_index:13},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:30,closed_won_trailing_12m:9},repeatability:{wins_trailing_12m:9,non_founder_wins_trailing_12m:null}}));
  assert.equal(late.calculations.proposed_ae_contribution,0);assert.notEqual(late.decision.primary_constraint,'unknown_conversion');
});
test('A2: the first-AE founder-inclusive path is unchanged',()=>{
  const first={decision:{evaluating_first_professional_ae:true},current_team:{current_quota_carriers:0,sellers:[],founder_committed_new_arr:650000,founder_expected_to_remain_seller:true},conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:42,closed_won_trailing_12m:11,qualified_opp_to_win_pct:11/42},repeatability:{wins_trailing_12m:11,non_founder_wins_trailing_12m:0,founder_primary_seller_share_pct:1,icp_documented:'yes',qualification_documented:'yes',discovery_documented:'yes',sales_stages_documented:'partial',rep_can_run_discovery_without_founder:'unknown',founder_required_late_stage:'almost_always',repeatable_use_cases_count:2,founder_can_articulate_path:true}};
  const r=engine.underwrite(makeCase(first));
  assert.equal(r.conversion.conversion_basis,'first_ae_founder_inclusive');
  assert.ok(['conditional','supported'].includes(r.decision.state));assert.equal(r.decision.primary_constraint,'transferability');
});
// Final pre-merge correction (engine 1.3.0): unknown-ramp latest-start null semantics.
const branch=(status,date=null)=>({latest_start_status:status,latest_viable_start:date});
const reconcile=(closed,productivity)=>engine.reconcileRampLatestStart({closed_bookings:closed,pipeline_productivity:productivity});
test('latest start reconciliation: both branches dated -> the earlier date',()=>{
  const r=reconcile(branch('date','2027-02-01'),branch('date','2026-10-30'));
  assert.equal(r.latest_viable_start,'2026-10-30');assert.equal(r.latest_viable_start_reason,null);
  assert.deepEqual(r.latest_viable_start_range,['2026-10-30','2027-02-01']);
  assert.deepEqual(r.latest_viable_start_by_ramp,{closed_bookings:'2027-02-01',pipeline_productivity:'2026-10-30'});
});
test('latest start reconciliation: compatible/null + incompatible/date -> the restrictive date',()=>{
  for(const [c,p] of [[branch('not_needed'),branch('date','2026-10-30')],[branch('date','2026-10-30'),branch('not_needed')]]) {
    const r=reconcile(c,p);
    assert.equal(r.latest_viable_start,'2026-10-30');assert.equal(r.latest_viable_start_reason,null);assert.equal(r.latest_viable_start_range,null);
  }
});
test('latest start reconciliation: incompatible/null + a dated branch -> null with no common viable start',()=>{
  for(const [c,p] of [[branch('none'),branch('date','2026-10-30')],[branch('date','2027-02-01'),branch('none')]]) {
    const r=reconcile(c,p);
    assert.equal(r.latest_viable_start,null);
    assert.equal(r.latest_viable_start_reason,'no_common_viable_start_across_ramp_interpretations');
    assert.ok(Object.values(r.latest_viable_start_by_ramp).some(v=>v!==null),'branch-specific dates are kept to explain why');
  }
  assert.equal(reconcile(branch('none'),branch('not_needed')).latest_viable_start_reason,'no_common_viable_start_across_ramp_interpretations');
});
test('latest start reconciliation: both incompatible/null -> null',()=>{
  const r=reconcile(branch('none'),branch('none'));
  assert.equal(r.latest_viable_start,null);assert.equal(r.latest_viable_start_reason,'no_common_viable_start_across_ramp_interpretations');
});
test('latest start reconciliation: both compatible -> no corrective date or reason',()=>{
  const r=reconcile(branch('not_needed'),branch('not_needed'));
  assert.equal(r.latest_viable_start,null);assert.equal(r.latest_viable_start_reason,null);assert.equal(r.latest_viable_start_range,null);
});
test('latest start reconciliation: a branch whose search could not run makes the common start unknown',()=>{
  const r=reconcile(branch('unknown'),branch('date','2026-10-30'));
  assert.equal(r.latest_viable_start,null);assert.equal(r.latest_viable_start_reason,'latest_start_unknown_for_a_ramp_interpretation');
});
const UNKNOWN_RAMP_AT=(start,need,extra={})=>makeCase(deepMerge({proposed_ae:{ramp_definition:'unknown',start_month_index:null,proposed_start_date:start},timing:{revenue_needed_by_date:need}},extra));
test('unknown ramp end to end: both branches dated',()=>{
  const r=engine.underwrite(UNKNOWN_RAMP_AT('2026-12-01','2027-01-05',{proposed_ae:{monthly_ramp_schedule:[0,0,1],ramp_months:null}}));
  const t=r.tests.timing_management.timing;
  assert.deepEqual(t.latest_start_status_by_ramp,{closed_bookings:'date',pipeline_productivity:'date'});
  assert.equal(t.latest_viable_start,[t.latest_viable_start_by_ramp.closed_bookings,t.latest_viable_start_by_ramp.pipeline_productivity].sort()[0]);
});
test('unknown ramp end to end: compatible closed-bookings branch, dated pipeline-productivity branch',()=>{
  const r=engine.underwrite(UNKNOWN_RAMP_AT('2026-12-01','2027-01-05'));
  const t=r.tests.timing_management.timing;
  assert.deepEqual(t.latest_start_status_by_ramp,{closed_bookings:'not_needed',pipeline_productivity:'date'});
  assert.equal(t.latest_viable_start,t.latest_viable_start_by_ramp.pipeline_productivity);assert.notEqual(t.latest_viable_start,null);
  // The timing correction from the branch that needs it is reported, dated with the combined date.
  const timingCondition=r.conditions.find(c=>c.code==='sales_cycle_timing'||c.code==='late_start');
  assert.ok(timingCondition);assert.equal(timingCondition.deadline,t.latest_viable_start);
});
test('unknown ramp end to end: no viable start under either interpretation',()=>{
  const r=engine.underwrite(UNKNOWN_RAMP_AT('2026-06-01','2026-09-01'));
  const t=r.tests.timing_management.timing;
  assert.deepEqual(t.latest_start_status_by_ramp,{closed_bookings:'none',pipeline_productivity:'none'});
  assert.equal(t.latest_viable_start,null);assert.equal(t.latest_viable_start_reason,'no_common_viable_start_across_ramp_interpretations');
  assert.notEqual(r.decision.state,'supported');
});
test('unknown ramp end to end: both branches compatible manufacture no corrective latest start',()=>{
  const r=engine.underwrite(UNKNOWN_RAMP_AT('2026-06-01','2027-01-05'));
  const t=r.tests.timing_management.timing;
  assert.deepEqual(t.latest_start_status_by_ramp,{closed_bookings:'not_needed',pipeline_productivity:'not_needed'});
  assert.equal(t.latest_viable_start,null);assert.equal(t.latest_viable_start_reason,null);
  assert.ok(!r.conditions.some(c=>c.code==='sales_cycle_timing'||c.code==='late_start'));
});
test('a known ramp records why its latest start is null',()=>{
  const t=engine.underwrite(makeCase({proposed_ae:{start_month_index:null,proposed_start_date:'2026-06-01'},timing:{revenue_needed_by_date:'2026-09-01'}})).tests.timing_management.timing;
  assert.equal(t.latest_viable_start,null);assert.equal(t.latest_viable_start_reason,'no_viable_start');
});
if(failures.length){failures.forEach(f=>console.error('FAIL '+f));process.exitCode=1;}
console.log(`AE engine: ${passed} passed, ${failures.length} failed`);
