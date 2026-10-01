(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ae-policy.js'));
  else root.AEDecisionEngine = factory(root.AE_HIRE_POLICY);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (defaultPolicy) {
  'use strict';

  function numeric(value) { return typeof value === 'number' && Number.isFinite(value); }
  function known(value) { return value !== null && value !== undefined && value !== 'unknown'; }
  function section(input, key) { return input && input[key] || {}; }
  function positiveDocumentation(value) { return value === 'yes' || value === 'partial'; }
  function sampleDenominator(winRate) {
    return numeric(winRate.denominator) ? winRate.denominator : null;
  }
  function firstAE(input) {
    var team = section(input, 'current_team');
    var decision = section(input, 'decision');
    var sellers = Array.isArray(team.sellers) ? team.sellers : [];
    var count = numeric(team.current_non_founder_quota_carriers)
      ? team.current_non_founder_quota_carriers : team.current_quota_carriers;
    if (sellers.length) count = sellers.filter(function (seller) { return seller.is_founder !== true; }).length;
    return count === 0 && (decision.evaluating_first_professional_ae === true ||
      team.no_non_founder_sellers_history === true || team.non_founder_sellers_have_existed === false);
  }

  // Maps founder_required_late_stage onto the policy-owned independence classes.
  // Anything the policy does not list (null, unknown or an unrecognized value)
  // is 'unknown': it can never establish demonstrated independence.
  function classifyFounderLateStage(value, policy) {
    var mapping = (policy.repeatability || {}).founderLateStage;
    if (!mapping || !Array.isArray(mapping.demonstrated) || !Array.isArray(mapping.emerging) || !Array.isArray(mapping.dependent)) {
      throw new TypeError('Policy ' + policy.version + ' must define repeatability.founderLateStage {demonstrated, emerging, dependent}.');
    }
    if (mapping.dependent.indexOf(value) !== -1) return 'dependent';
    if (mapping.emerging.indexOf(value) !== -1) return 'emerging';
    if (mapping.demonstrated.indexOf(value) !== -1) return 'demonstrated';
    return 'unknown';
  }

  function classifyRepeatability(input, winRate, policy, demand) {
    policy = policy || defaultPolicy;
    winRate = winRate || {};
    demand = demand || {};
    var r = section(input, 'repeatability');
    var lateStage = classifyFounderLateStage(r.founder_required_late_stage, policy);
    var conversion = section(input, 'conversion');
    var documented = ['icp_documented', 'qualification_documented', 'discovery_documented', 'sales_stages_documented']
      .filter(function (key) { return positiveDocumentation(r[key]); }).length;
    var nfWins = numeric(conversion.non_founder_wins_trailing_12m)
      ? conversion.non_founder_wins_trailing_12m : r.non_founder_wins_trailing_12m;
    var nfOpps = conversion.non_founder_qualified_opps_trailing_12m;
    if (winRate.source === 'post_change_counts') {
      // Pre-pivot wins cannot demonstrate the motion selected for underwriting.
      nfWins = conversion.post_change_non_founder === true ? conversion.post_change_wins : null;
      nfOpps = conversion.post_change_non_founder === true ? conversion.post_change_qualified_opps : null;
    }
    var isFirstAE = firstAE(input);
    var result = {
      state: 'unknown', first_ae: isFirstAE, non_founder_wins: numeric(nfWins) ? nfWins : null,
      non_founder_qualified_opps: numeric(nfOpps) ? nfOpps : null,
      founder_required_late_stage: known(r.founder_required_late_stage) ? r.founder_required_late_stage : null,
      founder_late_stage_class: lateStage,
      documented_process_items: documented, evidence_window: winRate.source === 'post_change_counts' ? 'post_change' : 'supplied_window',
      evidence_gaps: [], disclosures: []
    };
    if (isFirstAE) {
      result.disclosures.push('First-hire transferability remains an execution risk until non-founder evidence exists.');
      result.disclosures.push('Transferability is not yet empirically proven because this is the first non-founder AE.');
      var wins = numeric(r.wins_trailing_12m) ? r.wins_trailing_12m : conversion.closed_won_trailing_12m;
      if (winRate.source === 'post_change_counts') wins = conversion.post_change_wins;
      var stableICP = r.icp_documented === 'yes' || r.icp_strongly_consistent === true;
      var recognizableICP = positiveDocumentation(r.icp_documented) || r.icp_strongly_consistent === true;
      var articulate = r.founder_can_articulate_path === true;
      var cases = r.repeatable_use_cases_count;
      if (!known(wins)) result.evidence_gaps.push('repeatability.wins_trailing_12m');
      if (!known(r.founder_can_articulate_path)) result.evidence_gaps.push('repeatability.founder_can_articulate_path');
      if (wins >= policy.repeatability.firstAERelevantWins && stableICP &&
          positiveDocumentation(r.qualification_documented) && positiveDocumentation(r.discovery_documented) &&
          cases >= policy.repeatability.firstAEUseCasesMinimum && articulate && demand.state === 'sufficient') {
        result.state = 'transferable_evidence_strong';
      } else if (numeric(wins) && (wins === 0 || cases === 0 ||
          (r.icp_documented === 'no' && r.qualification_documented === 'no' && r.discovery_documented === 'no'))) {
        result.state = 'founder_motion_not_yet_externalizable';
      } else if (wins > 0 && recognizableICP && cases > 0) {
        result.state = 'transferable_evidence_emerging';
      }
      return result;
    }
    // Evidence of dependence takes precedence over a count of past wins.
    if (lateStage === 'dependent' || r.founder_primary_seller_share_pct === 1 ||
        (nfWins === 0 && r.wins_trailing_12m > 0)) {
      result.state = 'founder_dependent';
    } else if (nfWins >= policy.repeatability.demonstratedNonFounderWins && nfOpps > 0 &&
        lateStage === 'demonstrated' && documented >= policy.repeatability.documentedProcessMinimum &&
        numeric(winRate.value) && winRate.scenario_only !== true && winRate.transferable !== false) {
      result.state = 'demonstrated';
    } else if (nfWins > 0 || (numeric(winRate.value) && documented > 0)) {
      // Includes otherwise-strong evidence whose founder is still sometimes/often
      // required late-stage: that motion is not yet operationally independent.
      result.state = 'emerging';
    }
    if (winRate.source === 'post_change_counts' && conversion.post_change_non_founder !== true) result.evidence_gaps.push('conversion.post_change_non_founder');
    if (!numeric(nfWins)) result.evidence_gaps.push(winRate.source === 'post_change_counts' ? 'conversion.post_change_wins' : 'conversion.non_founder_wins_trailing_12m');
    if (!numeric(nfOpps)) result.evidence_gaps.push(winRate.source === 'post_change_counts' ? 'conversion.post_change_qualified_opps' : 'conversion.non_founder_qualified_opps_trailing_12m');
    if (lateStage === 'unknown') result.evidence_gaps.push('repeatability.founder_required_late_stage');
    return result;
  }

  function classifyManagement(input, policy) {
    policy = policy || defaultPolicy;
    var m = section(input, 'management');
    var fields = ['direct_manager_exists', 'weekly_1to1_capacity', 'weekly_pipeline_review_capacity',
      'onboarding_owner_named', 'onboarding_plan_exists'];
    var missing = fields.filter(function (key) { return !known(m[key]); });
    var blockers = [];
    if (m.direct_manager_exists === false) blockers.push('management.direct_manager_exists');
    if (m.weekly_pipeline_review_capacity === 'no') blockers.push('management.weekly_pipeline_review_capacity');
    if (m.onboarding_owner_named === false) blockers.push('management.onboarding_owner_named');
    if (m.overloaded === true) blockers.push('management.overloaded');
    var basicsReady = m.direct_manager_exists === true && m.weekly_1to1_capacity === 'yes' &&
      m.weekly_pipeline_review_capacity === 'yes' && m.onboarding_owner_named === true;
    var state = missing.length === fields.length ? 'unknown' : 'conditional';
    var nonmaterial = false;
    if (blockers.length) {
      state = m.readiness_resolution_before_start === true ? 'conditional' : 'constrained';
    } else if (basicsReady && m.onboarding_plan_exists === 'yes' && m.manager_is_also_primary_seller !== true) {
      state = 'ready';
    } else if (basicsReady && positiveDocumentation(m.onboarding_plan_exists)) {
      // Sections 4.27/5.6 allow a partial plan with all operating gates ready.
      nonmaterial = true;
    }
    return { state: state, nonmaterial_gap: nonmaterial, blockers: blockers, evidence_gaps: missing.map(function (key) {
      return 'management.' + key;
    }), readiness_resolution_before_start: m.readiness_resolution_before_start === true };
  }

  function classifyEvidenceConfidence(input, context, policy) {
    policy = policy || defaultPolicy;
    context = context || {};
    var gate = context.evidenceGate || {};
    var validation = context.validation || input.validation || {};
    if (gate.passes === false || (validation.fatal_errors || []).length) {
      return { state: 'insufficient', reasons: ['evidence_gate_failed'] };
    }
    var low = [], moderate = [];
    var winRate = context.winRate || {};
    var hire = context.hireCapacity || {};
    var repeatability = context.repeatability || {};
    var demand = context.demand || {};
    var provenance = section(input, 'provenance');
    var proposed = section(input, 'proposed_ae');
    var denominator = sampleDenominator(winRate);
    if ((validation.clarifications || []).length) low.push('unresolved_conflict');
    if (!numeric(winRate.value)) low.push('unknown_conversion');
    if (denominator === null) low.push('unknown_conversion_sample');
    else if (denominator < policy.conversionSample.veryThinBelow) low.push('very_thin_conversion_sample');
    else if (denominator < policy.conversionSample.thinBelow) moderate.push('thin_conversion_sample');
    if (winRate.scenario_only === true || winRate.transferable === false ||
        winRate.transferability_assumption === 'founder_inclusive') low.push('transferability_unproven');
    if (proposed.ramp_definition === 'unknown' || !known(proposed.ramp_definition) || hire.ambiguous === true) {
      low.push('ramp_ambiguity');
    } else if (hire.uses_fallback === true || (!Array.isArray(proposed.monthly_ramp_schedule) &&
        !Array.isArray(proposed.ramp_schedule))) moderate.push('linear_ramp_assumption');
    if (demand.state === 'unknown' || demand.allocation_uncertain === true) low.push('unknown_pipeline_allocation');
    if (demand.allocation_partially_estimated === true) moderate.push('estimated_pipeline_allocation');
    // Unknown creation sufficiency is uncertain demand evidence. Without this, an
    // unknown creation test pins the decision at conditional and hides sensitivity
    // flips, so deleting creation evidence would raise confidence (§14.7).
    if (demand.pipeline_creation_state === 'unknown' || demand.opportunity_creation_state === 'unknown') low.push('creation_sufficiency_unknown');
    if (repeatability.first_ae === true) moderate.push('first_ae_transferability_unproven');
    var suppliedDemand = section(input, 'demand');
    if (suppliedDemand.pipeline_creation_is_seasonal === true && !Array.isArray(suppliedDemand.monthly_pipeline_series)) {
      moderate.push('seasonal_pipeline_linear_extrapolation');
    }
    var team = section(input, 'current_team');
    var sellers = Array.isArray(team.sellers) ? team.sellers : [];
    if (sellers.some(function (seller) { return !numeric(seller.trailing_attainment_pct); }) ||
        (sellers.length === 0 && team.current_quota_carriers > 0 && !numeric(team.trailing_team_attainment_pct))) {
      moderate.push('existing_capacity_uses_declared_quota');
    }
    ['conversion', 'pipeline', 'attainment'].forEach(function (key) {
      var source = provenance[key];
      if (source && typeof source === 'object') source = source.source;
      if (policy.evidence.estimateSources.indexOf(source) !== -1 || !known(source)) low.push(key + '_source_weak_or_unknown');
      else if (policy.evidence.strongSources.indexOf(source) === -1) moderate.push(key + '_source_estimated');
    });
    var coreUnknown = ['economic', 'demand', 'repeatability', 'timing', 'management'].some(function (key) {
      return context[key] && context[key].state === 'unknown';
    });
    if (coreUnknown) low.push('core_test_unknown');
    if ((context.sensitivities || []).some(function (scenario) {
      return scenario.decision_changed === true && scenario.modest_change === true;
    })) low.push('sensitivity_changes_decision');
    return { state: low.length ? 'low' : moderate.length ? 'moderate' : 'high', reasons: low.concat(moderate) };
  }

  function normalizedShortfall(value, target) {
    return numeric(value) && numeric(target) && target > 0 ? Math.max(0, (target - value) / target) : null;
  }
  function orderConstraints(constraints, policy) {
    // Select the largest quantitative shortfall within each severity, then use
    // causal order for ties and qualitative constraints. This avoids an
    // intransitive pairwise comparator when qualitative values are unknown.
    var remaining = constraints.slice(), ordered = [];
    while (remaining.length) {
      var severity = Math.max.apply(null, remaining.map(function (item) { return item.severity; }));
      var group = remaining.filter(function (item) { return item.severity === severity; });
      var quantities = group.filter(function (item) { return numeric(item.normalized_shortfall); });
      var largest = quantities.length ? Math.max.apply(null, quantities.map(function (item) { return item.normalized_shortfall; })) : null;
      var candidates = group.filter(function (item) {
        return !numeric(item.normalized_shortfall) || item.normalized_shortfall === largest;
      });
      candidates.sort(function (a, b) {
        var ai = policy.constraints.dimensionOrder.indexOf(a.dimension);
        var bi = policy.constraints.dimensionOrder.indexOf(b.dimension);
        return ai - bi || constraints.indexOf(a) - constraints.indexOf(b);
      });
      var selected = candidates[0];
      ordered.push(selected);
      remaining.splice(remaining.indexOf(selected), 1);
    }
    return ordered;
  }
  function closureSupported(demand) {
    return demand.shortfall_closure_supported === true && numeric(demand.closure_amount) &&
      numeric(demand.required) && numeric(demand.allocatable) &&
      demand.closure_amount >= Math.max(0, demand.required - demand.allocatable) &&
      typeof demand.closure_date === 'string' && typeof demand.needed_by_date === 'string' &&
      demand.closure_date <= demand.needed_by_date;
  }
  function decide(context, policy) {
    policy = policy || defaultPolicy;
    context = context || {};
    var input = context.input || {};
    var validation = context.validation || input.validation || {};
    var gate = context.evidenceGate || { passes: false, missing: ['evidence_gate'] };
    var confidence = context.confidence || { state: 'insufficient', reasons: [] };
    var economic = context.economic || { state: 'unknown' };
    var demand = context.demand || { state: 'unknown' };
    var repeatability = context.repeatability || { state: 'unknown' };
    var timing = context.timing || { state: 'unknown' };
    var management = context.management || { state: 'unknown' };
    var reason = section(input, 'decision').hire_reason || section(input, 'proposed_ae').hire_reason;
    var strategic = policy.strategicReasons.indexOf(reason) !== -1;
    var severity = policy.constraints.severity;
    var constraints = [];
    function add(code, dimension, level, shortfall, hard, detail) {
      constraints.push({ code: code, dimension: dimension, severity: level,
        normalized_shortfall: numeric(shortfall) ? shortfall : null, hard: hard === true, reason: detail });
    }
    if ((validation.fatal_errors || []).length) {
      return { state: null, confidence: 'insufficient', can_decide: false, validation_stop: true,
        primary_constraint: 'data_conflict', secondary_constraints: [], reasons: validation.fatal_errors.slice(), constraints: [] };
    }
    if (gate.passes === false || (validation.clarifications || []).length) {
      var missing = (gate.missing || []).slice();
      var conflict = (validation.clarifications || []).length > 0;
      return { state: 'insufficient_evidence', confidence: 'insufficient', can_decide: false,
        primary_constraint: conflict ? 'data_conflict' : (gate.primary_constraint ||
          (Array.isArray(gate.blocking_missing) && gate.blocking_missing.length && gate.blocking_missing.every(function (item) {
            return String(item.field || item).indexOf('repeatability.') === 0;
          }) ? 'transferability' :
          missing.some(function (item) { return String(item.field || item).indexOf('conversion') !== -1; }) ? 'unknown_conversion' :
            missing.some(function (item) { return String(item.field || item).indexOf('capacity') !== -1; }) ? 'unknown_current_capacity' : 'unknown_pipeline_allocation')),
        secondary_constraints: [], reasons: conflict ? validation.clarifications.slice() : missing,
        missing_evidence: missing, constraints: [] };
    }
    if (economic.state === 'none' || economic.state === 'no_revenue_gap') add('no_capacity_gap', 'economic_need',
      strategic ? severity.material : severity.blocking, 1, !strategic, 'The revenue plan has no residual capacity gap.');
    else if (economic.state === 'weak' || economic.state === 'partial') add('seat_oversized', 'economic_need',
      economic.state === 'weak' ? severity.blocking : severity.material,
      normalizedShortfall(economic.ratio, policy.economic.fullUseThreshold), economic.state === 'weak', 'The gap does not require the modeled full seat.');
    else if (economic.state === 'unknown') add('unknown_current_capacity', 'economic_need', severity.material, null, false, 'Economic need cannot be established.');
    if (demand.state === 'short' || demand.state === 'near') {
      var demandHard = demand.state === 'short' && !closureSupported(demand);
      add('pipeline_supply', 'demand_sufficiency', demandHard ? severity.blocking : severity.material,
        normalizedShortfall(demand.coverage, policy.demand.sufficientThreshold), demandHard, 'Allocatable qualified pipeline is below the calculated requirement.');
    } else if (demand.state === 'unknown') add('unknown_pipeline_allocation', 'demand_sufficiency', severity.material, null, false, 'Demand coverage is unknown.');
    // Monthly creation must sustain the seat, not only the horizon total. A
    // creation test that cannot be established (unknown or unbounded) cannot
    // count as satisfied: otherwise removing adverse creation evidence would
    // make the recommendation more aggressive (§8.8).
    [['pipeline_creation', demand.pipeline_creation_ratio, demand.pipeline_creation_state, 'pipeline'],
      ['opportunity_creation', demand.opportunity_creation_ratio, demand.opportunity_creation_state, 'opportunity']].forEach(function (test) {
      var code = test[0], ratio = test[1], creationState = test[2], noun = test[3];
      if (numeric(ratio) && ratio < policy.demand.sufficientThreshold) {
        add(code, 'demand_sufficiency', severity.material, normalizedShortfall(ratio, policy.demand.sufficientThreshold), false,
          'Monthly ' + noun + ' creation is below the calculated requirement.');
      } else if (creationState === 'unbounded') {
        add(code, 'demand_sufficiency', severity.material, 1, false, demand.creation_unbounded_reason === 'zero_conversion' ?
          'At the observed zero conversion rate no amount of monthly ' + noun + ' creation meets the requirement.' :
          'No ' + noun + ' created inside the horizon can close in time to cover the remaining requirement.');
      } else if (creationState === 'unknown') {
        add(code, 'demand_sufficiency', severity.material, null, false,
          'Monthly ' + noun + ' creation sufficiency cannot be established from the supplied evidence.');
      }
    });
    if (repeatability.state === 'founder_motion_not_yet_externalizable') add('transferability', 'repeatability', severity.blocking, null, true, 'The founder motion is not yet ready to hand over.');
    else if (repeatability.state === 'founder_dependent') {
      var independent = section(input, 'proposed_ae').expected_to_run_independently !== false;
      add('founder_dependency', 'repeatability', independent ? severity.blocking : severity.material, null, independent, 'The motion still depends on the founder.');
    } else if (repeatability.state === 'emerging' || repeatability.state === 'transferable_evidence_emerging' || repeatability.state === 'unknown') {
      add('transferability', 'repeatability', severity.material, null, false, 'Transferability requires additional evidence.');
    } else if (repeatability.first_ae) add('transferability', 'repeatability', severity.watch, null, false, 'First-hire transferability remains an execution risk.');
    if (timing.state === 'incompatible') {
      var late = timing.late_start === true || timing.reason === 'late_start' ||
        section(input, 'proposed_ae').start_month_index > section(input, 'decision').analysis_horizon_months;
      add(late ? 'late_start' : 'sales_cycle_timing', 'timing', severity.blocking,
        timing.normalized_shortfall, true, 'Modeled contribution cannot arrive in the required revenue window.');
    } else if (timing.state === 'tight' || timing.state === 'unknown') add('sales_cycle_timing', 'timing', severity.material, timing.normalized_shortfall, false, 'The contribution timetable needs resolution.');
    if (management.state === 'constrained') add('management_capacity', 'management', severity.blocking, null, true, 'Management or onboarding capacity is unavailable before start.');
    else if (management.state === 'conditional' || management.state === 'unknown') add('management_capacity', 'management',
      management.nonmaterial_gap ? severity.watch : severity.material, null, false, 'Resolve the management and onboarding gaps before start.');
    if ((context.hireCapacity || {}).ambiguous === true || section(input, 'proposed_ae').ramp_definition === 'unknown') {
      add('ramp_ambiguity', 'timing', severity.material, null, false, 'Specify whether ramp describes bookings or pipeline productivity.');
    }
    if (confidence.state === 'low' || confidence.state === 'insufficient') {
      var thin = (confidence.reasons || []).indexOf('very_thin_conversion_sample') !== -1;
      add(thin ? 'thin_conversion_sample' : 'transferability', 'repeatability', severity.material, null, false, 'Evidence confidence does not support an unconditional decision.');
    }
    (context.sensitivities || []).filter(function (scenario) {
      return scenario.decision_changed === true && scenario.deterioration !== false;
    }).forEach(function (scenario) {
      var timingVariable = ['ramp_duration', 'sales_cycle', 'start_date'].indexOf(scenario.variable) !== -1;
      add(timingVariable ? 'sales_cycle_timing' : scenario.variable === 'pipeline_creation' ? 'pipeline_creation' : 'pipeline_supply', timingVariable ? 'timing' : 'demand_sufficiency',
        severity.material, null, false, 'The ' + scenario.variable + ' model scenario changes the decision.');
    });
    var ordered = orderConstraints(constraints, policy);
    var allSupported = economic.state === 'supported' && demand.state === 'sufficient' && timing.state === 'compatible' &&
      (management.state === 'ready' || management.state === 'conditional' && management.nonmaterial_gap) &&
      (confidence.state === 'high' || confidence.state === 'moderate') &&
      (repeatability.state === 'demonstrated' || repeatability.state === 'transferable_evidence_strong');
    var state = constraints.some(function (item) { return item.hard; }) ? 'not_yet_supported' :
      constraints.some(function (item) { return item.severity >= severity.material; }) ? 'conditional' :
      allSupported ? 'supported' : 'conditional';
    var primary = ordered.length ? ordered[0].code : null;
    var secondary = ordered.slice(1).map(function (item) { return item.code; }).filter(function (code, index, codes) {
      return code !== primary && codes.indexOf(code) === index;
    });
    return { state: state, confidence: confidence.state, can_decide: true, primary_constraint: primary,
      secondary_constraints: secondary, constraints: ordered, reasons: ordered.map(function (item) { return item.reason; }),
      revenue_capacity_case: economic.state === 'supported' ? 'established' : 'not_established',
      strategic_hiring_case: strategic ? { declared: true, reason: reason } : { declared: false, reason: null } };
  }

  function generateConditions(context, decision, policy) {
    policy = policy || defaultPolicy;
    context = context || {};
    decision = decision || decide(context, policy);
    var input = context.input || {}, conditions = [];
    var d = context.demand || {}, e = context.economic || {}, t = context.timing || {}, r = context.repeatability || {};
    var start = section(input, 'proposed_ae').proposed_start_date || section(input, 'timing').proposed_start_date || null;
    function add(code, current, required, gap, deadline, dependencies, fields, trigger) {
      conditions.push({ code: code, current: current === undefined ? null : current, required: required === undefined ? null : required,
        gap: gap === undefined ? null : gap, deadline: deadline || null, depends_on: dependencies,
        evidence_required: fields || [], retest_trigger: trigger });
    }
    if (!decision.can_decide) {
      var missing = decision.missing_evidence || (context.evidenceGate || {}).missing || [];
      missing.forEach(function (item) {
        var field = typeof item === 'string' ? item : item.field || item.code;
        add('evidence_required', null, field, null, null, [], [field], 'Supply ' + field + ' and rerun the analysis.');
      });
      var validation = context.validation || input.validation || {};
      (validation.fatal_errors || []).concat(validation.clarifications || []).forEach(function (item) {
        add('data_conflict', item, 'resolved', null, null, [], item.fields || (item.field ? [item.field] : []), 'Resolve the recorded contradiction and rerun the analysis.');
      });
      return conditions;
    }
    if (d.state === 'near' || d.state === 'short' || d.state === 'unknown') {
      add('pipeline_supply', d.allocatable, d.required, numeric(d.required) && numeric(d.allocatable) ? Math.max(0, d.required - d.allocatable) : null,
        d.needed_by_date || start, ['selected_win_rate', 'proposed_ae_contribution', 'pipeline_allocation'],
        d.state === 'unknown' ? ['demand.pipeline_likely_open_at_ae_start', 'demand.new_ae_pipeline_share_pct'] : [],
        'Rerun when allocatable qualified pipeline reaches the calculated requirement.');
    }
    // The required monthly rate is an average over the eligible creation window, so
    // it must hold from the window start, not be reached by the window's end.
    var creationDeadline = d.creation_window_start || start;
    var unboundedTrigger = d.creation_unbounded_reason === 'zero_conversion' ?
      'Rerun when observed qualified-opportunity conversion is above zero.' :
      'Rerun when current allocatable pipeline or the revenue window permits the remaining requirement to close in time.';
    var observedPipeline = d.observed_monthly_pipeline_creation !== undefined ? d.observed_monthly_pipeline_creation :
      section(input, 'demand').monthly_qualified_pipeline_created_value;
    var observedOpps = d.observed_monthly_opps_created !== undefined ? d.observed_monthly_opps_created :
      section(input, 'demand').monthly_qualified_opps_created;
    if (numeric(d.required_monthly_pipeline_creation) && d.required_monthly_pipeline_creation > 0) {
      add('pipeline_creation', observedPipeline, d.required_monthly_pipeline_creation,
        numeric(observedPipeline) ? Math.max(0, d.required_monthly_pipeline_creation - observedPipeline) : null,
        creationDeadline, ['eligible_creation_months', 'current_allocatable_pipeline'], d.pipeline_creation_missing || [],
        'Rerun when the observed monthly pipeline creation available to the new seat meets the requirement.');
    } else if (d.pipeline_creation_state === 'unknown' || d.pipeline_creation_state === 'unbounded') {
      add('pipeline_creation', numeric(observedPipeline) ? observedPipeline : null, null, null,
        creationDeadline, ['eligible_creation_months', 'current_allocatable_pipeline'], d.pipeline_creation_missing || [],
        d.pipeline_creation_state === 'unbounded' ? unboundedTrigger :
          'Supply the listed evidence and rerun to establish the monthly pipeline creation requirement.');
    }
    if (numeric(d.required_monthly_opps) && d.required_monthly_opps > 0) {
      add('opportunity_creation', observedOpps, d.required_monthly_opps,
        numeric(observedOpps) ? Math.max(0, d.required_monthly_opps - observedOpps) : null,
        creationDeadline, ['average_acv', 'selected_win_rate', 'eligible_creation_months'], d.opportunity_creation_missing || [],
        'Rerun when qualified opportunity creation available to the new seat meets the requirement.');
    } else if (d.opportunity_creation_state === 'unknown' || d.opportunity_creation_state === 'unbounded') {
      add('opportunity_creation', numeric(observedOpps) ? observedOpps : null, null, null,
        creationDeadline, ['average_acv', 'selected_win_rate', 'eligible_creation_months'], d.opportunity_creation_missing || [],
        d.opportunity_creation_state === 'unbounded' ? unboundedTrigger :
          'Supply the listed evidence and rerun to establish the monthly qualified opportunity requirement.');
    }
    if (e.state !== 'supported' && numeric(e.contribution)) {
      var requiredGap = e.contribution * policy.economic.fullUseThreshold;
      add(e.state === 'none' ? 'no_capacity_gap' : 'seat_oversized', e.gap, requiredGap,
        numeric(e.gap) ? Math.max(0, requiredGap - e.gap) : null, start, ['current_team_capacity', 'proposed_ae_contribution'], [],
        'Rerun when the revenue capacity gap meets the requirement or the proposed seat scope changes.');
    }
    if (t.state !== 'compatible') add(t.late_start === true || t.reason === 'late_start' ? 'late_start' : 'sales_cycle_timing', start, t.latest_viable_start, null,
      t.latest_viable_start, ['ramp_definition', 'ramp_schedule', 'qualified_opportunity_sales_cycle'], [],
      'Rerun when the proposed start or revenue window changes to permit the required contribution.');
    if (r.first_ae) add('transferability', r.state, 'documented_buyer_use_case_qualification_and_close_path', null, start,
      ['first_ae_execution_risk'], ['repeatability.founder_can_articulate_path'],
      'Reassess transferability when the first non-founder conversion evidence exists.');
    else if (r.state !== 'demonstrated' || decision.confidence === 'low') add('transferability', r.non_founder_qualified_opps,
      policy.conversionSample.thinBelow, numeric(r.non_founder_qualified_opps) ? Math.max(0, policy.conversionSample.thinBelow - r.non_founder_qualified_opps) : null,
      start, ['relevant_non_founder_evidence_window'], ['conversion.non_founder_qualified_opps_trailing_12m',
        'conversion.non_founder_wins_trailing_12m', 'repeatability.founder_required_late_stage'],
      'Rerun after the required non-founder opportunity evidence and independent late-stage progression are observed.');
    if ((context.management || {}).state !== 'ready') add('management_capacity', (context.management || {}).state,
      'named_manager_and_onboarding_owner_with_weekly_coaching_and_pipeline_review', null, start, [],
      ['management.direct_manager_exists', 'management.weekly_1to1_capacity', 'management.weekly_pipeline_review_capacity',
        'management.onboarding_owner_named', 'management.onboarding_plan_exists'], 'Rerun when the management and onboarding gaps are resolved.');
    if (section(input, 'proposed_ae').ramp_definition === 'unknown' || (context.hireCapacity || {}).ambiguous) add('ramp_ambiguity',
      'unknown', 'closed_bookings_or_pipeline_productivity', null, start, [], ['proposed_ae.ramp_definition'],
      'Rerun after the company specifies what its ramp plan measures.');
    (context.sensitivities || []).filter(function (scenario) {
      return scenario.decision_changed === true && scenario.deterioration !== false;
    }).forEach(function (scenario) {
      add('sensitivity', scenario.value, { variable: scenario.variable, scenario_change: scenario.change,
        decision_state: scenario.decision_state }, null, start, [scenario.variable], [scenario.variable],
        'Verify the ' + scenario.variable + ' assumption against the disclosed scenario before committing to the hire.');
    });
    if (!conditions.length && decision.state === 'conditional') add('evidence_required', null, 'resolve_material_assumptions', null,
      start, [], (context.confidence || {}).reasons || [], 'Resolve the listed evidence assumptions and rerun the analysis.');
    return conditions;
  }

  return {
    classifyRepeatability: classifyRepeatability,
    classifyManagement: classifyManagement,
    classifyEvidenceConfidence: classifyEvidenceConfidence,
    decide: decide,
    generateConditions: generateConditions
  };
});
