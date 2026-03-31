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
        'cold-call-studio': { label: 'Outbound', tone: 'live' },
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

        node.innerHTML =
            '<section class="shell-command-band">' +
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
        node.classList.add('shell-context-rail');

        node.innerHTML = cards.map(function (card) {
            var list = Array.isArray(card.items) ? card.items : [];
            var actions = Array.isArray(card.actions) ? card.actions : [];
            return '<section class="shell-rail-card">' +
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
