(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ae-policy.js'),require('./ae-engine-input.js'),require('./ae-underwriting-math.js'),require('./ae-decision-engine.js'));
  else root.AEUnderwriting = factory(root.AE_HIRE_POLICY,root.AEEngineInput,root.AEUnderwritingMath,root.AEDecisionEngine);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DEFAULT_POLICY,Input,MathEngine,Decision) {
  'use strict';
  const ENGINE_VERSION='ae-engine-1.1.0';
  const number=v=>typeof v==='number'&&Number.isFinite(v);
  const value=v=>number(v)?v:(v&&number(v.value)?v.value:null);
  const divide=(a,b)=>number(a)&&number(b)&&b>0&&Number.isFinite(a/b)?a/b:null;
  const unique=list=>[...new Map(list.map(v=>[JSON.stringify(v),v])).values()];
  function freeze(object) {
    if(object&&typeof object==='object'){Object.values(object).forEach(freeze);Object.freeze(object);}return object;
  }
  function selectTransferableWinRate(input,policy=DEFAULT_POLICY) {
    const c=input.conversion,r=input.repeatability,provenance=input.provenance;
    const first=input.decision.evaluating_first_professional_ae===true;
    let rate=null,denominator=null,source='unknown',scenario=false,reason=null;
    const assumptions=[],warnings=[];
    const pick=(wins,opps,label)=>{if(number(wins)&&number(opps)&&opps>0){rate=wins/opps;denominator=opps;source=label;return true;}return false;};
    const supplied=(v,label)=>{if(number(v)){rate=v;source=label;return true;}return false;};
    const pivot=c.material_gtm_change_date!=null||c.post_change_wins!=null||c.post_change_qualified_opps!=null;
    if(pivot&&pick(c.post_change_wins,c.post_change_qualified_opps,'post_change_counts')) {
      scenario=c.post_change_non_founder!==true;
      if(scenario)reason='post_change_founder_inclusive';
    } else {
      const credible=policy.evidence.credibleSources.includes(provenance['conversion.non_founder_qualified_opp_to_win_pct']||provenance.conversion);
      if(!pick(c.non_founder_wins_trailing_12m,c.non_founder_qualified_opps_trailing_12m,'non_founder_counts') && !(credible&&supplied(c.non_founder_qualified_opp_to_win_pct,'non_founder_supplied'))) {
        pick(c.closed_won_trailing_12m,c.qualified_opps_trailing_12m,'all_seller_counts') || supplied(c.qualified_opp_to_win_pct,'all_seller_supplied');
        if(rate!==null && (first||r.founder_primary_seller_share_pct!==0||c.includes_founder!==false)) {scenario=true;reason='founder_inclusive';}
      }
      if(pivot&&rate!==null) {scenario=true;reason='pre_change_history';}
    }
    if(input.decision.new_ae_market_same_as_history!=='yes'&&rate!==null) {scenario=true;reason=input.decision.new_ae_market_same_as_history==='no'?'new_market':'market_transferability_unconfirmed';}
    if(evidenceStageConflict(input)&&rate!==null){scenario=true;reason='stage_basis_conflict';}
    const sample=denominator===null?'unknown':denominator<policy.conversionSample.veryThinBelow?'very_thin':denominator<policy.conversionSample.thinBelow?'thin':'not_thin';
    if(sample==='very_thin'||sample==='thin')warnings.push({code:'thin_conversion_sample',sample,denominator});
    if(scenario)assumptions.push({code:'scenario_conversion',reason,message:'Historical conversion is an illustrative scenario, not proven transferable performance.'});
    return {value:rate,denominator,source,scenario_only:scenario,transferability_assumption:reason,sample,assumptions,warnings,trace:{formula:source.endsWith('counts')?'wins / qualified opportunities':'supplied company conversion',inputs:Input.copy(c)}};
  }
  function evidenceStageConflict(input) {
    const stage=input.economics.qualified_stage_definition;
    return input.demand.pipeline_stage_basis!=null&&stage!=null&&input.demand.pipeline_stage_basis!==stage || input.conversion.qualified_stage_definition!=null&&stage!=null&&input.conversion.qualified_stage_definition!==stage;
  }
  function calculateNonDuplicatedFounderContribution(input) {
    const t=input.current_team,founderIn=t.founder_in_existing_team===true||(t.sellers||[]).some(s=>s.is_founder===true);
    if(founderIn&&!t.founder_contribution_explicitly_distinct)return {value:0,assumptions:[{code:'founder_already_in_team',message:'Founder capacity is already in the current-team plan.'}]};
    if(t.founder_committed_new_arr===0||t.founder_expected_to_remain_seller===false)return {value:0,assumptions:[]};
    if(t.founder_expected_to_remain_seller!==true)return {value:null,assumptions:[],missing:'current_team.founder_expected_to_remain_seller'};
    return {value:value(t.founder_committed_new_arr),assumptions:[]};
  }
  function testEconomicNeed({revenueGap,hireCapacity,policy=DEFAULT_POLICY}) {
    const gap=value(revenueGap),contribution=value(hireCapacity),ratio=divide(gap,contribution);
    const state=gap===null?'unknown':gap===0?'none':ratio===null?'unknown':ratio>=policy.economic.fullUseThreshold?'supported':ratio>=policy.economic.partialUseThreshold?'partial':'weak';
    return {state,gap,contribution,ratio,seat_utilization:ratio===null?null:Math.min(ratio,1),outcome_determinative:!(contribution===0&&gap!==null)};
  }
  function testDemandSufficiency({allocatable,required,policy=DEFAULT_POLICY}) {
    const allocated=value(allocatable),requirement=value(required),coverage=divide(allocated,requirement);
    return {state:coverage===null?'unknown':coverage>=policy.demand.sufficientThreshold?'sufficient':coverage>=policy.demand.nearThreshold?'near':'short',coverage,required:requirement,allocatable:allocated};
  }
  // Monthly creation sufficiency (§§4.22–4.23). A zero requirement needs no
  // creation; a zero observed rate is a known zero (ratio 0), never unknown.
  function testCreationSufficiency({observed,required,unbounded=false,policy=DEFAULT_POLICY}) {
    const obs=value(observed),req=value(required);
    if(unbounded)return {state:'unbounded',ratio:null,observed:obs,required:null};
    if(req===0)return {state:'not_required',ratio:null,observed:obs,required:0};
    const ratio=divide(obs,req);
    return {state:ratio===null?'unknown':ratio>=policy.demand.sufficientThreshold?'sufficient':'short',ratio,observed:obs,required:req};
  }
  function testTiming(input,hireCapacity,policy) {
    const start=Input.day(input.proposed_ae.proposed_start_date),end=Input.day(input.target.target_period_end),need=Input.day(input.timing.revenue_needed_by_date),first=Input.day(hireCapacity.first_contribution_date);
    let state='compatible',reason=null;
    if(start===null||end===null||hireCapacity.value===null)state='unknown';
    else if(start>end){state='incompatible';reason='late_start';}
    else if(hireCapacity.value===0||(need!==null&&(first===null||need<first))){state='incompatible';reason='sales_cycle_timing';}
    else if(!number(input.economics.average_sales_cycle_days)||input.economics.sales_cycle_definition===null)state='unknown';
    else if(input.economics.sales_cycle_definition!=='qualified_opportunity_to_close'){state='tight';reason='cycle_definition';}
    const decisionDay=Input.day(input.timing.decision_date),lead=input.timing.recruiting_lead_time_days;
    const recruitingConflict=decisionDay!==null&&number(lead)&&start!==null&&start<decisionDay+lead;
    if(recruitingConflict&&state==='compatible'){state='tight';reason='recruiting_plausibility';}
    const companyFirst=Input.day(input.timing.first_revenue_expected_by_company);
    const plausibilityDate=start===null||!number(input.economics.average_sales_cycle_days)?null:start+input.economics.average_sales_cycle_days;
    const earlyExpectation=companyFirst!==null&&plausibilityDate!==null&&companyFirst<plausibilityDate&&input.demand.allocatable_current_pipeline===null;
    if(earlyExpectation&&state==='compatible'){state='tight';reason='first_close_plausibility';}
    return {state,reason,first_contribution_date:hireCapacity.first_contribution_date||null,latest_viable_start:null,recruiting_conflict:recruitingConflict,cycle_definition:input.economics.sales_cycle_definition};
  }
  function existingWinRate(input,selected) {
    const c=input.conversion;
    if(number(c.existing_team_qualified_opp_to_win_pct))return c.existing_team_qualified_opp_to_win_pct;
    if(c.material_gtm_change_date!=null||c.post_change_wins!=null||c.post_change_qualified_opps!=null)return selected.value;
    if(number(c.closed_won_trailing_12m)&&c.qualified_opps_trailing_12m>0)return c.closed_won_trailing_12m/c.qualified_opps_trailing_12m;
    if(number(c.qualified_opp_to_win_pct))return c.qualified_opp_to_win_pct;
    return selected.value;
  }
  function analyze(input,policy,{winRateOverride=null,mode=null}={}) {
    const winRate=selectTransferableWinRate(input,policy);
    if(winRateOverride!==null) {winRate.value=winRateOverride;winRate.source='sensitivity_scenario';}
    const existing=MathEngine.calculateExistingCapacity(input,policy);
    const founder=calculateNonDuplicatedFounderContribution(input);
    const target=value(input.target.new_arr_target_horizon);
    const basisInvalid=input.validation.clarifications.some(v=>['metric_basis_conflict','expansion_basis_conflict','renewal_basis_conflict'].includes(v.code));
    const raw=!basisInvalid&&target!==null&&existing.value!==null&&founder.value!==null?target-existing.value-founder.value:null;
    const gap=raw===null?null:Math.max(0,raw);
    const hireCapacity=MathEngine.calculateHireContribution(input,winRate,policy,mode||undefined);
    const economic=testEconomicNeed({revenueGap:gap,hireCapacity,policy});
    const funnel=MathEngine.calculateFunnelRequirements({contribution:basisInvalid?null:hireCapacity,acv:input.economics.average_acv,winRate,meetingToOpp:input.conversion.meeting_to_qualified_opp_pct});
    const demandPool=MathEngine.calculateDemandPool(input,policy);
    let teamRate=existingWinRate(input,winRate);
    if(winRateOverride!==null&&teamRate===selectTransferableWinRate(input,policy).value)teamRate=winRateOverride;
    const existingDemand=existing.value===0?0:divide(existing.value,teamRate);
    // A separately selling founder consumes supply too. No duplicated founder reservation.
    const founderDemand=founder.value===0?0:divide(founder.value,teamRate);
    const totalExistingDemand=existingDemand!==null&&founderDemand!==null?existingDemand+founderDemand:null;
    const allocation=MathEngine.calculateAllocatablePipeline({demandPool,existingDemand:totalExistingDemand,input});
    const demand=testDemandSufficiency({allocatable:allocation,required:funnel.pipeline_required,policy});
    if(winRate.value===0&&hireCapacity.value>0) {demand.state='short';demand.coverage=0;demand.unbounded_requirement=true;}
    Object.assign(demand,Object.fromEntries(Object.entries(input.demand).filter(([k])=>['shortfall_closure_supported','closure_amount','closure_date','needed_by_date'].includes(k))));
    // Monthly creation (§§4.22–4.23) is attached to the demand test BEFORE any
    // decision runs, so creation shortfalls reach Decision.decide().
    const eligible=demandPool.eligible_creation_months;
    const currentAlloc=allocation.current_allocatable;
    // Summation rounding in the requirement is not a remaining gap: within the
    // policy's numerical-equality tolerance (relative, no business materiality) it is 0.
    const pipelineGap=funnel.pipeline_required!==null&&currentAlloc!==null?(funnel.pipeline_required-currentAlloc>policy.validation.equalityTolerance*Math.max(Math.abs(funnel.pipeline_required),Math.abs(currentAlloc))?funnel.pipeline_required-currentAlloc:0):null;
    const creationUnboundedReason=funnel.statuses.pipeline_required==='unbounded'?'zero_conversion':pipelineGap!==null&&pipelineGap>0&&eligible===0?'no_eligible_creation_month':null;
    const creationUnbounded=creationUnboundedReason!==null;
    const requiredMonthly=pipelineGap===0?0:creationUnbounded?null:divide(pipelineGap,eligible);
    const requiredOpps=requiredMonthly===0?0:divide(requiredMonthly,input.economics.average_acv);
    // A supplied monthly series takes precedence over the single monthly value,
    // exactly as in the demand pool: observed creation is the series' eligible-window average.
    const seriesSupplied=Array.isArray(input.demand.monthly_pipeline_series);
    const observedMonthly=seriesSupplied?(demandPool.future!==null&&number(eligible)&&eligible>0?demandPool.future/eligible:null):value(input.demand.monthly_qualified_pipeline_created_value);
    const observedOpps=value(input.demand.monthly_qualified_opps_created);
    const pipelineCreation=testCreationSufficiency({observed:observedMonthly,required:requiredMonthly,unbounded:creationUnbounded,policy});
    const opportunityCreation=testCreationSufficiency({observed:observedOpps,required:requiredOpps,unbounded:creationUnbounded,policy});
    const creationField=seriesSupplied?'demand.monthly_pipeline_series':'demand.monthly_qualified_pipeline_created_value';
    const requirementMissing=[];
    // Name only root causes not already reported elsewhere (contradictions and
    // weighted pipeline are clarifications; an invalid basis nulls the funnel).
    if(pipelineGap===null&&!creationUnbounded) {
      if(funnel.pipeline_required===null&&winRate.value===null)requirementMissing.push('conversion.qualified_opportunity_win_rate');
      if(currentAlloc===null&&allocation.warnings.includes('unknown_current_pipeline_pool'))requirementMissing.push('demand.current_qualified_pipeline_value');
      if(currentAlloc===null&&allocation.warnings.includes('unknown_current_pipeline_allocation'))requirementMissing.push('demand.allocatable_current_qualified_pipeline');
      if(currentAlloc===null&&allocation.warnings.includes('unknown_current_reservation'))requirementMissing.push('demand.current_pipeline_reserved_for_existing_team');
    }
    if(pipelineGap!==null&&pipelineGap>0&&!number(eligible))requirementMissing.push(number(input.economics.average_sales_cycle_days)?'economics.sales_cycle_definition':'economics.average_sales_cycle_days');
    const pipelineCreationMissing=pipelineCreation.state!=='unknown'?[]:unique([...requirementMissing,...(observedMonthly===null?[creationField]:[])]);
    const opportunityCreationMissing=opportunityCreation.state!=='unknown'?[]:unique([...requirementMissing,...(requiredMonthly!==null&&requiredMonthly>0&&!(number(input.economics.average_acv)&&input.economics.average_acv>0)?['economics.average_acv']:[]),...(observedOpps===null?['demand.monthly_qualified_opps_created']:[])]);
    Object.assign(demand,{required_monthly_pipeline_creation:requiredMonthly,required_monthly_opps:requiredOpps,observed_monthly_pipeline_creation:observedMonthly,observed_monthly_opps_created:observedOpps,creation_window_start:demandPool.trace.horizon_start,creation_unbounded_reason:creationUnboundedReason,pipeline_creation_ratio:pipelineCreation.ratio,pipeline_creation_state:pipelineCreation.state,pipeline_creation_missing:pipelineCreationMissing,opportunity_creation_ratio:opportunityCreation.ratio,opportunity_creation_state:opportunityCreation.state,opportunity_creation_missing:opportunityCreationMissing,creation_cutoff_date:demandPool.creation_cutoff_date,allocation_uncertain:allocation.surplus===null});
    const repeatability=Decision.classifyRepeatability(input,winRate,policy,demand);
    const timing=testTiming(input,hireCapacity,policy);
    const management=Decision.classifyManagement(input,policy);
    const missing=[];
    const requireValue=(v,path)=>{if(v===null)missing.push(path);};
    requireValue(target,'target.new_arr_target_horizon');requireValue(existing.value,'current_team.capacity');requireValue(founder.value,'current_team.founder_committed_new_arr');
    requireValue(value(input.proposed_ae.annual_quota),'proposed_ae.annual_quota');
    requireValue(Input.day(input.proposed_ae.proposed_start_date),'proposed_ae.proposed_start_date');
    requireValue(Input.day(input.target.target_period_start),'target.target_period_start');requireValue(Input.day(input.target.target_period_end),'target.target_period_end');
    if(input.proposed_ae.ramp_months===null&&!input.proposed_ae.monthly_ramp_schedule)missing.push('proposed_ae.ramp_months_or_schedule');
    if(winRate.value===null)missing.push('conversion.qualified_opportunity_win_rate');
    if(allocation.value===null)missing.push('demand.allocatable_qualified_pipeline');
    if(input.economics.average_sales_cycle_days===null)missing.push('economics.average_sales_cycle_days');
    // Unknown answers to a blocking question cannot turn a negative result into
    // a more permissive conditional hire (the §8.8 / §14 missingness invariant).
    const blockerUnknowns=[];
    if(allocation.value===null&&hireCapacity.value!==0)blockerUnknowns.push('demand.allocatable_qualified_pipeline');
    // Late-stage evidence blocks only when it could decide the case: dependence
    // already established by other evidence makes the answer non-determinative.
    if(!repeatability.first_ae&&repeatability.founder_late_stage_class==='unknown') {
      if(repeatability.state==='founder_dependent')missing.push('repeatability.founder_required_late_stage');
      else blockerUnknowns.push('repeatability.founder_required_late_stage');
    }
    // Without the full pool, the existing-team surplus cap disappears. When the
    // known part of the pool cannot prove that cap non-binding, the missing pool
    // input is outcome-determinative: removing it must not lift a short-demand
    // result into a conditional hire (§8.8 / §14 invariant 7).
    if(demandPool.value===null&&input.demand.pipeline_value_type==='unweighted'&&allocation.value!==null&&hireCapacity.value!==0) {
      const knownPool=(demandPool.current??0)+(demandPool.future??0),share=allocation.trace.share;
      const capNonBinding=totalExistingDemand!==null&&allocation.value<=Math.max(0,knownPool-totalExistingDemand)&&(share===null||share===undefined||allocation.value<=knownPool*share);
      if(!capNonBinding) {
        if(demandPool.current===null)blockerUnknowns.push('demand.current_qualified_pipeline_value');
        if(demandPool.creation_cutoff_date===null)blockerUnknowns.push(number(input.economics.average_sales_cycle_days)?'economics.sales_cycle_definition':'economics.average_sales_cycle_days');
        else if(demandPool.future===null)blockerUnknowns.push(creationField);
      }
    }
    for(const field of ['direct_manager_exists','onboarding_owner_named','weekly_pipeline_review_capacity'])if(input.management[field]===null)blockerUnknowns.push('management.'+field);
    missing.push(...blockerUnknowns);
    const basisUnknowns=[];
    for(const [group,fields] of [['target',['target_metric','target_includes_expansion','target_includes_renewal']],['proposed_ae',['quota_metric','quota_includes_expansion']],['economics',['acv_metric']],['demand',['pipeline_metric']]])for(const field of fields)if(input[group][field]===null)basisUnknowns.push(group+'.'+field);
    missing.push(...basisUnknowns);
    // Unknown creation sufficiency is not a gate failure, but it is decision-critical evidence.
    missing.push(...pipelineCreationMissing,...opportunityCreationMissing);
    const unknownCore=[economic.state==='unknown'&&economic.outcome_determinative,demand.state==='unknown',repeatability.state==='unknown',timing.state==='unknown'||management.state==='unknown'].filter(Boolean).length;
    const essentialUnknown=target===null||existing.value===null||founder.value===null||input.proposed_ae.annual_quota===null||Input.day(input.proposed_ae.proposed_start_date)===null||Input.day(input.target.target_period_start)===null||Input.day(input.target.target_period_end)===null||(input.proposed_ae.ramp_months===null&&!input.proposed_ae.monthly_ramp_schedule);
    const onlyRepeatabilityBlocks=blockerUnknowns.length>0&&blockerUnknowns.every(item=>item.indexOf('repeatability.')===0)&&!essentialUnknown&&!basisUnknowns.length&&!(winRate.value===null&&allocation.value===null)&&unknownCore<policy.evidence.unknownCoreTestsLimit&&input.validation.clarifications.length===0&&!missing.some(item=>/conversion|capacity/.test(item));
    const gate={primary_constraint:onlyRepeatabilityBlocks?'transferability':undefined,passes:!essentialUnknown&&!blockerUnknowns.length&&!basisUnknowns.length&&!(winRate.value===null&&allocation.value===null)&&unknownCore<policy.evidence.unknownCoreTestsLimit&&input.validation.clarifications.length===0,missing:unique(missing),unknown_core_tests:unknownCore};
    const ote=number(input.proposed_ae.base_salary)&&number(input.proposed_ae.variable_comp_target)?input.proposed_ae.base_salary+input.proposed_ae.variable_comp_target:null;
    const loaded=ote!==null&&number(input.proposed_ae.other_loaded_cost_estimate)?ote+input.proposed_ae.other_loaded_cost_estimate:null;
    const gp=hireCapacity.value!==null&&number(input.economics.gross_margin_pct)?hireCapacity.value*input.economics.gross_margin_pct:null;
    const calculations={target,existing_capacity:existing.value,nominal_existing_capacity:existing.nominal_capacity,existing_finance_plan:existing.finance_plan,founder_contribution:founder.value,residual_gap_raw:raw,residual_gap:gap,proposed_ae_contribution:hireCapacity.value,months_available:hireCapacity.months_available,gap_coverage:divide(hireCapacity.value,gap),seat_utilization_against_gap:economic.seat_utilization,wins_required:funnel.wins_required,practical_wins_required:funnel.practical_wins_required,qualified_opps_required:funnel.opps_required,qualified_pipeline_required:funnel.pipeline_required,meetings_required:funnel.meetings_required,pipeline_pool:demandPool.value,existing_pipeline_required:existingDemand,founder_pipeline_required:founderDemand,theoretical_pipeline_surplus:allocation.surplus,allocatable_pipeline:allocation.value,allocatable_current_pipeline:currentAlloc,demand_coverage:demand.coverage,eligible_creation_months:eligible,required_monthly_pipeline_creation:requiredMonthly,required_monthly_opps:requiredOpps,observed_monthly_pipeline_creation:observedMonthly,pipeline_creation_ratio:pipelineCreation.ratio,monthly_pipeline_creation_gap:requiredMonthly!==null&&observedMonthly!==null?Math.max(0,requiredMonthly-observedMonthly):null,opportunity_creation_ratio:opportunityCreation.ratio,monthly_opportunity_creation_gap:requiredOpps!==null&&observedOpps!==null?Math.max(0,requiredOpps-observedOpps):null,ote,loaded_cost:loaded,gross_profit_from_modeled_bookings:gp,gross_profit_to_loaded_cost:divide(gp,loaded)};
    const context={input,winRate,existing,founder,hireCapacity,economic,demand,repeatability,timing,management,evidenceGate:gate,calculations,validation:input.validation,sensitivities:[]};
    context.confidence=Decision.classifyEvidenceConfidence(input,context,policy);
    context.decision=Decision.decide(context,policy);
    context.details={funnel,demandPool,allocation};
    return context;
  }
  function runSensitivity(input,policy=DEFAULT_POLICY,baseContext=null) {
    const base=baseContext||analyze(input,policy),rows=[];
    const mode=base.hireCapacity.mode;
    for(const variable of policy.sensitivity.variables) {
      for(const direction of [-1,0,1]) {
        const changed=Input.copy(input),s=policy.sensitivity;let changedValue=null,override=null,available=true;
        if(variable==='acv') {available=number(input.economics.average_acv);changedValue=available?input.economics.average_acv*(1+direction*s.relativeChange):null;changed.economics.average_acv=changedValue;}
        if(variable==='win_rate') {available=number(base.winRate.value);changedValue=available?Math.max(0,Math.min(1,base.winRate.value*(1+direction*s.relativeChange))):null;override=changedValue;}
        if(variable==='ramp_duration') {available=number(input.proposed_ae.ramp_months)&&!input.proposed_ae.monthly_ramp_schedule;changedValue=available?Math.max(policy.validation.rampMin,Math.min(policy.validation.rampMax,input.proposed_ae.ramp_months+direction*s.rampMonthsChange)):null;changed.proposed_ae.ramp_months=changedValue;}
        if(variable==='sales_cycle') {available=number(input.economics.average_sales_cycle_days);changedValue=available?Math.max(policy.validation.cycleMinDays,input.economics.average_sales_cycle_days+direction*s.cycleDaysChange):null;changed.economics.average_sales_cycle_days=changedValue;}
        if(variable==='pipeline_creation') {available=number(input.demand.monthly_qualified_pipeline_created_value)||Array.isArray(input.demand.monthly_pipeline_series);changedValue=number(input.demand.monthly_qualified_pipeline_created_value)?input.demand.monthly_qualified_pipeline_created_value*(1+direction*s.relativeChange):null;changed.demand.monthly_qualified_pipeline_created_value=changedValue;if(Array.isArray(changed.demand.monthly_pipeline_series))changed.demand.monthly_pipeline_series=changed.demand.monthly_pipeline_series.map(v=>number(v)?v*(1+direction*s.relativeChange):null);}
        if(variable==='start_date') {available=Input.day(input.proposed_ae.proposed_start_date)!==null;changedValue=available?Input.iso(Input.day(input.proposed_ae.proposed_start_date)+direction*s.startDaysChange):null;changed.proposed_ae.proposed_start_date=changedValue;}
        const evaluated=available?(direction===0?base:analyze(changed,policy,{winRateOverride:override,mode})):null;
        const calc=evaluated?.calculations;
        const rank=policy.decisionRank;
        rows.push({variable,change:direction,value:changedValue,label:'Model scenario; not a market expectation',status:available?'calculated':'unknown',reason:!available&&variable==='ramp_duration'&&input.proposed_ae.monthly_ramp_schedule?'Company schedule supplied; duration cannot be changed without a new company schedule.':null,proposed_ae_contribution:calc?.proposed_ae_contribution??null,qualified_pipeline_required:calc?.qualified_pipeline_required??null,demand_coverage:calc?.demand_coverage??null,timing_status:evaluated?.timing.state??'unknown',decision_state:evaluated?.decision.state??null,primary_constraint:evaluated?.decision.primary_constraint??null,decision_changed:evaluated?evaluated.decision.state!==base.decision.state:false,deterioration:evaluated?rank[evaluated.decision.state]<rank[base.decision.state]:false,absolute_change:calc&&calc.qualified_pipeline_required!==null&&base.calculations.qualified_pipeline_required!==null?Math.abs(calc.qualified_pipeline_required-base.calculations.qualified_pipeline_required):null});
      }
    }
    return rows;
  }
  function runSensitivityReview(input,policy,base) {
    const rows=[];
    for(const variable of ['acv','win_rate','pipeline_creation','ramp_duration','sales_cycle'])for(const direction of [-1,1]) {
      const changed=Input.copy(input),factor=1+direction*policy.sensitivity.enhancedReviewRelativeChange;
      let original=null,override=null;
      if(variable==='acv'){original=input.economics.average_acv;changed.economics.average_acv=number(original)?original*factor:null;}
      if(variable==='win_rate'){original=base.winRate.value;override=number(original)?Math.max(0,Math.min(1,original*factor)):null;}
      if(variable==='pipeline_creation'){original=input.demand.monthly_qualified_pipeline_created_value;changed.demand.monthly_qualified_pipeline_created_value=number(original)?original*factor:null;if(Array.isArray(changed.demand.monthly_pipeline_series))changed.demand.monthly_pipeline_series=changed.demand.monthly_pipeline_series.map(v=>number(v)?v*factor:null);}
      if(variable==='ramp_duration'){original=input.proposed_ae.monthly_ramp_schedule?null:input.proposed_ae.ramp_months;changed.proposed_ae.ramp_months=number(original)?Math.max(policy.validation.rampMin,Math.min(policy.validation.rampMax,original*factor)):null;}
      if(variable==='sales_cycle'){original=input.economics.average_sales_cycle_days;changed.economics.average_sales_cycle_days=number(original)?Math.max(policy.validation.cycleMinDays,original*factor):null;}
      if(!number(original))continue;
      const result=analyze(changed,policy,{winRateOverride:override,mode:base.hireCapacity.mode});
      rows.push({variable,change:direction*policy.sensitivity.enhancedReviewRelativeChange,value:variable==='win_rate'?override:original*factor,modest_change:true,decision_changed:result.decision.state!==base.decision.state,deterioration:policy.decisionRank[result.decision.state]<policy.decisionRank[base.decision.state],decision_state:result.decision.state,primary_constraint:result.decision.primary_constraint,proposed_ae_contribution:result.calculations.proposed_ae_contribution,qualified_pipeline_required:result.calculations.qualified_pipeline_required,demand_coverage:result.calculations.demand_coverage,timing_status:result.timing.state});
    }
    return rows;
  }
  function underwrite(raw,policy=DEFAULT_POLICY,options={}) {
    const frozenPolicy=Input.copy(policy),input=Input.normalizeInput(raw,frozenPolicy);
    if(evidenceStageConflict(input))input.validation.clarifications.push({code:'stage_basis_conflict',fields:['economics.qualified_stage_definition','demand.pipeline_stage_basis','conversion.qualified_stage_definition'],message:'Conversion denominator and pipeline must describe the same qualified stage.'});
    const timestamp=options.calculation_timestamp??raw.calculation_timestamp??null;
    const suppliedPool=input.validation.fatal_errors.length?{value:null}:MathEngine.calculateDemandPool(input,frozenPolicy);
    if(number(suppliedPool.value)&&number(input.demand.allocatable_qualified_pipeline)&&input.demand.allocatable_qualified_pipeline>suppliedPool.value)input.validation.clarifications.push({code:'allocation_exceeds_pipeline_pool',fields:['demand.allocatable_qualified_pipeline'],message:'Declared allocation exceeds the cycle-eligible pipeline pool; reconcile allocation and source data.'});
    const metadata={engine_version:ENGINE_VERSION,policy_version:frozenPolicy.version,schema_version:input.schema_version,calculation_timestamp:timestamp};
    const audit={policy_snapshot:frozenPolicy,input_snapshot:Input.copy(input),calculation_timestamp:timestamp,formulas:{}};
    if(input.validation.fatal_errors.length)return freeze({...metadata,status:'validation_stop',decision:{state:null,confidence:'insufficient',primary_constraint:'data_conflict',secondary_constraints:[],can_decide:false},tests:{},calculations:{},sensitivity:[],conditions:[],evidence_gaps:input.validation.fatal_errors,assumptions:[],warnings:input.validation.warnings,validation:input.validation,audit});
    const unknownRamp=input.proposed_ae.ramp_definition===null||input.proposed_ae.ramp_definition==='unknown';
    const context=analyze(input,frozenPolicy,{mode:unknownRamp?'closed_bookings':null});
    if(unknownRamp) {context.hireCapacity.ambiguous=true;context.confidence=Decision.classifyEvidenceConfidence(input,context,frozenPolicy);context.decision=Decision.decide(context,frozenPolicy);}
    const sensitivities=runSensitivity(input,frozenPolicy,context);
    const sensitivityReview=runSensitivityReview(input,frozenPolicy,context);
    context.sensitivities=[...sensitivities,...sensitivityReview];
    context.confidence=Decision.classifyEvidenceConfidence(input,context,frozenPolicy);
    context.decision=Decision.decide(context,frozenPolicy);
    let branches=null;
    if(unknownRamp) {
      const alternate=analyze(input,frozenPolicy,{mode:'pipeline_productivity'});
      branches={closed_bookings:{contribution:context.hireCapacity.value,decision:context.decision.state,timing:context.timing.state},pipeline_productivity:{contribution:alternate.hireCapacity.value,decision:alternate.decision.state,timing:alternate.timing.state}};
      if(context.evidenceGate.passes&&context.decision.state!==alternate.decision.state){context.decision.state='conditional';context.decision.primary_constraint='ramp_ambiguity';}
      if(context.decision.state==='supported')context.decision.state='conditional';
    }
    // A zero observed conversion must remain an unbounded requirement, not missing evidence.
    if(context.winRate.value===0&&context.evidenceGate.passes&&context.hireCapacity.value>0){context.decision.state='not_yet_supported';context.decision.primary_constraint='pipeline_supply';}
    if(context.timing.state!=='compatible') {
      const start=Input.day(input.target.target_period_start),end=Input.day(input.target.target_period_end),need=Input.day(input.timing.revenue_needed_by_date);
      if(start!==null&&end!==null) {
        const limit=need===null?end:Math.min(need,end);
        // The latest viable start can precede the horizon (pipeline generated
        // before it can close inside it). Floor: a start whose first positive
        // ramp month falls on the last eligible generation day (deadline minus the
        // qualified-cycle lag) is always viable, so the latest viable start is never
        // earlier than horizon start - lag - (first positive ramp month + 1 month of
        // anniversary slack). Closed-bookings ramps carry no lag (no second delay).
        const schedule=input.proposed_ae.monthly_ramp_schedule;
        const firstPositiveIndex=Array.isArray(schedule)?schedule.findIndex(v=>v>0):0;
        const firstPositiveMonth=firstPositiveIndex===-1?schedule.length:firstPositiveIndex;
        const lag=context.hireCapacity.mode==='pipeline_productivity'&&number(input.economics.average_sales_cycle_days)?Math.ceil(input.economics.average_sales_cycle_days):0;
        const floor=Math.max(Input.day('0001-01-01'),start-lag-(firstPositiveMonth+1)*31);
        const probe=Input.copy(input);probe.target.target_period_end=Input.iso(limit);
        const positiveBy=day=>{
          probe.proposed_ae.proposed_start_date=Input.iso(day);
          return MathEngine.calculateHireContribution(probe,context.winRate,frozenPolicy,context.hireCapacity.mode).value>0;
        };
        // Binary search needs "positive by the deadline" to be monotone in the start
        // date. That holds for linear ramps and nondecreasing schedules ending at 1;
        // any other supplied schedule is scanned day by day from the deadline down.
        const neverPositive=Array.isArray(schedule)&&firstPositiveIndex===-1;
        const monotoneRamp=!Array.isArray(schedule)||(schedule.every((v,i)=>i===0||v>=schedule[i-1])&&schedule[schedule.length-1]===1);
        let last=null;
        if(limit>=start&&!neverPositive) {
          if(monotoneRamp) {
            let low=floor,high=limit;
            while(low<=high) {
              const mid=Math.floor((low+high)/2);
              if(positiveBy(mid)){last=mid;low=mid+1;}else high=mid-1;
            }
          } else for(let day=limit;day>=floor;day-=1)if(positiveBy(day)){last=day;break;}
        }
        context.timing.latest_viable_start=last===null?null:Input.iso(last);
        context.timing.latest_start_criterion='positive modeled contribution by the required date; does not promise to close the full revenue gap';
        context.timing.latest_start_search_floor=Input.iso(floor);
      }
    }
    const conditions=Decision.generateConditions(context,context.decision,frozenPolicy);
    if(unknownRamp)conditions.push({code:'ramp_ambiguity',current:branches,required:'Confirm whether ramp describes closed bookings or qualified pipeline productivity.',gap:null,deadline:input.proposed_ae.proposed_start_date,depends_on:['proposed_ae.ramp_definition'],evidence_required:['Company ramp definition'],retest_trigger:'Re-run when ramp meaning is confirmed.'});
    const {funnel,demandPool,allocation}=context.details;
    const assumptions=unique([...(context.winRate.assumptions||[]),...(context.existing.assumptions||[]),...(context.founder.assumptions||[]),...(context.hireCapacity.assumptions||[]),...(demandPool.assumptions||[]),...(allocation.assumptions||[])]);
    const warnings=unique([...input.validation.warnings,...(context.winRate.warnings||[]),...(context.hireCapacity.warnings||[]),...(demandPool.warnings||[]),...(allocation.warnings||[])]);
    // A late-stage gap that cannot change the decision (dependence already established)
    // is informational; an unrecognized answer is named as such, not as missing.
    const lateStageField='repeatability.founder_required_late_stage',lateStageValue=input.repeatability.founder_required_late_stage;
    const evidenceGaps=context.evidenceGate.missing.map(field=>field===lateStageField?{field,severity:context.repeatability.state==='founder_dependent'?'informational':'decision_critical',required:lateStageValue==null?'Supply '+field:'Replace the unrecognized value with rarely, sometimes, often, almost_always or unknown.'}:{field,severity:'decision_critical',required:'Supply '+field});
    input.validation.clarifications.forEach(issue=>evidenceGaps.push({field:issue.fields.join(', '),severity:'decision_critical',required:issue.message}));
    const formulas={target:'supplied target',existing_capacity:'sum(seller quota / 12 × active month fractions × supplied attainment)',nominal_existing_capacity:'sum(seller quota / 12 × active month fractions)',existing_finance_plan:'supplied finance plan; retained separately',founder_contribution:'separate founder commitment only if remaining seller and not in current team',residual_gap_raw:'target - existing_capacity - founder_contribution',residual_gap:'max(0, residual_gap_raw)',proposed_ae_contribution:'sum(quota / 12 × ramp factor × eligible month fraction)',months_available:'sum(day fractions of active months inside horizon)',gap_coverage:'proposed_ae_contribution / residual_gap when gap > 0',seat_utilization_against_gap:'min(residual_gap / proposed_ae_contribution, 1)',wins_required:'proposed_ae_contribution / average_acv',practical_wins_required:'ceil(wins_required)',qualified_opps_required:'wins_required / transferable_win_rate',qualified_pipeline_required:'proposed_ae_contribution / transferable_win_rate; unbounded at zero rate',meetings_required:'qualified_opps_required / meeting_to_qualified_opp_pct',pipeline_pool:'eligible current pipeline + future pipeline that can close inside horizon',existing_pipeline_required:'existing_capacity / existing_team_win_rate',founder_pipeline_required:'separate founder_contribution / existing_team_win_rate',theoretical_pipeline_surplus:'max(0, pipeline_pool - existing_pipeline_required - founder_pipeline_required)',allocatable_pipeline:'minimum supported explicit allocation measures and surplus cap',allocatable_current_pipeline:'minimum(explicit current allocation, current pool × explicit share) when every claim + current existing-team reservation <= current cycle-eligible pool (a positive explicit claim also needs a known reservation unless the existing team has no pipeline demand or the claim fits within an explicit share of the current pool); 0 for a zero claim; capped by allocatable_pipeline; otherwise unknown (never future creation)',demand_coverage:'allocatable_pipeline / qualified_pipeline_required',eligible_creation_months:'sum(month fractions whose qualified pipeline can close by horizon end)',required_monthly_pipeline_creation:'max(0, qualified_pipeline_required - allocatable_current_pipeline) / eligible_creation_months; null when unknown or unbounded (no eligible creation month)',required_monthly_opps:'required_monthly_pipeline_creation / average_acv',observed_monthly_pipeline_creation:'supplied monthly qualified pipeline creation; with a supplied monthly series, the series creation inside the eligible window / eligible_creation_months',pipeline_creation_ratio:'observed_monthly_pipeline_creation / required_monthly_pipeline_creation; null when the requirement is zero, unknown or unbounded',monthly_pipeline_creation_gap:'max(0, required_monthly_pipeline_creation - observed_monthly_pipeline_creation)',opportunity_creation_ratio:'observed monthly qualified opportunities created / required_monthly_opps; null when the requirement is zero, unknown or unbounded',monthly_opportunity_creation_gap:'max(0, required_monthly_opps - observed monthly qualified opportunities created)',ote:'base_salary + variable_comp_target',loaded_cost:'ote + supplied other_loaded_cost_estimate',gross_profit_from_modeled_bookings:'proposed_ae_contribution × gross_margin_pct',gross_profit_to_loaded_cost:'gross_profit_from_modeled_bookings / loaded_cost'};
    Object.entries(context.calculations).forEach(([key,val])=>{audit.formulas[key]={formula:formulas[key],value:val,inputs:'audit.input_snapshot',policy:'audit.policy_snapshot'};});
    audit.math={conversion:context.winRate.trace,existing:context.existing.trace,hire:context.hireCapacity.trace,funnel:funnel.trace,demand:demandPool.trace,allocation:allocation.trace};
    return freeze({...metadata,status:'complete',decision:context.decision,tests:{economic_need:context.economic,demand_sufficiency:context.demand,repeatability:context.repeatability,timing_management:{state:context.timing.state,timing:context.timing,management:context.management}},calculations:context.calculations,conversion:context.winRate,confidence:context.confidence,calculation_statuses:funnel.statuses,ramp_interpretations:branches,contribution_range:branches&&branches.closed_bookings.contribution!==null&&branches.pipeline_productivity.contribution!==null?[Math.min(branches.closed_bookings.contribution,branches.pipeline_productivity.contribution),Math.max(branches.closed_bookings.contribution,branches.pipeline_productivity.contribution)]:null,sensitivity:sensitivities,sensitivity_review:sensitivityReview,enhanced_review_required:sensitivityReview.some(row=>row.decision_changed)||unknownRamp||context.winRate.scenario_only||input.validation.clarifications.length>0,sensitivity_ranking:[...sensitivities].filter(s=>s.change!==0&&s.status==='calculated').sort((a,b)=>Number(b.decision_changed)-Number(a.decision_changed)||(b.absolute_change||0)-(a.absolute_change||0)),conditions,evidence_gaps:evidenceGaps,assumptions,warnings,validation:input.validation,audit});
  }
  return {engine_version:ENGINE_VERSION,normalizeInput:Input.normalizeInput,validateInput:Input.validateInput,selectTransferableWinRate,calculateNonDuplicatedFounderContribution,...MathEngine,...Decision,testEconomicNeed,testDemandSufficiency,testCreationSufficiency,testTiming,runSensitivity,underwrite};
});
