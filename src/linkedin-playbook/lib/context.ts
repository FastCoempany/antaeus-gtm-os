import { reportError } from "@/lib/observability";
import type {
    BestIcp,
    HottestAccount,
    LatestTouch
} from "./types";

/**
 * Phase 4 / Room 8 Wave 5 — inbound context loaders.
 *
 * Three pure readers that pull cross-room state from localStorage at
 * boot. Each one mirrors a specific legacy helper (`getBestIcp`,
 * `getHottestSignalAccount`, `getLatestOutboundTouch` — lines 104-106
 * of `app/linkedin-playbook/index.html`).
 *
 * Defensive throughout: null storage → null result, missing key → null,
 * malformed JSON → null + reportError, wrong shape → null.
 */

const ICP_KEY = "gtmos_icp_analytics";
const SIGNAL_KEY = "gtmos_sc_v4";
const TOUCHES_KEY = "gtmos_outbound_touches";

interface StorageReader {
    getItem(key: string): string | null;
}

function getStorage(
    storage?: StorageReader | null
): StorageReader | null {
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
    return 0;
}

/**
 * Read the best ICP from `gtmos_icp_analytics.icps[]`, ranked by
 * qualityScore desc. Returns null when the array is empty or no
 * row has a usable name.
 */
export function loadBestIcp(
    storage?: StorageReader | null
): BestIcp | null {
    const s = getStorage(storage);
    if (!s) return null;
    try {
        const raw = s.getItem(ICP_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return null;
        const arr = Array.isArray(root["icps"]) ? root["icps"] : [];
        let best: BestIcp | null = null;
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const name = asString(o["name"]);
            if (!name) continue;
            const qualityScore = asNumber(o["qualityScore"]);
            if (!best || qualityScore > best.qualityScore) {
                best = { name, qualityScore };
            }
        }
        return best;
    } catch (err) {
        reportError(err, { op: "linkedin-playbook.loadBestIcp" });
        return null;
    }
}

/**
 * Read the hottest Signal Console account from
 * `gtmos_sc_v4.accounts[]`, ranked by heat (preferring the new `heat`
 * field over legacy `_heat` when both exist — same presence-check rule
 * Phase 4 / Room 7's account-loader uses post-Codex P2 fix).
 */
export function loadHottestAccount(
    storage?: StorageReader | null
): HottestAccount | null {
    const s = getStorage(storage);
    if (!s) return null;
    try {
        const raw = s.getItem(SIGNAL_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return null;
        const arr = Array.isArray(root["accounts"])
            ? root["accounts"]
            : [];
        let best: HottestAccount | null = null;
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const name = asString(o["name"]);
            if (!name) continue;
            const heat =
                "heat" in o
                    ? asNumber(o["heat"])
                    : asNumber(o["_heat"]);
            if (!best || heat > best.heat) {
                best = { name, heat };
            }
        }
        return best;
    } catch (err) {
        reportError(err, {
            op: "linkedin-playbook.loadHottestAccount"
        });
        return null;
    }
}

/**
 * Read the most-recent outbound touch from
 * `gtmos_outbound_touches.touches[]` (Phase 4 / Room 6's mirror).
 * Picks the row with the latest createdAt / savedAt.
 */
export function loadLatestTouch(
    storage?: StorageReader | null
): LatestTouch | null {
    const s = getStorage(storage);
    if (!s) return null;
    try {
        const raw = s.getItem(TOUCHES_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return null;
        const arr = Array.isArray(root["touches"])
            ? root["touches"]
            : [];
        let latestTime = -Infinity;
        let latest: LatestTouch | null = null;
        for (const row of arr) {
            const o = asObject(row);
            if (!o) continue;
            const accountName = asString(o["accountName"]);
            if (!accountName) continue;
            const createdAt =
                asString(o["createdAt"]) || asString(o["savedAt"]);
            const t = createdAt ? Date.parse(createdAt) : 0;
            if (Number.isFinite(t) && t > latestTime) {
                latestTime = t;
                latest = { accountName, createdAt };
            }
        }
        return latest;
    } catch (err) {
        reportError(err, { op: "linkedin-playbook.loadLatestTouch" });
        return null;
    }
}
