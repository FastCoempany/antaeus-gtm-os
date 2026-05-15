(function () {
    'use strict';

    function getMessageText(error) {
        if (!error) return '';
        if (typeof error === 'string') return error;
        return String(error.message || error.error_description || error.description || '').trim();
    }

    function normalizeAuthError(error, context) {
        var raw = getMessageText(error);
        var text = raw.toLowerCase();

        // Default: Trust Annex voice — plain, calm, with a recovery move.
        // Canon Part II §4.7. We deliberately don't echo the raw Supabase
        // error string unless we couldn't find a specific match — those
        // strings often leak internal architecture language ("JWT",
        // "PKCE", "grant_type"), which violates the Trust Annex laws.
        var result = {
            message: 'Something stopped that from working. Please try again.',
            actionHref: '',
            actionLabel: '',
            actionCopy: ''
        };

        // No error info at all → use the calm default + a recovery move
        // so the user is never stuck on a dead page.
        if (!raw) {
            result.actionHref = '/login.html';
            result.actionLabel = 'Back to sign in';
            result.actionCopy = 'Start over:';
            return result;
        }

        if (/timed out|network|failed to fetch|unable to connect|fetch failed|networkerror/.test(text)) {
            result.message = 'We could not reach the workspace just now. Check your connection and try again.';
            return result;
        }

        // Session expired / refresh failures. Supabase returns these as
        // "jwt expired", "invalid refresh token", "user not found",
        // "session_not_found", etc. when the session has aged out or the
        // token store was cleared in another tab.
        if (/jwt expired|invalid refresh token|refresh token not found|session_not_found|session not found|user from sub claim|missing session|no session/.test(text)) {
            result.message = 'Your session timed out. Sign in again to pick up where you left off.';
            result.actionHref = '/login.html';
            result.actionLabel = 'Sign in';
            result.actionCopy = '';
            return result;
        }

        if (/email rate limit exceeded|over_email_send_rate_limit|rate limit/.test(text) && /email|otp|confirmation|reset/.test(text)) {
            result.message = 'Too many auth emails were requested in a short window. Wait a minute, then try again.';
            return result;
        }

        if (/user already registered|account with this email already exists|email already in use|already exists|already registered/.test(text)) {
            result.message = 'An account with this email already exists.';
            result.actionHref = '/login.html';
            result.actionLabel = 'Sign in instead';
            result.actionCopy = 'Already have an account?';
            return result;
        }

        if (/invalid login credentials|invalid email or password|invalid_credentials/.test(text)) {
            result.message = 'That email and password combination did not work.';
            result.actionHref = '/forgot-password.html';
            result.actionLabel = 'Reset password';
            result.actionCopy = 'Need a new password?';
            return result;
        }

        if (/email not confirmed|signup disabled|not_confirmed/.test(text)) {
            result.message = 'Confirm your email before signing in — the link is in the inbox we just sent to.';
            result.actionHref = '/signup.html';
            result.actionLabel = 'Resend confirmation';
            result.actionCopy = 'Need a fresh confirmation email?';
            return result;
        }

        if (/otp expired|expired|invalid.*token|token.*invalid|link expired|email link is invalid|email link is expired/.test(text)) {
            if (context === 'reset' || context === 'callback') {
                result.message = 'This link is expired or already used. Request a fresh one to continue.';
                result.actionHref = '/forgot-password.html';
                result.actionLabel = 'Request a new link';
                result.actionCopy = 'Try again with a fresh email:';
                return result;
            }
            result.message = 'This confirmation link is expired or already used.';
            result.actionHref = '/login.html';
            result.actionLabel = 'Back to sign in';
            result.actionCopy = 'Return to auth:';
            return result;
        }

        if (/password should be at least|password is too short/.test(text)) {
            result.message = 'Password must be at least 8 characters.';
            return result;
        }

        // OAuth callback fallback. When a sign-in provider hands us back
        // an error we don't specifically match, the raw string is
        // usually unhelpful ("server_error", "access_denied",
        // "interaction_required"). Show a calm message and route the
        // user back to login rather than echoing the protocol code.
        if (context === 'callback') {
            if (/access_denied|cancelled|user_cancelled/.test(text)) {
                result.message = 'Sign-in was cancelled. Try again when you are ready.';
                result.actionHref = '/login.html';
                result.actionLabel = 'Back to sign in';
                result.actionCopy = '';
                return result;
            }
            result.message = 'Sign-in did not complete. We will return you to the login screen.';
            result.actionHref = '/login.html';
            result.actionLabel = 'Back to sign in';
            result.actionCopy = '';
            return result;
        }

        // Last-resort fallback. Keep the raw Supabase string OUT of the
        // user-facing message (it reads as internal architecture
        // language). Offer a recovery move so the user is never stranded.
        result.actionHref = '/login.html';
        result.actionLabel = 'Back to sign in';
        result.actionCopy = 'Start over:';
        return result;
    }

    function renderAction(container, normalized) {
        if (!container) return;
        if (!normalized || !normalized.actionHref || !normalized.actionLabel) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        container.classList.remove('hidden');
        container.innerHTML =
            '<div style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);">' +
            (normalized.actionCopy ? normalized.actionCopy + ' ' : '') +
            '<a href="' + normalized.actionHref + '">' + normalized.actionLabel + '</a>' +
            '</div>';
    }

    window.gtmAuthUi = {
        normalizeError: normalizeAuthError,
        renderAction: renderAction
    };
})();
