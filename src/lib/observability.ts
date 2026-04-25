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
    return {
        sentry: initSentry(),
        posthog: initPosthog()
    };
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
