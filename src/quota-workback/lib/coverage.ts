import { reportError } from "@/lib/observability";
import { EMPTY_COVERAGE, type CoverageSnapshot } from "./types";

/**
 * Coverage snapshot from `gtmos_deal_workspaces` (the Phase 4 / Room 1
 * Deal Workspace mirror, which Future Autopsy + Quota Workback both
 * read). Faithful subset port of the legacy `dh.computeCoverage` from
 * `js/deal-health.js`:
 *
 *   - raw   = sum of open-deal `value` (open = stage not won/lost)
 *   - weighted = sum of value * stageProbability (per stage map below)
 *   - ratio = round(weighted / quota * 10) / 10
 *   - needed = max(0, quota * targetRatio - weighted)  (legacy used
 *              targetRatio inline in renderCoverage; we pass it back to
 *              the renderer to compute since per-band coverage targets
 *              differ)
 *
 * The legacy file is too tied to global window.dealHealth to import
 * directly; reimplementing the relevant subset keeps Room 14 honest
 * to the new-stack data contract.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

const STAGE_PROBABILITY: Readonly<Record<string, number>> = {
    prospect: 0.1,
    qualifying: 0.2,
    discovery: 0.3,
    poc: 0.5,
    proposal: 0.65,
    negotiation: 0.8,
    "closed-won": 1,
    "closed-lost": 0,
    won: 1,
    lost: 0
};

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const cleaned = v.replace(/[^0-9.\-]/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function isOpen(stage: string): boolean {
    const s = stage.toLowerCase();
    return s !== "won" && s !== "lost" && s !== "closed-won" && s !== "closed-lost";
}

function probability(stage: string): number {
    return STAGE_PROBABILITY[stage.toLowerCase()] ?? 0.3;
}

function loadDealRows(s?: StorageLike | null): ReadonlyArray<unknown> {
    const store = getStorage(s);
    if (!store) return [];
    try {
        const raw = store.getItem("gtmos_deal_workspaces");
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>)["deals"])) {
            return (parsed as Record<string, unknown>)["deals"] as ReadonlyArray<unknown>;
        }
    } catch (err) {
        reportError(err, { op: "quota.loadDealRows" });
    }
    return [];
}

export function computeCoverage(
    quota: number,
    s?: StorageLike | null
): CoverageSnapshot {
    const rows = loadDealRows(s);
    if (!quota || quota <= 0 || rows.length === 0) {
        return { ...EMPTY_COVERAGE, hasDeals: rows.length > 0 };
    }

    let raw = 0;
    let weighted = 0;
    let openCount = 0;
    for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const stage =
            asString(r["stage"]) || asString(r["currentStage"]) || "prospect";
        if (!isOpen(stage)) continue;
        openCount++;
        const value = asNumber(r["value"] ?? r["amount"] ?? r["dealValue"]);
        raw += value;
        weighted += value * probability(stage);
    }

    if (openCount === 0) {
        return { ...EMPTY_COVERAGE, hasDeals: rows.length > 0 };
    }

    const ratio = Math.round((weighted / quota) * 10) / 10;
    const needed = Math.max(0, quota - weighted);

    return {
        ratio,
        weighted: Math.round(weighted),
        raw: Math.round(raw),
        needed: Math.round(needed),
        hasDeals: true
    };
}
