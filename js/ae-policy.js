(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AE_HIRE_POLICY = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function freeze(value) {
    Object.values(value).forEach(function (child) {
      if (child && typeof child === 'object') freeze(child);
    });
    return Object.freeze(value);
  }
  // Operating policy, not external benchmarks. Changes require a new version.
  return freeze({
    version: 'ae-policy-1.0.0',
    economic: { fullUseThreshold: 0.80, partialUseThreshold: 0.50 },
    demand: { sufficientThreshold: 1, nearThreshold: 0.85 },
    conversionSample: { veryThinBelow: 10, thinBelow: 20 },
    repeatability: {
      demonstratedNonFounderWins: 5,
      documentedProcessMinimum: 2,
      firstAERelevantWins: 5,
      firstAEUseCasesMinimum: 1
    },
    evidence: {
      unknownCoreTestsLimit: 2,
      credibleSources: ['crm_report', 'finance_model', 'spreadsheet', 'structured_internal_analysis'],
      strongSources: ['crm_report', 'finance_model', 'structured_internal_analysis'],
      estimateSources: ['memory_estimate', 'founder_estimate', 'estimate']
    },
    validation: {
      horizonMin: 6, horizonMax: 18, defaultHorizon: 12,
      rampMin: 0, rampMax: 12, cycleMinDays: 1, cycleMaxDays: 730,
      attainmentWarningAbove: 1.5, winRateWarningAbove: 0.7,
      pipelineCoverageWarningAbove: 10,
      // Numerical equality only; no invented materiality tolerance.
      equalityTolerance: 1e-10
    },
    sensitivity: {
      relativeChange: 0.20, rampMonthsChange: 1, cycleDaysChange: 30,
      startDaysChange: 30, enhancedReviewRelativeChange: 0.10,
      variables: ['acv', 'win_rate', 'ramp_duration', 'sales_cycle', 'pipeline_creation', 'start_date']
    },
    constraints: {
      severity: { blocking: 3, material: 2, watch: 1, supported: 0 },
      dimensionOrder: ['economic_need', 'demand_sufficiency', 'repeatability', 'timing', 'management']
    },
    strategicReasons: ['new_geography', 'new_segment', 'founder_handoff', 'strategic_coverage', 'expected_demand_inflection'],
    decisionRank: { insufficient_evidence: 0, not_yet_supported: 1, conditional: 2, supported: 3 }
  });
});
