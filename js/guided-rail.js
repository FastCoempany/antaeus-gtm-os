/**
 * GTMOS Guided Rail System - v27 Phase 2
 *
 * Updated module paths for consolidation:
 *   /app/icp-builder/ -> /app/icp-studio/
 *   /app/signal-play-studio/ -> /app/outbound-studio/
 *   /app/deal-workspaces/ -> /app/deal-workspace/
 *   /app/deal-review/ -> /app/deal-workspace/ (qualification tab)
 *
 * Phase 2: Persona-specific guided rail paths.
 *   Founder:  ICP -> Quota -> Outbound -> Playbook -> Handoff
 *   CRO:      Founding GTM -> Readiness -> ICP -> Deal Workspace
 *   First AE: ICP -> Outbound -> Call Planner -> Discovery -> Deal Workspace
 */

(function() {
    'use strict';

    var THRESHOLD = 80;
    var DISMISS_KEY = 'gtmos_rail_dismissed';

    function isDismissed() {
        if (window.gtmLocalState && typeof window.gtmLocalState.getSession === 'function') {
            return window.gtmLocalState.getSession(DISMISS_KEY, null, { scope: 'user' }) === '1';
        }
        return sessionStorage.getItem(DISMISS_KEY) === '1';
    }

    function setDismissed() {
        if (window.gtmLocalState && typeof window.gtmLocalState.setSession === 'function') {
            window.gtmLocalState.setSession(DISMISS_KEY, '1', { scope: 'user' });
            return;
        }
        sessionStorage.setItem(DISMISS_KEY, '1');
    }

    function removeExistingRail() {
        var existing = document.getElementById('guidedRail');
        if (existing) existing.remove();
    }

    function readLS(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch (e) { return fallback; }
    }

    var workspaceSummary = null;
    var workspaceSummaryPromise = null;

    function currentWorkspaceSummary() {
        return workspaceSummary || window.__gtmosWorkspaceSummary || {
            onboarding: readLS('gtmos_onboarding', null),
            playbook: readLS('gtmos_playbook', {}),
            icpAnalytics: readLS('gtmos_icp_analytics', { icps: [], totalWorked: 0 }),
            discovery: {
                stats: readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 }),
                agenda: readLS('gtmos_discovery_agenda', {})
            },
            outboundSeed: readLS('gtmos_outbound_seed', {}),
            sequences: { angles: readLS('gtmos_angles', []) },
            deals: readDealsLocal(true)
        };
    }

    async function loadWorkspaceSummary(force) {
        if (force) workspaceSummaryPromise = null;
        if (workspaceSummaryPromise) return workspaceSummaryPromise;
        if (!(window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function')) {
            return Promise.resolve(currentWorkspaceSummary());
        }
        workspaceSummaryPromise = window.gtmPersistence.workspace.loadSummary({ force: !!force }).then(function(loaded) {
            if (loaded && loaded.error) console.error('Workspace summary load failed for guided rail:', loaded.error);
            if (loaded && loaded.data) workspaceSummary = loaded.data;
            return currentWorkspaceSummary();
        }).catch(function(error) {
            console.error('Workspace summary load failed for guided rail:', error);
            workspaceSummaryPromise = null;
            return currentWorkspaceSummary();
        });
        return workspaceSummaryPromise;
    }

    function readDealsLocal(skipWorkspace) {
        if (!skipWorkspace) {
            var workspace = workspaceSummary || window.__gtmosWorkspaceSummary;
            if (workspace && Array.isArray(workspace.deals)) return workspace.deals;
        }
        var raw = readLS('gtmos_deal_workspaces', []);
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
            return Object.keys(raw).map(function(id) {
                var d = raw[id] || {};
                if (!d.id) d.id = id;
                return d;
            });
        }
        return [];
    }

    function countStaleDeals(minDays) {
        var deals = readDealsLocal();
        var now = Date.now();
        return deals.filter(function(d) {
            if (!d || d.stage === 'closed-won' || d.stage === 'closed-lost') return false;
            var updated = d.updated_at || d.created_at;
            if (!updated) return false;
            var days = Math.floor((now - new Date(updated).getTime()) / 86400000);
            return days >= minDays;
        }).length;
    }

    function getPersona() {
        var ob = currentWorkspaceSummary().onboarding || readLS('gtmos_onboarding', null);
        return (ob && ob.persona) ? ob.persona : 'founder';
    }

    // Lower number means higher priority.
    var PERSONA_PRIORITIES = {
        'founder': {
            'icp-first': 1, 'icp-more': 2,
            'quota': 3,
            'angles-first': 4, 'angles-more': 5,
            'playbook-basics': 6, 'playbook-fields': 7,
            'disco-first': 8, 'disco-more': 9,
            'gates': 10,
            'qual-first': 11, 'stale-deals': 12,
            'outcome-first': 13, 'outcome-both': 14
        },
        'cro': {
            'playbook-basics': 1, 'playbook-fields': 2,
            'icp-first': 3, 'icp-more': 4,
            'qual-first': 5, 'stale-deals': 6,
            'outcome-first': 7, 'outcome-both': 8,
            'disco-first': 9, 'disco-more': 10,
            'gates': 11,
            'angles-first': 12, 'angles-more': 13,
            'quota': 14
        },
        'first-ae': {
            'icp-first': 1, 'icp-more': 2,
            'angles-first': 3, 'angles-more': 4,
            'gates': 5,
            'disco-first': 6, 'disco-more': 7,
            'qual-first': 8, 'stale-deals': 9,
            'outcome-first': 10, 'outcome-both': 11,
            'quota': 12,
            'playbook-basics': 13, 'playbook-fields': 14
        }
    };

    var PERSONA_RAIL_INTRO = {
        'founder': 'Build the system',
        'cro': 'Audit the foundation',
        'first-ae': 'Build your daily workflow'
    };

    function findGaps() {
        var workspace = currentWorkspaceSummary();
        var gaps = [];
        var playbook = workspace.playbook || readLS('gtmos_playbook', {});
        var fields = playbook.fields || {};
        var thinIcp = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [], totalWorked: 0 });
        var agenda = (workspace.discovery && workspace.discovery.agenda) || readLS('gtmos_discovery_agenda', {});
        var discoStats = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 });
        var seed = workspace.outboundSeed || readLS('gtmos_outbound_seed', {});
        var angles = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
        var quals = (typeof gtmStore !== 'undefined' && gtmStore.quals) ? gtmStore.quals.getAll() : {};
        var outcomes = (typeof gtmStore !== 'undefined' && gtmStore.outcomes) ? gtmStore.outcomes.count() : { total: 0, wins: 0, losses: 0 };

        var icpCount = (thinIcp.icps || []).length;
        var hasOnlyStub = icpCount === 1 && thinIcp.icps[0] && thinIcp.icps[0].source === 'onboarding';
        if (icpCount === 0 || hasOnlyStub) {
            var icpAction = hasOnlyStub
                ? 'Refine your draft ICP with scoring criteria'
                : 'Build your first ideal customer profile';
            gaps.push({ id: 'icp-first', label: 'Define your first ICP', action: icpAction, link: '/app/icp-studio/', potentialPoints: 8 });
        } else if (icpCount < 3) {
            gaps.push({ id: 'icp-more', label: 'Add more ICPs', action: 'You have ' + icpCount + ' ICP - add ' + (3 - icpCount) + ' more for +3 pts', link: '/app/icp-studio/', potentialPoints: 3 });
        }

        if (!playbook.company || !playbook.acv) {
            gaps.push({ id: 'playbook-basics', label: 'Set company basics', action: 'Add your company name and ACV to the GTM Playbook', link: '/app/founding-gtm/', potentialPoints: 4 });
        }
        var pbFieldCount = 0;
        if (fields) Object.values(fields).forEach(function(v) { if (v && String(v).trim()) pbFieldCount++; });
        if (pbFieldCount < 6) {
            gaps.push({ id: 'playbook-fields', label: 'Fill playbook fields', action: 'Fill ' + Math.max(0, 6 - pbFieldCount) + ' more playbook fields for +' + (pbFieldCount < 3 ? 7 : 3) + ' pts', link: '/app/founding-gtm/', potentialPoints: pbFieldCount < 3 ? 7 : 3 });
        }

        if (!seed.annual_quota) {
            gaps.push({ id: 'quota', label: 'Set quota targets', action: 'Enter your quota in Quota Workback - unlocks outbound planning', link: '/app/quota-workback/', potentialPoints: 4 });
        }

        if (discoStats.totalCalls === 0) {
            gaps.push({ id: 'disco-first', label: 'Log a discovery call', action: 'Run your first tracked discovery session', link: '/app/discovery-studio/', potentialPoints: 5 });
        } else if (discoStats.totalCalls < 5) {
            gaps.push({ id: 'disco-more', label: 'Run more discovery', action: discoStats.totalCalls + ' calls logged - hit 5 for +3 pts', link: '/app/discovery-studio/', potentialPoints: 3 });
        }

        var gatesChecked = (agenda.gates || []).filter(function(g) { return g; }).length;
        if (gatesChecked < 2 && agenda.contact) {
            gaps.push({ id: 'gates', label: 'Confirm qualification gates', action: 'Check 2+ gates in your Call Planner for +3 pts', link: '/app/discovery-agenda/', potentialPoints: 3 });
        }

        if (angles.length === 0) {
            gaps.push({ id: 'angles-first', label: 'Create outreach angles', action: 'Build your first signal-based outreach angle', link: '/app/outbound-studio/', potentialPoints: 5 });
        } else if (angles.length < 5) {
            gaps.push({ id: 'angles-more', label: 'Add outreach angles', action: angles.length + ' angles built - hit 5 for +2 pts', link: '/app/outbound-studio/', potentialPoints: 2 });
        }

        var qualCount = Object.keys(quals).length;
        if (qualCount === 0) {
            gaps.push({ id: 'qual-first', label: 'Score a deal', action: 'Qualify your first deal in Deal Workspace for +5 pts', link: '/app/deal-workspace/', potentialPoints: 5 });
        }

        var stale10 = countStaleDeals(10);
        if (stale10 > 0) {
            var staleVerb = stale10 === 1 ? 'hasn\'t' : 'haven\'t';
            gaps.push({
                id: 'stale-deals',
                label: 'Update stale deals',
                action: stale10 + ' deal' + (stale10 === 1 ? '' : 's') + ' ' + staleVerb + ' been updated in 10+ days',
                link: '/app/deal-workspace/',
                potentialPoints: 2
            });
        }

        if (outcomes.total === 0) {
            gaps.push({ id: 'outcome-first', label: 'Close a deal', action: 'Record your first win or loss in Deal Workspace', link: '/app/deal-workspace/', potentialPoints: 4 });
        } else if (!(outcomes.wins > 0 && outcomes.losses > 0)) {
            var need = outcomes.wins === 0 ? 'win' : 'loss';
            gaps.push({ id: 'outcome-both', label: 'Record a ' + need, action: 'Having both wins and losses reveals patterns (+2 pts)', link: '/app/deal-workspace/', potentialPoints: 2 });
        }

        var persona = getPersona();
        var priorities = PERSONA_PRIORITIES[persona] || PERSONA_PRIORITIES.founder;

        gaps.sort(function(a, b) {
            var pa = priorities[a.id] !== undefined ? priorities[a.id] : 99;
            var pb = priorities[b.id] !== undefined ? priorities[b.id] : 99;
            if (pa !== pb) return pa - pb;
            return b.potentialPoints - a.potentialPoints;
        });

        return gaps;
    }

    async function render() {
        await loadWorkspaceSummary();
        if (isDismissed()) return;

        var path = window.location.pathname;
        if (path.indexOf('/login') >= 0) return;

        removeExistingRail();

        var total = 0;
        if (typeof computeReadinessTotal === 'function') {
            total = computeReadinessTotal();
        } else {
            var workspace = currentWorkspaceSummary();
            var playbook = workspace.playbook || readLS('gtmos_playbook', {});
            var thinIcp = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [] });
            var disco = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0 });
            var anglesNow = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
            var qualsNow = (typeof gtmStore !== 'undefined' && gtmStore.quals) ? gtmStore.quals.getAll() : {};
            total = Math.min(100,
                (thinIcp.icps.length > 0 ? 10 : 0) +
                (playbook.company ? 8 : 0) +
                (disco.totalCalls > 0 ? 10 : 0) +
                (anglesNow.length > 0 ? 8 : 0) +
                (Object.keys(qualsNow).length > 0 ? 8 : 0)
            );
        }

        if (total >= THRESHOLD) {
            renderComplete(total);
            return;
        }

        var gaps = findGaps();
        if (gaps.length === 0) return;

        var topGap = gaps[0];
        var pct = Math.round((total / THRESHOLD) * 100);
        var persona = getPersona();
        var pathLabel = PERSONA_RAIL_INTRO[persona] || 'Build the system';

        var banner = document.createElement('div');
        banner.id = 'guidedRail';
        banner.style.cssText = 'position:sticky;top:0;z-index:200;display:flex;align-items:center;gap:16px;padding:16px 24px;background:linear-gradient(135deg,rgba(212,165,116,0.18),rgba(168,85,247,0.1),rgba(59,130,246,0.12));border-bottom:2px solid rgba(212,165,116,0.5);font-size:0.9rem;backdrop-filter:blur(12px);box-shadow:0 6px 28px rgba(212,165,116,0.15),0 0 0 1px rgba(212,165,116,0.12),inset 0 1px 0 rgba(255,255,255,0.06);animation:grGlow 3s ease-in-out infinite;';

        var progressHtml = '<div style="display:flex;align-items:center;gap:10px;min-width:150px;">';
        progressHtml += '<div style="font-size:1.4rem;font-weight:900;font-family:var(--font-serif,Georgia,serif);color:var(--brand-gold,#d4a574);text-shadow:0 0 12px rgba(212,165,116,0.3);">' + total + '</div>';
        progressHtml += '<div style="display:flex;flex-direction:column;gap:3px;">';
        progressHtml += '<div style="width:70px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">';
        var barColor = pct >= 80 ? 'linear-gradient(90deg,#15803d,#22c55e)' : 'linear-gradient(90deg,var(--brand-gold,#d4a574),#e879f9)';
        progressHtml += '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.5s;"></div>';
        progressHtml += '</div>';
        progressHtml += '<div style="font-size:0.6rem;color:var(--text-muted,#64748b);font-weight:600;">of ' + THRESHOLD + ' to handoff</div>';
        progressHtml += '</div>';
        progressHtml += '</div>';

        var actionHtml = '<div style="flex:1;color:var(--text-primary,#e2e8f0);">';
        actionHtml += '<div style="font-size:0.65rem;color:var(--brand-gold,#d4a574);text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:2px;">Path: ' + pathLabel + '</div>';
        actionHtml += '<div style="font-size:0.88rem;"><span style="font-weight:800;color:#e2e8f0;">Next -> </span><span style="color:var(--text-secondary,#cbd5e1);">' + topGap.action + '</span></div>';
        actionHtml += '</div>';

        var ctaHtml = '<a href="' + topGap.link + '" style="padding:8px 18px;background:linear-gradient(135deg,rgba(212,165,116,0.2),rgba(168,85,247,0.12));border:1px solid rgba(212,165,116,0.4);border-radius:10px;color:var(--brand-gold,#d4a574);font-weight:800;font-size:0.8rem;text-decoration:none;white-space:nowrap;transition:all 0.2s;box-shadow:0 2px 8px rgba(212,165,116,0.15);" onmouseenter="this.style.background=\'linear-gradient(135deg,rgba(212,165,116,0.35),rgba(168,85,247,0.2))\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.background=\'linear-gradient(135deg,rgba(212,165,116,0.2),rgba(168,85,247,0.12))\';this.style.transform=\'none\'">Go -></a>';
        var dismissHtml = '<button onclick="document.getElementById(\'guidedRail\').remove();if(window.gtmGuidedRail&&typeof window.gtmGuidedRail.dismiss===\'function\'){window.gtmGuidedRail.dismiss();}" style="background:none;border:none;color:var(--text-muted,#64748b);cursor:pointer;font-size:1.1rem;padding:4px 8px;line-height:1;opacity:0.5;transition:opacity 0.2s;" onmouseenter="this.style.opacity=\'1\'" onmouseleave="this.style.opacity=\'0.5\'" title="Dismiss">x</button>';

        banner.innerHTML = progressHtml + actionHtml + ctaHtml + dismissHtml;

        var main = document.querySelector('.app-main');
        if (main) {
            main.insertBefore(banner, main.firstChild);
            banner.querySelector('a').addEventListener('click', function() {
                if (window.gtmAnalytics) gtmAnalytics.track('guided_rail_clicked', { action: topGap.action, link: topGap.link });
            });
            banner.querySelector('button').addEventListener('click', function() {
                if (window.gtmAnalytics) gtmAnalytics.track('guided_rail_dismissed');
            });
        }
    }

    function renderComplete(total) {
        removeExistingRail();
        var banner = document.createElement('div');
        banner.id = 'guidedRail';
        banner.style.cssText = 'position:sticky;top:0;z-index:200;display:flex;align-items:center;gap:12px;padding:10px 16px;background:linear-gradient(90deg,rgba(34,197,94,0.08),rgba(59,130,246,0.08));border-bottom:1px solid rgba(34,197,94,0.2);font-size:0.8rem;';

        banner.innerHTML = '' +
            '<span style="font-size:1rem;">Ready</span>' +
            '<span style="font-weight:700;color:#22c55e;">Readiness: ' + total + '/100</span>' +
            '<span style="color:var(--text-secondary,#cbd5e1);flex:1;">Your Handoff Kit is ready to generate.</span>' +
            '<a href="/app/founding-gtm/" style="padding:5px 14px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);border-radius:6px;color:#22c55e;font-weight:700;font-size:0.75rem;text-decoration:none;">Open Handoff Kit -></a>' +
            '<button onclick="document.getElementById(\'guidedRail\').remove();if(window.gtmGuidedRail&&typeof window.gtmGuidedRail.dismiss===\'function\'){window.gtmGuidedRail.dismiss();}" style="background:none;border:none;color:var(--text-muted,#64748b);cursor:pointer;font-size:1rem;padding:2px 6px;">x</button>';

        var main = document.querySelector('.app-main');
        if (main) main.insertBefore(banner, main.firstChild);
    }

    async function init() {
        await loadWorkspaceSummary();
        setTimeout(function() {
            render().catch(function(error) {
                console.error('Guided rail initial render failed:', error);
            });
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.gtmGuidedRail = { dismiss: setDismissed };
    window.guidedRail = { render: render, findGaps: findGaps, preload: loadWorkspaceSummary, dismiss: setDismissed };

    window.addEventListener('gtmos:workspace-summary-ready', function(event) {
        if (event && event.detail) workspaceSummary = event.detail;
        workspaceSummaryPromise = Promise.resolve(workspaceSummary || currentWorkspaceSummary());
        render().catch(function(error) {
            console.error('Guided rail workspace-summary refresh failed:', error);
        });
    });

    var grAnimStyle = document.createElement('style');
    grAnimStyle.textContent = '@keyframes grGlow { 0%,100%{border-color:rgba(212,165,116,0.5);box-shadow:0 6px 28px rgba(212,165,116,0.15),0 0 0 1px rgba(212,165,116,0.12),inset 0 1px 0 rgba(255,255,255,0.06);} 50%{border-color:rgba(168,85,247,0.5);box-shadow:0 6px 32px rgba(168,85,247,0.2),0 0 0 1px rgba(168,85,247,0.15),inset 0 1px 0 rgba(255,255,255,0.1);} }';
    document.head.appendChild(grAnimStyle);
})();
