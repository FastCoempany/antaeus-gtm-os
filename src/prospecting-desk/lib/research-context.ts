/**
 * Reads the seller's own targeting context for a web search: the saved
 * ICP (ICP Studio), the active territory group (Territory Architect), and
 * the companies already in the workspace (to leave out of results).
 *
 * All reads are defensive — missing or malformed storage yields empty
 * strings and an empty list, never a throw.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

const KEY_ICP = "gtmos_icp_analytics";
const KEY_FOCUSES = "gtmos_ta_focuses";
const KEY_SIGNAL_CONSOLE = "gtmos_sc_v4";

function store(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    return typeof localStorage === "undefined" ? null : localStorage;
}

function readJson(s: StorageLike | null, key: string): unknown {
    if (!s) return null;
    try {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
        return null;
    }
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function str(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

/** One-line summary of the best saved ICP, or "" when none is saved. */
export function readIcpSummary(s?: StorageLike | null): string {
    const env = asObject(readJson(store(s), KEY_ICP));
    const list = Array.isArray(env?.["icps"]) ? (env!["icps"] as unknown[]) : [];
    let best: Record<string, unknown> | null = null;
    let bestScore = -1;
    for (const raw of list) {
        const o = asObject(raw);
        if (!o) continue;
        const score = typeof o["qualityScore"] === "number" ? (o["qualityScore"] as number) : 0;
        if (!best || score > bestScore) {
            best = o;
            bestScore = score;
        }
    }
    if (!best) return "";
    const statement = str(best["statement"]);
    if (statement) return statement.slice(0, 600);
    const parts = [
        str(best["industry"]),
        str(best["size"]),
        str(best["geo"]),
        str(best["buyer"]) && `buyer: ${str(best["buyer"])}`,
        str(best["pain"]) && `problem: ${str(best["pain"])}`,
        str(best["trigger"]) && `trigger: ${str(best["trigger"])}`
    ].filter(Boolean);
    return parts.join("; ").slice(0, 600);
}

/** The active territory group's statement, or "" when none exists. */
export function readActiveFocus(s?: StorageLike | null): string {
    const list = readJson(store(s), KEY_FOCUSES);
    if (!Array.isArray(list)) return "";
    for (const raw of list) {
        const o = asObject(raw);
        if (!o) continue;
        const status = str(o["status"]);
        if (status && status !== "active") continue;
        const text = str(o["fullStatement"]) || str(o["name"]);
        if (text) return text.slice(0, 600);
    }
    return "";
}

/** Account names already watched in Signal Console (local mirror). */
export function readSignalConsoleNames(s?: StorageLike | null): string[] {
    const env = asObject(readJson(store(s), KEY_SIGNAL_CONSOLE));
    const list = Array.isArray(env?.["accounts"]) ? (env!["accounts"] as unknown[]) : [];
    return list
        .map((raw) => {
            const o = asObject(raw);
            return o ? str(o["name"]) || str(o["account_name"]) : "";
        })
        .filter((n) => n.length > 0);
}

/**
 * The text to prefill the "Describe who you're after" box with: the
 * territory group passed in from another room, else the active territory
 * group, else the ICP summary.
 */
export function suggestedDescription(
    inboundFocus: string,
    s?: StorageLike | null
): string {
    return inboundFocus.trim() || readActiveFocus(s) || readIcpSummary(s);
}
