/**
 * Skill source readers.
 *
 * Per ADR-010 (2026-05-31). Each SourceKey in types.ts maps to one
 * reader function below. Readers are LOCAL-FIRST (read from
 * localStorage where the data lives today) — once the Tier 2-4
 * data-parity retrofit completes (ADR-005), readers can swap to
 * cloud reads without touching the dispatcher or recipes.
 *
 * Readers return either a resolved string (the value the dispatcher
 * will pass as a URL param) or null (no data available for this
 * source right now). The dispatcher decides what to do with null
 * based on whether the source was declared `required: true`.
 *
 * Pure functions — no side effects, no DOM, no Supabase. The
 * dispatcher composes them with the recipe.
 */

import { listObservations } from "@/lib/observations/reader";
import type { SourceKey } from "./types";

interface StorageLike {
    getItem(key: string): string | null;
}

/**
 * Resolver result. A source produces either:
 *   - { kind: "value", value: string } — a single URL-safe value
 *   - { kind: "list", values: string[] } — multiple ids (filter-and-route)
 *   - { kind: "none" } — no data; dispatcher decides
 */
export type SourceResult =
    | { readonly kind: "value"; readonly value: string }
    | { readonly kind: "list"; readonly values: ReadonlyArray<string> }
    | { readonly kind: "none" };

interface ResolveOptions {
    readonly storage?: StorageLike | null;
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

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

// ─── hottest-signal-console-account ────────────────────────────────────

export function resolveHottestSignalConsoleAccount(
    opts: ResolveOptions = {}
): SourceResult {
    const storage = getStorage(opts.storage);
    if (!storage) return { kind: "none" };
    const root = asObject(safeParse(storage.getItem("gtmos_sc_v4")));
    const accounts = asArray(root?.accounts);
    let best: { name: string; heat: number } | null = null;
    for (const raw of accounts) {
        const o = asObject(raw);
        if (!o) continue;
        const name = typeof o.name === "string" ? o.name : null;
        if (!name) continue;
        // Prefer the canonical `heat` field; fall back to legacy `_heat`.
        const heat =
            "heat" in o && typeof o.heat === "number"
                ? o.heat
                : typeof o._heat === "number"
                  ? o._heat
                  : 0;
        if (best === null || heat > best.heat) {
            best = { name, heat };
        }
    }
    return best ? { kind: "value", value: best.name } : { kind: "none" };
}

// ─── top-pressure-open-deal ────────────────────────────────────────────

export function resolveTopPressureOpenDeal(
    opts: ResolveOptions = {}
): SourceResult {
    const storage = getStorage(opts.storage);
    if (!storage) return { kind: "none" };
    const parsed = safeParse(storage.getItem("gtmos_deal_workspaces"));
    // Phase 4 / Room 1 writes either an array or a keyed-by-id map.
    // Check array first because asObject() rejects arrays.
    const dealsRaw = Array.isArray(parsed)
        ? parsed
        : asObject(parsed)
          ? Object.values(parsed as Record<string, unknown>)
          : [];
    let best: { id: string; recoveryRank: number } | null = null;
    for (const raw of dealsRaw) {
        const o = asObject(raw);
        if (!o) continue;
        const id = typeof o.id === "string" ? o.id : null;
        if (!id) continue;
        const stageRaw =
            typeof o.stage === "string"
                ? o.stage
                : typeof o.stageRaw === "string"
                  ? o.stageRaw
                  : "";
        if (stageRaw === "closed-won" || stageRaw === "closed-lost") continue;
        // Phase 4 / Room 1 publishes `recovery_rank` as a number; the
        // higher the value, the more pressure.
        const rank =
            typeof o.recovery_rank === "number"
                ? o.recovery_rank
                : typeof o.recoveryRank === "number"
                  ? o.recoveryRank
                  : 0;
        if (best === null || rank > best.recoveryRank) {
            best = { id, recoveryRank: rank };
        }
    }
    return best ? { kind: "value", value: best.id } : { kind: "none" };
}

// ─── latest-call-planner-agenda ────────────────────────────────────────

export function resolveLatestCallPlannerAgenda(
    opts: ResolveOptions = {}
): SourceResult {
    const storage = getStorage(opts.storage);
    if (!storage) return { kind: "none" };
    const root = asObject(
        safeParse(storage.getItem("gtmos_discovery_agenda"))
    );
    if (!root) return { kind: "none" };
    const account =
        typeof root.accountName === "string" ? root.accountName : null;
    if (!account) return { kind: "none" };
    return { kind: "value", value: account };
}

// ─── top-stalled-deals (returns id list, not single value) ─────────────

export function resolveTopStalledDeals(
    opts: ResolveOptions & { readonly limit?: number } = {}
): SourceResult {
    const storage = getStorage(opts.storage);
    if (!storage) return { kind: "none" };
    const limit = Math.max(1, opts.limit ?? 5);
    const parsed = safeParse(storage.getItem("gtmos_deal_workspaces"));
    const dealsRaw = Array.isArray(parsed)
        ? parsed
        : asObject(parsed)
          ? Object.values(parsed as Record<string, unknown>)
          : [];
    const open: Array<{ id: string; rank: number }> = [];
    for (const raw of dealsRaw) {
        const o = asObject(raw);
        if (!o) continue;
        const id = typeof o.id === "string" ? o.id : null;
        if (!id) continue;
        const stage =
            typeof o.stage === "string"
                ? o.stage
                : typeof o.stageRaw === "string"
                  ? o.stageRaw
                  : "";
        if (stage === "closed-won" || stage === "closed-lost") continue;
        const rank =
            typeof o.recovery_rank === "number"
                ? o.recovery_rank
                : typeof o.recoveryRank === "number"
                  ? o.recoveryRank
                  : 0;
        if (rank <= 0) continue;
        open.push({ id, rank });
    }
    if (open.length === 0) return { kind: "none" };
    open.sort((a, b) => b.rank - a.rank);
    return {
        kind: "list",
        values: open.slice(0, limit).map((d) => d.id)
    };
}

// ─── undismissed-observations (cloud — uses Phase B reader) ────────────

export async function resolveUndismissedObservations(): Promise<SourceResult> {
    try {
        const rows = await listObservations({ limit: 1 });
        if (rows.length === 0) return { kind: "none" };
        // The "value" for this source isn't an entity id — it's a flag
        // signaling there ARE observations. The dispatcher then routes
        // to /dashboard/ with no extra param; the WeekReadsCard
        // surfaces them. Pass the count as the value so the URL has
        // shape for analytics.
        return { kind: "value", value: String(rows.length) };
    } catch {
        return { kind: "none" };
    }
}

// ─── Dispatcher entry point ────────────────────────────────────────────

/**
 * Resolve a source by key. Sync sources (localStorage reads) resolve
 * synchronously; the one async source wraps. Dispatcher handles both
 * via `await`.
 */
export async function resolveSource(
    key: SourceKey,
    opts: ResolveOptions & { readonly limit?: number } = {}
): Promise<SourceResult> {
    switch (key) {
        case "hottest-signal-console-account":
            return resolveHottestSignalConsoleAccount(opts);
        case "top-pressure-open-deal":
            return resolveTopPressureOpenDeal(opts);
        case "latest-call-planner-agenda":
            return resolveLatestCallPlannerAgenda(opts);
        case "top-stalled-deals":
            return resolveTopStalledDeals(opts);
        case "undismissed-observations":
            return await resolveUndismissedObservations();
    }
}
