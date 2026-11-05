import type {
    ProspectResearch,
    ResearchConfidence,
    ResearchSignal,
    SuggestedAnswers,
    WhoToTarget
} from "./types";

/**
 * Defensive parser for the optional `webResearch` block on a stored
 * prospect (localStorage row or studio_artifacts.data). Old rows have no
 * block and load unchanged; malformed blocks are ignored rather than
 * failing the row. Only https source links survive.
 */

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asStringList(v: unknown, max: number): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max);
}

export function isHttpsUrl(v: unknown): v is string {
    return typeof v === "string" && /^https:\/\/[^\s]+\.[^\s]+/i.test(v.trim());
}

function parseSignal(v: unknown): ResearchSignal | null {
    const o = asObject(v);
    if (!o) return null;
    const what = asString(o["what"]).trim();
    if (!what) return null;
    const date = asString(o["date"]);
    const sourceUrl = isHttpsUrl(o["sourceUrl"]) ? (o["sourceUrl"] as string).trim() : null;
    const sourceName = asString(o["sourceName"]).trim() || null;
    return {
        what,
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        sourceUrl,
        sourceName
    };
}

function parseWho(v: unknown): WhoToTarget | null {
    const o = asObject(v);
    if (!o) return null;
    const role = asString(o["role"]).trim();
    if (!role) return null;
    return { role, why: asString(o["why"]).trim() };
}

function parseSuggested(v: unknown): SuggestedAnswers | null {
    const o = asObject(v);
    if (!o) return null;
    const s: SuggestedAnswers = {
        targetFit: asString(o["targetFit"]).trim(),
        wayIn: asString(o["wayIn"]).trim(),
        outreach: asString(o["outreach"]).trim()
    };
    return s.targetFit || s.wayIn || s.outreach ? s : null;
}

function parseConfidence(v: unknown): ResearchConfidence | null {
    return v === "high" || v === "medium" || v === "low" ? v : null;
}

export function parseProspectResearch(v: unknown): ProspectResearch | undefined {
    const o = asObject(v);
    if (!o) return undefined;
    const researchedAt = asString(o["researchedAt"]);
    if (!researchedAt) return undefined;
    const signals = Array.isArray(o["signals"])
        ? (o["signals"] as unknown[]).map(parseSignal).filter((x): x is ResearchSignal => x !== null).slice(0, 5)
        : [];
    return {
        kind: o["kind"] === "research" ? "research" : "find",
        researchedAt,
        summary: asString(o["summary"]).trim(),
        domain: asString(o["domain"]).trim() || null,
        signals,
        sources: asStringList(o["sources"], 6).filter(isHttpsUrl),
        whoToTarget: parseWho(o["whoToTarget"]),
        openingAngle: asString(o["openingAngle"]).trim(),
        confidence: parseConfidence(o["confidence"]),
        fitMatches: asStringList(o["fitMatches"], 4),
        fitUnknowns: asStringList(o["fitUnknowns"], 4),
        suggested: parseSuggested(o["suggested"]),
        sample: o["sample"] === true,
        ...(o["auto"] === true ? { auto: true } : {})
    };
}

/** Optional saved-search check fields; absent on older rows. */
export function parseQueryCardCheck(
    o: Record<string, unknown>
): { lastCheckedAt?: string; lastNewCount?: number; lastCheckedBy?: "auto" | "you" } {
    const out: { lastCheckedAt?: string; lastNewCount?: number; lastCheckedBy?: "auto" | "you" } = {};
    const by = o["lastCheckedBy"];
    if (by === "auto" || by === "you") out.lastCheckedBy = by;
    const at = asString(o["lastCheckedAt"]);
    if (at) out.lastCheckedAt = at;
    const n = o["lastNewCount"];
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) out.lastNewCount = Math.floor(n);
    return out;
}
