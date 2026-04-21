(function(window) {
    'use strict';

    if (window.gtmWorkspaceGuard && typeof window.gtmWorkspaceGuard.isCompleted === 'function') return;

    function bootstrapDemoEnvironment() {
        if (window.gtmDemoStorageBootstrap && typeof window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode === 'function') {
            return window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode({
                search: window.location.search
            });
        }
        return window.gtmEnvironment || { mode: 'prod', isDemo: false };
    }

    function readGuardJson(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || 'null');
        } catch (e) {
            return null;
        }
    }

    function readOnboardingState() {
        return readGuardJson('gtmos_onboarding');
    }

    function readProfileCache() {
        return readGuardJson('gtmos_profile_cache');
    }

    function isCompleted() {
        var onboardingState = readOnboardingState();
        if (onboardingState && onboardingState.completed === true) return true;

        var profileCache = readProfileCache();
        if (profileCache && profileCache.onboarding_completed === true) return true;

        return false;
    }

    function shouldBypassPath(pathname) {
        var currentPath = String(pathname || window.location.pathname || '');
        return currentPath.indexOf('/app/onboarding') !== -1
            || currentPath.indexOf('/login') !== -1
            || currentPath.indexOf('/signup') !== -1
            || currentPath.indexOf('/auth/') !== -1
            || currentPath.indexOf('/forgot-password') !== -1;
    }

    function redirectToOnboardingIfNeeded(pathname) {
        var currentPath = String(pathname || window.location.pathname || '');
        if (shouldBypassPath(currentPath)) return false;
        if (!isCompleted()) {
            window.location.replace('/app/onboarding/');
            return true;
        }
        return false;
    }

    bootstrapDemoEnvironment();

    window.gtmWorkspaceGuard = {
        readOnboardingState: readOnboardingState,
        readProfileCache: readProfileCache,
        isCompleted: isCompleted,
        shouldBypassPath: shouldBypassPath,
        redirectToOnboardingIfNeeded: redirectToOnboardingIfNeeded
    };
})(window);
