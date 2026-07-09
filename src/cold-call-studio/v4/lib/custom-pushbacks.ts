import { reportError } from "@/lib/observability";
import type { ThreadId } from "../../lib/types";

/**
 * Operator-authored pushback lines (canon §4.9 — the likely-pushback
 * branches, "each with a line ready for it"). The stock branches ship
 * with the room; these are the ones the seller actually hears and adds
 * ("+ Add a pushback you hear"). Stored per step, additive to — never
 * replacing — the engine's thread data.
 */

export const CUSTOM_PB_KEY = "gtmos_cold_call_custom_pushbacks_v1";

export interface CustomPushback {
    readonly id: string;
    readonly buyer: string;
    readonly reply: string;
}

export type CustomPushbackMap = Readonly<
    Partial<Record<ThreadId, ReadonlyArray<CustomPushback>>>
>;

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

export function loadCustomPushbacks(s?: StorageLike | null): CustomPushbackMap {
    const st = store(s);
    if (!st) return {};
    try {
        const raw = st.getItem(CUSTOM_PB_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
        const out: Partial<Record<ThreadId, CustomPushback[]>> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (!Array.isArray(v)) continue;
            const rows = v
                .map((row): CustomPushback | null => {
                    if (!row || typeof row !== "object") return null;
                    const r = row as Record<string, unknown>;
                    const id = typeof r["id"] === "string" ? r["id"] : "";
                    const buyer = typeof r["buyer"] === "string" ? r["buyer"] : "";
                    const reply = typeof r["reply"] === "string" ? r["reply"] : "";
                    if (!id || (!buyer && !reply)) return null;
                    return { id, buyer, reply };
                })
                .filter((r): r is CustomPushback => r !== null);
            if (rows.length > 0) out[k as ThreadId] = rows;
        }
        return out;
    } catch (err) {
        reportError(err, { op: "cold-call.loadCustomPushbacks" });
        return {};
    }
}

export function saveCustomPushbacks(
    map: CustomPushbackMap,
    s?: StorageLike | null
): void {
    const st = store(s);
    if (!st) return;
    try {
        st.setItem(CUSTOM_PB_KEY, JSON.stringify(map));
    } catch (err) {
        reportError(err, { op: "cold-call.saveCustomPushbacks" });
    }
}

export function addCustomPushback(
    map: CustomPushbackMap,
    threadId: ThreadId,
    buyer: string,
    reply: string,
    now: number = Date.now()
): CustomPushbackMap {
    const entry: CustomPushback = {
        id: `pb_${now}_${Math.random().toString(36).slice(2, 7)}`,
        buyer: buyer.trim(),
        reply: reply.trim()
    };
    return { ...map, [threadId]: [...(map[threadId] ?? []), entry] };
}

export function removeCustomPushback(
    map: CustomPushbackMap,
    threadId: ThreadId,
    id: string
): CustomPushbackMap {
    const rows = (map[threadId] ?? []).filter((r) => r.id !== id);
    return { ...map, [threadId]: rows };
}
