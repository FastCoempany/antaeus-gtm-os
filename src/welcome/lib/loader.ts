import { reportError } from "@/lib/observability";
import {
    EMPTY_ACTIVATION,
    EMPTY_COUNTS,
    type ActivationContext,
    type WorkspaceCounts
} from "./types";

interface StorageLike {
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function readJson<T>(
    store: StorageLike,
    key: string,
    op: string
): T | null {
    try {
        const raw = store.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch (err) {
        reportError(err, { op });
        return null;
    }
}

/**
 * loadCounts — peek into legacy localStorage shapes to compute the 4
 * milestone counts the Welcome ladder cares about.
 *
 * Sources:
 *   gtmos_icp_analytics  → { icps: [...] }
 *   gtmos_deal_workspaces → [...] OR { deals: [...] }
 *   gtmos_sc_v4          → { accounts: [...] } where each account.signals[]
 *   gtmos_outbound_touches → { touches: [...] }
 *   gtmos_linkedin_log   → { actions: [...] }
 *   gtmos_discovery_stats → { totalCalls: number, advancedCalls: number }
 */
export function loadCounts(s?: StorageLike | null): WorkspaceCounts {
    const store = getStorage(s);
    if (!store) return EMPTY_COUNTS;

    const icpData = readJson<{ icps?: unknown }>(
        store,
        "gtmos_icp_analytics",
        "welcome.loadCounts.icps"
    );
    const dealRaw = readJson<unknown>(
        store,
        "gtmos_deal_workspaces",
        "welcome.loadCounts.deals"
    );
    const dealRows = Array.isArray(dealRaw)
        ? dealRaw
        : asArray((dealRaw as { deals?: unknown })?.deals);
    const sc = readJson<{ accounts?: unknown }>(
        store,
        "gtmos_sc_v4",
        "welcome.loadCounts.signals"
    );
    const accounts = asArray(sc?.accounts);
    let signalCount = 0;
    for (const a of accounts) {
        if (a && typeof a === "object") {
            signalCount += asArray((a as { signals?: unknown }).signals).length;
        }
    }
    const outbound = readJson<{ touches?: unknown }>(
        store,
        "gtmos_outbound_touches",
        "welcome.loadCounts.touches"
    );
    const linkedin = readJson<{ actions?: unknown }>(
        store,
        "gtmos_linkedin_log",
        "welcome.loadCounts.linkedin"
    );
    const discovery = readJson<{ totalCalls?: unknown }>(
        store,
        "gtmos_discovery_stats",
        "welcome.loadCounts.discovery"
    );
    const calls =
        typeof discovery?.totalCalls === "number"
            ? discovery.totalCalls
            : 0;

    return {
        icps: asArray(icpData?.icps).length,
        deals: dealRows.length,
        accounts: accounts.length,
        signals: signalCount,
        touches:
            asArray(outbound?.touches).length +
            asArray(linkedin?.actions).length,
        calls
    };
}

export function loadActivationContext(
    s?: StorageLike | null
): ActivationContext {
    const store = getStorage(s);
    if (!store) return EMPTY_ACTIVATION;
    const ctx = readJson<Record<string, unknown>>(
        store,
        "gtmos_activation_context",
        "welcome.loadActivationContext"
    );
    if (!ctx) return EMPTY_ACTIVATION;
    return {
        companyName:
            typeof ctx["company"] === "string" ? (ctx["company"] as string) : null,
        role: typeof ctx["role"] === "string" ? (ctx["role"] as string) : null,
        categoryLabel:
            typeof ctx["categoryLabel"] === "string"
                ? (ctx["categoryLabel"] as string)
                : null
    };
}
