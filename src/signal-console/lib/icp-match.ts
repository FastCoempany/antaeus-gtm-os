/**
 * ICP match — score how well an Account fits the operator's ICP ICP.
 *
 * Per canon Part I §4.4: the ICP filter "manifests as ICP Match scoring
 * on every Account everywhere." This is the Signal Console version —
 * lightweight string-overlap heuristic (industry + geo) over the most
 * recent / highest-quality saved ICP in `gtmos_icp_analytics.icps[]`.
 *
 * Output ranges 0–100:
 *   - >= 75   → "Fit"     (industry overlap + at least one secondary)
 *   - >= 50   → "Loose"   (one strong dimension matches)
 *   -   else  → "Off"     (no obvious overlap)
 *
 * Callers can render the chip OR omit it when null is returned
 * (no ICP defined yet → no signal worth showing).
 *
 * This is intentionally simple. A future PR can deepen the engine —
 * persona overlap, trigger match, behavioral signal alignment, etc.
 */

import type { Account } from "./types";

export type IcpFitBand = "fit" | "loose" | "off";

export interface IcpMatch {
    readonly score: number;
    readonly band: IcpFitBand;
    readonly label: string;
}

interface SavedIcpLike {
    readonly id?: string;
    readonly industry?: string;
    readonly geo?: string;
    readonly size?: string;
    readonly qualityScore?: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

interface IcpEnvelope {
    readonly icps?: ReadonlyArray<unknown>;
}

interface StorageLike {
    getItem(k: string): string | null;
}

const KEY = "gtmos_icp_analytics";

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

/**
 * Read the "best" saved ICP — highest qualityScore, ties broken by
 * most-recent updatedAt. Returns null when no ICP is saved.
 */
export function bestSavedIcp(
    storage?: StorageLike | null
): SavedIcpLike | null {
    const s =
        storage ??
        (typeof localStorage !== "undefined" ? localStorage : null);
    if (!s) return null;
    let raw: string | null;
    try {
        raw = s.getItem(KEY);
    } catch {
        return null;
    }
    if (!raw) return null;
    let parsed: IcpEnvelope;
    try {
        parsed = JSON.parse(raw) as IcpEnvelope;
    } catch {
        return null;
    }
    const arr = Array.isArray(parsed.icps) ? parsed.icps : [];
    let best: SavedIcpLike | null = null;
    for (const item of arr) {
        const obj = asObject(item);
        if (!obj) continue;
        const candidate: SavedIcpLike = {
            id: asString(obj["id"]),
            industry: asString(obj["industry"]),
            geo: asString(obj["geo"]),
            size: asString(obj["size"]),
            qualityScore: asNumber(obj["qualityScore"]),
            createdAt: asString(obj["createdAt"]),
            updatedAt: asString(obj["updatedAt"])
        };
        if (!best) {
            best = candidate;
            continue;
        }
        const bestScore = best.qualityScore ?? 0;
        const candidateScore = candidate.qualityScore ?? 0;
        if (candidateScore > bestScore) {
            best = candidate;
            continue;
        }
        if (candidateScore === bestScore) {
            if ((candidate.updatedAt ?? "") > (best.updatedAt ?? "")) {
                best = candidate;
            }
        }
    }
    return best;
}

function bandFromScore(score: number): IcpFitBand {
    if (score >= 75) return "fit";
    if (score >= 50) return "loose";
    return "off";
}

function labelFromBand(band: IcpFitBand): string {
    if (band === "fit") return "ICP fit";
    if (band === "loose") return "ICP loose";
    return "ICP off";
}

function normalize(s: string): string {
    return (s ?? "").toLowerCase().trim();
}

function hasOverlap(a: string, b: string): boolean {
    const na = normalize(a);
    const nb = normalize(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    return na.includes(nb) || nb.includes(na);
}

/**
 * Score one account against one ICP. Returns null when no ICP is
 * available to compare against (caller should hide the chip in that
 * case). Otherwise returns score 0-100, band, and a one-line label.
 *
 * Pure — accepts an injected `bestIcp` so tests + callers don't have
 * to mock localStorage.
 */
export function scoreAccountAgainstIcp(
    account: Account,
    icp: SavedIcpLike | null
): IcpMatch | null {
    if (!icp) return null;

    const accountIndustry = account.industry ?? "";
    const accountHq = account.hq ?? "";

    const icpIndustry = icp.industry ?? "";
    const icpGeo = icp.geo ?? "";

    // No ICP context at all → no signal worth showing.
    if (!icpIndustry && !icpGeo) return null;

    let score = 0;

    if (icpIndustry) {
        if (hasOverlap(accountIndustry, icpIndustry)) {
            score += 60; // industry is the primary dimension
        } else if (accountIndustry) {
            // account has an industry but it doesn't match → strong
            // off-signal, dock the score
            score += 10;
        } else {
            // unknown industry on the account → neutral 25
            score += 25;
        }
    }

    if (icpGeo) {
        if (hasOverlap(accountHq, icpGeo)) {
            score += 30;
        } else if (accountHq) {
            score += 10;
        } else {
            score += 15;
        }
    } else {
        // no geo on the ICP → weight industry more
        score += 10;
    }

    score = Math.min(100, Math.max(0, score));
    const band = bandFromScore(score);
    return {
        score,
        band,
        label: labelFromBand(band)
    };
}

/**
 * Convenience: read the best saved ICP from storage + score the
 * account in one call. Returns null when no ICP exists.
 */
export function matchAccountToIcp(
    account: Account,
    storage?: StorageLike | null
): IcpMatch | null {
    const icp = bestSavedIcp(storage);
    return scoreAccountAgainstIcp(account, icp);
}
