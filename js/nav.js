/**
 * GTMOS Shared Navigation
 *
 * Consolidated modules:
 *   ICP Builder + ICP Library -> ICP Studio
 *   Weekly Outbound Plan + Trigger-Outreach -> Outbound Studio
 *   Deal Workspaces + Deal Review + Account Planning -> Deal Workspace
 */
(function() {
    'use strict';

    function bootstrapEnvironmentMode() {
        if (window.__gtmosEnvBootstrapped) {
            return window.gtmEnvironment || { mode: 'prod', isDemo: false };
        }
        window.__gtmosEnvBootstrapped = true;

        var MODE_KEY = 'gtmos_env_mode';
        var mode = 'prod';
        try {
            var params = new URLSearchParams(window.location.search || '');
            var demoParam = (params.get('demo') || '').toLowerCase();
            if (demoParam === '1' || demoParam === 'true') {
                sessionStorage.setItem(MODE_KEY, 'demo');
            } else if (demoParam === '0' || demoParam === 'false') {
                sessionStorage.setItem(MODE_KEY, 'prod');
            }
            mode = sessionStorage.getItem(MODE_KEY) || 'prod';
        } catch (e) {
            mode = 'prod';
        }

        var isDemo = mode === 'demo';
        window.gtmEnvironment = {
            mode: isDemo ? 'demo' : 'prod',
            isDemo: isDemo
        };

        if (!isDemo || !window.localStorage) return window.gtmEnvironment;

        var prefix = 'gtmos_demo__';
        var storageProto = window.Storage && window.Storage.prototype;
        if (!storageProto || storageProto.__gtmosDemoStoragePatch) return window.gtmEnvironment;
        storageProto.__gtmosDemoStoragePatch = true;

        var rawGetItem = storageProto.getItem;
        var rawSetItem = storageProto.setItem;
        var rawRemoveItem = storageProto.removeItem;
        var rawKey = storageProto.key;
        var rawClear = storageProto.clear;

        function isDemoStorageMode() {
            try { return sessionStorage.getItem(MODE_KEY) === 'demo'; }
            catch (e) { return false; }
        }

        function shouldPatch(storageObj) {
            return storageObj === window.localStorage && isDemoStorageMode();
        }

        function mapKey(key) {
            var next = String(key || '');
            if (next.indexOf('gtmos_') !== 0) return next;
            if (next.indexOf(prefix) === 0) return next;
            return prefix + next;
        }

        storageProto.getItem = function(key) {
            if (shouldPatch(this)) return rawGetItem.call(this, mapKey(key));
            return rawGetItem.call(this, key);
        };

        storageProto.setItem = function(key, value) {
            if (shouldPatch(this)) return rawSetItem.call(this, mapKey(key), value);
            return rawSetItem.call(this, key, value);
        };

        storageProto.removeItem = function(key) {
            if (shouldPatch(this)) return rawRemoveItem.call(this, mapKey(key));
            return rawRemoveItem.call(this, key);
        };

        storageProto.key = function(index) {
            if (!shouldPatch(this)) return rawKey.call(this, index);
            var demoKeys = [];
            for (var i = 0; i < this.length; i++) {
                var storageKey = rawKey.call(this, i);
                if (storageKey && storageKey.indexOf(prefix) === 0) {
                    demoKeys.push(storageKey.slice(prefix.length));
                }
            }
            return demoKeys[index] || null;
        };

        storageProto.clear = function() {
            if (!shouldPatch(this)) return rawClear.call(this);
            var toDelete = [];
            for (var i = 0; i < this.length; i++) {
                var storageKey = rawKey.call(this, i);
                if (storageKey && storageKey.indexOf(prefix) === 0) {
                    toDelete.push(storageKey);
                }
            }
            toDelete.forEach(function(storageKey) {
                rawRemoveItem.call(window.localStorage, storageKey);
            });
        };

        return window.gtmEnvironment;
    }

    bootstrapEnvironmentMode();

    if (!document.querySelector('script[data-gtmos-input-sanitizer]')) {
        var sanitizerScript = document.createElement('script');
        sanitizerScript.src = '/js/input-sanitizer.js';
        sanitizerScript.setAttribute('data-gtmos-input-sanitizer', 'true');
        document.head.appendChild(sanitizerScript);
    }

    if (!document.querySelector('script[data-gtmos-module-header]')) {
        var moduleHeaderScript = document.createElement('script');
        moduleHeaderScript.src = '/js/module-header.js';
        moduleHeaderScript.async = true;
        moduleHeaderScript.setAttribute('data-gtmos-module-header', 'true');
        document.head.appendChild(moduleHeaderScript);
    }

    // Redirect to onboarding whenever onboarding is not completed.
    var currentPath = window.location.pathname;

    function redirectToOnboardingIfNeeded() {
        if (currentPath.indexOf('/app/onboarding') !== -1) return false;
        try {
            var onboardingState = JSON.parse(localStorage.getItem('gtmos_onboarding') || 'null');
            if (!onboardingState || onboardingState.completed !== true) {
                window.location.replace('/app/onboarding/');
                return true;
            }
        } catch (e) {
            window.location.replace('/app/onboarding/');
            return true;
        }
        return false;
    }

    if (window.__gtmosAuthGatePending) {
        window.addEventListener('gtmos:auth-ready', function() {
            redirectToOnboardingIfNeeded();
        }, { once: true });
    } else if (redirectToOnboardingIfNeeded()) {
        return;
    }


    var NAV_HTML = '' +
    '<div class="sidebar-header"><a href="/app/dashboard/" class="sidebar-logo">ANTAEUS</a></div>' +
    '<nav class="sidebar-nav">' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Home</div>' +
            '<a href="/app/dashboard/" class="nav-item" data-nav="dashboard"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z\"/></svg></span><span class="nav-label">Dashboard</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Intelligence</div>' +
            '<a href="/app/signal-console/" class="nav-item" data-nav="signal-console"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12h4l3-9 6 18 3-9h4\"/></svg></span><span class="nav-label">Signal Console</span><span class="nav-dot"></span></a>' +
            '<a href="/app/icp-studio/" class="nav-item" data-nav="icp-studio"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/></svg></span><span class="nav-label">ICP Studio</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Territory</div>' +
            '<a href="/app/territory-architect/" class="nav-item" data-nav="territory-architect"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2\"/><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"15.5\"/><polyline points=\"22 8.5 12 15.5 2 8.5\"/><polyline points=\"2 15.5 12 8.5 22 15.5\"/><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"8.5\"/></svg></span><span class="nav-label">Territory Architect</span><span class="nav-dot"></span></a>' +
            '<a href="/app/sourcing-workbench/" class="nav-item" data-nav="sourcing-workbench"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/><line x1=\"11\" y1=\"8\" x2=\"11\" y2=\"14\"/><line x1=\"8\" y1=\"11\" x2=\"14\" y2=\"11\"/></svg></span><span class="nav-label">Sourcing Workbench</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Outbound</div>' +
            '<a href="/app/outbound-studio/" class="nav-item" data-nav="outbound-studio"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/></svg></span><span class="nav-label">Outbound Studio</span><span class="nav-dot"></span></a>' +
            '<a href="/app/cold-call-studio/" class="nav-item" data-nav="cold-call-studio"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72\"/><path d=\"M15 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z\"/></svg></span><span class="nav-label">Cold Call Studio</span><span class="nav-dot"></span></a>' +
            '<a href="/app/linkedin-playbook/" class="nav-item" data-nav="linkedin-playbook"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z\"/><rect x=\"2\" y=\"9\" width=\"4\" height=\"12\"/><circle cx=\"4\" cy=\"4\" r=\"2\"/></svg></span><span class="nav-label">LinkedIn Playbook</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Calls</div>' +
            '<a href="/app/discovery-agenda/" class="nav-item" data-nav="discovery-agenda"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z\"/></svg></span><span class="nav-label">Call Planner</span><span class="nav-dot"></span></a>' +
            '<a href="/app/discovery-studio/" class="nav-item" data-nav="discovery-studio"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><polygon points=\"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76\"/></svg></span><span class="nav-label">Discovery Studio</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">Pipeline</div>' +
            '<a href="/app/deal-workspace/" class="nav-item" data-nav="deal-workspace"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2\"/></svg></span><span class="nav-label">Deal Workspace</span><span class="nav-dot"></span></a>' +
            '<a href="/app/future-autopsy/" class="nav-item" data-nav="future-autopsy"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"8\" r=\"3\"/><line x1=\"11\" y1=\"11\" x2=\"11\" y2=\"17\"/><line x1=\"8\" y1=\"20\" x2=\"14\" y2=\"20\"/><line x1=\"11\" y1=\"17\" x2=\"11\" y2=\"20\"/><line x1=\"8\" y1=\"14\" x2=\"14\" y2=\"14\"/></svg></span><span class="nav-label">Future Autopsy</span><span class="nav-dot"></span></a>' +
            '<a href="/app/poc-framework/" class="nav-item" data-nav="poc-framework"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2\"/><path d=\"M8.5 2h7\"/></svg></span><span class="nav-label">PoC Framework</span><span class="nav-dot"></span></a>' +
            '<a href="/app/advisor-deploy/" class="nav-item" data-nav="advisor-deploy"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M23 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/></svg></span><span class="nav-label">Advisor Deploy</span><span class="nav-dot"></span></a>' +
        '</div>' +
        '<div class="nav-section">' +
            '<div class="nav-section-title nav-section-title-lg">System</div>' +
            '<a href="/app/quota-workback/" class="nav-item" data-nav="quota-workback"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><line x1=\"8\" y1=\"6\" x2=\"16\" y2=\"6\"/><line x1=\"8\" y1=\"10\" x2=\"16\" y2=\"10\"/><line x1=\"8\" y1=\"14\" x2=\"16\" y2=\"14\"/><line x1=\"8\" y1=\"18\" x2=\"16\" y2=\"18\"/></svg></span><span class="nav-label">Quota Workback</span><span class="nav-dot"></span></a>' +
            '<a href="/app/founding-gtm/" class="nav-item" data-nav="founding-gtm"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"/><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/></svg></span><span class="nav-label">Playbook</span><span class="nav-dot"></span></a>' +
            '<a href="/app/readiness/" class="nav-item" data-nav="readiness"><span class="nav-icon"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 12h-4l-3 9L9 3l-3 9H2\"/></svg></span><span class="nav-label">Readiness Score</span><span class="nav-dot"></span></a>' +
        '</div>' +
    '</nav>' +
    '<div class="sidebar-footer">' +
        '<div class="user-menu">' +
            '<div class="user-avatar" id="userAvatar">?</div>' +
            '<div class="user-info">' +
                '<div class="user-name" id="userName">Workspace</div>' +
                '<div class="user-plan">Pro Plan</div>' +
            '</div>' +
        '</div>' +
        '<div class="sidebar-data-notice" id="sidebarDataNotice">Data is saved in this browser on this device.</div>' +
        '<div class="sidebar-footer-actions">' +
            '<button class="sidebar-action-btn" id="settingsBtn" title="Settings"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg></button>' +
            '<button class="sidebar-action-btn" id="roleResetBtn" title="New Role Setup"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"23 4 23 10 17 10\"/><polyline points=\"1 20 1 14 7 14\"/><path d=\"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15\"/></svg></button>' +
            '<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="handleSignOut()">Sign Out</button>' +
        '</div>' +
    '</div>';

    var sidebar = document.querySelector('.app-sidebar');
    if (sidebar) sidebar.innerHTML = NAV_HTML;
    var sidebarNav = sidebar && sidebar.querySelector('.sidebar-nav');
    var SIDEBAR_SCROLL_KEY = 'gtmos_sidebar_nav_scroll_top';
    var SIDEBAR_ACTIVE_KEY = 'gtmos_sidebar_active_nav';
    var SIDEBAR_ANCHOR_KEY = 'gtmos_sidebar_anchor_nav';
    var SIDEBAR_OFFSET_KEY = 'gtmos_sidebar_anchor_offset';

    function readSessionStorage(key, fallback) {
        try {
            var value = sessionStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function writeSessionStorage(key, value) {
        try {
            sessionStorage.setItem(key, String(value));
        } catch (e) {}
    }

    function persistSidebarActive(navValue) {
        if (!navValue) return;
        writeSessionStorage(SIDEBAR_ACTIVE_KEY, navValue);
    }


    var navStyle = document.createElement('style');
    navStyle.textContent = `
        .nav-icon { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; margin-right:8px; opacity:0.7; flex-shrink:0; }
        .nav-item.active .nav-icon, .nav-item:hover .nav-icon { opacity:1; }
        .nav-label { flex:1; }
        .nav-item { display:flex !important; align-items:center; position:relative; }
        .nav-item.context-active {
            background:rgba(212,165,116,0.06);
            border-color:rgba(212,165,116,0.18);
            color:var(--text-primary,#e2e8f0);
        }
        .nav-dot { width:8px; height:8px; border-radius:50%; margin-left:auto; flex-shrink:0; background:rgba(100,116,139,0.3); transition:all 0.3s; }
        .nav-dot.started { background:rgba(45,212,191,0.6); box-shadow:0 0 6px rgba(45,212,191,0.4); }
        .nav-dot.complete { background:rgba(34,197,94,0.8); box-shadow:0 0 8px rgba(34,197,94,0.5); }
        .nav-item.context-active .nav-dot {
            background:rgba(212,165,116,0.6);
            box-shadow:0 0 6px rgba(212,165,116,0.25);
        }
        .sidebar-footer-actions { display:flex; align-items:center; gap:6px; margin-top:8px; padding:0 12px; }
        .sidebar-action-btn { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; border:1px solid var(--border-default,#2d3748); background:transparent; color:var(--text-muted,#64748b); cursor:pointer; transition:all 0.2s; }
        .sidebar-action-btn:hover { background:rgba(212,165,116,0.1); color:var(--brand-gold,#d4a574); border-color:rgba(212,165,116,0.3); }
        .nav-tour-glow {
            display:block; width:calc(100% - 24px); margin:12px 12px 8px; padding:12px 16px;
            background:linear-gradient(135deg,rgba(212,165,116,0.2),rgba(168,85,247,0.1),rgba(59,130,246,0.1));
            border:1px solid rgba(212,165,116,0.4); border-radius:12px;
            color:var(--brand-gold,#d4a574); font-weight:700; font-size:0.85rem;
            cursor:pointer; font-family:inherit; text-align:center;
            transition:all 0.3s; letter-spacing:0.03em;
            box-shadow:0 0 12px rgba(212,165,116,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
            animation:tourPulse 2.2s ease-in-out infinite;
        }
        .nav-tour-glow:hover {
            background:linear-gradient(135deg,rgba(212,165,116,0.35),rgba(168,85,247,0.15),rgba(59,130,246,0.15));
            box-shadow:0 0 20px rgba(212,165,116,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
            transform:translateY(-1px);
        }
        .nav-welcome-chip {
            display:block; width:calc(100% - 24px); margin:0 12px 10px; padding:9px 12px;
            border:1px solid rgba(45,212,191,0.22); border-radius:999px;
            background:rgba(45,212,191,0.08); color:var(--brand-teal-light,#5eead4);
            font-family:inherit; font-size:0.78rem; font-weight:700; letter-spacing:0.02em;
            cursor:pointer; transition:all 0.2s; text-align:center;
        }
        .nav-welcome-chip:hover {
            border-color:rgba(45,212,191,0.4);
            background:rgba(45,212,191,0.14);
            color:#d5fffa;
            transform:translateY(-1px);
        }
        .nav-demo-chip {
            display:block; width:calc(100% - 24px); margin:0 12px 10px; padding:9px 12px;
            border:1px solid rgba(212,165,116,0.24); border-radius:999px;
            background:rgba(212,165,116,0.08); color:var(--brand-gold,#d4a574);
            font-family:inherit; font-size:0.78rem; font-weight:700; letter-spacing:0.02em;
            cursor:pointer; transition:all 0.2s; text-align:center;
        }
        .nav-demo-chip:hover {
            border-color:rgba(212,165,116,0.4);
            background:rgba(212,165,116,0.14);
            color:#ffe3c4;
            transform:translateY(-1px);
        }
        .nav-demo-chip.nav-demo-chip-secondary {
            border-color:rgba(239,68,68,0.24);
            background:rgba(239,68,68,0.06);
            color:#ff9a92;
        }
        .nav-demo-chip.nav-demo-chip-secondary:hover {
            border-color:rgba(239,68,68,0.4);
            background:rgba(239,68,68,0.12);
            color:#ffd1cc;
        }
        @keyframes tourPulse {
            0%, 100% { box-shadow:0 0 12px rgba(212,165,116,0.15), inset 0 1px 0 rgba(255,255,255,0.05); transform:scale(1); }
            50% { box-shadow:0 0 24px rgba(212,165,116,0.34), inset 0 1px 0 rgba(255,255,255,0.08); transform:scale(1.025); }
        }
    `;
    document.head.appendChild(navStyle);


    var path = window.location.pathname.replace(/\/+$/, '');
    var segments = path.split('/').filter(Boolean);
    var appSlug = segments.length >= 2 ? segments[segments.length - 1] : '';
    var slugMap = {
        'command-center': 'dashboard',
        'icp-builder': 'icp-studio',
        'icp-library': 'icp-studio',
        'outbound-os': 'outbound-studio',
        'signal-play-studio': 'outbound-studio',
        'deal-workspaces': 'deal-workspace',
        'deal-review': 'deal-workspace',
        'account-planning': 'deal-workspace',
        'settings': 'settings'
    };
    var navKey = slugMap[appSlug] || appSlug;
    var activeLink = sidebar && sidebar.querySelector('[data-nav="' + navKey + '"]');
    var contextNavKey = readSessionStorage(SIDEBAR_ACTIVE_KEY, '');
    var contextLink = (!activeLink && contextNavKey)
        ? (sidebar && sidebar.querySelector('[data-nav="' + contextNavKey + '"]'))
        : null;
    if (activeLink) {
        activeLink.classList.add('active');
        persistSidebarActive(navKey);
    } else if (contextLink) {
        contextLink.classList.add('context-active');
    }
    var sidebarDataNotice = sidebar && sidebar.querySelector('#sidebarDataNotice');
    if (sidebarDataNotice && window.gtmEnvironment && window.gtmEnvironment.isDemo) {
        sidebarDataNotice.textContent = 'You are in a sample workspace. Changes stay in this browser until you exit demo.';
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getLinkContentTop(link) {
        if (!sidebarNav || !link) return 0;
        var navRect = sidebarNav.getBoundingClientRect();
        var linkRect = link.getBoundingClientRect();
        return sidebarNav.scrollTop + (linkRect.top - navRect.top);
    }

    function getVisibleSidebarAnchor(preferredLink) {
        if (!sidebarNav) return null;
        var navRect = sidebarNav.getBoundingClientRect();
        var link = preferredLink || null;
        if (!link) {
            var visibleLinks = Array.prototype.slice.call(sidebarNav.querySelectorAll('a.nav-item'));
            link = visibleLinks.find(function(candidate) {
                var rect = candidate.getBoundingClientRect();
                return rect.bottom > navRect.top + 4 && rect.top < navRect.bottom - 4;
            }) || activeLink || contextLink || visibleLinks[0] || null;
        }
        if (!link) return null;
        var offset = Math.max(0, Math.round(link.getBoundingClientRect().top - navRect.top));
        return {
            link: link,
            nav: link.getAttribute('data-nav') || '',
            offset: offset
        };
    }

    function persistSidebarState(preferredLink) {
        if (!sidebarNav) return;
        writeSessionStorage(SIDEBAR_SCROLL_KEY, sidebarNav.scrollTop || 0);
        var anchor = getVisibleSidebarAnchor(preferredLink);
        if (!anchor) return;
        if (anchor.nav) {
            writeSessionStorage(SIDEBAR_ANCHOR_KEY, anchor.nav);
            persistSidebarActive(anchor.nav);
        }
        writeSessionStorage(SIDEBAR_OFFSET_KEY, anchor.offset);
    }

    function restoreSidebarNavPosition() {
        if (!sidebarNav) return;
        var rawScroll = readSessionStorage(SIDEBAR_SCROLL_KEY, '');
        var rawAnchorNav = readSessionStorage(SIDEBAR_ANCHOR_KEY, '');
        var rawOffset = readSessionStorage(SIDEBAR_OFFSET_KEY, '');
        var storedScroll = rawScroll === '' ? null : parseInt(rawScroll, 10);
        var storedOffset = rawOffset === '' ? null : parseInt(rawOffset, 10);

        function applyRestore() {
            if (!sidebarNav) return;
            var maxScroll = Math.max(0, sidebarNav.scrollHeight - sidebarNav.clientHeight);
            var anchorLink = rawAnchorNav
                ? sidebar.querySelector('[data-nav="' + rawAnchorNav + '"]')
                : null;
            var targetLink = anchorLink || activeLink || contextLink;

            if (targetLink && storedOffset !== null && !isNaN(storedOffset)) {
                var contentTop = getLinkContentTop(targetLink);
                var targetScroll = clamp(Math.round(contentTop - storedOffset), 0, maxScroll);
                sidebarNav.scrollTop = targetScroll;
                return;
            }

            if (storedScroll !== null && !isNaN(storedScroll)) {
                sidebarNav.scrollTop = clamp(storedScroll, 0, maxScroll);
                return;
            }

            if (targetLink && typeof targetLink.scrollIntoView === 'function') {
                targetLink.scrollIntoView({ block: 'nearest' });
            }
        }

        requestAnimationFrame(applyRestore);
        window.addEventListener('load', applyRestore, { once: true });
        if (document.fonts && typeof document.fonts.ready === 'object' && typeof document.fonts.ready.then === 'function') {
            document.fonts.ready.then(function() {
                setTimeout(applyRestore, 0);
            }).catch(function(error) {
                console.error('Sidebar font-ready restore pass failed:', error);
            });
        }
        setTimeout(applyRestore, 140);
    }

    if (sidebarNav) {
        var sidebarScrollTicking = false;
        sidebarNav.addEventListener('scroll', function() {
            if (sidebarScrollTicking) return;
            sidebarScrollTicking = true;
            requestAnimationFrame(function() {
                writeSessionStorage(SIDEBAR_SCROLL_KEY, sidebarNav.scrollTop || 0);
                sidebarScrollTicking = false;
            });
        }, { passive: true });

        sidebarNav.addEventListener('pointerdown', function(event) {
            var link = event.target.closest('a.nav-item');
            if (!link) return;
            persistSidebarState(link);
        });

        sidebarNav.addEventListener('click', function(event) {
            var link = event.target.closest('a.nav-item');
            if (!link) return;
            persistSidebarState(link);
        });
    }

    if (sidebar) {
        var sidebarLogo = sidebar.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.addEventListener('click', function() {
                persistSidebarState(sidebar.querySelector('[data-nav="dashboard"]'));
            });
        }
    }

    window.addEventListener('pagehide', function() {
        persistSidebarState();
    });
    window.addEventListener('beforeunload', function() {
        persistSidebarState();
    });
    restoreSidebarNavPosition();

    function readLS(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch (e) { return fallback; }
    }

    var workspaceSummaryPreloadPromise = null;

    function currentWorkspaceSummary() {
        return window.__gtmosWorkspaceSummary || null;
    }

    function currentWorkspaceOrFallback() {
        return currentWorkspaceSummary() || {
            profile: readLS('gtmos_profile_cache', null) || {},
            onboarding: readLS('gtmos_onboarding', null) || {},
            playbook: readLS('gtmos_playbook', {}),
            outboundSeed: readLS('gtmos_outbound_seed', {}),
            icpAnalytics: readLS('gtmos_icp_analytics', { icps: [], totalWorked: 0 }),
            discovery: {
                stats: readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 }),
                agenda: readLS('gtmos_discovery_agenda', {})
            },
            sequences: { angles: readLS('gtmos_angles', []) },
            deals: readDealList(true)
        };
    }

    function preloadWorkspaceSummary() {
        if (workspaceSummaryPreloadPromise) return workspaceSummaryPreloadPromise;
        if (!(window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function')) {
            return Promise.resolve({ data: currentWorkspaceOrFallback(), error: null });
        }
        workspaceSummaryPreloadPromise = window.gtmPersistence.workspace.loadSummary().catch(function(error) {
            console.error('Workspace summary preload failed for nav:', error);
            return { data: currentWorkspaceOrFallback(), error: error };
        });
        return workspaceSummaryPreloadPromise;
    }

    function roleLabel(role) {
        var value = String(role || '').toLowerCase();
        if (value === 'first-ae') return 'First AE';
        if (value === 'cro') return 'CRO';
        if (value === 'founder') return 'Founder';
        return 'Founder';
    }

    function applySidebarIdentity(name, plan) {
        var safeName = String(name || 'Founder').trim() || 'Founder';
        var safePlan = String(plan || 'Pro Plan').trim() || 'Pro Plan';
        var nameEl = document.getElementById('userName');
        var avatarEl = document.getElementById('userAvatar');
        var planEl = sidebar && sidebar.querySelector('.user-plan');
        if (nameEl) nameEl.textContent = safeName;
        if (avatarEl) {
            var initial = safeName.replace(/[^A-Za-z0-9]/g, '').charAt(0) || '?';
            avatarEl.textContent = initial.toUpperCase();
        }
        if (planEl) planEl.textContent = safePlan;
    }

    function fallbackSidebarIdentity() {
        var workspace = currentWorkspaceOrFallback();
        var profileCache = workspace.profile || {};
        var onboarding = workspace.onboarding || {};
        var answers = onboarding.answers || {};
        var playbook = workspace.playbook || {};
        var company = (profileCache.company_name || answers.companyName || playbook.company || '').trim();
        var persona = profileCache.role || answers.role || onboarding.persona || '';
        var email = '';
        try { email = String(localStorage.getItem('gtmos_noauth_email') || '').trim(); }
        catch (e) { email = ''; }
        var name = company || (email ? email.split('@')[0] : '') || roleLabel(persona);
        var plan = (window.gtmEnvironment && window.gtmEnvironment.isDemo) ? 'Demo Workspace' : 'Pro Plan';
        return { name: name, plan: plan };
    }

    function hydrateSidebarIdentity() {
        var fallback = fallbackSidebarIdentity();
        applySidebarIdentity(fallback.name, fallback.plan);
        if (!window.auth || typeof auth.getUser !== 'function') return;
        auth.getUser().then(function(user) {
            if (!user) return;
            var fullName = '';
            if (user.user_metadata) {
                fullName = user.user_metadata.full_name || user.user_metadata.name || '';
            }
            var emailName = user.email ? String(user.email).split('@')[0] : '';
            var resolved = String(fullName || emailName || '').trim();
            if (resolved) applySidebarIdentity(resolved, fallback.plan);
        }).catch(function(error) {
            console.error('Sidebar identity hydration failed:', error);
        });
    }

    hydrateSidebarIdentity();
    window.addEventListener('gtmos:auth-ready', hydrateSidebarIdentity, { once: true });

    function countFilledFields(obj) {
        if (!obj || typeof obj !== 'object') return 0;
        var count = 0;
        Object.keys(obj).forEach(function(key) {
            var value = obj[key];
            if (typeof value === 'string' && value.trim().length > 0) count++;
            else if (typeof value === 'boolean' && value) count++;
        });
        return count;
    }

    function readDealList(skipWorkspace) {
        if (!skipWorkspace) {
            var workspace = currentWorkspaceSummary();
            if (workspace && Array.isArray(workspace.deals)) {
                return workspace.deals.filter(Boolean);
            }
        }
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

    function computeReadinessEstimate(workspaceOverride) {
        var workspace = workspaceOverride || currentWorkspaceOrFallback();
        var playbook = workspace.playbook || readLS('gtmos_playbook', {});
        var thinIcp = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [], totalWorked: 0 });
        var accountPlan = readLS('gtmos_account_planning', {});
        var accountPlanFields = countFilledFields((accountPlan && accountPlan.fields) || {});
        var hasBasics = !!(playbook.company && playbook.acv);

        var icpScore = 0;
        var icpCount = (thinIcp.icps || []).length;
        if (icpCount >= 1) icpScore += 5;
        if (icpCount >= 3) icpScore += 3;
        if ((thinIcp.totalWorked || 0) > 0) icpScore += 3;
        if (accountPlanFields >= 3) icpScore += 4;
        if (accountPlanFields >= 6) icpScore += 2;
        if (hasBasics) icpScore += 3;
        icpScore = Math.min(20, icpScore);

        var discoveryStats = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0, advancedCalls: 0 });
        var agenda = (workspace.discovery && workspace.discovery.agenda) || readLS('gtmos_discovery_agenda', {});
        var gatesChecked = (agenda.gates || []).filter(function(g) { return g; }).length;
        var advRate = discoveryStats.totalCalls > 0
            ? Math.round(((discoveryStats.advancedCalls || 0) / discoveryStats.totalCalls) * 100) : 0;
        var discoveryScore = 0;
        if (discoveryStats.totalCalls >= 1) discoveryScore += 3;
        if (discoveryStats.totalCalls >= 5) discoveryScore += 3;
        if (discoveryStats.totalCalls >= 10) discoveryScore += 2;
        if (advRate >= 30) discoveryScore += 3;
        if (agenda.contact && agenda.company) discoveryScore += 2;
        if (gatesChecked >= 2) discoveryScore += 3;
        if (gatesChecked === 4) discoveryScore += 2;
        if (agenda.linkedDeal) discoveryScore += 2;
        discoveryScore = Math.min(20, discoveryScore);

        var outboundSeed = workspace.outboundSeed || readLS('gtmos_outbound_seed', {});
        var angles = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
        var replies = angles.filter(function(a) { return a && a.payload && a.payload.got_reply; }).length;
        var outreachScore = 0;
        if (outboundSeed.annual_quota) outreachScore += 4;
        if (angles.length >= 1) outreachScore += 3;
        if (angles.length >= 5) outreachScore += 2;
        if (angles.length >= 10) outreachScore += 2;
        if (replies > 0) outreachScore += 3;
        if (replies >= 2) outreachScore += 2;
        outreachScore = Math.min(20, outreachScore);

        var dealReviews = readLS('gtmos_deal_reviews', []);
        var quals = readLS('gtmos_deal_quals', {});
        var outcomesRaw = readLS('gtmos_deal_outcomes', {});
        var outcomes = { wins: 0, losses: 0, total: 0 };
        Object.keys(outcomesRaw || {}).forEach(function(dealId) {
            var row = outcomesRaw[dealId] || {};
            if (row.type === 'won') outcomes.wins++;
            else if (row.type === 'lost') outcomes.losses++;
        });
        outcomes.total = outcomes.wins + outcomes.losses;
        var qualValues = Object.values(quals || {}).map(function(q) { return (q && q.score) ? q.score : 0; });
        var avgQual = qualValues.length
            ? Math.round(qualValues.reduce(function(a, b) { return a + b; }, 0) / qualValues.length) : 0;
        var stale14 = 0;
        readDealList().forEach(function(deal) {
            if (!deal || deal.stage === 'closed-won' || deal.stage === 'closed-lost') return;
            var updated = deal.updated_at || deal.created_at;
            if (!updated) return;
            var days = Math.floor((Date.now() - new Date(updated).getTime()) / 86400000);
            if (days >= 14) stale14++;
        });
        var dealsScore = 0;
        if (dealReviews.length >= 1) dealsScore += 3;
        if (dealReviews.length >= 3) dealsScore += 2;
        if (Object.keys(quals || {}).length >= 1) dealsScore += 2;
        if (Object.keys(quals || {}).length >= 3) dealsScore += 2;
        if (avgQual >= 10) dealsScore += 3;
        if (outcomes.total >= 1) dealsScore += 2;
        if (outcomes.total >= 3) dealsScore += 2;
        if (outcomes.total >= 5) dealsScore += 2;
        if (outcomes.wins > 0 && outcomes.losses > 0) dealsScore += 2;
        dealsScore = Math.max(0, Math.min(20, dealsScore - Math.min(8, stale14 * 2)));

        var playbookScore = 0;
        if (playbook.company) playbookScore += 2;
        if (playbook.acv) playbookScore += 2;
        if (playbook.stage) playbookScore += 1;
        if (playbook.cycle) playbookScore += 1;
        var pbFields = countFilledFields(playbook.fields || {});
        if (pbFields >= 3) playbookScore += 4;
        if (pbFields >= 6) playbookScore += 3;
        if (pbFields >= 10) playbookScore += 2;
        var pbChecks = playbook.checks ? Object.values(playbook.checks).filter(function(v) { return v; }).length : 0;
        if (pbChecks >= 2) playbookScore += 2;
        if (pbChecks >= 5) playbookScore += 1;
        if (playbook.notes && String(playbook.notes).trim().length > 10) playbookScore += 2;
        playbookScore = Math.min(20, playbookScore);

        return Math.min(100, icpScore + discoveryScore + outreachScore + dealsScore + playbookScore);
    }

    async function refreshNavState() {
        await preloadWorkspaceSummary();
        var workspace = currentWorkspaceOrFallback();
        var icps = workspace.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [] });
        var seed = workspace.outboundSeed || readLS('gtmos_outbound_seed', {});
        var discovery = (workspace.discovery && workspace.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0 });
        var agendaState = (workspace.discovery && workspace.discovery.agenda) || readLS('gtmos_discovery_agenda', {});
        var anglesData = (workspace.sequences && workspace.sequences.angles) || readLS('gtmos_angles', []);
        var playbookData = workspace.playbook || readLS('gtmos_playbook', {});
        var deals = Array.isArray(workspace.deals) ? workspace.deals.filter(Boolean) : readDealList(true);
        var qualsData = readLS('gtmos_deal_quals', {});

        var modulesCompleted = 0;
        if ((icps.icps || []).length > 0) modulesCompleted++;
        if (seed.annual_quota) modulesCompleted++;
        if (anglesData.length > 0) modulesCompleted++;
        if (discovery.totalCalls > 0) modulesCompleted++;
        if (playbookData.company) modulesCompleted++;
        if (deals.length > 0) modulesCompleted++;
        if (Object.keys(qualsData).length > 0) modulesCompleted++;

        var readinessTotal = computeReadinessEstimate(workspace);

        if (sidebar) {
            var dotStates = {};
            dotStates['icp-studio'] = (icps.icps || []).length > 0 ? ((icps.icps || []).length >= 3 ? 'complete' : 'started') : '';
            dotStates['signal-console'] = '';
            dotStates['quota-workback'] = seed.annual_quota ? 'complete' : '';
            dotStates['outbound-studio'] = anglesData.length > 0 ? (anglesData.length >= 5 ? 'complete' : 'started') : (function() {
                var t = readLS('gtmos_outbound_touches', { touches: [] });
                return (t.touches || []).length > 0 ? ((t.touches || []).length >= 20 ? 'complete' : 'started') : '';
            })();
            dotStates['cold-call-studio'] = (function() {
                var c = readLS('gtmos_cold_call_log', { calls: [] });
                var count = (c.calls || []).length;
                return count > 0 ? (count >= 10 ? 'complete' : 'started') : '';
            })();
            dotStates['linkedin-playbook'] = (function() {
                var l = readLS('gtmos_linkedin_log', { actions: [] });
                var count = (l.actions || []).length;
                return count > 0 ? (count >= 10 ? 'complete' : 'started') : '';
            })();
            dotStates['advisor-deploy'] = (function() {
                var d = readLS('gtmos_advisor_deployments', { deployments: [] });
                var count = (d.deployments || []).length;
                return count > 0 ? (count >= 3 ? 'complete' : 'started') : '';
            })();
            dotStates['discovery-agenda'] = (agendaState.contact || agendaState.company) ? 'started' : '';
            dotStates['discovery-studio'] = discovery.totalCalls > 0 ? (discovery.totalCalls >= 5 ? 'complete' : 'started') : '';
            dotStates['deal-workspace'] = deals.length > 0 ? (deals.length >= 3 ? 'complete' : 'started') : '';
            dotStates['future-autopsy'] = (function() {
                var log = readLS('gtmos_autopsy_log_v1', {});
                var runs = Object.keys(log).length;
                return runs > 0 ? (runs >= 3 ? 'complete' : 'started') : '';
            })();
            dotStates['poc-framework'] = (function() {
                var p = readLS('gtmos_poc_data', null);
                return p ? 'started' : '';
            })();
            dotStates['founding-gtm'] = playbookData.company ? (Object.keys(playbookData.fields || {}).filter(function(k) { return playbookData.fields[k]; }).length >= 5 ? 'complete' : 'started') : '';
            dotStates['readiness'] = readinessTotal >= 80 ? 'complete' : (readinessTotal >= 25 ? 'started' : '');
            dotStates['dashboard'] = modulesCompleted >= 3 ? 'complete' : (modulesCompleted >= 1 ? 'started' : '');
            dotStates['territory-architect'] = (function() {
                var ta = readLS('gtmos_ta_accounts', []);
                var active = ta.filter(function(a) { return a.status === 'active'; }).length;
                return active > 0 ? (active >= 20 ? 'complete' : 'started') : '';
            })();
            dotStates['sourcing-workbench'] = (function() {
                var sw = readLS('gtmos_sw_prospects', []);
                return sw.length > 0 ? (sw.length >= 15 ? 'complete' : 'started') : '';
            })();

            Object.keys(dotStates).forEach(function(slug) {
                var link = sidebar.querySelector('[data-nav="' + slug + '"]');
                if (!link) return;
                var dot = link.querySelector('.nav-dot');
                if (!dot) return;
                dot.classList.remove('complete', 'started');
                var state = dotStates[slug];
                if (state === 'complete') dot.classList.add('complete');
                else if (state === 'started') dot.classList.add('started');
            });
        }

        window.gtmNavState = {
            modulesCompleted: modulesCompleted,
            readinessTotal: readinessTotal
        };

        if (sidebarDataNotice && !(window.gtmEnvironment && window.gtmEnvironment.isDemo)) {
            sidebarDataNotice.textContent = (workspace.source && String(workspace.source).indexOf('supabase') === 0)
                ? 'Workspace syncs to your account.'
                : 'Data is saved in this browser on this device.';
        }

        return window.gtmNavState;
    }

    var workspaceSeed = currentWorkspaceOrFallback();
    var icps = workspaceSeed.icpAnalytics || readLS('gtmos_icp_analytics', { icps: [] });
    var seed = workspaceSeed.outboundSeed || readLS('gtmos_outbound_seed', {});
    var discovery = (workspaceSeed.discovery && workspaceSeed.discovery.stats) || readLS('gtmos_discovery_stats', { totalCalls: 0 });
    var anglesData = (workspaceSeed.sequences && workspaceSeed.sequences.angles) || readLS('gtmos_angles', []);
    var playbookData = workspaceSeed.playbook || readLS('gtmos_playbook', {});
    var deals = readDealList();
    var qualsData = readLS('gtmos_deal_quals', {});

    var modulesCompleted = 0;
    if ((icps.icps || []).length > 0) modulesCompleted++;
    if (seed.annual_quota) modulesCompleted++;
    if (anglesData.length > 0) modulesCompleted++;
    if (discovery.totalCalls > 0) modulesCompleted++;
    if (playbookData.company) modulesCompleted++;
    if (deals.length > 0) modulesCompleted++;
    if (Object.keys(qualsData).length > 0) modulesCompleted++;

    var readinessTotal = computeReadinessEstimate();

    if (sidebar) {
        var dotStates = {};
        dotStates['icp-studio'] = (icps.icps || []).length > 0 ? ((icps.icps || []).length >= 3 ? 'complete' : 'started') : '';
        dotStates['signal-console'] = '';  // Signal Console manages its own state
        dotStates['quota-workback'] = seed.annual_quota ? 'complete' : '';
        dotStates['outbound-studio'] = anglesData.length > 0 ? (anglesData.length >= 5 ? 'complete' : 'started') : (function(){
            var t = readLS('gtmos_outbound_touches', {touches:[]});
            return (t.touches||[]).length > 0 ? ((t.touches||[]).length >= 20 ? 'complete' : 'started') : '';
        })();
        dotStates['cold-call-studio'] = (function(){
            var c = readLS('gtmos_cold_call_log', {calls:[]});
            var count = (c.calls||[]).length;
            return count > 0 ? (count >= 10 ? 'complete' : 'started') : '';
        })();
        dotStates['linkedin-playbook'] = (function(){
            var l = readLS('gtmos_linkedin_log', {actions:[]});
            var count = (l.actions||[]).length;
            return count > 0 ? (count >= 10 ? 'complete' : 'started') : '';
        })();
        dotStates['advisor-deploy'] = (function(){
            var d = readLS('gtmos_advisor_deployments', {deployments:[]});
            var count = (d.deployments||[]).length;
            return count > 0 ? (count >= 3 ? 'complete' : 'started') : '';
        })();
        dotStates['discovery-agenda'] = (function() {
            var a = (workspaceSeed.discovery && workspaceSeed.discovery.agenda) || readLS('gtmos_discovery_agenda', {});
            return (a.contact || a.company) ? 'started' : '';
        })();
        dotStates['discovery-studio'] = discovery.totalCalls > 0 ? (discovery.totalCalls >= 5 ? 'complete' : 'started') : '';
        dotStates['deal-workspace'] = deals.length > 0 ? (deals.length >= 3 ? 'complete' : 'started') : '';
        dotStates['future-autopsy'] = (function() {
            var log = readLS('gtmos_autopsy_log_v1', {});
            var runs = Object.keys(log).length;
            return runs > 0 ? (runs >= 3 ? 'complete' : 'started') : '';
        })();
        dotStates['poc-framework'] = (function() {
            var p = readLS('gtmos_poc_data', null);
            return p ? 'started' : '';
        })();
        dotStates['founding-gtm'] = playbookData.company ? (Object.keys(playbookData.fields || {}).filter(function(k) { return playbookData.fields[k]; }).length >= 5 ? 'complete' : 'started') : '';
        dotStates['readiness'] = readinessTotal >= 80 ? 'complete' : (readinessTotal >= 25 ? 'started' : '');
        dotStates['dashboard'] = modulesCompleted >= 3 ? 'complete' : (modulesCompleted >= 1 ? 'started' : '');
        dotStates['territory-architect'] = (function(){
            var ta = readLS('gtmos_ta_accounts', []);
            var active = ta.filter(function(a) { return a.status === 'active'; }).length;
            return active > 0 ? (active >= 20 ? 'complete' : 'started') : '';
        })();
        dotStates['sourcing-workbench'] = (function(){
            var sw = readLS('gtmos_sw_prospects', []);
            return sw.length > 0 ? (sw.length >= 15 ? 'complete' : 'started') : '';
        })();

        Object.keys(dotStates).forEach(function(slug) {
            var link = sidebar.querySelector('[data-nav="' + slug + '"]');
            if (!link) return;
            var dot = link.querySelector('.nav-dot');
            if (!dot) return;
            var state = dotStates[slug];
            if (state === 'complete') dot.classList.add('complete');
            else if (state === 'started') dot.classList.add('started');
        });
    }

    window.gtmNavState = {
        modulesCompleted: modulesCompleted,
        readinessTotal: readinessTotal
    };

    function queueWorkspaceNavRefresh() {
        preloadWorkspaceSummary().then(function() {
            hydrateSidebarIdentity();
            return refreshNavState();
        }).catch(function(error) {
            console.error('Nav workspace refresh failed:', error);
        });
    }

    if (window.__gtmosAuthGatePending && window.requireAuthReady && typeof window.requireAuthReady.then === 'function') {
        window.requireAuthReady.then(function() {
            queueWorkspaceNavRefresh();
        }).catch(function(error) {
            console.error('Nav auth-gated refresh failed:', error);
        });
    } else if (window.__gtmosAuthGatePending) {
        window.addEventListener('gtmos:auth-ready', function() {
            queueWorkspaceNavRefresh();
        }, { once: true });
    } else {
        queueWorkspaceNavRefresh();
    }

    window.addEventListener('gtmos:workspace-summary-ready', function() {
        workspaceSummaryPreloadPromise = Promise.resolve({ data: currentWorkspaceSummary(), error: null });
        hydrateSidebarIdentity();
        refreshNavState().catch(function(error) {
            console.error('Nav workspace-summary refresh failed:', error);
        });
    });

    if (sidebar) {
        var footer = sidebar.querySelector('.sidebar-footer');
        if (footer) {
            var tourBtn = document.createElement('button');
            tourBtn.className = 'nav-tour-glow';
            tourBtn.onclick = function() {
                if (typeof TourGuide !== 'undefined' && typeof TourGuide.launch === 'function') TourGuide.launch();
                else if (typeof TourGuide !== 'undefined') TourGuide.start();
            };
            tourBtn.textContent = 'Tour the App';
            footer.insertBefore(tourBtn, footer.firstChild);
            if (window.gtmEnvironment && window.gtmEnvironment.isDemo) {
                var pricingBtn = document.createElement('button');
                pricingBtn.className = 'nav-demo-chip';
                pricingBtn.textContent = 'See Annual Plan';
                pricingBtn.onclick = function() {
                    persistSidebarState();
                    window.location.href = '/purchase/?entry=demo-sidebar';
                };
                footer.insertBefore(pricingBtn, tourBtn.nextSibling);

                var exitDemoBtn = document.createElement('button');
                exitDemoBtn.className = 'nav-demo-chip nav-demo-chip-secondary';
                exitDemoBtn.textContent = 'Exit Demo';
                exitDemoBtn.onclick = async function() {
                    persistSidebarState();
                    try {
                        if (window.gtmDataManager && typeof window.gtmDataManager.clearDemoWorkspace === 'function') {
                            await window.gtmDataManager.clearDemoWorkspace({
                                redirect: true,
                                redirectUrl: '/app/dashboard/'
                            });
                            return;
                        }
                    } catch (error) {
                        console.error('Demo exit from nav failed:', error);
                    }
                    try { sessionStorage.setItem('gtmos_env_mode', 'prod'); } catch (e) {}
                    window.location.href = '/app/dashboard/';
                };
                footer.insertBefore(exitDemoBtn, pricingBtn.nextSibling);
            } else if (currentPath.indexOf('/app/welcome') === -1) {
                var welcomeBtn = document.createElement('button');
                welcomeBtn.className = 'nav-welcome-chip';
                welcomeBtn.innerHTML = 'Back to Welcome Guide';
                welcomeBtn.onclick = function() {
                    persistSidebarState();
                    window.location.href = '/app/welcome/';
                };
                footer.insertBefore(welcomeBtn, tourBtn.nextSibling);
            }
        }
        var settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.onclick = function() {
                persistSidebarState();
                window.location.href = '/app/settings/';
            };
        }
        var roleResetBtn = document.getElementById('roleResetBtn');
        if (roleResetBtn) {
            roleResetBtn.onclick = async function() {
                if (confirm('Start a new role setup? This will take you through onboarding again. Your existing data stays safe.')) {
                    persistSidebarState();
                    if (typeof window.resetUserOnboardingState === 'function') {
                        var result = await window.resetUserOnboardingState();
                        if (result && result.error) {
                            console.error('Role reset failed:', result.error);
                            alert((result.error && result.error.message) ? result.error.message : 'Unable to reset setup right now.');
                            return;
                        }
                    } else {
                        localStorage.removeItem('gtmos_onboarding');
                        localStorage.removeItem('gtmos_discovery_pledged');
                    }
                    window.location.href = '/app/onboarding/';
                }
            };
        }
    }

    if (window.gtmAnalytics) {
        gtmAnalytics.page(appSlug || window.location.pathname);
    }
})();
