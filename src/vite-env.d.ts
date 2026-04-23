/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Sentry project DSN. When unset, Sentry init no-ops cleanly. */
    readonly VITE_SENTRY_DSN?: string;
    /** Sentry environment tag: "development" | "staging" | "production". */
    readonly VITE_SENTRY_ENV?: string;

    /** Posthog project API key. When unset, Posthog init no-ops cleanly. */
    readonly VITE_POSTHOG_API_KEY?: string;
    /** Posthog ingest host. Defaults to https://us.i.posthog.com. */
    readonly VITE_POSTHOG_HOST?: string;

    /** Release tag (usually git SHA) attached to Sentry events for per-release grouping. */
    readonly VITE_APP_RELEASE?: string;

    /** Supabase project URL. Phase 2 introduces this. */
    readonly VITE_SUPABASE_URL?: string;
    /** Supabase anon key. Phase 2 introduces this. Safe for client bundle (row-level-security policies protect data). */
    readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
