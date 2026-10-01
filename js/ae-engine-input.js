(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ae-policy.js'));
  else root.AEEngineInput = factory(root.AE_HIRE_POLICY);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DEFAULT_POLICY) {
  'use strict';
  const FIELDS = {
    company: ['currency'],
    decision: ['analysis_horizon_months', 'hire_reason', 'new_ae_market_same_as_history', 'evaluating_first_professional_ae'],
    target: ['target_metric', 'new_arr_target_horizon', 'target_includes_expansion', 'target_includes_renewal', 'target_period_start', 'target_period_end'],
    current_team: ['current_quota_carriers', 'aggregate_annual_quota', 'trailing_team_attainment_pct', 'founder_committed_new_arr', 'founder_in_existing_team', 'founder_expected_to_remain_seller', 'existing_team_committed_new_arr'],
    proposed_ae: ['annual_quota', 'quota_metric', 'quota_includes_expansion', 'proposed_start_date', 'ramp_months', 'ramp_definition', 'monthly_ramp_schedule', 'base_salary', 'variable_comp_target', 'other_loaded_cost_estimate'],
    economics: ['average_acv', 'median_acv', 'gross_margin_pct', 'average_sales_cycle_days', 'sales_cycle_definition', 'qualified_stage_definition', 'acv_metric'],
    conversion: ['non_founder_qualified_opps_trailing_12m', 'non_founder_wins_trailing_12m', 'non_founder_qualified_opp_to_win_pct', 'qualified_opps_trailing_12m', 'closed_won_trailing_12m', 'qualified_opp_to_win_pct', 'meeting_to_qualified_opp_pct', 'conversion_evidence_window_start', 'conversion_evidence_window_end', 'material_gtm_change_date'],
    demand: ['pipeline_value_type', 'pipeline_metric', 'current_qualified_pipeline_value', 'pipeline_likely_open_at_ae_start', 'allocatable_qualified_pipeline', 'allocatable_current_pipeline', 'monthly_qualified_pipeline_created_value', 'monthly_qualified_opps_created', 'territory_reserved_for_new_ae', 'new_ae_pipeline_share_pct', 'pipeline_creation_is_seasonal', 'monthly_pipeline_series', 'current_pipeline_reserved_for_existing_team'],
    repeatability: ['wins_trailing_12m', 'non_founder_wins_trailing_12m', 'founder_primary_seller_share_pct', 'icp_documented', 'qualification_documented', 'discovery_documented', 'sales_stages_documented', 'rep_can_run_discovery_without_founder', 'founder_required_late_stage', 'repeatable_use_cases_count', 'founder_can_articulate_path'],
    timing: ['revenue_needed_by_date', 'recruiting_lead_time_days', 'first_revenue_expected_by_company', 'decision_date'],
    management: ['direct_manager_exists', 'weekly_1to1_capacity', 'weekly_pipeline_review_capacity', 'onboarding_owner_named', 'onboarding_plan_exists', 'manager_is_also_primary_seller']
  };
  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !['__proto__', 'constructor', 'prototype'].includes(k)).map(([k,v]) => [k, copy(v)]));
    return value;
  }
  function day(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const t = Date.parse(s + 'T00:00:00Z');
    return Number.isFinite(t) && new Date(t).toISOString().slice(0,10) === s ? t / 86400000 : null;
  }
  function iso(d) { return new Date(d * 86400000).toISOString().slice(0,10); }
  function monthDate(start, index, endOfMonth) {
    if (day(start) === null || !Number.isInteger(index)) return null;
    const d = new Date(start + 'T00:00:00Z');
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + index - (endOfMonth ? 0 : 1), endOfMonth ? 0 : 1)).toISOString().slice(0,10);
  }
  function normalizeInput(raw = {}, policy = DEFAULT_POLICY) {
    if(raw===null||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('Engine input must be an object.');
    const input = copy(raw);
    input.schema_version = input.schema_version || 'ae-underwriting-1.0';
    input.unknowns = [];
    input.field_status = {};
    input.provenance = input.provenance || {};
    Object.entries(FIELDS).forEach(([group, fields]) => {
      if (!input[group] || typeof input[group] !== 'object' || Array.isArray(input[group])) input[group] = {};
      fields.forEach(field => { if (input[group][field] === undefined) input[group][field] = null; });
    });
    function unwrap(obj, path) {
      Object.keys(obj).forEach(k => {
        const p = path ? path + '.' + k : k;
        let value = obj[k];
        if (value && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value,'status') && Object.hasOwn(value,'value')) {
          const status = value.status;
          if (value.source) input.provenance[p] = value.source;
          obj[k] = status === 'unknown' || status === 'not_applicable' ? null : value.value;
          value = obj[k];
          input.field_status[p] = { value, status, source: input.provenance[p] || 'unknown' };
        }
        if (value === undefined || value === '' || value === 'unknown') obj[k] = null;
        if (obj[k] === null) {
          input.field_status[p] = input.field_status[p] || {value:null,status:'unknown',source:'unknown'};
          input.unknowns.push(p);
        } else if (typeof obj[k] === 'object') unwrap(obj[k],p);
      });
    }
    Object.keys(FIELDS).forEach(k => unwrap(input[k],k));
    // Aliases are explicit contract extensions, never implicit current dates.
    input.decision.hire_reason ??= input.proposed_ae.hire_reason ?? null;
    input.decision.new_ae_market_same_as_history ??= input.demand.new_ae_market_same_as_history ?? null;
    input.target.target_period_start ??= input.decision.target_period_start ?? null;
    input.target.target_period_end ??= input.decision.target_period_end ?? null;
    input.proposed_ae.proposed_start_date ??= input.timing.proposed_start_date ?? null;
    if (input.proposed_ae.proposed_start_date === null && input.proposed_ae.start_month_index != null) input.proposed_ae.proposed_start_date = monthDate(input.target.target_period_start,input.proposed_ae.start_month_index,false);
    if (input.current_team.departure_date == null && input.current_team.departure_month_index != null) input.current_team.departure_date = monthDate(input.target.target_period_start,input.current_team.departure_month_index,true);
    input.current_team.founder_committed_new_arr ??= input.target.founder_committed_new_arr ?? null;
    input.current_team.existing_team_committed_new_arr ??= input.target.existing_team_committed_new_arr ?? null;
    input.proposed_ae.monthly_ramp_schedule ??= input.proposed_ae.ramp_schedule ?? null;
    input.repeatability.founder_can_articulate_path ??= input.repeatability.founder_can_articulate_close_path ?? null;
    input.demand.allocatable_current_qualified_pipeline ??= input.demand.allocatable_current_pipeline ?? null;
    input.company.currency ??= 'USD';
    input.validation = validateInput(input,policy);
    return input;
  }
  function validateInput(input, policy = DEFAULT_POLICY) {
    const result = {fatal_errors:[],clarifications:[],warnings:[]};
    const issue = (kind,code,fields,message) => result[kind].push({code,fields,message});
    const fatal = (code,fields,message) => issue('fatal_errors',code,fields,message);
    const clarify = (code,fields,message) => issue('clarifications',code,fields,message);
    const warning = (code,fields,message) => issue('warnings',code,fields,message);
    const numericName = /(?:quota$|_arr$|new_arr_target_horizon$|pipeline.*(?:value|pipeline)$|_pipeline$|salary$|comp_target$|cost_estimate$|acv$|_pct$|_days$|_months$|_count$|_opps(?:_trailing_12m)?$|_wins(?:_trailing_12m)?$|wins_trailing_12m$|closed_won_trailing_12m$|carriers$|reports$|start_month_index$|departure_month_index$|post_change_wins$|_reserved_for_existing_team$|_in_horizon$)/;
    function walk(obj,path) {
      if (!obj || typeof obj !== 'object') return;
      Object.entries(obj).forEach(([key,value]) => {
        const field = path + '.' + key;
        if (value === null || value === undefined) return;
        if (numericName.test(key) && typeof value !== 'number') { fatal('invalid_numeric_type',[field],'Supply a number or an explicit unknown.'); return; }
        if (typeof value === 'number') {
          if (!Number.isFinite(value) || value < 0) fatal('invalid_number',[field],'Numbers must be finite and nonnegative.');
          if (key.endsWith('_pct') && !key.includes('attainment') && value > 1) fatal('invalid_percentage',[field],'Rates use decimals from 0 through 1.');
          if (/(?:wins(?:_trailing_12m)?|opps_trailing_12m|won_trailing_12m|carriers|reports|use_cases_count|month_index)$/.test(key) && !Number.isInteger(value)) fatal('invalid_count',[field],'Counts must be whole numbers.');
        } else if (typeof value === 'object') walk(value,field);
        else if (numericName.test(key) && !key.endsWith('_metric') && !key.endsWith('_definition') && typeof value !== 'boolean') fatal('invalid_numeric_type',[field],'Supply a number or an explicit unknown, not numeric text.');
        if ((key.endsWith('_date') || key.endsWith('_window_start') || key.endsWith('_window_end') || key.startsWith('target_period_') || key === 'first_revenue_expected_by_company') && day(value) === null) fatal('invalid_date',[field],'Business dates must be real ISO YYYY-MM-DD dates.');
      });
    }
    Object.keys(FIELDS).forEach(g => walk(input[g],g));
    const d=input.decision||{},t=input.target||{},a=input.proposed_ae||{},c=input.conversion||{},r=input.repeatability||{},e=input.economics||{},p=input.demand||{},team=input.current_team||{},time=input.timing||{};
    const limits=policy.validation;
    if (d.analysis_horizon_months != null && (!Number.isInteger(d.analysis_horizon_months)||d.analysis_horizon_months<limits.horizonMin||d.analysis_horizon_months>limits.horizonMax)) fatal('invalid_horizon',['decision.analysis_horizon_months'],'Supported horizons are 6–18 whole months.');
    if (a.ramp_months != null && (a.ramp_months<limits.rampMin||a.ramp_months>limits.rampMax)) fatal('invalid_ramp',['proposed_ae.ramp_months'],'Ramp must be between 0 and 12 months.');
    if (e.average_sales_cycle_days != null && !e.sales_cycle_manual_override && (e.average_sales_cycle_days<limits.cycleMinDays||e.average_sales_cycle_days>limits.cycleMaxDays)) fatal('invalid_cycle',['economics.average_sales_cycle_days'],'Sales cycle is outside the supported range.');
    ['monthly_ramp_schedule'].forEach(k=>{if(a[k] != null && (!Array.isArray(a[k]) || !a[k].length || a[k].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1))) fatal('invalid_ramp_schedule',['proposed_ae.'+k],'Ramp factors must be finite decimals from 0 through 1.');});
    if (p.monthly_pipeline_series != null && (!Array.isArray(p.monthly_pipeline_series)||p.monthly_pipeline_series.some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0)))) fatal('invalid_pipeline_series',['demand.monthly_pipeline_series'],'Pipeline series must contain nonnegative numbers or explicit unknowns.');
    const compare=(x,y,fields)=>{if(x!=null&&y!=null&&x>y)fatal('contradictory_counts',fields,'Wins or subset counts exceed their denominator or total.');};
    compare(c.closed_won_trailing_12m,c.qualified_opps_trailing_12m,['conversion.closed_won_trailing_12m','conversion.qualified_opps_trailing_12m']);
    compare(c.non_founder_wins_trailing_12m,c.non_founder_qualified_opps_trailing_12m,['conversion.non_founder_wins_trailing_12m','conversion.non_founder_qualified_opps_trailing_12m']);
    compare(c.non_founder_wins_trailing_12m,c.closed_won_trailing_12m,['conversion.non_founder_wins_trailing_12m','conversion.closed_won_trailing_12m']);
    compare(c.non_founder_qualified_opps_trailing_12m,c.qualified_opps_trailing_12m,['conversion.non_founder_qualified_opps_trailing_12m','conversion.qualified_opps_trailing_12m']);
    compare(r.non_founder_wins_trailing_12m,r.wins_trailing_12m,['repeatability.non_founder_wins_trailing_12m','repeatability.wins_trailing_12m']);
    compare(c.post_change_wins,c.post_change_qualified_opps,['conversion.post_change_wins','conversion.post_change_qualified_opps']);
    const mismatch=(x,y,fields)=>{if(x!=null&&y!=null&&Math.abs(x-y)>limits.equalityTolerance)clarify('conflicting_inputs',fields,'Supplied values for the same evidence disagree; reconcile them before a definitive decision.');};
    if(c.non_founder_qualified_opps_trailing_12m>0)mismatch(c.non_founder_wins_trailing_12m==null?null:c.non_founder_wins_trailing_12m/c.non_founder_qualified_opps_trailing_12m,c.non_founder_qualified_opp_to_win_pct,['conversion.non_founder_qualified_opp_to_win_pct','conversion.non_founder_wins_trailing_12m','conversion.non_founder_qualified_opps_trailing_12m']);
    if(c.qualified_opps_trailing_12m>0)mismatch(c.closed_won_trailing_12m==null?null:c.closed_won_trailing_12m/c.qualified_opps_trailing_12m,c.qualified_opp_to_win_pct,['conversion.qualified_opp_to_win_pct','conversion.closed_won_trailing_12m','conversion.qualified_opps_trailing_12m']);
    mismatch(c.non_founder_wins_trailing_12m,r.non_founder_wins_trailing_12m,['conversion.non_founder_wins_trailing_12m','repeatability.non_founder_wins_trailing_12m']);
    mismatch(c.closed_won_trailing_12m,r.wins_trailing_12m,['conversion.closed_won_trailing_12m','repeatability.wins_trailing_12m']);
    if(r.founder_primary_seller_share_pct===1&&r.non_founder_wins_trailing_12m>0)clarify('founder_share_conflict',['repeatability.founder_primary_seller_share_pct','repeatability.non_founder_wins_trailing_12m'],'Reconcile founder-primary share with independent non-founder wins.');
    if(day(t.target_period_start)!==null&&day(t.target_period_end)!==null&&day(t.target_period_start)>day(t.target_period_end))fatal('invalid_period',['target.target_period_start','target.target_period_end'],'The horizon ends before it starts.');
    if(day(t.target_period_start)!==null&&day(t.target_period_end)!==null) {
      const first=new Date(t.target_period_start+'T00:00:00Z'),last=new Date(t.target_period_end+'T00:00:00Z');
      const calendarMonths=(last.getUTCFullYear()-first.getUTCFullYear())*12+last.getUTCMonth()-first.getUTCMonth()+1;
      if(calendarMonths>limits.horizonMax+1||calendarMonths<limits.horizonMin)fatal('invalid_dated_horizon',['target.target_period_start','target.target_period_end'],'Dated horizon must fall within the supported 6–18 month window.');
    }
    for(const [group,fields]of [['target',['target_includes_expansion','target_includes_renewal']],['proposed_ae',['quota_includes_expansion','company_ramp_schedule_known']],['management',['direct_manager_exists','onboarding_owner_named','manager_is_also_primary_seller']],['demand',['territory_reserved_for_new_ae','pipeline_creation_is_seasonal']]])for(const field of fields)if(input[group][field]!=null&&typeof input[group][field]!=='boolean')fatal('invalid_boolean',[group+'.'+field],'Supply true, false or an explicit unknown.');
    if(day(c.conversion_evidence_window_start)!==null&&day(c.conversion_evidence_window_end)!==null&&day(c.conversion_evidence_window_start)>day(c.conversion_evidence_window_end))fatal('invalid_evidence_window',['conversion.conversion_evidence_window_start','conversion.conversion_evidence_window_end'],'Evidence window ends before it starts.');
    if(day(a.proposed_start_date)!==null&&day(t.target_period_end)!==null&&day(a.proposed_start_date)>day(t.target_period_end)&&time.expects_contribution_inside_horizon===true)fatal('impossible_contribution_expectation',['proposed_ae.proposed_start_date','timing.expects_contribution_inside_horizon'],'The explicit in-period contribution expectation conflicts with a start after the horizon.');
    if(day(time.first_revenue_expected_by_company)!==null&&day(a.proposed_start_date)!==null&&day(time.first_revenue_expected_by_company)<day(a.proposed_start_date))clarify('revenue_before_start',['timing.first_revenue_expected_by_company'],'Expected first revenue precedes the seller start.');
    if(team.current_quota_carriers===0&&team.aggregate_annual_quota>0)clarify('capacity_count_conflict',['current_team.current_quota_carriers','current_team.aggregate_annual_quota'],'No quota carriers were declared but aggregate quota is positive.');
    const metrics=[t.target_metric,a.quota_metric,e.acv_metric,p.pipeline_metric].filter(v=>v!=null);
    if(new Set(metrics).size>1 || ['ending_arr_growth','other'].includes(t.target_metric))clarify('metric_basis_conflict',['target.target_metric','proposed_ae.quota_metric','economics.acv_metric','demand.pipeline_metric'],'Supply explicitly normalized compatible target, quota, ACV and pipeline values. Contract length alone is not a revenue normalization.');
    if(t.target_includes_expansion!=null&&a.quota_includes_expansion!=null&&t.target_includes_expansion!==a.quota_includes_expansion)clarify('expansion_basis_conflict',['target.target_includes_expansion','proposed_ae.quota_includes_expansion'],'Target and quota expansion scope must match.');
    if(t.target_includes_renewal===true)clarify('renewal_basis_conflict',['target.target_includes_renewal'],'Separate renewal revenue before treating the target as new sales.');
    if(p.pipeline_value_type!=null&&p.pipeline_value_type!=='unweighted')clarify('pipeline_value_type',['demand.pipeline_value_type'],'Supply unweighted qualified pipeline. Weighted and forecast-category values cannot enter the unweighted demand formula.');
    if (p.allocatable_qualified_pipeline!=null && p.current_qualified_pipeline_value!=null && p.monthly_qualified_pipeline_created_value!=null && !p.monthly_pipeline_series && d.analysis_horizon_months!=null && p.allocatable_qualified_pipeline>p.current_qualified_pipeline_value+p.monthly_qualified_pipeline_created_value*d.analysis_horizon_months) clarify('allocation_exceeds_pool',['demand.allocatable_qualified_pipeline','demand.current_qualified_pipeline_value','demand.monthly_qualified_pipeline_created_value'],'Declared allocation exceeds even the full unlagged pipeline pool.');
    // Current supply cannot borrow from future creation: every current ownership
    // claim plus the existing team's current reservation must fit the current
    // cycle-eligible pool (the same pool the demand math uses).
    // Pipeline expected to close inside the horizon is a subset of current pipeline.
    if(typeof p.current_qualified_pipeline_in_horizon==='number'&&typeof p.current_qualified_pipeline_value==='number'&&p.current_qualified_pipeline_in_horizon>p.current_qualified_pipeline_value)clarify('current_horizon_pipeline_exceeds_current_pipeline',['demand.current_qualified_pipeline_in_horizon','demand.current_qualified_pipeline_value'],'Current pipeline expected to close inside the horizon exceeds total current qualified pipeline; reconcile the two values.');
    const currentPool=typeof p.current_qualified_pipeline_in_horizon==='number'?p.current_qualified_pipeline_in_horizon:p.current_qualified_pipeline_value;
    if(typeof currentPool==='number'&&currentPool>=0){
      const reserved=typeof p.current_pipeline_reserved_for_existing_team==='number'?p.current_pipeline_reserved_for_existing_team:0;
      const claims=[];
      if(typeof p.allocatable_current_qualified_pipeline==='number')claims.push(p.allocatable_current_qualified_pipeline);
      if(typeof p.new_ae_pipeline_share_pct==='number'&&p.new_ae_pipeline_share_pct>=0&&p.new_ae_pipeline_share_pct<=1)claims.push(currentPool*p.new_ae_pipeline_share_pct);
      const largest=claims.length?Math.max(...claims):0;
      const total=largest+reserved;
      if(total>currentPool&&total-currentPool>Math.max(total,currentPool)*8*Number.EPSILON)clarify('current_allocation_exceeds_current_pool',['demand.allocatable_current_qualified_pipeline','demand.new_ae_pipeline_share_pct','demand.current_pipeline_reserved_for_existing_team','demand.current_qualified_pipeline_in_horizon','demand.current_qualified_pipeline_value'],'Current pipeline allocated to the new AE plus current pipeline reserved for the existing team exceeds the current cycle-eligible pipeline pool. Future pipeline creation cannot be counted as pipeline that exists today; reconcile current ownership.');
    }
    const currencies = Object.values(FIELDS).length && Object.keys(FIELDS).map(g=>input[g]?.currency).filter(Boolean);
    if(new Set(currencies).size>1)fatal('mixed_currency',Object.keys(FIELDS).map(g=>g+'.currency'),'Mixed currencies require explicit supplied conversion before engine entry.');
    if(d.hire_reason==='replacement'&&(team.departing_seller_index==null||day(team.departure_date)===null))clarify('replacement_details',['current_team.departing_seller_index','current_team.departure_date'],'Identify the departing seller and departure date before calculating replacement capacity.');
    if(team.departing_seller_index!=null&&(!Number.isInteger(team.departing_seller_index)||!Array.isArray(team.sellers)||!team.sellers[team.departing_seller_index]))fatal('invalid_departing_seller',['current_team.departing_seller_index'],'The departing seller must exist in the seller list.');
    const attainments=[team.trailing_team_attainment_pct,...(team.sellers||[]).map(s=>s.trailing_attainment_pct)];
    if(attainments.some(v=>v>limits.attainmentWarningAbove))warning('unusual_attainment',['current_team'],'High attainment is preserved, not capped; inspect concentration and durability.');
    if([c.non_founder_qualified_opp_to_win_pct,c.qualified_opp_to_win_pct].some(v=>v>limits.winRateWarningAbove))warning('unusual_win_rate',['conversion'],'High conversion is preserved; inspect the denominator and sample.');
    return result;
  }
  return {normalizeInput,validateInput,copy,day,iso,FIELDS};
});
