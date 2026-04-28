import { reportError } from "@/lib/observability";
import {
    EMPTY_ANALYTICS,
    type IcpAnalytics,
    type RoleKey,
    type SavedIcp
} from "./types";

/**
 * Phase 4 / Room 11 Wave 4 — persistence helpers.
 *
 * `gtmos_icp_analytics` carries the full ICP library + session counter
 * (legacy line 1096). Defensive parser drops malformed rows; bubbles
 * errors through reportError().
 */

const STORAGE_KEY = "gtmos_icp_analytics";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
    if (storage !== undefined) return storage;
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
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

function asRole(v: unknown): RoleKey {
    return v === "firstae" ? "firstae" : "founder";
}

function parseSavedIcp(raw: unknown): SavedIcp | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    if (!id) return null;
    return {
        id,
        statement: asString(r["statement"]),
        role: asRole(r["role"]),
        industry: asString(r["industry"]),
        size: asString(r["size"]),
        geo: asString(r["geo"]),
        buyer: asString(r["buyer"]),
        pain: asString(r["pain"]),
        trigger: asString(r["trigger"]),
        proofWindow: asString(r["proofWindow"]),
        engineActive: asNumber(r["engineActive"] ?? r["activeAccounts"]),
        qualityScore: asNumber(r["qualityScore"]),
        qualityChecks: Array.isArray(r["qualityChecks"])
            ? r["qualityChecks"].filter((c) => {
                  const o = asObject(c);
                  return o && typeof o["text"] === "string";
              }).map((c) => {
                  const o = asObject(c)!;
                  const tone = asString(o["tone"]);
                  return {
                      tone:
                          tone === "good" || tone === "warn" || tone === "risk"
                              ? tone
                              : "warn",
                      text: asString(o["text"])
                  };
              })
            : [],
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        updatedAt:
            asString(r["updatedAt"]) ||
            asString(r["createdAt"]) ||
            new Date().toISOString()
    };
}

export function loadAnalytics(
    storage?: StorageLike | null
): IcpAnalytics {
    const s = getStorage(storage);
    if (!s) return EMPTY_ANALYTICS;
    try {
        const raw = s.getItem(STORAGE_KEY);
        if (!raw) return EMPTY_ANALYTICS;
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return EMPTY_ANALYTICS;
        const arr = Array.isArray(root["icps"])
            ? (root["icps"] as ReadonlyArray<unknown>)
            : [];
        const out: SavedIcp[] = [];
        for (const row of arr) {
            const icp = parseSavedIcp(row);
            if (icp) out.push(icp);
        }
        const totalWorked = asNumber(root["totalWorked"]);
        return {
            icps: out,
            totalWorked: Math.max(0, Math.floor(totalWorked))
        };
    } catch (err) {
        reportError(err, { op: "icp-studio.loadAnalytics" });
        return EMPTY_ANALYTICS;
    }
}

export function saveAnalytics(
    analytics: IcpAnalytics,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(
            STORAGE_KEY,
            JSON.stringify({
                icps: analytics.icps,
                totalWorked: analytics.totalWorked
            })
        );
    } catch (err) {
        reportError(err, { op: "icp-studio.saveAnalytics" });
    }
}

/** Stable id helper. */
export function uid(prefix: string, now: number = Date.now()): string {
    return `${prefix}_${now}_${Math.random().toString(36).slice(2, 7)}`;
}
