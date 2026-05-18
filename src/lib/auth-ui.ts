/**
 * Auth-UX normalization helpers (typed port of js/auth-ui.js).
 *
 * Phase 3 — Auth-UX standalone hardening (canon Part V §7 phase
 * plan). Moves the auth error → operator-voice translation out of
 * the legacy vanilla-JS file into a typed module so:
 *
 *   1. The 10 branches in `normalizeAuthError` are typechecked,
 *      reducing the risk of a future contributor adding a branch
 *      that doesn't return the canonical shape.
 *   2. A vitest suite can exhaustively cover every code path — the
 *      legacy file has zero tests despite handling the most
 *      user-visible failure surface in the product.
 *   3. Future Preact-stack consumers (auth modal, in-room session-
 *      expired banner) import this module directly instead of
 *      depending on the window.gtmAuthUi global.
 *
 * The legacy `js/auth-ui.js` MUST stay in lockstep with this module
 * until the static auth HTML pages migrate to the Preact stack
 * (planned for Phase 5 — Static public face). A comment in the JS
 * file points back here as the canonical source.
 *
 * Per canon Part II §4.7 (Trust Annex): error copy is "calm,
 * trustworthy, plainspoken." We deliberately don't echo the raw
 * Supabase error string unless we couldn't find a specific match —
 * those strings leak internal architecture language ("JWT", "PKCE",
 * "grant_type") which violates the Trust Annex laws.
 */

/**
 * What kind of auth flow the error happened in. Drives some
 * branch decisions (e.g. expired-link copy differs for password-
 * reset vs sign-up confirmation).
 */
export type AuthContext =
    | "login"
    | "signup"
    | "callback"
    | "reset"
    | "reset-request";

/**
 * Normalized error result. Every branch in `normalizeAuthError`
 * returns this shape; the renderer can always trust the presence of
 * `message` and conditionally render an action.
 */
export interface NormalizedAuthError {
    readonly message: string;
    /** Path to navigate to. Empty = no action affordance. */
    readonly actionHref: string;
    /** Label for the action link/button. */
    readonly actionLabel: string;
    /** Optional preface ("Need a fresh password? " etc.). */
    readonly actionCopy: string;
}

const EMPTY_RESULT: NormalizedAuthError = {
    message: "Something stopped that from working. Please try again.",
    actionHref: "",
    actionLabel: "",
    actionCopy: ""
};

function getMessageText(error: unknown): string {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null) {
        const obj = error as {
            message?: unknown;
            error_description?: unknown;
            description?: unknown;
        };
        const raw =
            obj.message ??
            obj.error_description ??
            obj.description ??
            "";
        return String(raw).trim();
    }
    return "";
}

/**
 * Translate an arbitrary auth error into operator-voice copy +
 * (optionally) a recovery action. Never throws; on unrecognized
 * input returns a calm default with a "Back to sign in" action so
 * the user is never stranded.
 */
