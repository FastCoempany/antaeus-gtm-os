import type { Browser, BrowserContext } from "@playwright/test";
import type { TestUser } from "./realtime-supabase";

/**
 * Playwright auth-context helpers for the @realtime suite.
 *
 * The Antaeus Supabase client (src/lib/supabase-client.ts) stores its
 * session in localStorage under the key `antaeus-auth-token` (matches
 * the legacy app's storage key so the new + legacy stacks share
 * auth). The `@supabase/supabase-js` v2 storage format is a JSON
 * object containing `access_token`, `refresh_token`, `expires_at`,
 * `expires_in`, `token_type`, and a nested `user` object.
 *
 * This helper builds that JSON for a given TestUser and pre-loads it
 * into a fresh browser context so the page boots already-signed-in.
 * No sign-in UI flow needed — the test is testing realtime, not auth.
 *
 * Why a fresh context per test: cookies + localStorage from one test
 * shouldn't leak into another (e.g. token from a deleted user). Each
 * test gets its own context that's disposed in afterAll.
 */

const AUTH_STORAGE_KEY = "antaeus-auth-token";

/**
 * Create a Playwright browser context with the test user already
 * signed in. The context's localStorage carries the Supabase session
 * shape so the room's auth flow finds it on boot.
 *
 * Caller is responsible for `await ctx.close()` in afterAll.
 */
export async function createSignedInContext(
    browser: Browser,
    user: TestUser
): Promise<BrowserContext> {
    const ctx = await browser.newContext();

    // Build the session blob in the exact shape the supabase-js v2
    // storage adapter expects. `expires_at` is unix-seconds; we add
    // 1 hour from now to keep the session valid for the test duration.
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const sessionBlob = {
        access_token: user.accessToken,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: expiresAt,
        refresh_token: user.refreshToken,
        user: {
            id: user.id,
            aud: "authenticated",
            email: user.email,
            role: "authenticated"
        }
    };

    // addInitScript runs on EVERY page navigation in this context.
    // Setting localStorage from origin context here is the canonical
    // Playwright pattern for pre-seeded auth.
    await ctx.addInitScript(
        ({ key, blob }) => {
            try {
                window.localStorage.setItem(key, JSON.stringify(blob));
            } catch {
                // private mode / quota — test will fail at sign-in
                // assertion if so; no need to handle here.
            }
        },
        { key: AUTH_STORAGE_KEY, blob: sessionBlob }
    );

    return ctx;
}
