(function () {
    var path = window.location.pathname || '';
    if (path.indexOf('/app/') !== 0) return;

    var MODE_KEY = 'gtmos_env_mode';
    var AUTH_STORAGE_KEY = 'antaeus-auth-token';
    var DEMO_BYPASS_KEYS = ['gtmos_noauth_mode', 'gtmos_demo__gtmos_noauth_mode'];

    function syncEnvironmentMode() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var demoParam = (params.get('demo') || '').toLowerCase();
            if (demoParam === '1' || demoParam === 'true') {
                sessionStorage.setItem(MODE_KEY, 'demo');
            } else if (demoParam === '0' || demoParam === 'false') {
                sessionStorage.setItem(MODE_KEY, 'prod');
            }
        } catch (e) {}
    }

    function installAuthLock() {
        if (document.getElementById('gtmosAuthPreflightStyle')) return;
        var style = document.createElement('style');
        style.id = 'gtmosAuthPreflightStyle';
        style.textContent = 'html[data-gtmos-auth-state="pending"] body{visibility:hidden!important;}';
        document.head.appendChild(style);
    }

    function isTruthy(value) {
        if (value === '1' || value === 'true') return true;

        if (value === '"1"' || value === '"true"' || value === "'1'" || value === "'true'") {
            return true;
        }

        return false;
    }

    function rawGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function hasStoredSession() {
        var raw = rawGet(AUTH_STORAGE_KEY);
        if (!raw) return false;

        try {
            var parsed = JSON.parse(raw);
            return !!(
                (parsed && parsed.access_token) ||
                (parsed && parsed.refresh_token) ||
                (parsed && parsed.currentSession && (parsed.currentSession.access_token || parsed.currentSession.refresh_token)) ||
                (parsed && parsed.session && (parsed.session.access_token || parsed.session.refresh_token))
            );
        } catch (e) {
            return true;
        }
    }

    function hasDemoBypassSession() {
        try {
            if (sessionStorage.getItem(MODE_KEY) !== 'demo') return false;
        } catch (e) {
            return false;
        }

        for (var i = 0; i < DEMO_BYPASS_KEYS.length; i++) {
            if (isTruthy(rawGet(DEMO_BYPASS_KEYS[i]))) return true;
        }

        return false;
    }

    syncEnvironmentMode();
    installAuthLock();

    document.documentElement.setAttribute('data-gtmos-auth-state', 'pending');

    var demoBypass = hasDemoBypassSession();
    var storedSession = hasStoredSession();

    window.__gtmosAuthGatePending = true;
    window.__gtmosDemoBypassSession = demoBypass;
    window.__gtmosHasStoredSession = storedSession;

    if (demoBypass || storedSession) return;

    window.location.replace('/login.html');
})();
