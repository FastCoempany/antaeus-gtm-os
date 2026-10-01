(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AEUnderwritingMath = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Calendar constants are units, not decision thresholds. Business dates stay
  // date-only throughout: neither local timezone nor the current clock is read.
  var DAY_MS = 86400000;
  function number(value) {
    if (value && typeof value === 'object') value = value.value;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  function nonnegative(value) {
    value = number(value);
    return value !== null && value >= 0 ? value : null;
  }
  function safe(value) { return Number.isFinite(value) ? value : null; }
  // Floating-point comparison only (no business materiality): a sum that equals
  // its bound up to rounding is not treated as exceeding it.
  function exceeds(a, b) { return a > b && a - b > Math.max(Math.abs(a), Math.abs(b)) * 8 * Number.EPSILON; }
  function result(value, details) {
    return Object.assign({ value: safe(value), assumptions: [], warnings: [], trace: {} }, details || {});
  }
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var parts = value.split('-').map(Number);
    var date = new Date(0);
    date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
    date.setUTCHours(0, 0, 0, 0);
    if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) return null;
    return safe(date.getTime() / DAY_MS);
  }
  function formatDate(day) {
    if (!Number.isInteger(day)) return null;
    var date = new Date(day * DAY_MS);
    if (!Number.isFinite(date.getTime())) return null;
    var year = date.getUTCFullYear();
    if (year < 0 || year > 9999) return null;
    return String(year).padStart(4, '0') + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
  }
  function dayNumber(value) { return typeof value === 'string' ? parseDate(value) : (Number.isInteger(value) && formatDate(value) !== null ? value : null); }
  function monthStart(day) {
    var date = new Date(day * DAY_MS);
    date.setUTCDate(1);
    return date.getTime() / DAY_MS;
  }
  function addMonths(value, count) {
    var day = dayNumber(value);
    if (day === null || !Number.isInteger(count)) return null;
    var date = new Date(day * DAY_MS);
    var originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + count);
    if (!Number.isFinite(date.getTime())) return null;
    var end = new Date(date.getTime());
    end.setUTCMonth(end.getUTCMonth() + 1);
    end.setUTCDate(0);
    date.setUTCDate(Math.min(originalDay, end.getUTCDate()));
    return formatDate(date.getTime() / DAY_MS) === null ? null : date.getTime() / DAY_MS;
  }
  function monthDays(day) { return addMonths(monthStart(day), 1) - monthStart(day); }
  function monthDistance(first, last) {
    var a = new Date(first * DAY_MS), b = new Date(last * DAY_MS);
    return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
  }
  function monthsBetween(first, last) {
    if (first === null || last === null) return null;
    if (first > last) return 0;
    var sum = 0;
    for (var day = first; day <= last;) {
      var next = addMonths(monthStart(day), 1);
      if (next === null) return null;
      var stop = Math.min(next - 1, last);
      sum += (stop - day + 1) / (next - monthStart(day));
      day = stop + 1;
    }
    return safe(sum);
  }
  function horizon(input) {
    var target = input.target || {};
    var start = parseDate(target.target_period_start);
    var end = parseDate(target.target_period_end);
    return { start: start, end: end, valid: start !== null && end !== null && start <= end };
  }
  function scheduleFor(person) {
    if (Array.isArray(person.monthly_ramp_schedule)) return person.monthly_ramp_schedule;
    if (Array.isArray(person.ramp_schedule)) return person.ramp_schedule;
    return null;
  }
  function rampFactor(person, start, day) {
    var age = monthDistance(start, day);
    if (day < addMonths(start, age)) age -= 1;
    if (age < 0) return 0;
    var schedule = scheduleFor(person);
    if (schedule) {
      if (!schedule.length) return null;
      var factor = age < schedule.length ? number(schedule[age]) : number(schedule[schedule.length - 1]);
      if (age >= schedule.length && factor !== 1) return null;
      return factor !== null && factor >= 0 && factor <= 1 ? factor : null;
    }
    if (person.company_ramp_schedule_known === true) return null;
    var ramp = nonnegative(person.ramp_months);
    if (ramp === null) return null;
    return ramp === 0 ? 1 : Math.min(1, (age + 1) / ramp);
  }
  function dailyContribution(person, start, first, last, lag) {
    var quota = nonnegative(person.annual_quota);
    if (first > last) return { value: 0, first: null, monthly: [] };
    if (quota === null) return { value: null, first: null, monthly: [] };
    var total = 0, firstContribution = null, monthly = {};
    for (var day = first; day <= last; day += 1) {
      var factor = rampFactor(person, start, day);
      if (factor === null) return { value: null, first: firstContribution, monthly: Object.values(monthly) };
      var booked = (quota / 12) * factor / monthDays(day);
      var close = day + lag;
      if (booked > 0 && firstContribution === null) firstContribution = close;
      var key = formatDate(day).slice(0, 7);
      if (!monthly[key]) monthly[key] = { generation_month: key, contribution: 0, eligible_days: 0 };
      monthly[key].contribution += booked;
      monthly[key].eligible_days += 1;
      total += booked;
    }
    return { value: safe(total), first: firstContribution, monthly: Object.values(monthly) };
  }

  function calculateExistingCapacity(input, policy) {
    input = input || {};
    var h = horizon(input), team = input.current_team || {}, target = input.target || {};
    var finance = nonnegative(team.existing_team_committed_new_arr);
    if (finance === null) finance = nonnegative(target.existing_team_committed_new_arr);
    var out = result(null, { nominal_capacity: null, finance_plan: finance, sellers: [] });
    out.trace = { formula: 'sum(annual_quota / 12 * calendar_month_fraction * supplied_ramp_factor * trailing_attainment)', horizon_start: formatDate(h.start), horizon_end: formatDate(h.end), finance_plan: finance };
    if (!h.valid) { out.warnings.push('unknown_analysis_horizon'); return out; }
    var sellers = Array.isArray(team.sellers) ? team.sellers : null;
    if (team.current_quota_carriers === 0 && (!sellers || sellers.length === 0)) {
      out.value = 0; out.nominal_capacity = 0; return out;
    }
    if (sellers && sellers.length) {
      var known = true, nominalKnown = true, sum = 0, nominalSum = 0;
      sellers.forEach(function (seller, index) {
        var started = parseDate(seller.start_date), departure = parseDate(seller.departure_date);
        if (index === team.departing_seller_index) departure = parseDate(team.departure_date || team.departing_seller_departure_date) || departure;
        var hasRamp = scheduleFor(seller) !== null || seller.company_ramp_schedule_known === true || nonnegative(seller.ramp_months) !== null;
        var start = started === null ? h.start : Math.max(h.start, started);
        var end = departure === null ? h.end : Math.min(h.end, departure);
        var activeMonths = monthsBetween(start, end);
        var quota = nonnegative(seller.annual_quota);
        var nominal = activeMonths === 0 ? 0 : quota === null ? null : safe(quota / 12 * activeMonths);
        var attainment = nonnegative(seller.trailing_attainment_pct);
        if (attainment === null) {
          attainment = 1;
          out.assumptions.push('Existing seller ' + index + ' uses 100% of declared quota because trailing attainment is unknown.');
        }
        var operating = nominal;
        if (hasRamp && activeMonths > 0) {
          if (started === null) { operating = null; out.warnings.push('unknown_existing_seller_ramp_start:' + index); }
          else operating = dailyContribution(seller, started, start, end, 0).value;
        }
        var value = operating === null ? null : safe(operating * attainment);
        out.sellers.push({ index: index, value: value, nominal_capacity: nominal, months_available: activeMonths, attainment: attainment, is_founder: seller.is_founder === true, start_date: formatDate(start), departure_date: formatDate(departure) });
        if (value === null) known = false; else sum += value;
        if (nominal === null) nominalKnown = false; else nominalSum += nominal;
      });
      out.value = known ? safe(sum) : null;
      out.nominal_capacity = nominalKnown ? safe(nominalSum) : null;
    } else {
      var aggregate = nonnegative(team.aggregate_annual_quota);
      var months = monthsBetween(h.start, h.end);
      var rate = nonnegative(team.trailing_team_attainment_pct);
      out.nominal_capacity = aggregate === null ? null : safe(aggregate / 12 * months);
      if (rate === null) {
        rate = 1;
        out.assumptions.push('Existing-team capacity uses 100% of declared quota because trailing attainment is unknown.');
      }
      out.value = out.nominal_capacity === null ? null : safe(out.nominal_capacity * rate);
      out.trace.aggregate_annual_quota = aggregate;
      out.trace.attainment = rate;
      out.trace.horizon_months = months;
      if (input.decision && input.decision.hire_reason === 'replacement') {
        out.value = null;
        out.warnings.push('replacement_requires_departing_seller_capacity');
      }
    }
    out.trace.sellers = out.sellers;
    if (finance !== null && out.value !== null && finance !== out.value) out.warnings.push('finance_plan_differs_from_operating_capacity');
    return out;
  }

  function calculateHireContribution(input, winRate, policy, mode) {
    input = input || {};
    var person = input.proposed_ae || {}, timing = input.timing || {}, economics = input.economics || {};
    mode = mode || person.ramp_definition || 'unknown';
    if (mode === 'unknown') {
      var closed = calculateHireContribution(input, winRate, policy, 'closed_bookings');
      var pipeline = calculateHireContribution(input, winRate, policy, 'pipeline_productivity');
      return result(null, {
        mode: mode, ambiguous: true, uses_fallback: closed.uses_fallback,
        months_available: closed.months_available, first_contribution_date: null,
        range: closed.value === null || pipeline.value === null ? null : [Math.min(closed.value, pipeline.value), Math.max(closed.value, pipeline.value)],
        branches: { closed_bookings: closed, pipeline_productivity: pipeline },
        assumptions: closed.assumptions, warnings: ['ramp_ambiguity'].concat(closed.warnings, pipeline.warnings),
        trace: { formula: 'evaluate both ramp interpretations; do not silently select one', closed_bookings: closed.trace, pipeline_productivity: pipeline.trace }
      });
    }
    var h = horizon(input), start = parseDate(person.proposed_start_date || timing.proposed_start_date);
    var schedule = scheduleFor(person), usesFallback = schedule === null && person.company_ramp_schedule_known !== true;
    var out = result(null, { mode: mode, ambiguous: false, uses_fallback: usesFallback, months_available: null, first_contribution_date: null, range: null });
    out.trace = { formula: mode === 'closed_bookings' ? 'sum(Q / 12 * ramp_factor / days_in_calendar_month) for active days in horizon; no cycle shift' : 'sum(Q / 12 / W * ramp_factor / days_in_calendar_month * W) for generation days whose day + qualified_cycle is inside horizon', annual_quota: nonnegative(person.annual_quota), start_date: formatDate(start), horizon_start: formatDate(h.start), horizon_end: formatDate(h.end), ramp_months: nonnegative(person.ramp_months), ramp_schedule: schedule, win_rate: number(winRate) };
    if (usesFallback) out.assumptions.push('Ramp assumption: linear progression to full productivity over the supplied ramp period because a company-specific monthly ramp schedule was not provided.');
    if (!h.valid || start === null) { out.warnings.push('unknown_start_or_horizon'); return out; }
    out.months_available = monthsBetween(Math.max(start, h.start), h.end);
    if (start > h.end) { out.value = 0; out.warnings.push('late_start'); return out; }
    var lag = 0;
    if (mode === 'pipeline_productivity') {
      if (economics.sales_cycle_definition !== 'qualified_opportunity_to_close' || nonnegative(economics.average_sales_cycle_days) === null) {
        out.warnings.push('qualified_opportunity_cycle_required'); return out;
      }
      lag = Math.ceil(economics.average_sales_cycle_days);
      var rate = number(winRate);
      if (rate === null || rate < 0 || rate > 1) { out.warnings.push('unknown_conversion'); return out; }
      if (rate === 0) { out.value = 0; out.warnings.push('zero_conversion_unbounded_pipeline'); return out; }
    } else if (mode !== 'closed_bookings') {
      out.warnings.push('unknown_ramp_definition'); return out;
    }
    var first = Math.max(start, h.start - lag), last = h.end - lag;
    var modeled = dailyContribution(person, start, first, last, lag);
    out.value = modeled.value;
    out.first_contribution_date = formatDate(modeled.first);
    out.trace.cycle_lag_days = lag;
    out.trace.generation_start = formatDate(first);
    out.trace.generation_cutoff = formatDate(last);
    out.trace.monthly = modeled.monthly;
    if (modeled.value === null) out.warnings.push('incomplete_quota_or_ramp_schedule');
    return out;
  }

  function quotient(numerator, denominator) {
    if (numerator === null || denominator === null || denominator < 0) return { value: null, status: 'unknown' };
    if (denominator === 0) return numerator === 0 ? { value: 0, status: 'known' } : { value: null, status: 'unbounded' };
    var value = safe(numerator / denominator);
    return { value: value, status: value === null ? 'unknown' : 'known' };
  }
  function calculateFunnelRequirements(args) {
    args = args || {};
    var contribution = nonnegative(args.contribution), acv = nonnegative(args.acv), rate = number(args.winRate), meeting = number(args.meetingToOpp);
    if (rate !== null && (rate < 0 || rate > 1)) rate = null;
    if (meeting !== null && (meeting < 0 || meeting > 1)) meeting = null;
    var wins = quotient(contribution, acv), pipeline = quotient(contribution, rate);
    var opps = quotient(wins.value, rate), meetings = quotient(opps.value, meeting);
    if (wins.status === 'unbounded' || (pipeline.status === 'unbounded' && acv !== null)) opps.status = 'unbounded';
    if (opps.status === 'unbounded' && meeting !== null) meetings.status = 'unbounded';
    return result(pipeline.value, {
      wins_required: wins.value, practical_wins_required: wins.value === null ? null : Math.ceil(wins.value),
      opps_required: opps.value, pipeline_required: pipeline.value, meetings_required: meetings.value,
      statuses: { wins_required: wins.status, opps_required: opps.status, pipeline_required: pipeline.status, meetings_required: meetings.status },
      warnings: pipeline.status === 'unbounded' ? ['zero_conversion_unbounded_pipeline'] : [],
      trace: { contribution: contribution, acv: acv, win_rate: rate, meeting_to_opp: meeting, wins_required: 'N / ACV', opps_required: '(N / ACV) / W', pipeline_required: 'N / W', meetings_required: 'O_req / M', practical_wins_required: 'ceil(N / ACV)' }
    });
  }

  function calculateDemandPool(input, policy) {
    input = input || {};
    var demand = input.demand || {}, economics = input.economics || {}, h = horizon(input);
    var out = result(null, { current: null, future: null, eligible_creation_months: null, creation_cutoff_date: null });
    out.trace = { formula: 'qualified current horizon pipeline + sum(monthly creation * eligible calendar-month fraction)', pipeline_value_type: demand.pipeline_value_type || 'unknown', horizon_start: formatDate(h.start), horizon_end: formatDate(h.end) };
    if (demand.pipeline_value_type !== 'unweighted') {
      out.warnings.push('unweighted_pipeline_required'); return out;
    }
    var current = nonnegative(demand.current_qualified_pipeline_in_horizon);
    if (current === null) {
      current = nonnegative(demand.current_qualified_pipeline_value);
      if (current !== null) out.assumptions.push('Supplied current qualified pipeline is modeled as expected to close inside the analysis horizon; confirm its close-date eligibility.');
    }
    out.current = current;
    if (!h.valid) { out.warnings.push('unknown_analysis_horizon'); return out; }
    var cycle = nonnegative(economics.average_sales_cycle_days);
    if (economics.sales_cycle_definition !== 'qualified_opportunity_to_close' || cycle === null) {
      out.warnings.push('qualified_opportunity_cycle_required_for_future_supply'); return out;
    }
    var cutoff = h.end - Math.ceil(cycle);
    out.creation_cutoff_date = formatDate(cutoff);
    out.eligible_creation_months = monthsBetween(h.start, cutoff);
    var monthly = nonnegative(demand.monthly_qualified_pipeline_created_value);
    var series = Array.isArray(demand.monthly_pipeline_series) ? demand.monthly_pipeline_series : null;
    var future = 0, parts = [], known = true;
    if (demand.pipeline_creation_is_seasonal === true && !series) {
      out.assumptions.push('Seasonal pipeline creation is extrapolated linearly from the supplied monthly value because no monthly series was supplied.');
      out.warnings.push('seasonal_linear_simplification');
    }
    for (var day = h.start; day <= cutoff;) {
      var next = addMonths(monthStart(day), 1), end = Math.min(next - 1, cutoff);
      var fraction = (end - day + 1) / (next - monthStart(day));
      var index = monthDistance(h.start, day);
      var amount = series ? nonnegative(series[index]) : monthly;
      var value = amount === null ? null : safe(amount * fraction);
      parts.push({ month: formatDate(day).slice(0, 7), series_index: index, monthly_value: amount, eligible_fraction: fraction, value: value });
      if (value === null) known = false; else future += value;
      day = end + 1;
    }
    out.future = known ? safe(future) : null;
    out.value = current === null || out.future === null ? null : safe(current + out.future);
    out.trace.current = current;
    out.trace.cycle_days = cycle;
    out.trace.future = parts;
    if (!known) out.warnings.push(series ? 'incomplete_monthly_pipeline_series' : 'unknown_monthly_pipeline_creation');
    return out;
  }

  function calculateAllocatablePipeline(args) {
    args = args || {};
    var input = args.input || {}, demand = input.demand || {};
    var pool = nonnegative(args.demandPool), existing = nonnegative(args.existingDemand);
    var out = result(null, { surplus: null, measures: [], current_allocatable: null });
    out.trace = { formula: 'minimum(supported explicit allocation, pool * explicit share, supported theoretical surplus)', pool: pool, existing_team_requirement: existing };
    if (demand.pipeline_value_type !== 'unweighted') { out.warnings.push('unweighted_pipeline_required'); return out; }
    out.surplus = pool === null || existing === null ? null : Math.max(0, pool - existing);
    var declared = nonnegative(demand.allocatable_qualified_pipeline);
    var share = number(demand.new_ae_pipeline_share_pct);
    if (share !== null && (share < 0 || share > 1)) share = null;
    if (declared !== null) out.measures.push({ source: 'explicit_allocation', value: declared });
    if (share !== null && pool !== null) out.measures.push({ source: 'explicit_share', value: safe(pool * share) });
    // Mathematical surplus alone says nothing about ownership, late-stage
    // reassignment, or a territory. It is a cap only after allocation evidence.
    if (out.measures.length && out.surplus !== null) out.measures.push({ source: 'theoretical_surplus_cap', value: out.surplus });
    if (out.measures.length) out.value = Math.min.apply(Math, out.measures.map(function (item) { return item.value; }));
    else out.warnings.push('unknown_pipeline_allocation');
    // Current allocation is temporal: it is bounded by the cycle-eligible
    // pipeline that exists today, net of any current pipeline reserved for the
    // existing team/founder. Horizon-wide allocation (which can include future
    // creation) is never the bound that makes a current claim admissible.
    var currentPool = args.demandPool ? nonnegative(args.demandPool.current) : null;
    var reserved = nonnegative(demand.current_pipeline_reserved_for_existing_team);
    var available = currentPool === null ? null : Math.max(0, currentPool - (reserved === null ? 0 : reserved));
    var currentClaims = [];
    var explicitCurrent = nonnegative(demand.allocatable_current_qualified_pipeline);
    if (explicitCurrent !== null) currentClaims.push({ source: 'explicit_current_allocation', value: explicitCurrent });
    if (share !== null && currentPool !== null) currentClaims.push({ source: 'explicit_share_of_current_pool', value: safe(currentPool * share) });
    var claimed = currentClaims.length ? Math.min.apply(Math, currentClaims.map(function (item) { return item.value; })) : null;
    var largestClaim = currentClaims.length ? Math.max.apply(Math, currentClaims.map(function (item) { return item.value; })) : null;
    if (claimed === null) {
      out.warnings.push('unknown_current_pipeline_allocation');
    } else if (available === null) {
      // A zero claim needs no pool evidence; any positive claim cannot be checked
      // against what exists today, so it stays unknown.
      if (claimed === 0) out.current_allocatable = 0;
      else out.warnings.push('unknown_current_pipeline_pool');
    } else if (exceeds(largestClaim + (reserved === null ? 0 : reserved), currentPool)) {
      // Every current ownership statement must fit the current pool. A claim that
      // only fits by borrowing future creation or the existing team's reservation
      // is contradictory, so ownership is not established.
      out.warnings.push('current_allocation_exceeds_current_pool');
    } else {
      out.current_allocatable = claimed;
    }
    // A seller's current allocation also cannot exceed its own total allocation.
    if (out.current_allocatable !== null && out.value !== null) out.current_allocatable = Math.min(out.current_allocatable, out.value);
    if (declared !== null && pool !== null && declared > pool) out.warnings.push('allocation_exceeds_pipeline_pool');
    out.trace.declared_allocation = declared;
    out.trace.share = share;
    out.trace.surplus = out.surplus;
    out.trace.measures = out.measures;
    out.trace.current_pool = currentPool;
    out.trace.current_reserved_for_existing_team = reserved;
    out.trace.current_available_to_new_ae = available;
    out.trace.current_claims = currentClaims;
    out.trace.current_formula = 'minimum(explicit current allocation, current pool * explicit share) when every claim + current existing-team reservation <= current cycle-eligible pool; capped by total allocation';
    return out;
  }

  return {
    parseDate: parseDate, formatDate: formatDate, addMonths: addMonths,
    calculateExistingCapacity: calculateExistingCapacity,
    calculateHireContribution: calculateHireContribution,
    calculateFunnelRequirements: calculateFunnelRequirements,
    calculateDemandPool: calculateDemandPool,
    calculateAllocatablePipeline: calculateAllocatablePipeline
  };
});
