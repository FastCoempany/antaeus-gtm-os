import * as Sentry from "@sentry/browser";
import posthog from "posthog-js";

/**
 * Antaeus observability layer — Sentry for errors, Posthog for product analytics.
 *
 * Both init functions are idempotent and safe to call multiple times. They
 * no-op cleanly when their respective env vars are missing (typical during
 * local development without credentials), so tests and dev boots never fail
 * because observability isn't configured.
 *
 * Env vars (set via .env.local for dev; via GitHub Actions + Cloudflare Pages
 * build env for prod):
 *
 *   VITE_SENTRY_DSN       — Sentry project DSN. When unset, Sentry is disabled.
 *   VITE_SENTRY_ENV       — "development" | "staging" | "production". Defaults to "development".
 *   VITE_POSTHOG_API_KEY  — Posthog project API key. When unset, Posthog is disabled.
 *   VITE_POSTHOG_HOST     — Posthog ingest host. Defaults to https://us.i.posthog.com.
 *   VITE_APP_RELEASE      — Release tag to attach to events (usually the git SHA). Optional.
 *
 * See:
 *   deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6 Phase 1.4
 *   .env.example for the full env var set
 */

type ObservabilityStatus = {
    sentry: "initialized" | "skipped-no-dsn" | "already-initialized";
    posthog: "initialized" | "skipped-no-key" | "already-initialized";
};

let sentryInitialized = false;
let posthogInitialized = false;

export function initObservability(): ObservabilityStatus {
    const status = {
        sentry: initSentry(),
        posthog: initPosthog()
    };
    // Fire-and-forget: bridge Supabase auth state → Posthog identify +
    // Sentry user. Sets `email` as a person property so feature-flag
    // filters and cohort analyses can target users by email. Failures
    // are silent (no auth client / no session / etc).
    void bootIdentifyFromAuth();
    return status;
}

function initSentry(): ObservabilityStatus["sentry"] {
    if (sentryInitialized) return "already-initialized";

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return "skipped-no-dsn";

    const environment = import.meta.env.VITE_SENTRY_ENV ?? "development";
    const release = import.meta.env.VITE_APP_RELEASE;

    Sentry.init({
        dsn,
        environment,
        release,
        // Start conservative; per-room code can raise sampleRate when needed.
        tracesSampleRate: environment === "production" ? 0.1 : 1.0,
        // Replay only on errors to control volume + privacy cost.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // Never ship PII through Sentry breadcrumbs or default context.
        sendDefaultPii: false
    });

    sentryInitialized = true;
    return "initialized";
}

function initPosthog(): ObservabilityStatus["posthog"] {
    if (posthogInitialized) return "already-initialized";

    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
    if (!apiKey) return "skipped-no-key";

    const apiHost = import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";

    posthog.init(apiKey, {
        api_host: apiHost,
        // Autocapture is useful for funnel analysis but noisy; opt-in per room.
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        // Session replay: off by default; turn on per-room once we're
        // confident about what we're willing to record.
        disable_session_recording: true,
        // Respect Do Not Track.
        respect_dnt: true
    });

    posthogInitialized = true;
    return "initialized";
}

/**
 * Report a handled error to Sentry. Falls back to console.error when
 * Sentry is not initialized (local dev, tests).
 *
 * Non-Error values (e.g. Supabase returns plain objects with {message,
 * code, hint, details}) are wrapped in a real Error instance before being
 * captured — otherwise Sentry emits a generic "Object captured as exception
 * with keys: ..." placeholder instead of a useful title + stack trace.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
    const wrapped = error instanceof Error ? error : wrapAsError(error);
    if (!sentryInitialized) {
        console.error("[observability] reportError (sentry disabled):", wrapped, context);
        return;
    }
    Sentry.captureException(wrapped, context ? { extra: context } : undefined);
}

function wrapAsError(value: unknown): Error {
    if (value === null || value === undefined) {
        return new Error("unknown error");
    }
    if (typeof value === "string") {
        return new Error(value);
    }
    if (typeof value === "object") {
        const v = value as Record<string, unknown>;
        const parts: string[] = [];
        if (typeof v.message === "string") parts.push(v.message);
        if (typeof v.code === "string" || typeof v.code === "number") {
            parts.push(`(code: ${v.code})`);
        }
        if (typeof v.hint === "string") parts.push(`hint: ${v.hint}`);
        if (typeof v.details === "string") parts.push(`details: ${v.details}`);
        const msg = parts.length > 0 ? parts.join(" ") : "non-Error object thrown";
        const e = new Error(msg);
        // Preserve the original as a `cause` so Sentry shows the original
        // object as a secondary context.
        (e as Error & { cause?: unknown }).cause = value;
        return e;
    }
    return new Error(String(value));
}

/**
 * Track a product event in Posthog. No-op when Posthog is not initialized.
 * Event names use snake_case by convention (e.g., "deal_stage_advanced").
 */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!posthogInitialized) return;
    posthog.capture(name, properties);
}

/**
 * Identify the current user after auth. Called once per session after
 * login, and again on user-update events. `userId` must be the stable
 * Supabase auth UID, not an email.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
    if (posthogInitialized) {
        posthog.identify(userId, traits);
    }
    if (sentryInitialized) {
        Sentry.setUser({ id: userId });
    }
}

/**
 * Clear user identity on sign-out.
 */
