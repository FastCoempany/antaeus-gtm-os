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
    function updateNavStates() {
        function readLS(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch(e) { return fb; } }

        var states = {};
        
        // ICP Studio
        var icps = readLS('gtmos_icp_analytics', { icps: [] });
        var icpCount = (icps.icps || []).length;
        var hasOnlyStub = icpCount === 1 && icps.icps[0] && icps.icps[0].source === 'onboarding';
        if (icpCount === 0 || hasOnlyStub) states['icp-studio'] = null;
        else if (icpCount < 3) states['icp-studio'] = 'in-progress';
        else states['icp-studio'] = 'complete';

        // Quota Workback
        var seed = readLS('gtmos_outbound_seed', {});
        if (seed.annual_quota) states['quota-workback'] = 'complete';

        // Outbound Studio
        var angles = readLS('gtmos_angles', []);
        if (angles.length === 0) states['outbound-studio'] = null;
        else if (angles.length < 5) states['outbound-studio'] = 'in-progress';
        else states['outbound-studio'] = 'complete';

        // Discovery
        var disco = readLS('gtmos_discovery_stats', { totalCalls: 0 });
        if (disco.totalCalls === 0) states['discovery-studio'] = null;
        else if (disco.totalCalls < 5) states['discovery-studio'] = 'in-progress';
        else states['discovery-studio'] = 'complete';

        // Call Planner
        var agenda = readLS('gtmos_discovery_agenda', {});
        if (agenda.contact || agenda.focus) states['discovery-agenda'] = 'complete';

        // Deal Workspace
        var deals = readLS('gtmos_deal_workspaces', {});
        var dealCount = Object.keys(deals).length;
        if (dealCount === 0) states['deal-workspace'] = null;
        else if (dealCount < 3) states['deal-workspace'] = 'in-progress';
        else states['deal-workspace'] = 'complete';

        // Founding GTM
        var pb = readLS('gtmos_playbook', {});
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
        setTimeout(updateNavStates, 600);
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

})();
