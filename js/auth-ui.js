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
        var result = {
            message: raw || 'Something went wrong. Please try again.',
            actionHref: '',
            actionLabel: '',
            actionCopy: ''
        };

        if (!raw) return result;

        if (/timed out|network|failed to fetch|unable to connect|fetch failed|networkerror/.test(text)) {
            result.message = 'Unable to connect. Check your internet connection and try again.';
            return result;
        }

        if (/email rate limit exceeded|over_email_send_rate_limit|rate limit/.test(text) && /email|otp|confirmation|reset/.test(text)) {
            result.message = 'Too many auth emails were requested recently. Wait a minute, then try again.';
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
            result.message = 'Check your inbox and confirm your email before signing in.';
            result.actionHref = '/signup.html';
            result.actionLabel = 'Create account again';
            result.actionCopy = 'Need a fresh confirmation email?';
            return result;
        }

        if (/otp expired|expired|invalid.*token|token.*invalid|link expired|email link is invalid|email link is expired/.test(text)) {
            if (context === 'reset' || context === 'callback') {
                result.message = 'This link is expired, invalid, or already used.';
                result.actionHref = '/forgot-password.html';
                result.actionLabel = 'Request a new link';
                result.actionCopy = 'Try again with a fresh email:';
                return result;
            }
            result.message = 'This confirmation link is expired, invalid, or already used.';
            result.actionHref = '/login.html';
            result.actionLabel = 'Back to sign in';
            result.actionCopy = 'Return to auth:';
            return result;
        }

        if (/password should be at least|password is too short/.test(text)) {
            result.message = 'Password must be at least 8 characters.';
            return result;
        }

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
