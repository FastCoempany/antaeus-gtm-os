/**
 * GTMOS Data Flow Visibility — v27 Phase 3
 * 
 * Two mechanisms:
 *   1) Toast: "Your ICP was synced to GTM Playbook → market-who"
 *   2) Nav badge: Gold dot on the Founding GTM nav item when data flows in
 * 
 * Usage from any module:
 *   dataFlow.notify('ICP Studio', 'Founding GTM Playbook', 'market-who');
 *   dataFlow.notify('Quota Workback', 'Founding GTM Playbook', 'acv, cycle');
 * 
 * The toast auto-dismisses after 4s. The nav badge persists for the session
 * and clears when the user visits the target module.
 */

(function() {
    'use strict';

    var BADGE_KEY = 'gtmos_flow_badges';
    var TOAST_DURATION = 4500;

    function getBadgeState() {
        if (window.gtmLocalState && typeof window.gtmLocalState.getSession === 'function') {
            return window.gtmLocalState.getSession(BADGE_KEY, {}, { scope: 'user', json: true }) || {};
        }
        try { return JSON.parse(sessionStorage.getItem(BADGE_KEY) || '{}'); } catch (e) { return {}; }
    }

    function setBadgeState(state) {
        if (window.gtmLocalState && typeof window.gtmLocalState.setSession === 'function') {
            window.gtmLocalState.setSession(BADGE_KEY, state || {}, { scope: 'user' });
            return;
        }
        sessionStorage.setItem(BADGE_KEY, JSON.stringify(state || {}));
    }

    // ── Toast Container ─────────────────────────────────────────────
    function ensureContainer() {
        var c = document.getElementById('dataFlowToasts');
        if (c) return c;
        c = document.createElement('div');
        c.id = 'dataFlowToasts';
        c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:380px;';
        document.body.appendChild(c);
        return c;
    }

    // ── Show Toast ──────────────────────────────────────────────────
    function showToast(fromModule, toModule, fields) {
        var container = ensureContainer();

        var toast = document.createElement('div');
        toast.style.cssText = 'pointer-events:auto;padding:12px 16px;background:rgba(15,23,42,0.95);border:1px solid rgba(212,165,116,0.3);border-radius:10px;backdrop-filter:blur(8px);display:flex;align-items:flex-start;gap:10px;animation:dfSlideIn 0.3s ease;font-family:inherit;';
        toast.innerHTML = '' +
            '<span style="font-size:1rem;flex-shrink:0;margin-top:1px;">🔗</span>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:0.8rem;font-weight:700;color:#e2e8f0;margin-bottom:2px;">Data synced</div>' +
                '<div style="font-size:0.75rem;color:#94a3b8;line-height:1.4;">' +
                    '<span style="color:#d4a574;font-weight:600;">' + fromModule + '</span> → ' +
                    '<span style="color:#cbd5e1;">' + toModule + '</span>' +
                    (fields ? '<br><span style="color:#64748b;font-style:italic;">Fields: ' + fields + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:0.9rem;padding:0 2px;line-height:1;">×</button>';

        container.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 350);
        }, TOAST_DURATION);
    }

    // ── Nav Badge ───────────────────────────────────────────────────
    // Adds a gold dot to the nav link for the receiving module.
    // Badges are session-scoped and clear when user visits the target page.

    function addNavBadge(targetPath) {
        var badges = getBadgeState();
        badges[targetPath] = true;
        setBadgeState(badges);
        renderBadges();
    }

    function renderBadges() {
        var badges = getBadgeState();

        // Remove existing badges
        document.querySelectorAll('.data-flow-badge').forEach(function(b) { b.remove(); });

        // Add badges to matching nav links
        Object.keys(badges).forEach(function(path) {
            var slug = String(path || '')
                .replace(/^https?:\/\/[^/]+/i, '')
                .replace(/\/+$/, '')
                .split('/')
                .filter(Boolean)
                .pop() || '';
            var link = document.querySelector('a.nav-item[href*="' + path + '"]') ||
                (slug ? document.querySelector('a.nav-item[data-nav="' + slug + '"]') : null);
            if (!link) return;
            // Don't badge the current page
            if (window.location.pathname.indexOf(path) >= 0) {
                delete badges[path];
                setBadgeState(badges);
                return;
            }
            var dot = document.createElement('span');
            dot.className = 'data-flow-badge';
            dot.style.cssText = 'display:inline-block;width:6px;height:6px;background:#d4a574;border-radius:50%;margin-left:6px;animation:dfPulse 2s infinite;flex-shrink:0;';
            var navDot = link.querySelector('.nav-dot');
            var navLabel = link.querySelector('.nav-label');
            if (navDot && navDot.parentNode === link) {
                link.insertBefore(dot, navDot);
            } else if (navLabel && navLabel.parentNode === link) {
                navLabel.insertAdjacentElement('afterend', dot);
            } else {
                link.appendChild(dot);
            }
        });
    }

    // Clear badge for current page on load
    function clearCurrentPageBadge() {
        var path = window.location.pathname;
        var badges = getBadgeState();
        var changed = false;
        Object.keys(badges).forEach(function(p) {
            if (path.indexOf(p) >= 0) { delete badges[p]; changed = true; }
        });
        if (changed) setBadgeState(badges);
    }

    // ── Inject Keyframes ────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('dataFlowStyles')) return;
        var style = document.createElement('style');
        style.id = 'dataFlowStyles';
        style.textContent = '' +
            '@keyframes dfSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }' +
            '@keyframes dfPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }';
        document.head.appendChild(style);
    }

    // ── Public API ──────────────────────────────────────────────────
    // notify(fromModule, toModule, fields, targetNavPath)
    function notify(fromModule, toModule, fields, targetNavPath) {
        injectStyles();
        showToast(fromModule, toModule, fields);
        if (targetNavPath) addNavBadge(targetNavPath);
    }

    // ── Init ────────────────────────────────────────────────────────
    function init() {
        injectStyles();
        clearCurrentPageBadge();
        // Render badges after nav is loaded (slight delay)
        setTimeout(renderBadges, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.dataFlow = {
        notify: notify,
        renderBadges: renderBadges
    };

})();
