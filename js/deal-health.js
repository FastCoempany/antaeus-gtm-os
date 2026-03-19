/**
 * deal-health.js — GTM OS Shared Deal Intelligence Engine
 * 
 * Used by: Dashboard (briefing), Future Autopsy (vitals/risk),
 *          Deal Workspace (ambient signals), Readiness Score,
 *          Playbook (loss patterns), Quota Workback (coverage bar)
 *
 * All functions are pure — they read localStorage but never write to it.
 */
(function(){
"use strict";

// ============================================================
// CONSTANTS
// ============================================================

var STAGE_PROB = {
    prospect: 0, discovery: 0.10, evaluation: 0.25,
    poc: 0.50, negotiation: 0.75, verbal: 0.90,
    'closed-won': 1.0, 'closed-lost': 0
};

var STAGE_LABELS = {
    prospect:'Prospect', discovery:'Discovery', evaluation:'Solution Fit',
    poc:'PoC / Pilot', negotiation:'Negotiation', verbal:'Verbal Commit',
    'closed-won':'Closed Won', 'closed-lost':'Closed Lost'
};

var STAGE_ORDER = {
    prospect:0, discovery:1, evaluation:2, poc:3,
    negotiation:4, verbal:5, 'closed-won':6, 'closed-lost':7
};

var LOSS_LABELS = {
    competitor:'Lost to Competitor', no_decision:'No Decision / Status Quo',
    budget:'Budget Killed', champion_left:'Champion Left / Reorg',
    timing:'Timing / Not Now'
};

var GATE_FIELDS = ['champion','eb','usecase','impact','process','timeline','competition','risks','nextstep'];

var DEFAULTS = {
    staleWarnDays: 7,
    staleCriticalDays: 14,
    stageStuckDays: 21,
    highValueUSD: 75000,
    killValueUSD: 15000,
    coverageTarget: 4.5,
    autopsyHorizonDays: 45
};

// ============================================================
// UTILITIES
// ============================================================

function readLS(k, fb) {
    try { return JSON.parse(localStorage.getItem(k)) || fb; }
    catch(e) { return fb; }
}

var workspaceSummaryPreloadPromise = null;

function currentWorkspaceSummary() {
    return window.__gtmosWorkspaceSummary || null;
}

function preloadWorkspaceSummary() {
    if (workspaceSummaryPreloadPromise) return workspaceSummaryPreloadPromise;
    if (!(window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function')) {
        return Promise.resolve({ data: currentWorkspaceSummary(), error: null });
    }
    workspaceSummaryPreloadPromise = window.gtmPersistence.workspace.loadSummary().catch(function(error) {
        console.error('Workspace summary preload failed for deal-health:', error);
        return { data: currentWorkspaceSummary(), error: error };
    });
    return workspaceSummaryPreloadPromise;
}

function tx(v) { return String(v || '').trim(); }

function daysBetween(a, b) {
    var x = new Date(a), y = b ? new Date(b) : new Date();
    if (isNaN(x) || isNaN(y)) return 0;
    return Math.max(0, Math.floor((y - x) / 86400000));
}

function daysUntil(d) {
    if (!d) return null;
    var target = new Date(d + 'T23:59:59'), now = new Date();
    if (isNaN(target)) return null;
    return Math.floor((target - now) / 86400000);
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function money(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(Number(n || 0));
}

function hasDateString(v) {
    v = tx(v).toLowerCase();
    return /\b(19|20)\d{2}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b|\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|today|tomorrow|next week|eow|eom)\b/.test(v);
}

function isClosed(stage) {
    return /closed|won|lost/i.test(String(stage || ''));
}

function normalizeStage(s) {
    s = tx(s).toLowerCase();
    if (/closed|won|lost/.test(s)) return s.indexOf('won') >= 0 ? 'closed-won' : 'closed-lost';
    if (s.indexOf('discover') >= 0) return 'discovery';
    if (s.indexOf('qual') >= 0 || s.indexOf('solution') >= 0 || s.indexOf('eval') >= 0) return 'evaluation';
    if (/poc|pilot/.test(s)) return 'poc';
    if (s.indexOf('negot') >= 0) return 'negotiation';
    if (s.indexOf('verbal') >= 0) return 'verbal';
    return s || 'prospect';
}

// ============================================================
// FIELD ADAPTER — normalizes v31/v32 deal schema for all consumers
// ============================================================

function adaptDeal(deal) {
    if (!deal) return null;
    return {
        id: deal.id || '',
        account_name: deal.accountName || deal.account_name || deal.name || '',
        stage: deal.stage || 'prospect',
        value: Number(deal.value || deal.deal_value || deal.amount || 0),
        champion: deal.champion || '',
        economic_buyer: deal.economicBuyer || deal.economic_buyer || '',
        use_cases: deal.useCase || deal.use_cases || '',
        pain_points: deal.pain || deal.pain_points || '',
        decision_process: deal.decisionProcess || deal.decision_process || '',
        competition: deal.competition || '',
        blockers: deal.blockers || '',
        timeline: deal.closeDate || deal.timeline || deal.close_date || '',
        close_date: deal.closeDate || deal.close_date || '',
        next_steps: deal.nextStep || deal.next_steps || '',
        next_step_date: deal.nextStepDate || deal.next_step_date || '',
        poc_end_date: deal.pocEndDate || deal.poc_end_date || '',
        notes: deal.notes || '',
        updated_at: deal.updated_at || '',
        created_at: deal.created_at || '',
        forecast_category: deal.forecastCategory || deal.forecast_category || 'pipeline',
        momentum: deal.momentum || '',
        stakeholders: deal.stakeholders || [],
        loss_reason: deal.lossReason || deal.loss_reason || '',
        loss_notes: deal.lossNotes || deal.loss_notes || '',
        // Preserve original for downstream
        _original: deal
    };
}

// ============================================================
// GATE ASSESSMENT — evaluates field quality
// ============================================================

function gate(v) {
    v = tx(v);
    if (!v) return 'missing';
    if (v.length < 20) return 'weak';
    return 'present';
}

function assessGates(adapted) {
    return {
        champion: gate(adapted.champion),
        eb: gate(adapted.economic_buyer),
        usecase: gate(adapted.use_cases),
        impact: gate(adapted.pain_points),
        process: gate(adapted.decision_process),
        timeline: gate(adapted.timeline || adapted.close_date),
        competition: gate(adapted.competition),
        risks: gate(adapted.blockers),
        nextstep: gate(adapted.next_steps)
    };
}

function missingMap(gates) {
    var m = {};
    GATE_FIELDS.forEach(function(k) { m[k] = gates[k] !== 'present'; });
    return m;
}

function qualScore(gates) {
    var s = 0;
    GATE_FIELDS.forEach(function(k) {
        s += gates[k] === 'present' ? 2 : gates[k] === 'weak' ? 1 : 0;
    });
    return clamp(s, 0, 18);
}

// ============================================================
// STAGE AGE — days in current stage from history log
// ============================================================

function stageAgeDays(deal) {
    var hist = readLS('gtmos_deal_stage_history', {});
    var entries = hist[String(deal.id)] || [];
    var st = normalizeStage(deal.stage);
    var lastEntry = null;
    for (var i = entries.length - 1; i >= 0; i--) {
        if (normalizeStage(entries[i].to) === st) { lastEntry = entries[i]; break; }
    }
    if (lastEntry) return daysBetween(lastEntry.at);
    return daysBetween(deal.updated_at || deal.created_at);
}

// ============================================================
// THREADING DEPTH
// ============================================================

function threadingDepth(deal) {
    var sh = deal.stakeholders || [];
    var engaged = 0, roles = {};
    sh.forEach(function(s) {
        if (s.role) roles[s.role] = true;
        if (s.engaged) engaged++;
    });
    // Count champion/EB from intel fields if not in stakeholders
    var ad = typeof deal.account_name !== 'undefined' ? deal : adaptDeal(deal);
    if (ad.champion && !roles.champion) { roles.champion = true; engaged++; }
    if (ad.economic_buyer && !roles.eb) { roles.eb = true; engaged++; }
    return { engaged: engaged, total: 6, roles: Object.keys(roles).length };
}

// ============================================================
// COMPUTE VITALS — the full health picture for one deal
// ============================================================

function computeVitals(deal, prefs) {
    prefs = prefs || DEFAULTS;
    var ad = adaptDeal(deal);
    if (!ad) return null;

    var gates = assessGates(ad);
    var missing = missingMap(gates);
    var qs = qualScore(gates);
    var stage = normalizeStage(ad.stage);
    var stale = daysBetween(ad.updated_at || ad.created_at);
    var stageAge = stageAgeDays(deal);
    var cdAway = daysUntil(ad.close_date);
    var nsdAway = daysUntil(ad.next_step_date);
    var td = threadingDepth(deal);
    var closed = isClosed(ad.stage);

    // Momentum: manual override or auto-compute
    var mom = ad.momentum;
    if (!mom) {
        mom = stale <= 3 ? 'strong' : stale <= 7 ? 'neutral' : 'stalling';
    }

    var v = {
        id: String(ad.id),
        deal: ad,
        name: ad.account_name || 'Unnamed',
        stage: stage,
        stageRaw: ad.stage || 'Unknown',
        value: ad.value,
        staleDays: stale,
        stageAgeDays: stageAge,
        qualScore: qs,
        missing: missing,
        gates: gates,
        hasNextStep: !!tx(ad.next_steps),
        nextStepHasDate: !!ad.next_step_date || hasDateString(ad.next_steps),
        nextStepText: tx(ad.next_steps),
        nextStepDate: ad.next_step_date || '',
        nextStepDaysAway: nsdAway,
        closeDateDaysAway: cdAway,
        closeDate: ad.close_date || '',
        forecastCategory: ad.forecast_category || 'pipeline',
        momentum: mom,
        threadingDepth: td,
        stakeholders: ad.stakeholders || [],
        lossReason: ad.loss_reason || '',
        lossNotes: ad.loss_notes || '',
        isClosed: closed,
        linkMeta: {}
    };

    v.riskScore = computeRisk(v, prefs);
    return v;
}

// ============================================================
// RISK SCORE — 0 to 100
// ============================================================

function computeRisk(v, prefs) {
    if (v.isClosed) return 0;
    prefs = prefs || DEFAULTS;
    var s = 0;

    // Staleness (max 30)
    s += v.staleDays <= 3 ? 0 : v.staleDays <= 7 ? 10 : v.staleDays <= 14 ? 20 : 30;

    // Stage stuck (max 20)
    s += v.stageAgeDays > prefs.stageStuckDays ? 20 : v.stageAgeDays > 14 ? 8 : 0;

    // Next step quality (max 15)
    s += v.missing.nextstep ? 15 : (!v.nextStepHasDate ? 8 : 0);

    // Qualification depth (max 20)
    s += v.qualScore >= 16 ? 0 : v.qualScore >= 12 ? 6 : v.qualScore >= 7 ? 12 : 20;

    // High-value amplifier (max 10)
    s += v.value >= prefs.highValueUSD ? 10 : 0;

    // Late-stage fragility (max 10)
    if (/negotiation|poc|verbal/.test(v.stage) && (v.missing.eb || v.missing.process)) s += 10;

    // Overdue close date (max 10)
    if (v.closeDateDaysAway !== null && v.closeDateDaysAway < 0) s += 10;

    // Overdue next step date (max 8)
    if (v.nextStepDaysAway !== null && v.nextStepDaysAway < 0) s += 8;

    // Single-threaded (max 8)
    if (v.threadingDepth.engaged < 3 && v.value >= 50000) s += 8;

    // PoC past end date
    var poe = v.deal.poc_end_date;
    if (v.stage === 'poc' && poe && !isNaN(new Date(poe)) && new Date(poe) < new Date()) s += 8;

    return clamp(Math.round(s), 0, 100);
}

// ============================================================
// PIPELINE COVERAGE MATH
// ============================================================

function computeCoverage(deals, quota) {
    quota = Number(quota) || 0;
    var quarterly = quota / 4;
    var active = [], weighted = 0, raw = 0;

    (deals || []).forEach(function(d) {
        if (isClosed(d.stage)) return;
        var val = Number(d.value || 0);
        var prob = STAGE_PROB[normalizeStage(d.stage)] || 0;
        raw += val;
        weighted += val * prob;
        active.push(d);
    });

    var ratio = quarterly > 0 ? Math.round((raw / quarterly) * 10) / 10 : 0;
    var needed = quarterly > 0 ? Math.max(0, quarterly * DEFAULTS.coverageTarget - raw) : 0;

    return {
        ratio: ratio,
        raw: raw,
        weighted: Math.round(weighted),
        needed: Math.round(needed),
        quarterly: Math.round(quarterly),
        activeCount: active.length,
        target: DEFAULTS.coverageTarget
    };
}

// ============================================================
// CAUSE ENGINE — why deals die
// ============================================================

var CAUSES = [
    { id:'no_nextstep', sev:9, text:'There was never a dated next step, so momentum decayed.',
      when: function(v) { return v.missing.nextstep || !v.nextStepHasDate; } },
    { id:'stale_thread', sev:8, text:'The thread went stale and urgency died.',
      when: function(v,p) { return v.staleDays >= (p||DEFAULTS).staleWarnDays; } },
    { id:'no_champion', sev:8, text:'No real champion carried this inside.',
      when: function(v) { return v.missing.champion; } },
    { id:'champion_weak', sev:6, text:'Champion signal was weak and non-committal.',
      when: function(v) { return v.gates.champion === 'weak'; } },
    { id:'no_eb', sev:8, text:'Economic buyer never entered the thread.',
      when: function(v) { return v.missing.eb; } },
    { id:'no_process', sev:8, text:'Decision process was never mapped.',
      when: function(v) { return v.missing.process; } },
    { id:'timeline_fantasy', sev:6, text:'Timeline was a wish, not a plan.',
      when: function(v) { return v.missing.timeline && v.closeDateDaysAway === null; } },
    { id:'impact_not_real', sev:7, text:'Business impact stayed vague.',
      when: function(v) { return v.missing.impact; } },
    { id:'usecase_blurry', sev:7, text:'Use case remained blurry.',
      when: function(v) { return v.missing.usecase; } },
    { id:'competition_unknown', sev:5, text:'Competition or status quo was never named.',
      when: function(v) { return v.missing.competition; } },
    { id:'late_stage_fragility', sev:9, text:'Late-stage fragility: no EB or process at the finish.',
      when: function(v) { return /negotiation|poc|verbal/.test(v.stage) && (v.missing.process || v.missing.eb); } },
    { id:'stage_stuck', sev:8, text:'Stage sat too long without movement.',
      when: function(v,p) { return v.stageAgeDays > (p||DEFAULTS).stageStuckDays; } },
    { id:'poc_no_criteria', sev:8, text:'PoC had no success criteria owner.',
      when: function(v) { return v.stage === 'poc' && (v.missing.impact || v.missing.process); } },
    { id:'close_date_impossible', sev:7, text:'Close date assumptions were impossible.',
      when: function(v) { return v.closeDateDaysAway !== null && v.closeDateDaysAway < 0; } },
    { id:'single_threaded', sev:7, text:'Deal is single-threaded with fewer than 3 engaged stakeholders.',
      when: function(v) { return v.threadingDepth.engaged < 3 && v.value >= 50000; } },
    { id:'next_step_overdue', sev:7, text:'Next step date is past due with no update.',
      when: function(v) { return v.nextStepDaysAway !== null && v.nextStepDaysAway < 0; } }
];

function topCauses(vitals, prefs, limit) {
    prefs = prefs || DEFAULTS;
    limit = limit || 5;
    return CAUSES
        .filter(function(c) { return c.when(vitals, prefs); })
        .map(function(c) { return { id: c.id, severity: c.sev, text: c.text }; })
        .sort(function(a, b) { return b.severity - a.severity; })
        .slice(0, limit);
}

// ============================================================
// MOVE GENERATOR — what to do about a specific deal
// ============================================================

var MOVE_TEMPLATES = {
    no_nextstep:    { action: 'Put a dated next step on {name}.', reason: 'No calendar anchor means no deal.' },
    stale_thread:   { action: '{name}: {days} days dark. Re-engage or kill it.', reason: 'Silence is the answer you\'re not hearing.' },
    no_champion:    { action: 'Find a champion inside {name}.', reason: 'No internal driver, no motion.' },
    no_eb:          { action: '{name}: bring the economic buyer into the thread.', reason: 'No budget owner = no close.' },
    no_process:     { action: 'Map the decision process on {name}.', reason: 'Unknown steps multiply slippage.' },
    impact_not_real:{ action: 'Quantify business impact on {name}.', reason: 'Vague impact kills urgency.' },
    usecase_blurry: { action: 'Lock the use case on {name}.', reason: 'Blur creates stakeholder drift.' },
    late_stage_fragility: { action: '{name}: EB and process must be locked before negotiation proceeds.', reason: 'Legal and procurement will widen the blast radius.' },
    stage_stuck:    { action: '{name} has been in {stage} for {stageAge}d. Force movement or qualify out.', reason: 'Elapsed time is a proxy for a hidden no.' },
    single_threaded:{ action: 'Multi-thread {name} — engage 3+ stakeholders.', reason: 'Single-threaded deals die when your one contact gets busy.' },
    close_date_impossible: { action: '{name}: close date is past due. Reset it or close-lost it.', reason: 'Fantasy dates poison your forecast.' },
    next_step_overdue: { action: '{name}: next step was {nextStepDate}. Follow up now.', reason: 'Overdue steps signal lost momentum.' },
    champion_weak:  { action: 'Strengthen your champion on {name} — do they have authority?', reason: 'A weak champion can\'t force the room.' },
    competition_unknown: { action: 'Name the competition on {name}.', reason: 'You can\'t win a fight you can\'t see.' },
    timeline_fantasy: { action: 'Get a real timeline on {name}.', reason: 'No forcing function means no decision pressure.' },
    poc_no_criteria: { action: 'Lock PoC success criteria on {name}.', reason: 'Without criteria, a pilot produces activity, not decisions.' }
};

function generateMoves(vitals, prefs) {
    var causes = topCauses(vitals, prefs, 8);
    var moves = [];
    var seen = {};

    causes.forEach(function(c) {
        var tmpl = MOVE_TEMPLATES[c.id];
        if (!tmpl || seen[c.id]) return;
        seen[c.id] = true;

        var action = tmpl.action
            .replace('{name}', vitals.name)
            .replace('{days}', vitals.staleDays)
            .replace('{stage}', STAGE_LABELS[vitals.stage] || vitals.stage)
            .replace('{stageAge}', vitals.stageAgeDays)
            .replace('{nextStepDate}', vitals.nextStepDate || 'unknown');

        moves.push({
            dealId: vitals.id,
            dealName: vitals.name,
            action: action,
            reason: tmpl.reason,
            causeId: c.id,
            severity: c.severity,
            urgency: c.severity * (vitals.value >= (prefs || DEFAULTS).highValueUSD ? 1.5 : 1)
        });
    });

    return moves.sort(function(a, b) { return b.urgency - a.urgency; });
}

// ============================================================
// NARRATIVE GENERATORS — editorial voice
// ============================================================

function dealNarrative(vitals, prefs) {
    var causes = topCauses(vitals, prefs, 3);
    if (causes.length === 0) return vitals.name + ' is healthy. Keep executing.';

    var parts = [];
    causes.forEach(function(c) {
        // Transform cause text from past tense to present observation
        var text = c.text
            .replace('There was never', 'No')
            .replace('so momentum decayed', 'so momentum is decaying')
            .replace('went stale and urgency died', 'has gone stale')
            .replace('never entered the thread', 'isn\'t in the thread')
            .replace('was never mapped', 'isn\'t mapped')
            .replace('stayed vague', 'is vague')
            .replace('remained blurry', 'is blurry')
            .replace('was never named', 'isn\'t named')
            .replace('sat too long', 'has sat too long')
            .replace('had no success criteria', 'has no success criteria');
        parts.push(text);
    });

    return parts.join(' ');
}

// ============================================================
// BRIEFING GENERATOR — the full editorial briefing
// ============================================================

function generateBriefing(allVitals, quota, seed) {
    seed = seed || {};
    var prefs = Object.assign({}, DEFAULTS, seed);
    var active = allVitals.filter(function(v) { return !v.isClosed; });
    var atRisk = active.filter(function(v) { return v.riskScore > 40; })
        .sort(function(a, b) { return b.riskScore - a.riskScore; });
    var stalled = active.filter(function(v) { return v.staleDays >= 7; });
    var overdue = active.filter(function(v) { return v.nextStepDaysAway !== null && v.nextStepDaysAway < 0; });

    // Coverage
    var cov = computeCoverage(allVitals.map(function(v) { return v.deal._original || v.deal; }), quota);

    // Stage changes in last 7 days
    var hist = readLS('gtmos_deal_stage_history', {});
    var moved = [];
    var sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    Object.keys(hist).forEach(function(dealId) {
        var entries = hist[dealId] || [];
        entries.forEach(function(e) {
            if (new Date(e.at) >= sevenDaysAgo) {
                var v = allVitals.find(function(x) { return x.id === dealId; });
                moved.push({
                    dealId: dealId,
                    dealName: v ? v.name : dealId,
                    from: e.from,
                    to: e.to,
                    daysAgo: daysBetween(e.at)
                });
            }
        });
    });

    // New deals in last 7 days
    var newDeals = allVitals.filter(function(v) {
        return v.deal.created_at && daysBetween(v.deal.created_at) <= 7;
    });
    var newValue = newDeals.reduce(function(s, v) { return s + v.value; }, 0);

    // ---- Headline ----
    var headline = '';
    if (active.length === 0) {
        headline = 'No active deals. Start in Signal Console or create your first deal.';
    } else if (cov.ratio >= prefs.coverageTarget) {
        headline = 'You have ' + cov.ratio + '\u00d7 coverage against ' + money(cov.quarterly) + ' this quarter.';
        if (atRisk.length > 0) headline += ' ' + atRisk.length + ' deal' + (atRisk.length > 1 ? 's' : '') + ' need attention.';
        else headline += ' Pipeline is healthy.';
    } else if (cov.ratio >= prefs.coverageTarget * 0.6) {
        headline = 'Coverage is thin at ' + cov.ratio + '\u00d7 \u2014 you need ' + prefs.coverageTarget + '\u00d7.';
        if (stalled.length > 0) headline += ' ' + stalled[0].name + ' hasn\'t moved in ' + stalled[0].staleDays + ' days.';
    } else if (cov.quarterly > 0) {
        headline = 'Pipeline gap: ' + cov.ratio + '\u00d7 coverage against a ' + prefs.coverageTarget + '\u00d7 target. You need ' + money(cov.needed) + ' more pipeline this quarter.';
    } else {
        headline = active.length + ' active deal' + (active.length > 1 ? 's' : '') + ' worth ' + money(cov.raw) + '. Set your quota in Quota Workback to see coverage.';
    }

    // ---- Week summary paragraph ----
    var weekParts = [];
    if (moved.length > 0) {
        weekParts.push(moved.length + ' deal' + (moved.length > 1 ? 's' : '') + ' moved forward this week.');
    }
    if (newDeals.length > 0) {
        weekParts.push(newDeals.length + ' new deal' + (newDeals.length > 1 ? 's' : '') + ' created worth ' + money(newValue) + '.');
    }
    // Closed deals this week
    var closedThisWeek = allVitals.filter(function(v) {
        return v.isClosed && v.deal.updated_at && daysBetween(v.deal.updated_at) <= 7;
    });
    var wonsThisWeek = closedThisWeek.filter(function(v) { return v.stageRaw === 'closed-won'; });
    var lostsThisWeek = closedThisWeek.filter(function(v) { return v.stageRaw === 'closed-lost'; });
    if (wonsThisWeek.length > 0) {
        weekParts.push(wonsThisWeek.length + ' deal' + (wonsThisWeek.length > 1 ? 's' : '') + ' closed won.');
    }
    if (lostsThisWeek.length > 0) {
        weekParts.push(lostsThisWeek.length + ' deal' + (lostsThisWeek.length > 1 ? 's' : '') + ' closed lost.');
    }
    if (atRisk.length > 0) {
        weekParts.push(atRisk[0].name + ' is the highest-risk deal \u2014 ' + dealNarrative(atRisk[0], prefs).split('.')[0] + '.');
    }
    if (stalled.length > 0 && (atRisk.length === 0 || stalled[0].id !== (atRisk[0] || {}).id)) {
        weekParts.push(stalled.length + ' deal' + (stalled.length > 1 ? 's' : '') + ' have gone quiet.');
    }

    var weekSummary = weekParts.length > 0
        ? weekParts.join(' ')
        : 'No pipeline movement in the last 7 days. That\'s the signal.';

    // ---- Top moves (across all deals) ----
    var allMoves = [];
    active.forEach(function(v) {
        var dealMoves = generateMoves(v, prefs);
        dealMoves.forEach(function(m) { allMoves.push(m); });
    });
    // Coverage gap move
    if (cov.ratio < prefs.coverageTarget && cov.quarterly > 0) {
        var dealsNeeded = Math.ceil(cov.needed / (Number(seed.avg_deal_size) || 50000));
        allMoves.push({
            dealId: null,
            dealName: null,
            action: 'Create ' + dealsNeeded + ' more deal' + (dealsNeeded > 1 ? 's' : '') + ' to get coverage above ' + prefs.coverageTarget + '\u00d7.',
            reason: 'Pipeline math demands it.',
            causeId: 'coverage_gap',
            severity: 7,
            urgency: 9
        });
    }
    // Deduplicate by deal (keep highest urgency per deal, plus coverage move)
    var seen = {};
    var topMoves = [];
    allMoves.sort(function(a, b) { return b.urgency - a.urgency; });
    allMoves.forEach(function(m) {
        var key = m.dealId || m.causeId;
        if (!seen[key]) {
            seen[key] = true;
            topMoves.push(m);
        }
    });
    topMoves = topMoves.slice(0, 5);

    // ---- Monday Review text ----
    var weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    var weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    var weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '\u2013' + weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    var mondayReview = 'PIPELINE BRIEFING \u2014 Week of ' + weekLabel + '\n';
    mondayReview += 'Coverage: ' + cov.ratio + '\u00d7 | Weighted: ' + money(cov.weighted) + ' | Active: ' + active.length + ' | At Risk: ' + atRisk.length + '\n\n';
    mondayReview += weekSummary + '\n\n';
    if (atRisk.length > 0) {
        mondayReview += 'AT RISK:\n';
        atRisk.slice(0, 4).forEach(function(v) {
            mondayReview += '\u2022 ' + v.name + ' (' + money(v.value) + ', ' + (STAGE_LABELS[v.stage] || v.stage) + ') \u2014 ' + dealNarrative(v, prefs).substring(0, 120) + '\n';
        });
        mondayReview += '\n';
    }
    if (topMoves.length > 0) {
        mondayReview += 'MOVES:\n';
        topMoves.forEach(function(m, i) {
            mondayReview += (i + 1) + '. ' + m.action + '\n';
        });
    }

    return {
        headline: headline,
        weekLabel: weekLabel,
        weekSummary: weekSummary,
        coverage: cov,
        atRisk: atRisk,
        moved: moved,
        overdue: overdue,
        stalled: stalled,
        newDeals: newDeals,
        closedThisWeek: closedThisWeek,
        topMoves: topMoves,
        mondayReview: mondayReview
    };
}

// ============================================================
// LOSS PATTERN ANALYSIS — for Playbook auto-assembly
// ============================================================

function lossPatterns(allVitals) {
    var lost = allVitals.filter(function(v) { return v.stageRaw === 'closed-lost' && v.lossReason; });
    if (lost.length < 2) return null;

    var reasons = {};
    lost.forEach(function(v) {
        reasons[v.lossReason] = (reasons[v.lossReason] || 0) + 1;
    });

    var sorted = Object.keys(reasons).map(function(k) {
        return { reason: k, count: reasons[k], label: LOSS_LABELS[k] || k };
    }).sort(function(a, b) { return b.count - a.count; });

    var top = sorted[0];
    var diagnostics = {
        competitor: 'You need stronger differentiation or earlier competitive positioning.',
        no_decision: 'Your discovery isn\'t creating enough urgency \u2014 deals stall because doing nothing is easier than changing.',
        budget: 'Budget authority isn\'t being engaged early enough. Bring the EB in before negotiation.',
        champion_left: 'Single-threading is killing you. Multi-thread from discovery.',
        timing: 'Your forcing function is weak. Every deal needs a "why now" that\'s real, not manufactured.'
    };

    return {
        total: lost.length,
        topReason: top,
        allReasons: sorted,
        diagnostic: diagnostics[top.reason] || 'Review your loss patterns for common themes.',
        summary: top.count + ' of ' + lost.length + ' losses were "' + top.label + '." ' + (diagnostics[top.reason] || '')
    };
}

// ============================================================
// PERFORMANCE METRICS — for Playbook scoreboard
// ============================================================

function performanceMetrics(allVitals) {
    var won = allVitals.filter(function(v) { return v.stageRaw === 'closed-won'; });
    var lost = allVitals.filter(function(v) { return v.stageRaw === 'closed-lost'; });
    var total = won.length + lost.length;

    var winRate = total > 0 ? Math.round(won.length / total * 100) : null;
    var avgDealSize = won.length > 0 ? Math.round(won.reduce(function(s, v) { return s + v.value; }, 0) / won.length) : null;

    // Avg cycle: created_at to updated_at for won deals
    var cycles = won.filter(function(v) { return v.deal.created_at && v.deal.updated_at; })
        .map(function(v) { return daysBetween(v.deal.created_at, v.deal.updated_at); })
        .filter(function(d) { return d > 0; });
    var avgCycle = cycles.length > 0 ? Math.round(cycles.reduce(function(s, d) { return s + d; }, 0) / cycles.length) : null;

    return {
        won: won.length,
        lost: lost.length,
        total: total,
        winRate: winRate,
        avgDealSize: avgDealSize,
        avgCycleDays: avgCycle
    };
}

// ============================================================
// LOAD HELPERS — convenience functions to load and compute
// ============================================================

function loadAllDeals() {
    var workspace = currentWorkspaceSummary();
    if (workspace && Array.isArray(workspace.deals)) {
        return workspace.deals.filter(Boolean);
    }
    var raw = readLS('gtmos_deal_workspaces', []);
    if (!Array.isArray(raw)) {
        raw = Object.keys(raw || {}).map(function(id) { var d = raw[id]; if (!d.id) d.id = id; return d; });
    }
    return raw.filter(Boolean);
}

function loadAllVitals(prefs) {
    return loadAllDeals().map(function(d) { return computeVitals(d, prefs); }).filter(Boolean);
}

function loadQuota() {
    var workspace = currentWorkspaceSummary();
    if (workspace && workspace.outboundSeed) {
        return Number(workspace.outboundSeed.annual_quota) || 0;
    }
    var seed = readLS('gtmos_outbound_seed', {});
    return Number(seed.annual_quota) || 0;
}

function loadSeed() {
    var workspace = currentWorkspaceSummary();
    if (workspace && workspace.outboundSeed) {
        return workspace.outboundSeed;
    }
    return readLS('gtmos_outbound_seed', {});
}

function loadFullBriefing(prefs) {
    var vitals = loadAllVitals(prefs);
    var quota = loadQuota();
    var seed = loadSeed();
    return generateBriefing(vitals, quota, seed);
}

// ============================================================
// PUBLIC API
// ============================================================

window.dealHealth = {
    // Core
    adaptDeal: adaptDeal,
    computeVitals: computeVitals,
    computeRisk: computeRisk,
    computeCoverage: computeCoverage,

    // Analysis
    assessGates: assessGates,
    qualScore: qualScore,
    topCauses: topCauses,
    generateMoves: generateMoves,
    dealNarrative: dealNarrative,
    threadingDepth: threadingDepth,
    lossPatterns: lossPatterns,
    performanceMetrics: performanceMetrics,

    // Briefing
    generateBriefing: generateBriefing,
    loadFullBriefing: loadFullBriefing,

    // Loaders
    preload: preloadWorkspaceSummary,
    loadAllDeals: loadAllDeals,
    loadAllVitals: loadAllVitals,
    loadQuota: loadQuota,
    loadSeed: loadSeed,

    // Utils
    money: money,
    daysBetween: daysBetween,
    normalizeStage: normalizeStage,
    isClosed: isClosed,

    // Constants
    STAGE_PROB: STAGE_PROB,
    STAGE_LABELS: STAGE_LABELS,
    STAGE_ORDER: STAGE_ORDER,
    LOSS_LABELS: LOSS_LABELS,
    CAUSES: CAUSES,
    DEFAULTS: DEFAULTS
};

if (window.__gtmosAuthGatePending && window.requireAuthReady && typeof window.requireAuthReady.then === 'function') {
    window.requireAuthReady.then(function() { return preloadWorkspaceSummary(); }).catch(function() {});
} else if (window.__gtmosAuthGatePending) {
    window.addEventListener('gtmos:auth-ready', function() {
        preloadWorkspaceSummary().catch(function() {});
    }, { once: true });
} else {
    preloadWorkspaceSummary().catch(function() {});
}

})();
