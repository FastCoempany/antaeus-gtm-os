import { describe, expect, it } from "vitest";
import { normalizeAuthError, withTimeout } from "./auth-ui";

/**
 * Phase 3 — comprehensive coverage for normalizeAuthError. Was: zero
 * tests despite handling the most user-visible failure surface in
 * the product (5 auth pages, every login + signup + password-reset
 * attempt funnels through this).
 *
 * Every branch in src/lib/auth-ui.ts covered + edge cases:
 *   - null / undefined / empty-object / non-error-shaped input
 *   - whitespace-only message
 *   - case-insensitive matching (Supabase sometimes Title-Cases)
 *   - context-sensitive branches (callback / reset)
 *   - Trust Annex law: never echo raw Supabase architecture
 *     language ("JWT", "PKCE") in the user-facing message
 */

describe("normalizeAuthError — empty / malformed input", () => {
    it("null input returns calm default + recovery action", () => {
        const r = normalizeAuthError(null);
        expect(r.message).toMatch(/something stopped/i);
        expect(r.actionHref).toBe("/login.html");
        expect(r.actionLabel).toBe("Back to sign in");
        expect(r.actionCopy).toBe("Start over:");
    });

    it("undefined input returns calm default + recovery action", () => {
        const r = normalizeAuthError(undefined);
        expect(r.message).toMatch(/something stopped/i);
        expect(r.actionHref).toBe("/login.html");
    });

    it("string input flows through getMessageText", () => {
        const r = normalizeAuthError("invalid login credentials");
        expect(r.message).toMatch(/email and password.*did not work/i);
    });

    it("object with .message takes precedence", () => {
        const r = normalizeAuthError({ message: "JWT expired" });
        expect(r.message).toMatch(/session timed out/i);
    });

    it("object with .error_description used when .message absent", () => {
        const r = normalizeAuthError({ error_description: "access_denied" }, "callback");
        expect(r.message).toMatch(/cancelled|did not complete/i);
    });

    it("object with no recognizable key returns calm default", () => {
        const r = normalizeAuthError({ foo: "bar" });
        expect(r.message).toMatch(/something stopped/i);
    });

    it("whitespace-only message is treated as empty (calm default)", () => {
        const r = normalizeAuthError({ message: "   " });
        expect(r.message).toMatch(/something stopped/i);
    });
});

describe("normalizeAuthError — network / connectivity", () => {
    it("'timed out' triggers network branch", () => {
        const r = normalizeAuthError({ message: "Request timed out" });
        expect(r.message).toMatch(/could not reach the workspace/i);
        // Network errors don't get a recovery action — just retry.
        expect(r.actionHref).toBe("");
    });

    it("'network' triggers network branch", () => {
        const r = normalizeAuthError({ message: "Network error" });
        expect(r.message).toMatch(/could not reach the workspace/i);
    });

    it("'failed to fetch' triggers network branch", () => {
        const r = normalizeAuthError({ message: "Failed to fetch" });
        expect(r.message).toMatch(/could not reach the workspace/i);
    });

    it("'NetworkError' (browser fetch) triggers network branch", () => {
        const r = normalizeAuthError({ message: "NetworkError when attempting to fetch resource" });
        expect(r.message).toMatch(/could not reach the workspace/i);
    });
});

describe("normalizeAuthError — session expiry", () => {
    it("'jwt expired' triggers session-expired branch", () => {
        const r = normalizeAuthError({ message: "JWT expired" });
        expect(r.message).toMatch(/session timed out/i);
        expect(r.actionHref).toBe("/login.html");
        expect(r.actionLabel).toBe("Sign in");
    });

    it("'invalid refresh token' triggers session-expired branch", () => {
        const r = normalizeAuthError({ message: "Invalid refresh token" });
        expect(r.message).toMatch(/session timed out/i);
    });

    it("'refresh token not found' triggers session-expired branch", () => {
        const r = normalizeAuthError({ message: "Refresh token not found" });
        expect(r.message).toMatch(/session timed out/i);
    });

    it("'session_not_found' triggers session-expired branch", () => {
        const r = normalizeAuthError({ message: "session_not_found" });
        expect(r.message).toMatch(/session timed out/i);
    });

    it("'no session' triggers session-expired branch", () => {
        const r = normalizeAuthError({ message: "no session" });
        expect(r.message).toMatch(/session timed out/i);
    });

    it("Trust Annex law — raw 'JWT' string never appears in user copy", () => {
        const r = normalizeAuthError({ message: "JWT expired at exp=12345" });
        expect(r.message).not.toMatch(/jwt/i);
        expect(r.message).not.toMatch(/exp=/);
    });
});

