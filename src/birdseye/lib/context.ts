import { listObservations } from "@/lib/observations/reader";
import type { DealForRanking, HotAccount } from "./ranker";

/**
 * Birdseye context loaders — Phase D inputs.
 *
 * Reads the three ranker sources (observations + deals + hot accounts).
 * Observations come from the cloud reader (Phase B); deals + hot
 * accounts come from localStorage (Tier 2-4 retrofit not done yet).
 * When the data-parity retrofit lands per ADR-005, swap the
 * localStorage reads for cloud reads here without touching the
 * ranker.
 *
 * All readers return defensively on parse failure; the float never
 * throws.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function safeParse(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

// ─── Deals (from gtmos_deal_workspaces) ───────────────────────────────

export function loadDealsForRanking(
    opts: { readonly storage?: StorageLike | null } = {}
): ReadonlyArray<DealForRanking> {
    const storage = getStorage(opts.storage);
    if (!storage) return [];
    const parsed = safeParse(storage.getItem("gtmos_deal_workspaces"));
    const rows = Array.isArray(parsed)
        ? parsed
        : asObject(parsed)
          ? Object.values(parsed as Record<string, unknown>)
          : [];
    const out: DealForRanking[] = [];
    for (const raw of rows) {
        const o = asObject(raw);
        if (!o) continue;
        const id = typeof o.id === "string" ? o.id : null;
        if (!id) continue;
        const stage =
            typeof o.stage === "string"
                ? o.stage
                : typeof o.stageRaw === "string"
                  ? o.stageRaw
                  : null;
        const account_name =
            typeof o.account_name === "string"
                ? o.account_name
                : typeof o.accountName === "string"
                  ? o.accountName
                  : null;
        const recovery_rank =
            typeof o.recovery_rank === "number"
                ? o.recovery_rank
                : typeof o.recoveryRank === "number"
                  ? o.recoveryRank
                  : 0;
        const next_step_date =
            typeof o.next_step_date === "string"
                ? o.next_step_date
                : typeof o.nextStepDate === "string"
                  ? o.nextStepDate
                  : null;
        out.push({
            id,
            account_name,
            stage,
            recovery_rank,
            next_step_date
        });
    }
    return out;
}

// ─── Hot accounts (from gtmos_sc_v4) ──────────────────────────────────

export function loadHotAccountsForRanking(
    opts: { readonly storage?: StorageLike | null; readonly limit?: number } = {}
): ReadonlyArray<HotAccount> {
    const storage = getStorage(opts.storage);
    if (!storage) return [];
    const limit = Math.max(1, opts.limit ?? 3);
    const root = asObject(safeParse(storage.getItem("gtmos_sc_v4")));
    const accounts = Array.isArray(root?.accounts)
        ? (root!.accounts as ReadonlyArray<unknown>)
        : [];
    const out: HotAccount[] = [];
    for (const raw of accounts) {
        const o = asObject(raw);
        if (!o) continue;
        const id = typeof o.id === "string" ? o.id : null;
        const account_name =
            typeof o.name === "string"
                ? o.name
                : typeof o.account_name === "string"
                  ? o.account_name
                  : null;
        if (!id || !account_name) continue;
        const heat =
            "heat" in o && typeof o.heat === "number"
                ? o.heat
                : typeof o._heat === "number"
                  ? o._heat
                  : 0;
        out.push({ id, account_name, heat });
    }
    out.sort((a, b) => b.heat - a.heat);
    return out.slice(0, limit);
}

// ─── Observations (cloud read) ────────────────────────────────────────

export async function loadObservationsForRanking() {
    try {
        return await listObservations({ limit: 20 });
    } catch {
        return [];
    }
}