export function clearUser(): void {
    if (posthogInitialized) posthog.reset();
    if (sentryInitialized) Sentry.setUser(null);
}

// For feature flags (Phase 3+ rolling migration).
export function isFeatureEnabled(flagKey: string): boolean {
    if (flagKey.endsWith("_legacy")) {
        // E2E per-test override: force the NEW surfaces even inside the
        // force-legacy build. The new-surface seam walks navigate room-to-
        // room by click, so a URL param can't follow them — instead they
        // set sessionStorage.gtmos_e2e_force_new via an init script, and
        // this wins over the build-level force-legacy below. sessionStorage
        // (not localStorage) so the `?demo=1` localStorage namespace shim
        // doesn't hide it, and it survives same-origin click navigations
        // within the tab. Inert in production (the key is never set, and
        // forcing a `_legacy` flag false there just keeps the new surface,
        // which is already the default).
        try {
            if (
                typeof sessionStorage !== "undefined" &&
                sessionStorage.getItem("gtmos_e2e_force_new") === "1"
            ) {
                return false;
            }
        } catch {
            // sessionStorage unavailable — fall through.
        }
        // E2E builds otherwise force the per-room legacy surfaces. The
        // legacy walk + boot suites were written against them, and they
        // remain shipped as each room's safety net (the new design-system
        // surface is the production default). VITE_E2E_FORCE_LEGACY=1 (set
        // only by `npm run test:e2e`) turns every `room_*_legacy` kill-
        // switch ON so the gates resolve to legacy. Inert in production.
        if (import.meta.env.VITE_E2E_FORCE_LEGACY === "1") {
            return true;
        }
    }
    if (!posthogInitialized) return false;
    return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Subscribe to Posthog flag-load / flag-update events. Returns an unsubscribe
 * function. The callback fires once flags are first loaded and again whenever
 * the user's flags change (e.g. after identify()).
 *
 * Needed by UIs that render flag-dependent controls on mount — Posthog's flag
 * fetch is async after init(), so a first-paint `isFeatureEnabled()` call
 * returns the default (false) until the fetch completes.
 */
export function onFeatureFlagsReady(callback: () => void): () => void {
    if (!posthogInitialized) {
        // Posthog is not initialized; the callback will never fire. Return a
        // no-op unsubscribe so callers don't need to branch.
        return () => undefined;
    }
    return posthog.onFeatureFlags(callback);
}

// ─── Auth → identify bridge ────────────────────────────────────────────
//
// Posthog and Sentry are most useful when they know WHO a session belongs
// to. Without identify, every flag filter degrades to "all users 100%",
// every cohort analysis is anonymous, and Sentry errors can't be grouped
// per-user. This bridge listens for Supabase auth state changes and
// translates them into identifyUser / clearUser calls.
//
// Triggered automatically by initObservability(). No room-level wiring
// needed.

/**
 * Subscribe to Supabase auth state changes + identify the current
 * session if any. Fire-and-forget; failures are silent. Idempotent —
 * the subscription is set up once per page load, mirroring posthog +
 * sentry's one-init-per-load contract.
 *
 * Why dynamic-import the supabase-client: keeps observability.ts from
 * statically depending on Supabase env vars. Rooms without auth (the
 * static landing page, etc.) still call initObservability() cleanly.
 */
let identifyBridgeMounted = false;

async function bootIdentifyFromAuth(): Promise<void> {
    if (identifyBridgeMounted) return;
    if (!posthogInitialized && !sentryInitialized) return;
    try {
        const mod = await import("./supabase-client");
        const client = mod.getSupabaseClient();
        identifyBridgeMounted = true;

        // Handle the current session (page refresh keeps the JWT).
        const { data } = await client.auth.getSession();
        if (data.session?.user) {
            identifyFromUser(data.session.user);
        }

        // Subscribe to subsequent changes (sign-in, sign-out, token
        // refresh — all flow through this listener).
        client.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                if (session?.user) identifyFromUser(session.user);
            } else if (event === "SIGNED_OUT") {
                clearUser();
            }
        });
    } catch {
        // Supabase env vars missing, or client init failed. Silent —
        // analytics work fine without identify, just anonymous.
    }
}

/**
 * Identify the current user across Posthog + Sentry, deriving the
 * email + workspace info from the Supabase auth user record.
 */
function identifyFromUser(user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
}): void {
    const traits: Record<string, unknown> = {};
    if (user.email) traits.email = user.email;
    // Surface user_metadata fields if present (set during sign-up flow).
    if (user.user_metadata) {
        const meta = user.user_metadata;
        if (typeof meta.full_name === "string") traits.name = meta.full_name;
        if (typeof meta.workspace_id === "string") {
            traits.workspace_id = meta.workspace_id;
        }
    }
    identifyUser(user.id, traits);
}

/**
 * Test-only — read the bridge-mounted flag. Tests reset between cases.
 */
export function __isIdentifyBridgeMountedForTests(): boolean {
    return identifyBridgeMounted;
}

/**
 * Test-only — reset the bridge state between cases.
 */
export function __resetIdentifyBridgeForTests(): void {
    identifyBridgeMounted = false;
}
