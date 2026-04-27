import { reportError } from "@/lib/observability";
import type { CallLogEntry, Outcome, ThreadId } from "./types";
import { OUTCOMES } from "./types";

/**
 * Phase 4 / Room 7 Wave 4 — persistence helpers.
 *
 * `gtmos_cold_call_log` carries the call history; legacy writes a
 * shape `{calls: [...]}` (line 199 of `app/cold-call-studio/index.html`).
 * `gtmos_discovery_stats` carries `{totalCalls, advancedCalls}` —
 * Readiness Score + Dashboard read this and may be on legacy still,
 * so we preserve the same wire shape. `gtmos_playbook.company` is
 * the operator's company name used in personalize() substitutions.
 *
 * All readers are defensive: malformed JSON, missing keys, wrong
 * types, and unknown outcome enums are dropped silently. Errors
 * bubble through reportError() per CLAUDE.md Part II.5 §2.
 */

const CALL_LOG_KEY = "gtmos_cold_call_log";
const STATS_KEY = "gtmos_discovery_stats";
const PLAYBOOK_KEY = "gtmos_playbook";

const VALID_THREAD_IDS: ReadonlyArray<ThreadId> = [
    "prep",
    "opener",
    "pressure",
    "proof",
    "ask",
    "exit"
];

const VALID_OUTCOMES: ReadonlyArray<Outcome> = [...OUTCOMES, "logged"];

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(storage?: StorageLike): StorageLike | null {
    if (storage) return storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function parseEntry(raw: unknown): CallLogEntry | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r["id"] === "string" ? r["id"] : null;
    const accountName =
        typeof r["accountName"] === "string" ? r["accountName"] : "";
    const contactName =
        typeof r["contactName"] === "string" ? r["contactName"] : "";
    const contactTitle =
        typeof r["contactTitle"] === "string" ? r["contactTitle"] : "";
    const threadIdRaw = r["threadId"];
    const threadId =
        typeof threadIdRaw === "string" &&
        VALID_THREAD_IDS.includes(threadIdRaw as ThreadId)
            ? (threadIdRaw as ThreadId)
            : null;
    const threadTitle =
        typeof r["threadTitle"] === "string" ? r["threadTitle"] : "";
    const buyerResponse =
        typeof r["buyerResponse"] === "string" ? r["buyerResponse"] : "";
    const recommendedResponse =
        typeof r["recommendedResponse"] === "string"
            ? r["recommendedResponse"]
            : "";
    const outcomeRaw = r["outcome"];
    const outcome =
        typeof outcomeRaw === "string" &&
        VALID_OUTCOMES.includes(outcomeRaw as Outcome)
            ? (outcomeRaw as Outcome)
            : null;
    const notes = typeof r["notes"] === "string" ? r["notes"] : "";
    const createdAt =
        typeof r["createdAt"] === "string"
            ? r["createdAt"]
            : new Date().toISOString();

    if (!id || !threadId || !outcome) return null;

    return {
        id,
        accountName,
        contactName,
        contactTitle,
        threadId,
        threadTitle,
        buyerResponse,
        recommendedResponse,
        outcome,
        notes,
        source: "cold-call-studio-talk-loom",
        createdAt
    };
}

export function loadCallLog(
    storage?: StorageLike
): ReadonlyArray<CallLogEntry> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(CALL_LOG_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return [];
        const calls = (parsed as { calls?: unknown }).calls;
        if (!Array.isArray(calls)) return [];
        const out: CallLogEntry[] = [];
        for (const c of calls) {
            const entry = parseEntry(c);
            if (entry) out.push(entry);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "cold-call-studio.loadCallLog" });
        return [];
    }
}

export function saveCallLog(
    entries: ReadonlyArray<CallLogEntry>,
    storage?: StorageLike
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(CALL_LOG_KEY, JSON.stringify({ calls: entries }));
    } catch (err) {
        reportError(err, { op: "cold-call-studio.saveCallLog" });
    }
}

export interface DiscoveryStats {
    readonly totalCalls: number;
    readonly advancedCalls: number;
}

const EMPTY_STATS: DiscoveryStats = { totalCalls: 0, advancedCalls: 0 };

export function loadDiscoveryStats(storage?: StorageLike): DiscoveryStats {
    const s = getStorage(storage);
    if (!s) return EMPTY_STATS;
    try {
        const raw = s.getItem(STATS_KEY);
        if (!raw) return EMPTY_STATS;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return EMPTY_STATS;
        const r = parsed as Record<string, unknown>;
        const totalCalls =
            typeof r["totalCalls"] === "number" && Number.isFinite(r["totalCalls"])
                ? Math.max(0, Math.floor(r["totalCalls"]))
                : 0;
        const advancedCalls =
            typeof r["advancedCalls"] === "number" &&
            Number.isFinite(r["advancedCalls"])
                ? Math.max(0, Math.floor(r["advancedCalls"]))
                : 0;
        return { totalCalls, advancedCalls };
    } catch (err) {
        reportError(err, { op: "cold-call-studio.loadDiscoveryStats" });
        return EMPTY_STATS;
    }
}

export function saveDiscoveryStats(
    next: DiscoveryStats,
    storage?: StorageLike
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(STATS_KEY, JSON.stringify(next));
    } catch (err) {
        reportError(err, { op: "cold-call-studio.saveDiscoveryStats" });
    }
}

/**
 * Increment discovery stats by 1 logged call (and 1 advanced if the
 * outcome is meeting_booked). Idempotent shape: read → mutate → write.
 */
export function incrementDiscoveryStats(
    outcome: Outcome,
    storage?: StorageLike
): DiscoveryStats {
    const prev = loadDiscoveryStats(storage);
    const next: DiscoveryStats = {
        totalCalls: prev.totalCalls + 1,
        advancedCalls:
            outcome === "meeting_booked"
                ? prev.advancedCalls + 1
                : prev.advancedCalls
    };
    saveDiscoveryStats(next, storage);
    return next;
}

/**
 * Read the operator's company name from `gtmos_playbook.company`.
 * Returns the empty string when missing — personalize() will then
 * fall back to its "[your company]" default.
 */
export function loadCompanyName(storage?: StorageLike): string {
    const s = getStorage(storage);
    if (!s) return "";
    try {
        const raw = s.getItem(PLAYBOOK_KEY);
        if (!raw) return "";
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return "";
        const company = (parsed as { company?: unknown }).company;
        return typeof company === "string" ? company : "";
    } catch (err) {
        reportError(err, { op: "cold-call-studio.loadCompanyName" });
        return "";
    }
}
