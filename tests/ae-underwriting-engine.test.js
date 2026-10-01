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
  assert.ok(!codes(at).includes('pipeline_creation'),'a ratio of exactly 1.00x is not a creation shortfall');
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
  const r=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:3300000}}));
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
  const higher=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:1000000}}));
  const lower=engine.underwrite(strong(DEEP_POOL,{demand:{allocatable_current_qualified_pipeline:0}}));
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
  const expected=new Date(Date.parse('2027-01-01T00:00:00Z')-(94+(policy.validation.rampMax+1)*31)*86400000).toISOString().slice(0,10);
  assert.equal(first.latest_start_search_floor,expected);
  const schedule=timingOf(engine.underwrite(productivity({proposed_ae:{monthly_ramp_schedule:[...Array(20).fill(0.2),1]},timing:{revenue_needed_by_date:'2027-02-01'}})));
  assert.ok(schedule.latest_start_search_floor<first.latest_start_search_floor,'a longer supplied schedule extends the floor');
  assert.notEqual(schedule.latest_viable_start,null);
});
test('defect 4: the existing after-horizon start condition keeps its latest viable start',()=>{
  const r=engine.underwrite(makeCase({proposed_ae:{proposed_start_date:'2028-01-01'}}));
  assert.equal(timingOf(r).latest_viable_start,'2027-12-31');
  assert.equal(r.conditions.find(c=>c.code==='late_start'||c.code==='sales_cycle_timing').deadline,'2027-12-31');
});
if(failures.length){failures.forEach(f=>console.error('FAIL '+f));process.exitCode=1;}
console.log(`AE engine: ${passed} passed, ${failures.length} failed`);
