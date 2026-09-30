'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/ae-underwriting-engine.js');
const { makeCase, deepMerge } = require('./ae-fixtures.js');
// Corrections and contract extensions are recorded in docs/ae-engine-contract.md.
const firstAE = {
  decision:{evaluating_first_professional_ae:true},
  current_team:{current_quota_carriers:0,sellers:[],founder_committed_new_arr:650000,founder_expected_to_remain_seller:true},
  conversion:{non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null,qualified_opps_trailing_12m:42,closed_won_trailing_12m:11,qualified_opp_to_win_pct:11/42},
  repeatability:{wins_trailing_12m:11,non_founder_wins_trailing_12m:0,founder_primary_seller_share_pct:1,icp_documented:'yes',qualification_documented:'yes',discovery_documented:'yes',sales_stages_documented:'partial',rep_can_run_discovery_without_founder:'unknown',founder_required_late_stage:'almost_always',repeatable_use_cases_count:2,founder_can_articulate_path:true}
};
const noNF={non_founder_qualified_opps_trailing_12m:null,non_founder_wins_trailing_12m:null,non_founder_qualified_opp_to_win_pct:null};
const cases=[
  {id:'G01',description:'No capacity gap',overrides:{target:{new_arr_target_horizon:1250000}},allowed:['not_yet_supported'],constraint:'no_capacity_gap'},
  {id:'G02',description:'Strong case with sufficient pool after existing demand and sensitivity',overrides:{target:{new_arr_target_horizon:2200000},demand:{pipeline_likely_open_at_ae_start:4200000,allocatable_qualified_pipeline:4200000,monthly_qualified_pipeline_created_value:1000000}},allowed:['supported'],check:r=>assert.ok(['high','moderate'].includes(r.decision.confidence))},
  {id:'G03',description:'Near pipeline',overrides:{},allowed:['conditional'],constraint:'pipeline_supply'},
  {id:'G04',description:'Materially short pipeline',overrides:{demand:{pipeline_likely_open_at_ae_start:1750000,allocatable_qualified_pipeline:1750000}},allowed:['not_yet_supported'],constraint:'pipeline_supply'},
  {id:'G05',description:'First AE with strong structured founder motion',overrides:firstAE,allowed:['conditional','supported'],check:r=>{assert.equal(r.tests.repeatability.state,'transferable_evidence_strong');assert.ok(r.tests.repeatability.disclosures.length);}},
  {id:'G06',description:'First AE with idiosyncratic founder deals',overrides:deepMerge(firstAE,{conversion:{closed_won_trailing_12m:4,qualified_opp_to_win_pct:4/42},repeatability:{wins_trailing_12m:4,icp_documented:'no',qualification_documented:'no',discovery_documented:'no',repeatable_use_cases_count:0,founder_can_articulate_path:false},demand:{pipeline_likely_open_at_ae_start:null,allocatable_qualified_pipeline:null}}),allowed:['not_yet_supported','insufficient_evidence']},
  {id:'G07',description:'Founder-inclusive conversion only',overrides:{conversion:{...noNF,qualified_opps_trailing_12m:30,closed_won_trailing_12m:9,qualified_opp_to_win_pct:0.3},repeatability:{wins_trailing_12m:9,non_founder_wins_trailing_12m:null}},allowed:['conditional'],check:r=>{assert.equal(r.conversion.scenario_only,true);assert.notEqual(r.decision.confidence,'high');}},
  {id:'G08',description:'Start after horizon without contradictory in-period expectation',overrides:{proposed_ae:{start_month_index:13}},allowed:['not_yet_supported'],constraint:'late_start',check:r=>assert.equal(r.calculations.proposed_ae_contribution,0)},
  {id:'G09',description:'Closed-bookings ramp never subtracts the cycle again',overrides:{economics:{average_sales_cycle_days:180}},allowed:['not_yet_supported','conditional'],check:r=>assert.ok(Math.abs(r.calculations.proposed_ae_contribution-675000)<1e-6)},
  {id:'G10',description:'Pipeline-productivity ramp applies qualified-cycle lag',overrides:{proposed_ae:{ramp_definition:'pipeline_productivity'}},allowed:['supported','conditional','not_yet_supported'],check:r=>assert.ok(r.calculations.proposed_ae_contribution<675000)},
  {id:'G11',description:'Unknown ramp with stable negative demand decision',overrides:{proposed_ae:{ramp_definition:'unknown'},demand:{pipeline_likely_open_at_ae_start:1000000,allocatable_qualified_pipeline:1000000}},allowed:['not_yet_supported'],check:r=>{assert.ok(r.contribution_range[0]<r.contribution_range[1]);assert.equal(r.decision.confidence,'low');assert.ok(r.conditions.some(c=>c.code==='ramp_ambiguity'));}},
  {id:'G12',description:'Unknown ramp with a declared deadline producing different timing decisions',overrides:{proposed_ae:{ramp_definition:'unknown',start_month_index:5},demand:{pipeline_likely_open_at_ae_start:3100000,allocatable_qualified_pipeline:3100000},timing:{revenue_needed_by_date:'2027-06-01'}},allowed:['conditional','insufficient_evidence'],check:r=>assert.notEqual(r.ramp_interpretations.closed_bookings.timing,r.ramp_interpretations.pipeline_productivity.timing)},
  {id:'G13',description:'Replacement removes departed capacity',overrides:{decision:{hire_reason:'replacement'},current_team:{departing_seller_index:1,departure_month_index:2}},allowed:['conditional','supported','not_yet_supported'],check:r=>assert.ok(Math.abs(r.calculations.existing_capacity-(648000+117000))<1e-6)},
  {id:'G14',description:'Weighted pipeline requires clarification',overrides:{demand:{pipeline_value_type:'probability_weighted',current_qualified_pipeline_value:2000000}},allowed:['insufficient_evidence'],check:r=>{assert.equal(r.calculations.pipeline_pool,null);assert.ok(r.validation.clarifications.some(v=>v.code==='pipeline_value_type'));}},
  {id:'G15',description:'TCV quota and ARR target cannot be silently combined',overrides:{proposed_ae:{quota_metric:'tcv'},economics:{contract_term_months_typical:36}},allowed:['insufficient_evidence'],check:r=>assert.ok(r.validation.clarifications.some(v=>v.code==='metric_basis_conflict'))},
  {id:'G16',description:'Recent pivot uses thin post-change evidence',overrides:{conversion:{material_gtm_change_date:'2026-10-01',qualified_opp_to_win_pct:0.28,post_change_qualified_opps:13,post_change_wins:2,post_change_non_founder:true}},allowed:['not_yet_supported','conditional','insufficient_evidence'],check:r=>{assert.equal(r.conversion.value,2/13);assert.equal(r.tests.repeatability.non_founder_wins,2);assert.notEqual(r.decision.confidence,'high');}},
  {id:'G17',description:'New geography conversion is scenario evidence',overrides:{decision:{new_ae_market_same_as_history:'no'}},allowed:['conditional','not_yet_supported'],check:r=>{assert.equal(r.conversion.scenario_only,true);assert.notEqual(r.decision.confidence,'high');}},
  {id:'G18',description:'Underfed current sellers do not justify another seat',overrides:{target:{new_arr_target_horizon:1600000},current_team:{sellers:[{annual_quota:900000,trailing_attainment_pct:0.55,is_founder:false},{annual_quota:900000,trailing_attainment_pct:0.55,is_founder:false}]},demand:{pipeline_likely_open_at_ae_start:1000000,allocatable_qualified_pipeline:1000000,monthly_qualified_pipeline_created_value:250000}},allowed:['not_yet_supported'],constraint:'pipeline_supply'},
  {id:'G19',description:'Management cannot onboard or review',overrides:{management:{direct_manager_exists:true,weekly_1to1_capacity:'no',weekly_pipeline_review_capacity:'no',onboarding_owner_named:false,onboarding_plan_exists:'no',manager_is_also_primary_seller:true}},allowed:['not_yet_supported','conditional'],check:r=>assert.ok([r.decision.primary_constraint,...r.decision.secondary_constraints].includes('management_capacity'))},
  {id:'G20',description:'Unknown conversion and allocation',overrides:{conversion:{...noNF,qualified_opp_to_win_pct:null},demand:{pipeline_likely_open_at_ae_start:null,allocatable_qualified_pipeline:null,new_ae_pipeline_share_pct:null}},allowed:['insufficient_evidence'],check:r=>{assert.ok(r.evidence_gaps.some(g=>g.field.includes('conversion')));assert.ok(r.evidence_gaps.some(g=>g.field.includes('allocatable')));}},
  {id:'G21',description:'Zero observed conversion produces unbounded requirements',overrides:{conversion:{non_founder_qualified_opps_trailing_12m:20,non_founder_wins_trailing_12m:0,non_founder_qualified_opp_to_win_pct:0},repeatability:{non_founder_wins_trailing_12m:0}},allowed:['not_yet_supported'],check:r=>assert.equal(r.calculation_statuses.pipeline_required,'unbounded')},
  {id:'G22',description:'Perfect conversion on two opportunities remains very thin',overrides:{conversion:{non_founder_qualified_opps_trailing_12m:2,non_founder_wins_trailing_12m:2,non_founder_qualified_opp_to_win_pct:1},repeatability:{non_founder_wins_trailing_12m:2}},allowed:['conditional','not_yet_supported'],check:r=>{assert.equal(r.conversion.sample,'very_thin');assert.notEqual(r.decision.confidence,'high');assert.ok(r.sensitivity.length);}},
  {id:'G23',description:'Strategic reason remains separate from revenue capacity',overrides:{target:{new_arr_target_horizon:1250000},decision:{hire_reason:'new_geography',new_ae_market_same_as_history:'no'}},allowed:['conditional','not_yet_supported'],check:r=>{assert.equal(r.decision.revenue_capacity_case,'not_established');assert.equal(r.decision.strategic_hiring_case.declared,true);}},
  {id:'G24',description:'Seasonal creation uses the supplied series',overrides:{demand:{pipeline_creation_is_seasonal:true,monthly_pipeline_series:[200000,220000,240000,300000,350000,400000,450000,500000,550000,900000,1100000,1300000]}},allowed:['not_yet_supported','conditional'],check:r=>assert.ok(r.calculations.pipeline_pool<7000000)}
];
function run() {
  let passed=0;const failures=[];
  for(const fixture of cases) {
    try {
      const result=engine.underwrite(makeCase(fixture.overrides));
      assert.ok(fixture.allowed.includes(result.decision.state),`expected ${fixture.allowed.join('/')} but got ${result.decision.state}; ${JSON.stringify(result.validation)}`);
      if(fixture.constraint)assert.equal(result.decision.primary_constraint,fixture.constraint);
      if(fixture.check)fixture.check(result);
      if(['conditional','not_yet_supported'].includes(result.decision.state))assert.ok(result.conditions.length);
      passed++;
    }catch(error){failures.push(fixture.id+' '+fixture.description+': '+error.message);}
  }
  failures.forEach(f=>console.error('FAIL '+f));
  console.log(`AE golden cases: ${passed}/${cases.length} passed`);
  if(failures.length)process.exitCode=1;
}
module.exports={cases,run};
if(require.main===module)run();
