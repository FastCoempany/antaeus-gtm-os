import { reportError, trackEvent } from "@/lib/observability";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Account, Signal } from "./types";

/**
 * Enrichment server client.
 *
 * Calls the `enrichment-server/` Node service (POST /enrich) with
 * `{ name, domain, industry, sector, ticker }` and gets back:
 *   {
 *     name, domain, info: { industry, sector, employees, hq, ... },
 *     signals: [{ id, cat, headline, source_name, ... }],
 *     heat, enrichedAt, elapsed
 *   }
 *
 * The legacy room had this wired; the new room (Phase 4 / Room 3 /
 * PR #13, 2026-04-26) shipped without it — operators bounced back to
 * the legacy room to enrich, then back to the new room to act. The
 * legacy room was retired in PR #45 (2026-05-01) so this gap has been
 * open ever since. Step 3 closes it.
 *
 * URL resolution chain (matches legacy `js/supabase-config.js`):
 *   1. window.__ANTAEUS_ENRICHMENT_BASE_URL__ (runtime override)
 *   2. localStorage.gtmos_enrichment_base_url (manual override)
 *   3. http://localhost:3001 on localhost (local dev server)
 *   4. https://enrich.antaeus.app (production default)
 *
 * Auth: Supabase JWT in the Authorization header when REQUIRE_SUPABASE_AUTH
 * is on at the server (the production deployment). Pulled from the
 * shared Supabase client's current session.
 *
 * Ref: enrichment-server/README.md
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Site 7"
 */

const DEFAULT_PROD_URL = "https://enrich.antaeus.app";
const DEFAULT_LOCAL_URL = "http://localhost:3001";

/**
 * Resolve the enrichment server base URL from the resolution chain.
 * Pure-ish — reads window + localStorage but never mutates them. SSR-safe
 * (returns the prod default when window is undefined).
 */
export function resolveEnrichmentBaseUrl(): string {
    if (typeof window === "undefined") return DEFAULT_PROD_URL;
    const runtime = (window as unknown as Record<string, unknown>)
        .__ANTAEUS_ENRICHMENT_BASE_URL__;
    if (typeof runtime === "string" && runtime.length > 0) {
        return stripTrailingSlash(runtime);
    }
    try {
        const stored = window.localStorage?.getItem("gtmos_enrichment_base_url");
        if (typeof stored === "string" && stored.length > 0) {
            return stripTrailingSlash(stored);
        }
    } catch {
        // localStorage unavailable (private mode, etc.) — ignore.
    }
    const host = window.location?.hostname ?? "";
    if (host === "localhost" || host === "127.0.0.1") {
        return DEFAULT_LOCAL_URL;
    }
    return DEFAULT_PROD_URL;
}

function stripTrailingSlash(s: string): string {
    return s.endsWith("/") ? s.slice(0, -1) : s;
}

// ─── Response shapes (server-side) ─────────────────────────────────────

/**
 * Shape returned by `enrichment-server/enrich-server.js POST /enrich`.
 * `info` + `signals` carry the enrichment payload; everything else is
 * either debug metadata or per-request identity.
 */
export interface EnrichmentResponse {
    name: string;
    domain: string | null;
    info: EnrichmentCompanyInfo;
    signals: ReadonlyArray<EnrichmentSignal>;
    heat?: number;
    enrichedAt: string;
    elapsed?: string;
}

export interface EnrichmentCompanyInfo {
    industry?: string;
    sector?: string;
    revenue?: string;
    employees?: string;
    hq?: string;
    description?: string;
}

/**
 * Raw signal shape from the enrichment server. NOT the in-memory
 * Signal type — translate via {@link enrichmentSignalToSignal} before
 * mutating room state.
 */
export interface EnrichmentSignal {
    readonly id: string;
    readonly cat?: string;
    readonly headline?: string;
    readonly detail?: string;
    readonly why_it_matters?: string;
    readonly why?: string;
    readonly source_name?: string;
    readonly source_type?: string;
    readonly lane?: string;
    readonly published_date?: string;
    readonly confidence?: number;
    readonly url?: string;
    readonly is_ai?: boolean;
    readonly status?: string;
    readonly fetched_at?: string;
}

// ─── Server → in-memory translation ────────────────────────────────────

/**
 * Translate one server signal into the in-memory Signal shape. Drops
 * fields the room doesn't render (`detail`, `why_it_matters`, etc.)
 * — those land in the cloud row's `data` jsonb blob via the bridge
 * write path if we re-derive them from `note` or similar, but we
 * don't carry them in-memory.
 */
