(function () {
    'use strict';

    var FAMILY_MAP = {
        'dashboard': { label: 'Home', tone: 'ready' },
        'welcome': { label: 'Activation', tone: 'live' },
        'settings': { label: 'System', tone: 'ready' },
        'signal-console': { label: 'Intelligence', tone: 'live' },
        'icp-studio': { label: 'Intelligence', tone: 'ready' },
        'territory-architect': { label: 'Territory', tone: 'ready' },
        'sourcing-workbench': { label: 'Territory', tone: 'ready' },
        'outbound-studio': { label: 'Outbound', tone: 'live' },
        'cold-call-studio': { label: 'Calls', tone: 'live' },
        'linkedin-playbook': { label: 'Outbound', tone: 'ready' },
        'discovery-agenda': { label: 'Calls', tone: 'ready' },
        'discovery-studio': { label: 'Calls', tone: 'ready' },
        'deal-workspace': { label: 'Pipeline', tone: 'ready' },
        'future-autopsy': { label: 'Pipeline', tone: 'risk' },
        'poc-framework': { label: 'Pipeline', tone: 'ready' },
        'advisor-deploy': { label: 'Pipeline', tone: 'ready' },
        'quota-workback': { label: 'System', tone: 'ready' },
        'founding-gtm': { label: 'System', tone: 'ready' },
        'readiness': { label: 'System', tone: 'ready' },
        'onboarding': { label: 'Activation', tone: 'live' }
    };

    function slugFromPath() {
        var clean = String(window.location.pathname || '').replace(/\/+$/, '');
        var parts = clean.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function getHeader() {
        return document.querySelector('.app-main > .app-header') ||
            document.querySelector('.app-header') ||
            document.querySelector('.page-header') ||
            null;
    }

    function ensureTitleGroup(header) {
        var existing = header.querySelector('.module-header-title');
        if (existing) return existing;

        var title = header.querySelector('.page-title, h1');
        if (!title) return null;

        var subtitle = header.querySelector('.module-subtitle, .page-subtitle');
        var wrap = document.createElement('div');
        wrap.className = 'module-header-title';
        header.insertBefore(wrap, title);
        wrap.appendChild(title);
        if (subtitle && subtitle.parentElement === header) {
            wrap.appendChild(subtitle);
        }
        return wrap;
    }

    function stateToneClass(tone) {
        var normalized = String(tone || '').trim().toLowerCase();
        if (!normalized) return '';
        if (normalized === 'good') normalized = 'live';
        if (normalized === 'quality') normalized = 'ready';
        if (normalized === 'warn') normalized = 'thin';
        if (normalized === 'warning') normalized = 'thin';
        if (normalized === 'bad') normalized = 'risk';
        return 'state-' + normalized;
    }

    function createAction(action) {
        if (!action) return '';
        var tag = action.href ? 'a' : 'button';
        var className = 'btn ' + (action.tone === 'primary' ? 'btn-primary' : action.tone === 'warning' ? 'btn-warning' : 'btn-ghost') + ' btn-sm';
        if (tag === 'a') {
            return '<a class="' + className + '" href="' + action.href + '">' + escapeHtml(action.label || 'Open') + '</a>';
        }
        var onclick = action.action ? ' onclick="' + escapeAttr(action.action) + '"' : '';
        return '<button type="button" class="' + className + '"' + onclick + '>' + escapeHtml(action.label || 'Open') + '</button>';
    }

    function escapeHtml(value) {
        var node = document.createElement('div');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/"/g, '&quot;');
    }

    function readHandoffContext() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var returnTo = String(params.get('returnTo') || '').trim();
            if (!returnTo || returnTo.charAt(0) !== '/') return null;
            return {
                returnTo: returnTo,
                returnLabel: params.get('returnLabel') || 'Back',
                focusObject: params.get('focusObject') || '',
                focusRoom: params.get('focusRoom') || '',
                fromMode: params.get('fromMode') || '',
                fromSurface: params.get('fromSurface') || ''
            };
        } catch (error) {
            return null;
        }
    }

    function formatModeLabel(mode) {
        var normalized = String(mode || '').trim().toLowerCase();
        if (!normalized) return '';
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    function renderHandoffBridge(context) {
        if (!context || !context.returnTo) return '';
        var spotlightHref = '/app/dashboard/?mode=spotlight';
        var welcomeHref = '/app/welcome/';
        var returnIsSpotlight = context.returnTo.indexOf('/app/dashboard/') === 0;
        var returnIsWelcome = context.returnTo.indexOf('/app/welcome/') === 0;
        var title = context.focusObject && context.focusRoom
            ? '<strong>' + escapeHtml(context.focusObject) + '</strong> stayed in context as you moved into <strong>' + escapeHtml(context.focusRoom) + '</strong>.'
            : 'You entered this room from the command layer with context intact.';
        var copy = returnIsSpotlight
            ? 'Use Spotlight as the default way back into the system. The room rail is still here, but it should not be your main re-entry path.'
            : 'When this room work is done, re-enter through Spotlight or Week One before using the left rail. Rooms should stay secondary to the command stack.';
        var meta = [
            context.fromMode ? '<span class="shell-handoff-pill">From ' + escapeHtml(formatModeLabel(context.fromMode)) + '</span>' : '',
            context.focusRoom ? '<span class="shell-handoff-pill">' + escapeHtml(context.focusRoom) + '</span>' : '',
            context.fromSurface ? '<span class="shell-handoff-pill">Via sheet</span>' : ''
        ].filter(Boolean).join('');
        var actions = [
            '<a class="btn btn-primary btn-sm" href="' + escapeAttr(spotlightHref) + '">Open Spotlight</a>',
            '<a class="btn btn-ghost btn-sm" href="' + escapeAttr(welcomeHref) + '">Week One</a>'
        ];
        if (!returnIsSpotlight && !returnIsWelcome) {
            actions.unshift('<a class="btn btn-secondary btn-sm" href="' + escapeAttr(context.returnTo) + '">' + escapeHtml(context.returnLabel || 'Back') + '</a>');
        } else if (returnIsWelcome) {
            actions.unshift('<a class="btn btn-secondary btn-sm" href="' + escapeAttr(context.returnTo) + '">' + escapeHtml(context.returnLabel || 'Back') + '</a>');
        }
        return (
            '<div class="shell-handoff-bridge">' +
                '<div class="shell-handoff-copy">' +
                    '<div class="shell-handoff-kicker">Room entry</div>' +
                    '<div class="shell-handoff-title">' + title + '</div>' +
                    '<div class="shell-handoff-subcopy">' + copy + '</div>' +
                    (meta ? '<div class="shell-handoff-meta">' + meta + '</div>' : '') +
                '</div>' +
                '<div class="shell-handoff-actions">' +
                    actions.join('') +
                '</div>' +
            '</div>'
        );
    }

    function applyHeader(config) {
        var header = getHeader();
        if (!header) return;

        var titleGroup = ensureTitleGroup(header);
        if (!titleGroup) return;

        header.classList.add('module-header', 'shell-topbar');

        var slug = slugFromPath();
        var mapped = FAMILY_MAP[slug] || {};
        var familyLabel = (config && config.family) || header.getAttribute('data-shell-family') || mapped.label || 'System';
        var stateLabel = (config && config.stateLabel) || header.getAttribute('data-shell-state-label') || '';
        var stateTone = (config && config.stateTone) || header.getAttribute('data-shell-state-tone') || mapped.tone || 'ready';

        var meta = titleGroup.querySelector('.shell-header-meta');
        if (!meta) {
            meta = document.createElement('div');
            meta.className = 'shell-header-meta';
            titleGroup.insertBefore(meta, titleGroup.firstChild);
        }

        meta.innerHTML = '';

        if (familyLabel) {
            var kicker = document.createElement('span');
            kicker.className = 'shell-header-kicker';
            kicker.textContent = familyLabel;
            meta.appendChild(kicker);
        }

        if (stateLabel) {
            var state = document.createElement('span');
            state.className = 'shell-header-state ' + stateToneClass(stateTone);
            state.textContent = stateLabel;
            meta.appendChild(state);
        }
    }

    function renderCommandBand(target, config) {
        var node = typeof target === 'string' ? document.querySelector(target) : target;
        if (!node) return;

        var metrics = Array.isArray(config && config.metrics) ? config.metrics : [];
        var actions = Array.isArray(config && config.actions) ? config.actions : [];
        var variant = config && config.variant ? ' shell-command-band--' + escapeHtml(config.variant) : '';
        var bridge = renderHandoffBridge(readHandoffContext());

        node.innerHTML =
            bridge +
            '<section class="shell-command-band' + variant + '">' +
                '<div class="shell-band-top">' +
                    '<div>' +
                        (config && config.kicker ? '<div class="shell-band-kicker">' + escapeHtml(config.kicker) + '</div>' : '') +
                        '<div class="shell-band-title">' + escapeHtml((config && config.title) || '') + '</div>' +
                        (config && config.copy ? '<div class="shell-band-copy">' + escapeHtml(config.copy) + '</div>' : '') +
                    '</div>' +
                    ((config && config.stateLabel) ? '<span class="shell-state-pill ' + stateToneClass(config.stateTone || 'ready') + '">' + escapeHtml(config.stateLabel) + '</span>' : '') +
                '</div>' +
                (metrics.length ? '<div class="shell-band-grid">' + metrics.map(function (metric) {
                    return '<div class="shell-band-block">' +
                        '<div class="shell-band-block-label">' + escapeHtml(metric.label || '') + '</div>' +
                        '<div class="shell-band-block-value">' + escapeHtml(metric.value || '') + '</div>' +
                    '</div>';
                }).join('') + '</div>' : '') +
                (actions.length ? '<div class="shell-band-actions">' + actions.map(createAction).join('') + '</div>' : '') +
            '</section>';
    }

    function renderContextRail(target, config) {
        var node = typeof target === 'string' ? document.querySelector(target) : target;
        if (!node) return;

        var cards = Array.isArray(config && config.cards) ? config.cards : [];
        var railVariant = config && config.variant ? 'shell-context-rail--' + String(config.variant).trim().toLowerCase() : '';
        node.className = 'shell-context-rail' + (railVariant ? ' ' + railVariant : '');

        node.innerHTML = cards.map(function (card) {
            var list = Array.isArray(card.items) ? card.items : [];
            var actions = Array.isArray(card.actions) ? card.actions : [];
            var cardVariant = card && card.variant ? ' shell-rail-card--' + escapeHtml(card.variant) : '';
            return '<section class="shell-rail-card' + cardVariant + '">' +
                (card.kicker ? '<div class="shell-rail-kicker">' + escapeHtml(card.kicker) + '</div>' : '') +
                (card.title ? '<div class="shell-rail-title">' + escapeHtml(card.title) + '</div>' : '') +
                (card.copy ? '<div class="shell-rail-copy">' + escapeHtml(card.copy) + '</div>' : '') +
                (list.length ? '<div class="shell-rail-list">' + list.map(function (item) {
                    return '<div class="shell-rail-list-item">' + escapeHtml(item) + '</div>';
                }).join('') + '</div>' : '') +
                (actions.length ? '<div class="shell-rail-actions">' + actions.map(createAction).join('') + '</div>' : '') +
            '</section>';
        }).join('');
    }

    function run() {
        applyHeader();
    }

    window.gtmShellChrome = {
        applyHeader: applyHeader,
        renderCommandBand: renderCommandBand,
        renderContextRail: renderContextRail
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

    window.addEventListener('load', run);
    setTimeout(run, 250);
})();
