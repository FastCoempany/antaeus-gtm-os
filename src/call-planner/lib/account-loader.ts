import { reportError } from "@/lib/observability";
import type { MatchedAccount, SignalSummary } from "./types";

/**
 * Phase 4 / Room 9 Wave 5 — Signal Console account loader.
 *
 * Reads accounts from `gtmos_sc_v4` (Phase 4 / Room 3's Signal Console
 * mirror), projects each row to MatchedAccount {id, name, heat,
 * topSignal}. Heat read with a `_heat` legacy fallback using the
 * `"heat" in o` presence check from PR #22's Codex P2 fix so an
 * explicit `heat: 0` always wins over a stale legacy value.
 *
 * Defensive: malformed JSON / missing keys / hostile types → empty
 * fallback, errors via reportError per CLAUDE.md Part II.5 §2.
 */

const STORAGE_KEY = "gtmos_sc_v4";

interface StorageReader {
    getItem(key: string): string | null;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function topSignalSummary(account: Record<string, unknown>): SignalSummary | null {
    const signals = account["signals"];
    if (!Array.isArray(signals) || signals.length === 0) return null;
    const first = asObject(signals[0]);
    if (!first) return null;
    const headline = asString(first["headline"]);
    if (!headline) return null;
    const publishedDate =
        asString(first["published_date"]) ||
        asString(first["publishedDate"]) ||
        asString(first["fetched_at"]) ||
        "";
    return { headline, publishedDate };
}

export function loadAccountOptions(
    storage: StorageReader | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<MatchedAccount> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        const arr =
            root && Array.isArray(root["accounts"])
                ? (root["accounts"] as ReadonlyArray<unknown>)
                : [];
        const out: MatchedAccount[] = [];
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const id = asString(o["id"]);
            const name = asString(o["name"]);
            if (!id || !name) continue;
            const heat =
                "heat" in o ? asNumber(o["heat"]) : asNumber(o["_heat"]);
            out.push({
                id,
                name,
                heat,
                topSignal: topSignalSummary(o)
            });
        }
        return out;
    } catch (err) {
        reportError(err, { op: "call-planner.loadAccountOptions" });
        return [];
    }
}