export function enrichmentSignalToSignal(
    raw: EnrichmentSignal,
    now: string = new Date().toISOString()
): Signal {
    const headline = raw.headline?.trim() || "Untitled signal";
    return {
        id: raw.id,
        ...(raw.cat ? { cat: raw.cat, type: raw.cat } : {}),
        headline,
        ...(raw.source_name ? { source: raw.source_name } : {}),
        ...(raw.url ? { url: raw.url } : {}),
        ...(raw.published_date ? { published_date: raw.published_date } : {}),
        ...(raw.fetched_at ? { fetched_at: raw.fetched_at } : { fetched_at: now }),
        ...(typeof raw.confidence === "number"
            ? { confidence: raw.confidence }
            : {}),
        ...(raw.is_ai === true ? { is_ai: true } : {}),
        ...(raw.status ? { status: raw.status } : {}),
        // Compose note from detail / why_it_matters so the operator
        // sees the reasoning when they hover/click into a card.
        ...(raw.detail || raw.why_it_matters
            ? { note: composeNote(raw) }
            : {})
    };
}

function composeNote(raw: EnrichmentSignal): string {
    const parts: string[] = [];
    if (raw.detail) parts.push(raw.detail.trim());
    const why = raw.why_it_matters || raw.why;
    if (why && why !== raw.detail) parts.push(why.trim());
    return parts.join(" — ");
}

export function enrichmentSignalsToSignals(
    raws: ReadonlyArray<EnrichmentSignal>,
    now: string = new Date().toISOString()
): ReadonlyArray<Signal> {
    return raws.map((r) => enrichmentSignalToSignal(r, now));
}

/**
 * Build the patch fields for `Account` that the enrichment response
 * implies. Returns only the keys we want to write — caller spreads
 * onto the existing account.
 *
 * `"Unknown"` is the server's "no data" sentinel; we treat it as
 * absent and don't overwrite existing operator-entered values.
 */
export function enrichmentResponseToAccountPatch(
    response: EnrichmentResponse
): Partial<Account> {
    const patch: { -readonly [K in keyof Account]?: Account[K] } = {
        enrichedAt: response.enrichedAt
    };
    if (response.domain && response.domain !== "Unknown") {
        patch.domain = response.domain;
    }
    const info = response.info ?? {};
    if (info.industry && info.industry !== "Unknown") {
        patch.industry = info.industry;
    }
    if (info.employees && info.employees !== "Unknown") {
        patch.employees = info.employees;
    }
    if (info.hq && info.hq !== "Unknown") {
        patch.hq = info.hq;
    }
    return patch;
}

// ─── Enrich call ───────────────────────────────────────────────────────

export interface EnrichOptions {
    /** Override the resolved base URL (test-only / power-user override). */
    readonly baseUrl?: string;
    /**
     * Optional AbortSignal so callers can cancel a long-running enrich
     * (the server can take 30-90s on a cold cache).
     */
    readonly signal?: AbortSignal;
}

/**
 * Result of {@link enrichAccount}. Distinguishes the three terminal
 * states the room cares about: success, abort, error.
 */
export type EnrichResult =
    | { readonly status: "ok"; readonly response: EnrichmentResponse }
    | { readonly status: "aborted" }
    | { readonly status: "error"; readonly message: string };

/**
 * Resolve the current Supabase session's JWT for the Authorization
 * header. Returns null when no session is active (REQUIRE_SUPABASE_AUTH
 * is off in dev / local server doesn't enforce it). Catches all errors —
 * an auth lookup failure shouldn't block a local-dev enrich.
 */
async function resolveBearerToken(): Promise<string | null> {
    try {
        const client = getSupabaseClient();
        const { data } = await client.auth.getSession();
        return data.session?.access_token ?? null;
    } catch {
        return null;
    }
}

/**
 * Call POST /enrich for one Account. Returns a structured result; never
 * throws. Server takes 30-90s on a cold cache — caller must surface
 * progress UI.
 */
export async function enrichAccount(
    account: Account,
    options: EnrichOptions = {}
): Promise<EnrichResult> {
    const baseUrl = options.baseUrl ?? resolveEnrichmentBaseUrl();
    const url = `${baseUrl}/enrich`;
    const token = await resolveBearerToken();

    const body = JSON.stringify({
        name: account.name,
        domain: account.domain ?? "",
        industry: account.industry ?? "",
        sector: "",
        ticker: account.ticker ?? ""
    });

    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers,
            body,
            signal: options.signal
        });
        if (!res.ok) {
            const message = await readErrorMessage(res);
            return { status: "error", message };
        }
        const response = (await res.json()) as EnrichmentResponse;
        trackEvent("signal_console_enrich", {
            accountId: account.id,
            signalCount: response.signals?.length ?? 0,
            elapsed: response.elapsed ?? null
        });
        return { status: "ok", response };
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            return { status: "aborted" };
        }
        reportError(err, {
            op: "signal-console.enrichAccount",
            accountId: account.id
        });
        const message =
            err instanceof Error ? err.message : "Network error during enrich";
        return { status: "error", message };
    }
}

async function readErrorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body.error === "string") return body.error;
    } catch {
        // not JSON
    }
    return `HTTP ${res.status} ${res.statusText}`;
}
