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

/**
 * Map legacy platform keys (sales-nav / zoominfo / apollo / google-boolean /
 * conference / crm / custom) onto the new-stack platform enum
 * (linkedin / search / intent / signals / list).
 */
const LEGACY_PLATFORM_MAP: Readonly<Record<string, Platform>> = {
    "sales-nav": "linkedin",
    linkedin: "linkedin",
    "google-boolean": "search",
    search: "search",
    zoominfo: "intent",
    apollo: "intent",
    intent: "intent",
    conference: "signals",
    signals: "signals",
    crm: "list",
    list: "list",
    custom: "list"
};

function asPlatform(v: unknown): Platform {
    if (typeof v !== "string") return "linkedin";
    if ((PLATFORMS as ReadonlyArray<string>).includes(v)) return v as Platform;
    return LEGACY_PLATFORM_MAP[v] ?? "linkedin";
}

/**
 * Map legacy prospect stages (captured / researched / ready / pushed /
 * parked / rejected) onto the new-stack stages. Legacy `parked` and
 * `rejected` both fold into `dropped` so we never lose pipeline
 * history during cutover.
 */
const LEGACY_STAGE_MAP: Readonly<Record<string, ProspectStage>> = {
    captured: "captured",
    researched: "researched",
    ready: "ready",
    pushed: "pushed",
    dropped: "dropped",
    parked: "dropped",
    rejected: "dropped"
};

function asStage(v: unknown): ProspectStage {
    if (typeof v !== "string") return "captured";
    if ((PROSPECT_STAGES as ReadonlyArray<string>).includes(v)) {
        return v as ProspectStage;
    }
    return LEGACY_STAGE_MAP[v] ?? "captured";
}

/**
 * Compose a query string from the legacy `filters` object when the
 * top-level `query` field is missing. The legacy schema put each
 * filter in its own field (industry / companySize / geography /
 * behavioralSignal / techSignal / personaTitles / booleanString /
 * exclusions / customNotes); we serialize the most operationally-
 * meaningful subset back into a single readable line so the operator
 * doesn't lose history on cutover.
 *
 * Priority: booleanString (highest fidelity) → personaTitles +
 * industry (most common query intent) → industry alone (last resort).
 */
function deriveLegacyQuery(filters: Record<string, unknown>): string {
    const boolean = asString(filters["booleanString"]).trim();
    if (boolean) return boolean;
    const personas = asString(filters["personaTitles"]).trim();
    const industry = asString(filters["industry"]).trim();
    const parts: string[] = [];
    if (personas) parts.push(personas);
    if (industry) parts.push(industry);
    if (parts.length > 0) return parts.join(" / ");
    const signal = asString(filters["behavioralSignal"]).trim();
    if (signal) return signal;
    const tech = asString(filters["techSignal"]).trim();
    if (tech) return tech;
    return "";
}

function deriveLegacyIntent(filters: Record<string, unknown>): string {
    const industry = asString(filters["industry"]).trim();
    const geography = asString(filters["geography"]).trim();
    const personas = asString(filters["personaTitles"]).trim();
    const parts: string[] = [];
    if (personas) parts.push(personas);
    if (industry) parts.push(industry);
    if (geography) parts.push(geography);
    return parts.join(" · ");
}

function deriveLegacyNotes(filters: Record<string, unknown>): string {
    const direct = asString(filters["customNotes"]).trim();
    const exclusions = asString(filters["exclusions"]).trim();
    if (direct && exclusions) return `${direct}. Exclude: ${exclusions}`;
    if (direct) return direct;
    if (exclusions) return `Exclude: ${exclusions}`;
    return "";
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
    if (!id) return null;

    // Legacy `gtmos_sw_query_cards` rows from the static-HTML room
    // (app/sourcing-workbench/index.html lines 1846-1869) store the
    // operational fields under a `filters` object with keys industry /
    // companySize / geography / behavioralSignal / techSignal /
    // personaTitles / booleanString / exclusions / customNotes; the
    // top-level `query` field does not exist. Fall back to deriving
    // a readable query from those filters so cutover does not erase
    // pre-migration history.
    const filters = asObject(r["filters"]) ?? {};
    const query = asString(r["query"]) || deriveLegacyQuery(filters);
    if (!query) return null;

    return {
        id,
        platform: asPlatform(r["platform"]),
        query,
        intent: asString(r["intent"]) || deriveLegacyIntent(filters),
        notes: asString(r["notes"]) || deriveLegacyNotes(filters),
        targetIcp:
            asString(r["targetIcp"]) || asString(filters["industry"]),
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
    // Legacy `gtmos_sw_prospects` rows (app/sourcing-workbench lines
    // 2049-2055) use `name` for the company; the new-stack field is
    // `accountName`. Accept either so cutover does not drop history.
    const accountName =
        asString(r["accountName"]) || asString(r["name"]);
    if (!id || !accountName) return null;
    // Legacy prospects also carry `sourceQueryCardId`; fall back to
    // that when the new field is missing.
    const sourceQueryId =
        asString(r["sourceQueryId"]) || asString(r["sourceQueryCardId"]);
    return {
        id,
        accountName,
        contactName: asString(r["contactName"]),
        contactTitle: asString(r["contactTitle"]),
        sourceQueryId,
        leverage: asLeverage(r["leverage"]),
        stage: asStage(r["stage"]),
        entryPoint: asString(r["entryPoint"]),
        approach: asString(r["approach"]),
        notes:
            asString(r["notes"]) || asString(r["initialImpression"]),
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
