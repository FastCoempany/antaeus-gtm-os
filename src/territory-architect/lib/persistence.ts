import { reportError } from "@/lib/observability";
import {
    EMPTY_TERRITORY_STATE,
    TIER_IDS,
    type Approach,
    type DispositionState,
    type TerritoryAccount,
    type TerritoryState,
    type Thesis,
    type TierId
} from "./types";

/**
 * Phase 4 / Room 12 — persistence helpers.
 *
 * Mirrors the legacy 4 primary keys:
 *   gtmos_territory       → TerritoryState (health/pulse/cycle)
 *   gtmos_ta_theses       → Thesis[]
 *   gtmos_ta_approaches   → Approach[]
 *   gtmos_ta_accounts     → TerritoryAccount[]
 *
 * (Legacy also tracks dispositions/signals/swap-history/retier-history/
 * calibrations/setup as separate keys — those land in a follow-up if
 * needed; the 4 above are the operational core.)
 */

const KEY_TERRITORY = "gtmos_territory";
const KEY_THESES = "gtmos_ta_theses";
const KEY_APPROACHES = "gtmos_ta_approaches";
const KEY_ACCOUNTS = "gtmos_ta_accounts";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
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

function asTier(v: unknown): TierId {
    return typeof v === "string" && (TIER_IDS as ReadonlyArray<string>).includes(v)
        ? (v as TierId)
        : "t2";
}

function asDisposition(v: unknown): DispositionState {
    return v === "paused" ||
        v === "closed-won" ||
        v === "closed-lost" ||
        v === "reroute"
        ? v
        : "active";
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

// ─── Theses ────────────────────────────────────────────────────────────

function parseThesis(raw: unknown): Thesis | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const title = asString(r["title"]);
    if (!id || !title) return null;
    return {
        id,
        title,
        pressure: asString(r["pressure"]),
        segment: asString(r["segment"]),
        whyUs: asString(r["whyUs"]),
        tier: asTier(r["tier"]),
        accountIds: asStringArray(r["accountIds"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

export function loadTheses(s?: StorageLike | null): ReadonlyArray<Thesis> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem(KEY_THESES);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: Thesis[] = [];
        for (const row of parsed) {
            const t = parseThesis(row);
            if (t) out.push(t);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "territory.loadTheses" });
        return [];
    }
}

// ─── Approaches ────────────────────────────────────────────────────────

function parseApproach(raw: unknown): Approach | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const name = asString(r["name"]);
    if (!id || !name) return null;
    return {
        id,
        name,
        trigger: asString(r["trigger"]),
        script: asString(r["script"]),
        bridge: asString(r["bridge"]),
        thesisId: asString(r["thesisId"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

export function loadApproaches(
    s?: StorageLike | null
): ReadonlyArray<Approach> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem(KEY_APPROACHES);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: Approach[] = [];
        for (const row of parsed) {
            const a = parseApproach(row);
            if (a) out.push(a);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "territory.loadApproaches" });
        return [];
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────

function parseAccount(raw: unknown): TerritoryAccount | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const name = asString(r["name"]);
    if (!id || !name) return null;
    return {
        id,
        name,
        tier: asTier(r["tier"]),
        thesisId: asString(r["thesisId"]),
        approachId: asString(r["approachId"]),
        disposition: asDisposition(r["disposition"]),
        notes: asString(r["notes"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

export function loadAccounts(
    s?: StorageLike | null
): ReadonlyArray<TerritoryAccount> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem(KEY_ACCOUNTS);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: TerritoryAccount[] = [];
        for (const row of parsed) {
            const a = parseAccount(row);
            if (a) out.push(a);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "territory.loadAccounts" });
        return [];
    }
}

// ─── Territory state ──────────────────────────────────────────────────

export function loadTerritoryState(
    s?: StorageLike | null
): TerritoryState {
    const store = getStorage(s);
    if (!store) return EMPTY_TERRITORY_STATE;
    try {
        const raw = store.getItem(KEY_TERRITORY);
        if (!raw) return EMPTY_TERRITORY_STATE;
        const parsed: unknown = JSON.parse(raw);
        const r = asObject(parsed);
        if (!r) return EMPTY_TERRITORY_STATE;
        const cycleRaw = asString(r["salesCycle"]);
        return {
            healthScore: Math.max(0, Math.min(100, asNumber(r["healthScore"]))),
            lastPulse: typeof r["lastPulse"] === "string" ? r["lastPulse"] : null,
            pulseSkips: Math.max(0, Math.floor(asNumber(r["pulseSkips"]))),
            salesCycle:
                cycleRaw === "fast" ||
                cycleRaw === "medium" ||
                cycleRaw === "slow"
                    ? cycleRaw
                    : "",
            createdAt: typeof r["createdAt"] === "string" ? r["createdAt"] : null
        };
    } catch (err) {
        reportError(err, { op: "territory.loadTerritoryState" });
        return EMPTY_TERRITORY_STATE;
    }
}

// ─── Bulk save ────────────────────────────────────────────────────────

export interface SaveAllInput {
    readonly theses: ReadonlyArray<Thesis>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly accounts: ReadonlyArray<TerritoryAccount>;
    readonly territory: TerritoryState;
}

export function saveAll(
    next: SaveAllInput,
    s?: StorageLike | null
): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(KEY_THESES, JSON.stringify(next.theses));
        store.setItem(KEY_APPROACHES, JSON.stringify(next.approaches));
        store.setItem(KEY_ACCOUNTS, JSON.stringify(next.accounts));
        store.setItem(KEY_TERRITORY, JSON.stringify(next.territory));
    } catch (err) {
        reportError(err, { op: "territory.saveAll" });
    }
}
