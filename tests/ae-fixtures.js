'use strict';
// Appendix B.1 literal shared fixture. Golden corrections require the recorded resolution.
const BASE = {
  company: {
    company_stage: 'series_a',
    business_model: 'b2b_saas'
  },

  decision: {
    analysis_horizon_months: 12,
    hire_reason: 'growth_capacity',
    new_ae_market_same_as_history: 'yes'
  },

  target: {
    target_metric: 'new_arr',
    new_arr_target_horizon: 2_000_000,
    target_includes_expansion: false,
    target_includes_renewal: false
  },

  current_team: {
    current_quota_carriers: 2,
    sellers: [
      {
        annual_quota: 900_000,
        trailing_attainment_pct: .72,
        is_founder: false
      },
      {
        annual_quota: 900_000,
        trailing_attainment_pct: .78,
        is_founder: false
      }
    ],
    founder_committed_new_arr: 0
  },

  proposed_ae: {
    annual_quota: 900_000,
    quota_metric: 'new_arr',
    quota_includes_expansion: false,
    start_month_index: 3,
    ramp_months: 3,
    ramp_definition: 'closed_bookings',
    base_salary: 140_000,
    variable_comp_target: 140_000
  },

  economics: {
    average_acv: 52_000,
    median_acv: 50_000,
    average_sales_cycle_days: 94,
    sales_cycle_definition: 'qualified_opportunity_to_close'
  },

  conversion: {
    non_founder_qualified_opps_trailing_12m: 57,
    non_founder_wins_trailing_12m: 12,
    non_founder_qualified_opp_to_win_pct: 12 / 57,
    meeting_to_qualified_opp_pct: .35
  },

  demand: {
    pipeline_value_type: 'unweighted',
    current_qualified_pipeline_value: 3_400_000,
    pipeline_likely_open_at_ae_start: 2_900_000,
    monthly_qualified_pipeline_created_value: 650_000,
    monthly_qualified_opps_created: 12,
    territory_reserved_for_new_ae: true,
    new_ae_pipeline_share_pct: null,
    pipeline_creation_is_seasonal: false
  },

  repeatability: {
    wins_trailing_12m: 14,
    non_founder_wins_trailing_12m: 12,
    founder_primary_seller_share_pct: .14,
    icp_documented: 'yes',
    qualification_documented: 'yes',
    discovery_documented: 'yes',
    sales_stages_documented: 'yes',
    rep_can_run_discovery_without_founder: 'yes',
    founder_required_late_stage: 'rarely',
    repeatable_use_cases_count: 2
  },

  management: {
    direct_manager_exists: true,
    manager_current_direct_reports: 2,
    weekly_1to1_capacity: 'yes',
    weekly_pipeline_review_capacity: 'yes',
    onboarding_owner_named: true,
    onboarding_plan_exists: 'yes',
    manager_is_also_primary_seller: false
  },

  provenance: {
    conversion: 'crm_report',
    pipeline: 'crm_report',
    attainment: 'finance_model'
  }
};

// Separate unit-test inputs supply explicit dates and allocation semantics.
// The literal Appendix B object above is preserved for contradiction checks.
function deepMerge(base, overrides) {
  const result = structuredClone(base);
  Object.entries(overrides).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) result[key] = deepMerge(result[key], value);
    else result[key] = structuredClone(value);
  });
  return result;
}
const UNIT_BASE = deepMerge(BASE, {
  schema_version: 'ae-underwriting-1.0',
  company: { currency: 'USD' },
  target: { target_period_start: '2027-01-01', target_period_end: '2027-12-31' },
  current_team: { founder_in_existing_team: false, founder_expected_to_remain_seller: false },
  economics: { acv_metric: 'new_arr', qualified_stage_definition: 'qualified_opportunity' },
  demand: { pipeline_metric: 'new_arr', pipeline_stage_basis: 'qualified_opportunity', current_qualified_pipeline_in_horizon: 3400000, allocatable_qualified_pipeline: 2900000, allocatable_current_qualified_pipeline: 0 },
  conversion: { conversion_evidence_window_start: '2026-01-01', conversion_evidence_window_end: '2026-12-31' },
  timing: { expects_contribution_inside_horizon: false }
});
function makeCase(overrides = {}) { return deepMerge(UNIT_BASE, overrides); }
module.exports = { BASE, UNIT_BASE, deepMerge, makeCase };