export function normalizeAuthError(
    error: unknown,
    context?: AuthContext
): NormalizedAuthError {
    const raw = getMessageText(error);
    const text = raw.toLowerCase();

    // No error info at all → calm default + recovery move.
    if (!raw) {
        return {
            ...EMPTY_RESULT,
            actionHref: "/login.html",
            actionLabel: "Back to sign in",
            actionCopy: "Start over:"
        };
    }

    // Network / connectivity / timeout.
    if (
        /timed out|network|failed to fetch|unable to connect|fetch failed|networkerror/.test(
            text
        )
    ) {
        return {
            ...EMPTY_RESULT,
            message:
                "We could not reach the workspace just now. Check your connection and try again."
        };
    }

    // Session expired / refresh failures.
    if (
        /jwt expired|invalid refresh token|refresh token not found|session_not_found|session not found|user from sub claim|missing session|no session/.test(
            text
        )
    ) {
        return {
            ...EMPTY_RESULT,
            message:
                "Your session timed out. Sign in again to pick up where you left off.",
            actionHref: "/login.html",
            actionLabel: "Sign in"
        };
    }

    // Email rate-limit (only when the error is actually about emails).
    if (
        /email rate limit exceeded|over_email_send_rate_limit|rate limit/.test(
            text
        ) &&
        /email|otp|confirmation|reset/.test(text)
    ) {
        return {
            ...EMPTY_RESULT,
            message:
                "Too many auth emails were requested in a short window. Wait a minute, then try again."
        };
    }

    // Account already exists (signup attempt).
    if (
        /user already registered|account with this email already exists|email already in use|already exists|already registered/.test(
            text
        )
    ) {
        return {
            ...EMPTY_RESULT,
            message: "An account with this email already exists.",
            actionHref: "/login.html",
            actionLabel: "Sign in instead",
            actionCopy: "Already have an account?"
        };
    }

    // Invalid login credentials.
    if (
        /invalid login credentials|invalid email or password|invalid_credentials/.test(
            text
        )
    ) {
        return {
            ...EMPTY_RESULT,
            message: "That email and password combination did not work.",
            actionHref: "/forgot-password.html",
            actionLabel: "Reset password",
            actionCopy: "Need a new password?"
        };
    }

    // Email not yet confirmed.
    if (/email not confirmed|signup disabled|not_confirmed/.test(text)) {
        return {
            ...EMPTY_RESULT,
            message:
                "Confirm your email before signing in — the link is in the inbox we just sent to.",
            actionHref: "/signup.html",
            actionLabel: "Resend confirmation",
            actionCopy: "Need a fresh confirmation email?"
        };
    }

    // Expired / invalid token (link clicks).
    if (
        /otp expired|expired|invalid.*token|token.*invalid|link expired|email link is invalid|email link is expired/.test(
            text
        )
    ) {
        if (context === "reset" || context === "callback") {
            return {
                ...EMPTY_RESULT,
                message:
                    "This link is expired or already used. Request a fresh one to continue.",
                actionHref: "/forgot-password.html",
                actionLabel: "Request a new link",
                actionCopy: "Try again with a fresh email:"
            };
        }
        return {
            ...EMPTY_RESULT,
            message: "This confirmation link is expired or already used.",
            actionHref: "/login.html",
            actionLabel: "Back to sign in",
            actionCopy: "Return to auth:"
        };
    }

    // Password too short.
    if (/password should be at least|password is too short/.test(text)) {
        return {
            ...EMPTY_RESULT,
            message: "Password must be at least 8 characters."
        };
    }

    // OAuth callback fallback.
    if (context === "callback") {
        if (/access_denied|cancelled|user_cancelled/.test(text)) {
            return {
                ...EMPTY_RESULT,
                message: "Sign-in was cancelled. Try again when you are ready.",
                actionHref: "/login.html",
                actionLabel: "Back to sign in"
            };
        }
        return {
            ...EMPTY_RESULT,
            message:
                "Sign-in did not complete. We will return you to the login screen.",
            actionHref: "/login.html",
            actionLabel: "Back to sign in"
        };
    }

    // Last-resort fallback — keep the raw Supabase string OUT of the
    // user-facing message (architecture language). Offer recovery
    // move so the user is never stranded.
    return {
        ...EMPTY_RESULT,
        actionHref: "/login.html",
        actionLabel: "Back to sign in",
        actionCopy: "Start over:"
    };
}

/**
 * Promise-wrap with a timeout so a hanging Supabase request never
 * leaves the operator staring at a spinner forever. Default 10s
 * matches the existing login.html behavior; signup.html uses 8s
 * for the getSession check.
 *
 * Phase 3 — extracted from the duplicated copies in login.html,
 * signup.html, forgot-password.html, reset-password.html, and
 * auth/callback/index.html. Static pages keep their inline copies
 * for now (cross-bundle plumbing is Phase 5); Preact consumers
 * import this directly.
 */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage = "Request timed out. Please check your internet connection and try again."
): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (timer !== null) clearTimeout(timer);
    }) as Promise<T>;
}
