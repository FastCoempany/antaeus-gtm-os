/**
 * GTMOS Proof Layer — "It Worked" Aggregation
 * 
 * Reads effectiveness signals from 8 module sources:
 * 1. ICP Builder        — icps with worked=true
 * 2. Discovery Studio   — advancedCalls count
 * 3. Trigger-Outreach   — angles with got_reply=true
 * 4. CFO Negotiation    — moves marked "worked"
 * 5. PoC Framework      — PoCs marked converted
 * 6. Sales Collateral Builder    — assets with worked=true
 * 7. Deal Workspaces    — Closed Won "what worked" text
 * 8. Discovery Agenda   — gates checked
 * 
 * Usage: window.proofLayer.getSummary() returns full aggregation.
 */

(function() {
    'use strict';

    function readLS(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch(e) { return fallback; }
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
            console.error('Workspace summary preload failed for proof-layer:', error);
            return { data: currentWorkspaceSummary(), error: error };
        });
        return workspaceSummaryPreloadPromise;
    }

    function getSummary() {
        var workspace = currentWorkspaceSummary() || {};
        var signals = [];
        var totalSignals = 0;
        var totalPositive = 0;

        // 1. ICP Builder — icps with worked flag
        var icp = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [], totalWorked: 0 });
        var icpTotal = (icp.icps || []).length;
        var icpWorked = (icp.icps || []).filter(function(i) { return i.worked; }).length;
        signals.push({
            source: 'ICP Builder',
            icon: '🎯',
            total: icpTotal,
            positive: icpWorked,
            label: icpWorked + ' of ' + icpTotal + ' ICPs confirmed effective'
        });
        totalSignals += icpTotal;
        totalPositive += icpWorked;

        // 2. Discovery Studio — advancement rate
        var discoState = workspace.discovery || null;
        var disco = (discoState && discoState.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 });
        signals.push({
            source: 'Discovery Frameworks',
            icon: '🔍',
            total: disco.totalCalls,
            positive: disco.advancedCalls,
            label: disco.advancedCalls + ' of ' + disco.totalCalls + ' calls advanced'
        });
        totalSignals += disco.totalCalls;
        totalPositive += disco.advancedCalls;

        // 3. Trigger-Outreach — got_reply angles
        var sequences = workspace.sequences || null;
        var angles = (sequences && sequences.angles) || readLS('gtmos_angles', []);
        var anglesTotal = angles.length;
        var anglesReplied = angles.filter(function(a) { return a.payload && a.payload.got_reply; }).length;
        signals.push({
            source: 'Trigger-Outreach',
            icon: '🎪',
            total: anglesTotal,
            positive: anglesReplied,
            label: anglesReplied + ' of ' + anglesTotal + ' angles got replies'
        });
        totalSignals += anglesTotal;
        totalPositive += anglesReplied;

        // 4. CFO Negotiation — moves marked worked (stored in localStorage as array/object)
        var cfoMoves = readLS('gtmos_cfo_worked_moves', []);
        var cfoCount = Array.isArray(cfoMoves) ? cfoMoves.length : 0;
        signals.push({
            source: 'CFO Negotiation',
            icon: '💰',
            total: cfoCount,
            positive: cfoCount,
            label: cfoCount + ' moves marked "worked"'
        });
        totalPositive += cfoCount;

        // 5. PoC Framework — converted PoCs
        var pocState = readLS('gtmos_poc_data', { pocs: [] });
        var pocList = Array.isArray(pocState && pocState.pocs) ? pocState.pocs : [];
        var poc = {
            total: pocList.length,
            converted: pocList.filter(function(item) { return item && item.outcome === 'converted'; }).length
        };
        signals.push({
            source: 'PoC Framework',
            icon: '🧪',
            total: poc.total || 0,
            positive: poc.converted || 0,
            label: (poc.converted || 0) + ' of ' + (poc.total || 0) + ' PoCs converted'
        });
        totalSignals += (poc.total || 0);
        totalPositive += (poc.converted || 0);

        // 6. Sales Collateral Builder — assets with worked flag
        var assets = readLS('gtmos_asset_builder_analytics', { assets: [], totalWorked: 0 });
        var assetTotal = (assets.assets || []).length;
        var assetWorked = assets.totalWorked || 0;
        signals.push({
            source: 'Sales Collateral Builder',
            icon: '📄',
            total: assetTotal,
            positive: assetWorked,
            label: assetWorked + ' of ' + assetTotal + ' assets marked effective'
        });
        totalSignals += assetTotal;
        totalPositive += assetWorked;

        // 7. Deal Workspaces — Closed Won with "what worked" text
        var outcomes = {};
        if (window.gtmStore && window.gtmStore.outcomes) {
            var wins = window.gtmStore.outcomes.getWins();
            var winsWithText = Object.values(wins).filter(function(w) { return w.whatWorked && w.whatWorked.trim().length > 0; });
            var totalWins = Object.keys(wins).length;
            signals.push({
                source: 'Closed Won',
                icon: '🏆',
                total: totalWins,
                positive: winsWithText.length,
                label: winsWithText.length + ' of ' + totalWins + ' wins documented "what worked"'
            });
            totalSignals += totalWins;
            totalPositive += winsWithText.length;
        }

        // 7b. Closed revenue proof snippets (from Deal Workspace close events)
        var proofSignals = readLS('gtmos_proof_signals', []).filter(function(s) { return s && s.type === 'closed_revenue'; });
        if (proofSignals.length > 0) {
            signals.push({
                source: 'Closed Revenue',
                icon: '💵',
                total: proofSignals.length,
                positive: proofSignals.length,
                label: proofSignals[0].label
            });
            totalSignals += proofSignals.length;
            totalPositive += proofSignals.length;
        }

        // 8. Discovery Agenda — gates checked
        var agenda = (discoState && discoState.agenda) || readLS('gtmos_discovery_agenda', {});
        var gates = (agenda.gates || []);
        var gatesChecked = gates.filter(function(g) { return g; }).length;
        signals.push({
            source: 'Call Planner',
            icon: '⏱️',
            total: 4,
            positive: gatesChecked,
            label: gatesChecked + ' of 4 qualification gates confirmed'
        });
        totalSignals += 4;
        totalPositive += gatesChecked;

        // ── Celebration threshold ──
        var dealCount = 0;
        if (window.gtmStore && window.gtmStore.outcomes) {
            dealCount = window.gtmStore.outcomes.count().total;
        }
        var celebrate = dealCount >= 50 && totalPositive >= 20;

        return {
            signals: signals,
            totalSignals: totalSignals,
            totalPositive: totalPositive,
            rate: totalSignals > 0 ? Math.round((totalPositive / totalSignals) * 100) : 0,
            celebrate: celebrate,
            dealCount: dealCount,
            enrichment: computeEnrichment(signals, totalSignals, totalPositive)
        };
    }

    // ── Enrichment: effectiveness, consistency, coverage ──────────
    function computeEnrichment(signals, totalSignals, totalPositive) {
        var workspace = currentWorkspaceSummary() || {};
        var effectiveness = { score: 0, details: [] };
        var consistency = { score: 0, details: [] };
        var coverage = { score: 0, details: [] };

        // Effectiveness: advance rate + reply rate
        var discoState = workspace.discovery || null;
        var disco = (discoState && discoState.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 });
        var advRate = disco.totalCalls > 0 ? Math.round((disco.advancedCalls / disco.totalCalls) * 100) : 0;
        if (advRate >= 40) { effectiveness.score += 2; effectiveness.details.push('Strong advance rate (' + advRate + '%)'); }
        else if (advRate >= 25) { effectiveness.score += 1; effectiveness.details.push('Improving advance rate (' + advRate + '%)'); }

        var sequences = workspace.sequences || null;
        var angles = (sequences && sequences.angles) || readLS('gtmos_angles', []);
        var replied = angles.filter(function(a) { return a.payload && a.payload.got_reply; }).length;
        var replyRate = angles.length > 0 ? Math.round((replied / angles.length) * 100) : 0;
        if (replyRate >= 15) { effectiveness.score += 2; effectiveness.details.push('Strong reply rate (' + replyRate + '%)'); }
        else if (replyRate >= 8) { effectiveness.score += 1; effectiveness.details.push('Improving reply rate (' + replyRate + '%)'); }

        // Consistency: consecutive weekly reviews
        var reviews = readLS('gtmos_deal_reviews', []);
        var streakWeeks = 0;
        if (reviews.length > 0) {
            var now = Date.now();
            var weekMs = 7 * 24 * 60 * 60 * 1000;
            for (var w = 0; w < 4; w++) {
                var weekStart = now - ((w + 1) * weekMs);
                var weekEnd = now - (w * weekMs);
                var has = reviews.some(function(r) {
                    var ts = r.timestamp || r.createdAt;
                    if (!ts) return false;
                    var t = new Date(ts).getTime();
                    return t >= weekStart && t < weekEnd;
                });
                if (has) streakWeeks++;
                else break;
            }
        }
        if (streakWeeks >= 3) { consistency.score += 3; consistency.details.push(streakWeeks + '-week review streak'); }
        else if (streakWeeks >= 2) { consistency.score += 2; consistency.details.push(streakWeeks + '-week review streak'); }
        else if (streakWeeks >= 1) { consistency.score += 1; consistency.details.push('Reviewed this week'); }

        // Coverage: ratio of real confirmations to total signals
        var coverageRate = totalSignals > 0 ? Math.round((totalPositive / totalSignals) * 100) : 0;
        if (coverageRate >= 40) { coverage.score += 2; coverage.details.push('Strong signal coverage (' + coverageRate + '%)'); }
        else if (coverageRate >= 20) { coverage.score += 1; coverage.details.push('Building coverage (' + coverageRate + '%)'); }

        return {
            effectiveness: effectiveness,
            consistency: consistency,
            coverage: coverage,
            totalBonus: effectiveness.score + consistency.score + coverage.score
        };
    }

    // ── Render a plain-language selling record bar ──
    async function renderProofBar(containerId) {
        await preloadWorkspaceSummary();
        var container = document.getElementById(containerId);
        if (!container) return;

        var summary = getSummary();
        var workspace = currentWorkspaceSummary() || {};
        var disco = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 });
        var angles = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
        var replied = angles.filter(function(a) { return a.payload && a.payload.got_reply; }).length;

        // Build plain-language stats
        var stats = [];
        if (disco.totalCalls > 0) {
            var advRate = disco.totalCalls > 0 ? Math.round((disco.advancedCalls / disco.totalCalls) * 100) : 0;
            stats.push({icon: '📞', text: disco.totalCalls + ' discovery call' + (disco.totalCalls !== 1 ? 's' : '') + ' logged', sub: disco.advancedCalls + ' advanced (' + advRate + '% rate)'});
        }
        if (angles.length > 0) {
            stats.push({icon: '📨', text: angles.length + ' outreach angle' + (angles.length !== 1 ? 's' : '') + ' built', sub: replied + ' got replies'});
        }
        if (summary.dealCount > 0) {
            stats.push({icon: '🤝', text: summary.dealCount + ' deal outcome' + (summary.dealCount !== 1 ? 's' : '') + ' captured', sub: ''});
        }
        var cfoMoves = readLS('gtmos_cfo_worked_moves', []);
        if (cfoMoves.length > 0) {
            stats.push({icon: '💰', text: cfoMoves.length + ' negotiation move' + (cfoMoves.length !== 1 ? 's' : '') + ' proven', sub: ''});
        }

        if (stats.length === 0) {
            container.innerHTML = '<div style="padding:14px 16px;background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:var(--radius-md);margin-bottom:16px;text-align:center;color:var(--text-muted);font-size:0.82rem;">Start using the app to build your selling record. Every call, angle, and deal outcome adds evidence here.</div>';
            return;
        }

        var html = '<div style="background:var(--bg-tertiary);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:16px;margin-bottom:16px;">';
        html += '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--brand-gold,#d4a574);margin-bottom:10px;">Your Selling Record</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">';
        stats.forEach(function(s) {
            html += '<div style="display:flex;align-items:flex-start;gap:8px;">';
            html += '<span style="font-size:1rem;">' + s.icon + '</span>';
            html += '<div><div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">' + s.text + '</div>';
            if (s.sub) html += '<div style="font-size:0.72rem;color:var(--text-muted);">' + s.sub + '</div>';
            html += '</div></div>';
        });
        html += '</div>';

        if (summary.celebrate) {
            html += '<div style="margin-top:12px;text-align:center;padding:10px;background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(59,130,246,0.08));border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);">';
            html += '<span style="font-size:0.85rem;font-weight:700;color:#22c55e;">🎉 Your playbook is battle-tested — 50+ deals with proven patterns</span>';
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // ── Public API ───────────────────────────────────────────────────
    window.proofLayer = {
        preload: preloadWorkspaceSummary,
        getSummary: getSummary,
        renderProofBar: renderProofBar
    };

    if (window.__gtmosAuthGatePending && window.requireAuthReady && typeof window.requireAuthReady.then === 'function') {
        window.requireAuthReady.then(function() { return preloadWorkspaceSummary(); }).catch(function(error) {
            console.error('Proof layer auth-gated preload failed:', error);
        });
    } else if (window.__gtmosAuthGatePending) {
        window.addEventListener('gtmos:auth-ready', function() {
            preloadWorkspaceSummary().catch(function(error) {
                console.error('Proof layer auth-ready preload failed:', error);
            });
        }, { once: true });
    } else {
        preloadWorkspaceSummary().catch(function(error) {
            console.error('Proof layer preload failed:', error);
        });
    }

})();
