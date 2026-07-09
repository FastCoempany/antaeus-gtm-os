import { reportError } from "@/lib/observability";

/**
 * Cross-room inbound account queue (canon §4.6 — "confirmed accounts
 * into Signal Console"). Prospecting Desk's send action enqueues the
 * confirmed account here; Signal Console drains the queue on boot
 * AFTER cloud persistence resolves, creating each account through its
 * own canonical write path (buildManualAccount + saveAccount) so the
 * delivery is cloud-safe — a direct gtmos_sc_v4 append would be
 * clobbered when the cloud replaces local state on boot.
 *
 * Same compounding pattern as Cold Call → gtmos_deal_workspaces, but
 * routed through the owner room's writer instead of a raw mirror write.
 */

export const INBOUND_QUEUE_KEY = "gtmos_sc_inbound_v1";

export interface InboundAccountEntry {
    /** Account name (required). */
    readonly name: string;
    readonly industry?: string;
    /** Plain note carried onto the account (way in / how we'll reach out). */
    readonly note?: string;
    /** Sending room slug, e.g. "prospecting-desk". */
    readonly from?: string;
    /** ISO timestamp of the send. */
    readonly at: string;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function parseEntry(raw: unknown): InboundAccountEntry | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const r = raw as Record<string, unknown>;
    const name = typeof r["name"] === "string" ? r["name"].trim() : "";
    if (!name) return null;
    return {
        name,
        ...(typeof r["industry"] === "string" && r["industry"].trim()
            ? { industry: r["industry"].trim() }
            : {}),
        ...(typeof r["note"] === "string" && r["note"].trim()
            ? { note: r["note"].trim() }
            : {}),
        ...(typeof r["from"] === "string" && r["from"] ? { from: r["from"] } : {}),
        at:
            typeof r["at"] === "string" && r["at"]
                ? r["at"]
                : new Date().toISOString()
    };
}

export function readInboundQueue(
    s?: StorageLike | null
): ReadonlyArray<InboundAccountEntry> {
    const st = store(s);
    if (!st) return [];
    try {
        const raw = st.getItem(INBOUND_QUEUE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const list = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as { queue?: unknown })?.queue)
              ? ((parsed as { queue: unknown[] }).queue)
              : [];
        return list
            .map(parseEntry)
            .filter((e): e is InboundAccountEntry => e !== null);
    } catch (err) {
        reportError(err, { op: "signal-console.readInboundQueue" });
        return [];
    }
}

/**
 * Append an account to the inbound queue. Dedupes by case-insensitive
 * name against entries already waiting. Returns true when the entry
 * landed (or was already queued).
 */
export function enqueueInboundAccount(
    entry: Omit<InboundAccountEntry, "at"> & { readonly at?: string },
    s?: StorageLike | null
): boolean {
    const st = store(s);
    if (!st) return false;
    const name = entry.name.trim();
    if (!name) return false;
    try {
        const existing = readInboundQueue(st);
        const lower = name.toLowerCase();
        if (existing.some((e) => e.name.toLowerCase() === lower)) return true;
        const next: InboundAccountEntry[] = [
            ...existing,
            {
                ...entry,
                name,
                at: entry.at ?? new Date().toISOString()
            }
        ];
        st.setItem(INBOUND_QUEUE_KEY, JSON.stringify({ queue: next }));
        return true;
    } catch (err) {
        reportError(err, { op: "signal-console.enqueueInboundAccount" });
        return false;
    }
}

export function clearInboundQueue(s?: StorageLike | null): void {
    const st = store(s);
    if (!st) return;
    try {
        st.removeItem(INBOUND_QUEUE_KEY);
    } catch {
        // best-effort
    }
}
