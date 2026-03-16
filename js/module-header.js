/**
 * Phase 10: shared module-header structure and primary action ordering.
 */
(function () {
    'use strict';

    var ACTIVE_MODULES = {
        'dashboard': true,
        'readiness': true,
        'icp-studio': true,
        'quota-workback': true,
        'outbound-studio': true,
        'discovery-agenda': true,
        'discovery-studio': true,
        'deal-workspace': true,
        'poc-framework': true,
        'founding-gtm': true,
        'territory-architect': true,
        'sourcing-workbench': true
    };

    function toArray(nodeList) {
        return Array.prototype.slice.call(nodeList || []);
    }

    function slugFromPath() {
        var clean = window.location.pathname.replace(/\/+$/, '');
        var parts = clean.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function normalizeText(value) {
        return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function detectRoleFromText(text) {
        var v = normalizeText(text);
        if (!v) return '';
        if (/(^|\b)(reset|clear)(\b|$)/.test(v)) return 'reset';
        if (/(^|\b)(export|copy|download)(\b|$)/.test(v)) return 'share';
        if (/(^|\b)(save|submit)(\b|$)/.test(v)) return 'save';
        return '';
    }

    function detectRole(el) {
        return detectRoleFromText(el && el.textContent);
    }

    function isIgnoredRegion(el) {
        return !!(el.closest('.app-sidebar') || el.closest('.modal') || el.closest('.modal-backdrop') || el.closest('.toast'));
    }

    function getRoleControls(root) {
        var selector = 'button.btn, a.btn, button.action-btn, a.action-btn';
        return toArray(root.querySelectorAll(selector)).filter(function (el) {
            if (isIgnoredRegion(el)) return false;
            return !!detectRole(el);
        });
    }

    function ensureModuleTitleGroup(header) {
        var title = header.querySelector('.page-title, h1');
        var subtitle = header.querySelector('.module-subtitle, .page-subtitle');

        if (title && title.parentElement && title.parentElement !== header) {
            title.parentElement.classList.add('module-header-title');
            if (subtitle && subtitle.parentElement === header) {
                title.parentElement.appendChild(subtitle);
            }
            return;
        }

        if (title && title.parentElement === header) {
            var wrap = document.createElement('div');
            wrap.className = 'module-header-title';
            header.insertBefore(wrap, title);
            wrap.appendChild(title);
            if (subtitle && subtitle.parentElement === header) {
                wrap.appendChild(subtitle);
            }
            return;
        }

        var brandline = header.querySelector('.brandline');
        if (brandline) {
            brandline.classList.add('module-header-title');
        }
    }

    function setControlStyle(el, role) {
        if (!el || !role) return;

        if (el.classList.contains('action-btn')) {
            el.classList.remove('primary', 'secondary', 'warning');
            if (role === 'save') {
                el.classList.add('primary');
            } else if (role === 'reset') {
                el.classList.add('warning');
            } else {
                el.classList.add('secondary');
            }
            return;
        }

        if (!el.classList.contains('btn')) {
            el.classList.add('btn');
        }

        el.classList.remove('btn-primary', 'btn-secondary', 'btn-ghost', 'btn-warning', 'btn-danger', 'btn-warn');
        if (role === 'save') {
            el.classList.add('btn-primary');
        } else if (role === 'reset') {
            el.classList.add('btn-warning');
        } else {
            el.classList.add('btn-ghost');
        }
    }

    function compactLabel(el) {
        return (el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function styleActionContainer(container, inHeader) {
        if (!container) return;
        container.classList.add('module-header-actions');

        if (inHeader) {
            container.classList.add('header-actions');
            if (container.classList.contains('action-bar')) {
                container.classList.add('module-header-lifted');
                container.style.position = 'static';
                container.style.left = 'auto';
                container.style.right = 'auto';
                container.style.bottom = 'auto';
                container.style.top = 'auto';
                container.style.background = 'transparent';
                container.style.backdropFilter = 'none';
                container.style.border = 'none';
                container.style.padding = '0';
                container.style.margin = '0';
                container.style.zIndex = 'auto';
            }
        }

        var controls = getRoleControls(container);
        controls.forEach(function (el) {
            var role = detectRole(el);
            setControlStyle(el, role);

            if (role === 'reset') {
                el.style.order = '1';
            } else if (role === 'share') {
                el.style.order = '2';
            } else if (role === 'save') {
                el.style.order = '4';
            }

            if (el.classList.contains('btn') || el.classList.contains('action-btn')) {
                el.style.flex = '0 0 auto';
            }
        });
    }

    function scoreContainer(container, header) {
        if (!container || isIgnoredRegion(container)) return -1;

        var controls = getRoleControls(container).filter(function (el) {
            return !header.contains(el);
        });
        if (!controls.length) return -1;

        var roleMap = {};
        controls.forEach(function (el) {
            roleMap[detectRole(el)] = true;
        });

        var score = controls.length + (Object.keys(roleMap).length * 3);
        if (roleMap.save) score += 3;
        if (container.classList.contains('action-bar')) score += 2;
        if (container.classList.contains('header-actions')) score += 2;
        if (container.classList.contains('actions')) score += 1;
        if (container.hasAttribute('data-primary-actions')) score += 3;
        if (header.contains(container)) score += 6;
        if (container.querySelector('.nav-btn')) score -= 2;

        return score;
    }

    function findBestContainer(header) {
        var candidates = [];
        var seen = [];

        function push(node) {
            if (!node) return;
            if (seen.indexOf(node) !== -1) return;
            seen.push(node);
            candidates.push(node);
        }

        toArray(header.querySelectorAll('.header-actions, .actions, .action-bar, [data-primary-actions]')).forEach(push);
        toArray(document.querySelectorAll('.header-actions, .actions, .action-bar, [data-primary-actions]')).forEach(push);

        getRoleControls(document).forEach(function (el) {
            push(el.parentElement);
        });

        var best = null;
        var bestScore = -1;
        candidates.forEach(function (node) {
            var score = scoreContainer(node, header);
            if (score > bestScore) {
                best = node;
                bestScore = score;
            }
        });

        return best;
    }

    function buildProxy(source, role) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm';
        btn.setAttribute('data-module-header-proxy', 'true');
        btn.textContent = compactLabel(source);

        setControlStyle(btn, role);

        btn.addEventListener('click', function () {
            source.click();
        });

        function sync() {
            btn.disabled = !!source.disabled;
            btn.style.display = source.classList.contains('hidden') ? 'none' : '';
        }

        sync();
        if (window.MutationObserver) {
            var observer = new MutationObserver(sync);
            observer.observe(source, {
                attributes: true,
                attributeFilter: ['class', 'style', 'disabled', 'aria-disabled', 'hidden']
            });
        }

        return btn;
    }

    function ensureHeaderActionContainer(header) {
        var existing = header.querySelector('.header-actions, .actions[data-primary-actions]');
        if (existing) return existing;

        var created = document.createElement('div');
        created.className = 'header-actions module-header-actions';
        created.setAttribute('data-module-header-generated', 'true');
        header.appendChild(created);
        return created;
    }

    function applyProxyActions(header, sourceContainer) {
        if (!sourceContainer) return;

        var headerActions = ensureHeaderActionContainer(header);
        if (!headerActions) return;

        var existingProxy = toArray(headerActions.querySelectorAll('[data-module-header-proxy]'));
        existingProxy.forEach(function (node) {
            node.remove();
        });

        var controls = getRoleControls(sourceContainer);
        if (!controls.length) return;

        var picked = [];
        var reset = controls.find(function (el) { return detectRole(el) === 'reset'; });
        if (reset) picked.push(reset);

        controls.filter(function (el) { return detectRole(el) === 'share'; }).slice(0, 2).forEach(function (el) {
            picked.push(el);
        });

        var save = controls.find(function (el) { return detectRole(el) === 'save'; });
        if (save) picked.push(save);

        if (!picked.length) return;

        picked.forEach(function (source) {
            var role = detectRole(source);
            headerActions.appendChild(buildProxy(source, role));
        });

        styleActionContainer(headerActions, true);
    }

    function run() {
        var moduleSlug = slugFromPath();
        if (!ACTIVE_MODULES[moduleSlug]) return;

        var header = document.querySelector('.app-main > .app-header') ||
            document.querySelector('.app-header') ||
            document.querySelector('.page-header') ||
            document.querySelector('.control-bar');

        if (!header) return;

        header.classList.add('module-header');
        ensureModuleTitleGroup(header);

        var headerContainer = header.querySelector('.header-actions, .actions[data-primary-actions]');
        var headerControls = headerContainer ? getRoleControls(headerContainer) : [];

        if (headerContainer && headerControls.length) {
            styleActionContainer(headerContainer, true);
        } else {
            var source = findBestContainer(header);
            if (source && source !== headerContainer) {
                if (header.contains(source)) {
                    styleActionContainer(source, true);
                } else {
                    applyProxyActions(header, source);
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
