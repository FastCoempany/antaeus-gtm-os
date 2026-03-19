/**
 * GTMOS Collapsible Sections — v27 Phase 5
 * 
 * Two modes:
 *   1) Auto-detect: finds .collapsible-section elements and wires toggle behavior
 *   2) Programmatic: collapseSections.wrap(containerId, sections[]) builds sections
 * 
 * Also provides state-aware nav dots based on module data completeness.
 */

(function() {
    'use strict';

    var workspaceSummaryPreloadPromise = null;

    function readLS(k, fb) {
        try { return JSON.parse(localStorage.getItem(k)) || fb; }
        catch(e) { return fb; }
    }

    function currentWorkspaceSummary() {
        return window.__gtmosWorkspaceSummary || null;
    }

    function readDealList(workspace) {
        if (workspace && Array.isArray(workspace.deals)) return workspace.deals;
        var raw = readLS('gtmos_deal_workspaces', []);
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
            return Object.keys(raw).map(function(id) {
                var deal = raw[id] || {};
                if (!deal.id) deal.id = id;
                return deal;
            });
        }
        return [];
    }

    function preloadWorkspaceSummary() {
        if (workspaceSummaryPreloadPromise) return workspaceSummaryPreloadPromise;
        if (!(window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function')) {
            return Promise.resolve({ data: currentWorkspaceSummary(), error: null });
        }
        workspaceSummaryPreloadPromise = window.gtmPersistence.workspace.loadSummary().catch(function(error) {
            console.error('Workspace summary preload failed for collapsible sections:', error);
            return { data: currentWorkspaceSummary(), error: error };
        });
        return workspaceSummaryPreloadPromise;
    }

    // ── Auto-init: wire click handlers on .collapsible-section .section-header ──
    function initCollapsible() {
        document.querySelectorAll('.collapsible-section .section-header').forEach(function(header) {
            if (header.dataset.wired) return;
            header.dataset.wired = '1';
            header.addEventListener('click', function() {
                var section = header.closest('.collapsible-section');
                if (section) section.classList.toggle('open');
            });
        });
    }

    // ── Programmatic: wrap existing content in collapsible sections ──
    // sections: [{ title, meta, contentSelector, startOpen }]
    function wrap(containerId, sections) {
        var container = document.getElementById(containerId);
        if (!container) return;

        sections.forEach(function(cfg) {
            var content = container.querySelector(cfg.contentSelector);
            if (!content) return;

            // Create wrapper
            var wrapper = document.createElement('div');
            wrapper.className = 'collapsible-section' + (cfg.startOpen ? ' open' : '');

            var header = document.createElement('div');
            header.className = 'section-header';
            header.innerHTML = '' +
                '<span class="section-title">' + (cfg.title || '') + '</span>' +
                (cfg.meta ? '<span class="section-meta">' + cfg.meta + '</span>' : '') +
                '<span class="section-chevron">▼</span>';

            var body = document.createElement('div');
            body.className = 'section-body';

            // Move content into body
            content.parentNode.insertBefore(wrapper, content);
            body.appendChild(content);
            wrapper.appendChild(header);
            wrapper.appendChild(body);

            // Wire click
            header.addEventListener('click', function() {
                wrapper.classList.toggle('open');
            });
        });
    }

    // ── Nav State Dots ─────────────────────────────────────────────
    // Adds colored dots to nav items based on module data completeness.
    // States: empty (no dot), in-progress (teal), complete (green), at-risk (amber)
    async function updateNavStates() {
        await preloadWorkspaceSummary();
        var workspace = currentWorkspaceSummary() || {};
        var states = {};
        
        // ICP Studio
        var icps = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [] });
        var icpCount = (icps.icps || []).length;
        var hasOnlyStub = icpCount === 1 && icps.icps[0] && icps.icps[0].source === 'onboarding';
        if (icpCount === 0 || hasOnlyStub) states['icp-studio'] = null;
        else if (icpCount < 3) states['icp-studio'] = 'in-progress';
        else states['icp-studio'] = 'complete';

        // Quota Workback
        var seed = workspace.outboundSeed || readLS('gtmos_outbound_seed', {});
        if (seed.annual_quota) states['quota-workback'] = 'complete';

        // Outbound Studio
        var angles = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
        if (angles.length === 0) states['outbound-studio'] = null;
        else if (angles.length < 5) states['outbound-studio'] = 'in-progress';
        else states['outbound-studio'] = 'complete';

        // Discovery
        var disco = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0 });
        if (disco.totalCalls === 0) states['discovery-studio'] = null;
        else if (disco.totalCalls < 5) states['discovery-studio'] = 'in-progress';
        else states['discovery-studio'] = 'complete';

        // Call Planner
        var agenda = (workspace.discovery && workspace.discovery.agenda) || readLS('gtmos_discovery_agenda', {});
        if (agenda.contact || agenda.focus) states['discovery-agenda'] = 'complete';

        // Deal Workspace
        var deals = readDealList(workspace);
        var dealCount = deals.length;
        if (dealCount === 0) states['deal-workspace'] = null;
        else if (dealCount < 3) states['deal-workspace'] = 'in-progress';
        else states['deal-workspace'] = 'complete';

        // Founding GTM
        var pb = workspace.playbook || readLS('gtmos_playbook', {});
        var fields = pb.fields || {};
        var filledCount = 0;
        Object.values(fields).forEach(function(v) { if (v && String(v).trim()) filledCount++; });
        if (!pb.company) states['founding-gtm'] = null;
        else if (filledCount < 6) states['founding-gtm'] = 'in-progress';
        else states['founding-gtm'] = 'complete';

        // Apply dots
        Object.keys(states).forEach(function(navKey) {
            var link = document.querySelector('[data-nav="' + navKey + '"]');
            if (!link) return;
            // Remove existing dots
            var existing = link.querySelector('.nav-state-dot');
            if (existing) existing.remove();

            var state = states[navKey];
            if (!state) return;

            var dot = document.createElement('span');
            dot.className = 'nav-state-dot ' + state;
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.appendChild(dot);
        });
    }

    // ── Init ────────────────────────────────────────────────────────
    function init() {
        initCollapsible();
        setTimeout(function() {
            updateNavStates().catch(function() {});
        }, 600);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.collapseSections = {
        init: initCollapsible,
        wrap: wrap,
        updateNavStates: updateNavStates
    };

    if (window.__gtmosAuthGatePending && window.requireAuthReady && typeof window.requireAuthReady.then === 'function') {
        window.requireAuthReady.then(function() { return preloadWorkspaceSummary(); }).then(function() {
            return updateNavStates();
        }).catch(function() {});
    } else if (window.__gtmosAuthGatePending) {
        window.addEventListener('gtmos:auth-ready', function() {
            preloadWorkspaceSummary().then(function() {
                return updateNavStates();
            }).catch(function() {});
        }, { once: true });
    } else {
        preloadWorkspaceSummary().then(function() {
            return updateNavStates();
        }).catch(function() {});
    }

    window.addEventListener('gtmos:workspace-summary-ready', function() {
        workspaceSummaryPreloadPromise = Promise.resolve({ data: currentWorkspaceSummary(), error: null });
        updateNavStates().catch(function() {});
    });

})();