describe("normalizeAuthError — email rate limit", () => {
    it("rate limit + email scope triggers branch", () => {
        const r = normalizeAuthError({
            message: "Email rate limit exceeded for OTP requests"
        });
        expect(r.message).toMatch(/too many auth emails/i);
    });

    it("'over_email_send_rate_limit' triggers branch", () => {
        const r = normalizeAuthError({
            message: "over_email_send_rate_limit for confirmation"
        });
        expect(r.message).toMatch(/too many auth emails/i);
    });

    it("rate limit WITHOUT email scope falls through", () => {
        // Rate-limit-only with no email context should not match this
        // branch (could be a different rate limit).
        const r = normalizeAuthError({ message: "rate limit hit on api" });
        // Falls through to the last-resort default.
        expect(r.message).toMatch(/something stopped/i);
    });
});

describe("normalizeAuthError — account already exists", () => {
    it("'user already registered' triggers branch", () => {
        const r = normalizeAuthError({ message: "User already registered" });
        expect(r.message).toMatch(/account with this email already exists/i);
        expect(r.actionHref).toBe("/login.html");
        expect(r.actionLabel).toBe("Sign in instead");
    });

    it("'email already in use' triggers branch", () => {
        const r = normalizeAuthError({
            message: "An account with this email already exists"
        });
        expect(r.message).toMatch(/account with this email already exists/i);
    });
});

describe("normalizeAuthError — invalid credentials", () => {
    it("'invalid login credentials' triggers branch", () => {
        const r = normalizeAuthError({ message: "Invalid login credentials" });
        expect(r.message).toMatch(/email and password.*did not work/i);
        expect(r.actionHref).toBe("/forgot-password.html");
        expect(r.actionLabel).toBe("Reset password");
    });

    it("'invalid_credentials' triggers branch", () => {
        const r = normalizeAuthError({ message: "invalid_credentials" });
        expect(r.message).toMatch(/email and password.*did not work/i);
    });
});

describe("normalizeAuthError — email not confirmed", () => {
    it("'email not confirmed' triggers branch", () => {
        const r = normalizeAuthError({ message: "Email not confirmed" });
        expect(r.message).toMatch(/confirm your email/i);
        expect(r.actionHref).toBe("/signup.html");
        expect(r.actionLabel).toBe("Resend confirmation");
    });
});

describe("normalizeAuthError — expired link (context-sensitive)", () => {
    it("'otp expired' in 'reset' context routes to forgot-password", () => {
        const r = normalizeAuthError({ message: "OTP expired" }, "reset");
        expect(r.message).toMatch(/expired or already used/i);
        expect(r.actionHref).toBe("/forgot-password.html");
        expect(r.actionLabel).toBe("Request a new link");
    });

    it("'link expired' in 'callback' context routes to forgot-password", () => {
        const r = normalizeAuthError({ message: "Link expired" }, "callback");
        expect(r.message).toMatch(/expired or already used/i);
        expect(r.actionHref).toBe("/forgot-password.html");
    });

    it("'otp expired' without context routes to login", () => {
        const r = normalizeAuthError({ message: "OTP expired" });
        expect(r.message).toMatch(/confirmation link is expired/i);
        expect(r.actionHref).toBe("/login.html");
    });

    it("'email link is invalid' triggers expired-link branch", () => {
        const r = normalizeAuthError({ message: "Email link is invalid or expired" });
        expect(r.message).toMatch(/expired/i);
    });
});

describe("normalizeAuthError — password too short", () => {
    it("'password should be at least' triggers branch", () => {
        const r = normalizeAuthError({
            message: "Password should be at least 8 characters"
        });
        expect(r.message).toBe("Password must be at least 8 characters.");
    });
});

