(function(window) {
    'use strict';

    if (window.gtmQaMode && typeof window.gtmQaMode.isEnabled === 'function') return;

    var KEY = 'gtmos_qa_mode';

    function readSession() {
        try {
            return sessionStorage.getItem(KEY);
        } catch (e) {
            return null;
        }
    }

    function writeSession(value) {
        try {
            if (value == null) sessionStorage.removeItem(KEY);
            else sessionStorage.setItem(KEY, value ? '1' : '0');
        } catch (e) {}
    }

    function syncFromSearch(search) {
        try {
            var params = new URLSearchParams(search || window.location.search || '');
            var raw = String(params.get('qa') || '').toLowerCase();
            if (raw === '1' || raw === 'true') writeSession(true);
            if (raw === '0' || raw === 'false') writeSession(false);
        } catch (e) {}
    }

    function applyDocumentState(enabled) {
        var next = !!enabled;
        if (document.documentElement) document.documentElement.classList.toggle('qa-mode', next);
        if (document.body) document.body.classList.toggle('qa-mode', next);
    }

    function isEnabled() {
        return readSession() === '1';
    }

    function bootstrap(options) {
        options = options || {};
        if (typeof options.enabled === 'boolean') {
            writeSession(options.enabled);
        } else {
            syncFromSearch(options.search);
        }
        applyDocumentState(isEnabled());
        return {
            enabled: isEnabled()
        };
    }

    function setEnabled(enabled) {
        writeSession(!!enabled);
        applyDocumentState(!!enabled);
        try {
            window.dispatchEvent(new CustomEvent('gtmos:qa-mode-changed', {
                detail: { enabled: !!enabled }
            }));
        } catch (e) {}
        return !!enabled;
    }

    window.gtmQaMode = {
        KEY: KEY,
        bootstrap: bootstrap,
        isEnabled: isEnabled,
        setEnabled: setEnabled
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            applyDocumentState(isEnabled());
        }, { once: true });
    } else {
        applyDocumentState(isEnabled());
    }
})(window);
