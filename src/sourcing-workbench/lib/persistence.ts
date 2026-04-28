import { reportError } from "@/lib/observability";
import {
    PLATFORMS,
    PROSPECT_STAGES,
    type Platform,
    type Prospect,
    type ProspectStage,
    type QueryCard
} from "./types";

const KEY_QUERY_CARDS = "gtmos_sw_query_cards";
const KEY_PROSPECTS = "gtmos_sw_prospects";

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

function asPlatform(v: unknown): Platform {
    return typeof v === "string" && (PLATFORMS as ReadonlyArray<string>).includes(v)
        ? (v as Platform)
        : "linkedin";
}

function asStage(v: unknown): ProspectStage {
    return typeof v === "string" &&
        (PROSPECT_STAGES as ReadonlyArray<string>).includes(v)
        ? (v as ProspectStage)
        : "captured";
}

function asLeverage(v: unknown): Prospect["leverage"] {
    const lev = asString(v);
    if (
        lev === "network-connection" ||
        lev === "existing-proof-point" ||
        lev === "market-signal" ||
        lev === "geographic-advantage"
    ) {
        return lev;
    }
    return "cold";
}

function parseQueryCard(raw: unknown): QueryCard | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const query = asString(r["query"]);
    if (!id || !query) return null;
    return {
        id,
        platform: asPlatform(r["platform"]),
        query,
        intent: asString(r["intent"]),
        notes: asString(r["notes"]),
        targetIcp: asString(r["targetIcp"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

function parseProspect(raw: unknown): Prospect | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const accountName = asString(r["accountName"]);
    if (!id || !accountName) return null;
    return {
        id,
        accountName,
        contactName: asString(r["contactName"]),
        contactTitle: asString(r["contactTitle"]),
        sourceQueryId: asString(r["sourceQueryId"]),
        leverage: asLeverage(r["leverage"]),
        stage: asStage(r["stage"]),
        entryPoint: asString(r["entryPoint"]),
        approach: asString(r["approach"]),
        notes: asString(r["notes"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

export function loadQueryCards(
    s?: StorageLike | null
): ReadonlyArray<QueryCard> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem(KEY_QUERY_CARDS);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: QueryCard[] = [];
        for (const row of parsed) {
            const c = parseQueryCard(row);
            if (c) out.push(c);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "sourcing.loadQueryCards" });
        return [];
    }
}

export function loadProspects(
    s?: StorageLike | null
): ReadonlyArray<Prospect> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem(KEY_PROSPECTS);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: Prospect[] = [];
        for (const row of parsed) {
            const p = parseProspect(row);
            if (p) out.push(p);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "sourcing.loadProspects" });
        return [];
    }
}

export interface SaveAllInput {
    readonly queryCards: ReadonlyArray<QueryCard>;
    readonly prospects: ReadonlyArray<Prospect>;
}

export function saveAll(next: SaveAllInput, s?: StorageLike | null): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(KEY_QUERY_CARDS, JSON.stringify(next.queryCards));
        store.setItem(KEY_PROSPECTS, JSON.stringify(next.prospects));
    } catch (err) {
        reportError(err, { op: "sourcing.saveAll" });
    }
}
