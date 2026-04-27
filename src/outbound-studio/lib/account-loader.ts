import { reportError } from "@/lib/observability";
import type { AccountOption } from "./types";

/**
 * Phase 4 / Room 6 Wave 5 — account loader.
 *
 * Reads accounts from Phase 4 / Room 3's `gtmos_sc_v4` (Signal Console)
 * mirror and projects each into the AccountOption shape the dropdown
 * consumes. Same defensive posture as the rest of Phase 4: malformed
 * input → empty fallback, hostile storage swallowed via reportError.
 */

const STORAGE_KEY = "gtmos_sc_v4";

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

export function loadAccountOptions(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<AccountOption> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        const arr = Array.isArray(root?.accounts) ? root!.accounts! : [];
        return arr
            .map((row): AccountOption | null => {
                const o = asObject(row);
                if (!o) return null;
                const id = asString(o.id);
                const name = asString(o.name);
                if (!id || !name) return null;
                const heat = asNumber(o.heat);
                const band = asString(o.band);
                return {
                    id,
                    name,
                    ...(heat ? { heat } : {}),
                    ...(band ? { band } : {})
                };
            })
            .filter((a): a is AccountOption => a !== null);
    } catch (err) {
        reportError(err, { op: "outbound-studio.loadAccountOptions" });
        return [];
    }
}
