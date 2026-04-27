import { reportError } from "@/lib/observability";
import type { LinkedDeal } from "./types";

/**
 * Phase 4 / Room 9 Wave 5 — Deal Workspace deal loader.
 *
 * Reads deals from `gtmos_deal_workspaces` (Phase 4 / Room 1's mirror),
 * projects each row to LinkedDeal {id, accountName, value, stage}.
 * Drives the linked-deal `<select>` in the Witness rail. Drops rows
 * missing id or accountName so the dropdown stays clean.
 *
 * Defensive throughout — malformed JSON / wrong shape → empty fallback.
 */

const STORAGE_KEY = "gtmos_deal_workspaces";

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

export function loadDealOptions(
    storage: StorageReader | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<LinkedDeal> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        // Legacy supports both an array AND an object-of-deals shape; prefer
        // the array shape (Phase 4 / Room 1's mirror writes that).
        const arr: ReadonlyArray<unknown> = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === "object"
              ? Object.values(parsed)
              : [];
        const out: LinkedDeal[] = [];
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const id = asString(o["id"]);
            const accountName =
                asString(o["accountName"]) || asString(o["account_name"]);
            if (!id || !accountName) continue;
            out.push({
                id,
                accountName,
                value: asNumber(o["value"]),
                stage: asString(o["stage"]) || "prospect"
            });
        }
        return out;
    } catch (err) {
        reportError(err, { op: "call-planner.loadDealOptions" });
        return [];
    }
}
