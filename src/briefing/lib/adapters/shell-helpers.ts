import {
    CONTRACT_SCHEMA_VERSION,
    type ModuleStateContract
} from "../contracts";

/**
 * Shared helper for adapter shells (B.0c).
 *
 * Returns an uninitialized contract — valid shape, no state. Adapters
 * call this when:
 *   - the underlying room has no localStorage / cloud row yet, or
 *   - the underlying data is malformed and the adapter chooses to
 *     fall back rather than throw.
 *
 * Real data translation per adapter lands in follow-up PRs as each
 * room either retrofits per ADR-005 Step 5 (cloud read) or grows a
 * richer localStorage adapter (legacy path). The returned shape stays
 * stable across either path; the consumer (B.1 pipeline) doesn't have
 * to know which mode is active.
 */
export function uninitializedContract<TState>(
    reason: string
): ModuleStateContract<TState> {
    return {
        schema_version: CONTRACT_SCHEMA_VERSION,
        last_modified_at: null,
        health: "uninitialized",
        health_reason: reason,
        state: null
    };
}

/**
 * Read a JSON-encoded value from localStorage. Returns null when the
 * key is absent, the value parses to null, parsing throws, or
 * `localStorage` itself is unavailable (SSR / disabled cookies).
 *
 * Adapters use this as the first read step; if it returns null they
 * fall back to `uninitializedContract`. Never throws.
 */
export function readLocalStorageJson(key: string): unknown {
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}
