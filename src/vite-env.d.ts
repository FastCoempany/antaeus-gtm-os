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

    /**
     * Environment tag for the app as a whole: "production" | "preview" | "development".
     * Set via Cloudflare Workers Builds Variables with different values for Production
     * (main branch) vs Preview (feature branches). Used by in-app surfaces like the
     * data-migration page to make the target environment legible before destructive
     * actions. Separate from VITE_SENTRY_ENV so the two can diverge if needed.
     */
    readonly VITE_APP_ENV?: string;

    /**
     * Set to "1" only by the e2e build (npm run test:e2e) to force every
     * room's gate onto the legacy surface — the Playwright walk suite was
     * written against the legacy surfaces, which remain shipped as each
     * room's safety net. Unset in the production build, so production
     * serves the new design-system surfaces.
     */
    readonly VITE_E2E_FORCE_LEGACY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
