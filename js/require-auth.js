(function () {
    function finalizeSuccess(detail) {
        window.__gtmosAuthGatePending = false;
        document.documentElement.setAttribute('data-gtmos-auth-state', 'ready');
        window.dispatchEvent(new CustomEvent('gtmos:auth-ready', { detail: detail || {} }));
        return detail || {};
    }

    window.requireAuthReady = (async function () {
        try {
            if (typeof initSupabase === 'function') initSupabase();

            const session = await auth.getSession();
            if (!session) {
                window.location.replace('/login.html');
                throw new Error('Auth session missing');
            }

            var workspace = null;
            if (typeof window.ensureUserWorkspace === 'function') {
                workspace = await window.ensureUserWorkspace(session);
            }

            return finalizeSuccess({
                mode: (typeof window.isAuthBypassEnabled === 'function' && window.isAuthBypassEnabled()) ? 'demo' : 'session',
                session: session,
                workspace: workspace
            });
        } catch (e) {
            window.location.replace('/login.html');
            throw e;
        }
    })();
})();
