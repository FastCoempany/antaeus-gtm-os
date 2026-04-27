import { reportError } from "@/lib/observability";
import type { AccountSummary } from "./types";

/**
 * Phase 4 / Room 7 Wave 5 — account loader.
 *
 * Reads accounts from Phase 4 / Room 3's `gtmos_sc_v4` (Signal Console)
 * mirror and projects each into the AccountSummary shape this room
 * consumes. The legacy file at `app/cold-call-studio/index.html` lines
 * 156-163 also tries window.gtmPersistence.signalConsole.load() first;
 * we skip that here because Phase 4 / Room 3 publishes through this
 * key directly, and the new stack reads from Supabase via Wave 7+
 * (post-migration) once Signal Console retires its localStorage mirror.
 *
 * Returned list is ranked by heat desc so the boot auto-select picks
 * the hottest account first. Defensive: malformed JSON, missing
 * fields, hostile types → empty fallback, errors via reportError.
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
    if (typeof v === "number" && Number.isFinite(v)) return v;
    return 0;
}

function topSignalHeadline(account: Record<string, unknown>): string {
    const signals = account["signals"];
    if (!Array.isArray(signals) || signals.length === 0) return "";
    const first = asObject(signals[0]);
    if (!first) return "";
    return asString(first["headline"]);
}

export function loadAccountOptions(
    storage: StorageReader | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<AccountSummary> {
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
        const out: AccountSummary[] = [];
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const id = asString(o["id"]);
            const name = asString(o["name"]);
            if (!id || !name) continue;
            // Heat may be stored as `heat` (Phase 4 / Room 3) or `_heat`
            // (legacy Signal Console). Read both, prefer `heat`.
            const heat = asNumber(o["heat"]) || asNumber(o["_heat"]);
            const topSignal = topSignalHeadline(o);
            out.push({ id, name, heat, topSignal });
        }
        // Rank by heat desc; stable ties leave order as-stored.
        return out
            .slice()
            .sort((a, b) => b.heat - a.heat);
    } catch (err) {
        reportError(err, { op: "cold-call-studio.loadAccountOptions" });
        return [];
    }
}
