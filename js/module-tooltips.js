/**
 * Module Tooltips — GTMOS v27 Phase 1
 * 
 * Updated for consolidated modules:
 *   icp-studio (was icp-builder + icp-library)
 *   outbound-studio (was outbound-os + signal-play-studio)
 *   deal-workspace (was deal-workspaces + deal-review + account-planning)
 */

(function() {
    'use strict';

    var TOOLTIPS = {
        'dashboard': {
            does: 'Dashboard showing pipeline health, velocity, and patterns.',
            feedsIn: 'Deal data, win/loss data, qualification scores',
            feedsOut: 'Readiness Score'
        },
        'readiness': {
            does: 'Tracks whether your GTM is foundationally sound and whether you\'re ready to hire.',
            feedsIn: 'Activity from all modules',
            feedsOut: 'Handoff Kit unlock threshold'
        },
        'icp-studio': {
            does: 'Define, score, and manage your ideal customer segments. Build ICPs, browse saved profiles, and track what\'s working.',
            feedsIn: '— (starting point)',
            feedsOut: 'Outbound targeting, Discovery context, GTM Playbook'
        },
        'quota-workback': {
            does: 'Calculate required weekly activity from your revenue target.',
            feedsIn: '— (manual inputs)',
            feedsOut: 'Outbound Studio targets'
        },
        'outbound-studio': {
            does: 'Build signal-based outreach angles and see your weekly volume targets from Quota Workback.',
            feedsIn: 'Quota Workback targets, ICP personas, trigger events',
            feedsOut: 'Outbound sequences, GTM Playbook, Handoff Kit'
        },
        'discovery-agenda': {
            does: 'Prepare a structured agenda before a discovery call, then hand off to Discovery Frameworks.',
            feedsIn: 'Deal context, ICP data',
            feedsOut: 'Discovery Frameworks session, Deal Workspace qualification'
        },
        'discovery-studio': {
            does: 'Run a guided discovery call with frameworks and objection handling.',
            feedsIn: 'Call Planner agenda, deal context',
            feedsOut: 'Deal Workspace qualification, Handoff Kit'
        },
        'deal-workspace': {
            does: 'Manage deals, run qualification reviews, and build account plans — all in one place.',
            feedsIn: 'Discovery outputs, ICP data',
            feedsOut: 'Qualification Score, Win/Loss patterns, GTM Playbook, Readiness Score'
        },
        'poc-framework': {
            does: 'Structure and track proof-of-concept engagements.',
            feedsIn: 'Deal context',
            feedsOut: 'Deal progression, Handoff Kit'
        },
        'discovery-studio-negotiation': {
            does: 'Guided scripts for procurement and finance conversations.',
            feedsIn: 'Deal stage, negotiation context',
            feedsOut: 'Deal close data, Handoff Kit'
        },
        'founding-gtm-assets': {
            does: 'Generate sales collateral briefs for any deal stage.',
            feedsIn: 'Deal context, ICP data',
            feedsOut: 'Prospect-facing materials'
        },
        'founding-gtm': {
            does: 'The living document your first hire reads on day one. Auto-populates from your activity across modules.',
            feedsIn: 'All module activity',
            feedsOut: 'Handoff Kit'
        },
        'founding-gtm-export': {
            does: 'Exportable onboarding kit assembled from your entire system.',
            feedsIn: 'All modules via GTM Playbook',
            feedsOut: 'PDF/DOCX/CSV export for new hires'
        },
        'agents': {
            does: 'AI-powered agents for specialized account research.',
            feedsIn: 'Various data sources',
            feedsOut: 'Insights and recommendations'
        }
    };

    // ── Inject Styles ───────────────────────────────────────────────
    var style = document.createElement('style');
    style.textContent = '' +
        '.module-tooltip-trigger {' +
            'display: inline-flex; align-items: center; justify-content: center;' +
            'width: 22px; height: 22px; border-radius: 50%;' +
            'background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);' +
            'color: var(--text-muted, #8892a4); font-size: 0.7rem; font-weight: 700;' +
            'cursor: pointer; margin-left: 10px; transition: all 0.15s;' +
            'vertical-align: middle; position: relative; line-height: 1;' +
        '}' +
        '.module-tooltip-trigger:hover {' +
            'background: rgba(212,165,116,0.12); border-color: rgba(212,165,116,0.3);' +
            'color: var(--text-primary, #e2e8f0);' +
        '}' +
        '.module-tooltip-popover {' +
            'display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);' +
            'margin-top: 8px; width: 320px; max-width: 90vw; z-index: 1000;' +
            'background: var(--bg-tertiary, #1a2332); border: 1px solid var(--border-default, #2d3748);' +
            'border-radius: var(--radius-md, 8px); padding: 14px 16px;' +
            'box-shadow: 0 8px 24px rgba(0,0,0,0.4); font-size: 0.8rem; line-height: 1.5;' +
        '}' +
        '.module-tooltip-popover.visible { display: block; }' +
        '.module-tooltip-row { margin-bottom: 8px; }' +
        '.module-tooltip-row:last-child { margin-bottom: 0; }' +
        '.module-tooltip-label {' +
            'font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;' +
            'color: var(--text-muted, #8892a4); margin-bottom: 2px;' +
        '}' +
        '.module-tooltip-value { color: var(--text-secondary, #cbd5e1); }';
    document.head.appendChild(style);

    // ── Determine Module ────────────────────────────────────────────
    var path = window.location.pathname.replace(/\/+$/, '');
    var segments = path.split('/').filter(Boolean);
    var slug = segments.length >= 2 ? segments[segments.length - 1] : '';
    var slugMap = {
        'dashboard': 'dashboard',
        'icp-builder': 'icp-studio',
        'icp-library': 'icp-studio',
        'outbound-os': 'outbound-studio',
        'signal-play-studio': 'outbound-studio',
        'deal-workspaces': 'deal-workspace',
        'deal-review': 'deal-workspace',
        'account-planning': 'deal-workspace'
    };
    var key = slugMap[slug] || slug;
    var tooltip = TOOLTIPS[key];

    if (!tooltip) return;

    // ── Inject Trigger ──────────────────────────────────────────────
    function inject() {
        var title = document.querySelector('.page-title, h1.app-title, header h1');
        if (!title) return;
        if (title.querySelector('.module-tooltip-trigger')) return;

        var btn = document.createElement('button');
        btn.className = 'module-tooltip-trigger';
        btn.textContent = '?';
        btn.setAttribute('aria-label', 'Module info');

        var popover = document.createElement('div');
        popover.className = 'module-tooltip-popover';
        popover.innerHTML = '' +
            '<div class="module-tooltip-row">' +
                '<div class="module-tooltip-label">What it does</div>' +
                '<div class="module-tooltip-value">' + tooltip.does + '</div>' +
            '</div>' +
            '<div class="module-tooltip-row">' +
                '<div class="module-tooltip-label">Feeds in</div>' +
                '<div class="module-tooltip-value">' + tooltip.feedsIn + '</div>' +
            '</div>' +
            '<div class="module-tooltip-row">' +
                '<div class="module-tooltip-label">Feeds out</div>' +
                '<div class="module-tooltip-value">' + tooltip.feedsOut + '</div>' +
            '</div>';

        btn.appendChild(popover);
        title.appendChild(btn);

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            popover.classList.toggle('visible');
        });

        document.addEventListener('click', function() {
            popover.classList.remove('visible');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

})();