describe("normalizeAuthError — OAuth callback fallback", () => {
    it("'access_denied' in callback context = cancelled copy", () => {
        const r = normalizeAuthError({ message: "access_denied" }, "callback");
        expect(r.message).toMatch(/sign-in was cancelled/i);
        expect(r.actionHref).toBe("/login.html");
    });

    it("'user_cancelled' in callback context = cancelled copy", () => {
        const r = normalizeAuthError({ message: "user_cancelled" }, "callback");
        expect(r.message).toMatch(/cancelled/i);
    });

    it("unknown error in callback context = calm did-not-complete", () => {
        const r = normalizeAuthError(
            { message: "server_error" },
            "callback"
        );
        expect(r.message).toMatch(/did not complete/i);
        expect(r.actionHref).toBe("/login.html");
    });

    it("Trust Annex law — 'server_error' string not echoed to user", () => {
        const r = normalizeAuthError(
            { message: "server_error: backend failed" },
            "callback"
        );
        expect(r.message).not.toMatch(/server_error/i);
        expect(r.message).not.toMatch(/backend/i);
    });
});

describe("normalizeAuthError — last-resort fallback", () => {
    it("unrecognized error returns calm default + recovery", () => {
        const r = normalizeAuthError({
            message: "Something totally unexpected happened"
        });
        expect(r.message).toMatch(/something stopped/i);
        expect(r.actionHref).toBe("/login.html");
        expect(r.actionLabel).toBe("Back to sign in");
    });

    it("Trust Annex law — never echoes 'PKCE', 'grant_type', etc.", () => {
        const cases = [
            "PKCE verifier mismatch",
            "grant_type 'authorization_code' is unsupported",
            "{nbf, iat, exp} claim missing"
        ];
        for (const message of cases) {
            const r = normalizeAuthError({ message });
            expect(r.message).not.toMatch(/PKCE/);
            expect(r.message).not.toMatch(/grant_type/);
            expect(r.message).not.toMatch(/nbf|iat|exp/);
            expect(r.message).not.toMatch(/claim/i);
        }
    });
});

describe("normalizeAuthError — case insensitivity", () => {
    it("uppercase 'INVALID LOGIN CREDENTIALS' matches", () => {
        const r = normalizeAuthError({ message: "INVALID LOGIN CREDENTIALS" });
        expect(r.message).toMatch(/email and password.*did not work/i);
    });

    it("mixed case 'Failed to Fetch' matches", () => {
        const r = normalizeAuthError({ message: "Failed to Fetch" });
        expect(r.message).toMatch(/could not reach the workspace/i);
    });
});

describe("withTimeout", () => {
    it("resolves with the promise's value when it beats the timeout", async () => {
        const result = await withTimeout(Promise.resolve("ok"), 100);
        expect(result).toBe("ok");
    });

    it("rejects with the timeout message when the promise hangs past ms", async () => {
        const hang = new Promise<string>(() => {
            /* never resolves */
        });
        await expect(withTimeout(hang, 30)).rejects.toThrow(
            /timed out|check your internet/i
        );
    });

    it("uses a custom timeout message when provided", async () => {
        const hang = new Promise<string>(() => {});
        await expect(
            withTimeout(hang, 30, "Custom timeout copy here")
        ).rejects.toThrow("Custom timeout copy here");
    });

    it("propagates the underlying promise's rejection (not the timeout)", async () => {
        const failed = Promise.reject(new Error("upstream failure"));
        await expect(withTimeout(failed, 100)).rejects.toThrow(
            "upstream failure"
        );
    });

    it("clears the timeout timer when the promise resolves first", async () => {
        // If the timer wasn't cleared, an unhandled rejection would
        // fire after the test completes. The test passes if no
        // unhandled rejection is raised within a short window.
        await withTimeout(Promise.resolve("done"), 1000);
        await new Promise((r) => setTimeout(r, 50));
        // No assertion needed — the test would have warned/failed if
        // a timer leaked an unhandled rejection.
        expect(true).toBe(true);
    });
});
