/**
 * Synthesis response parsing (B.2c).
 *
 * Defensive parsers for the Draft / Critique / Revise LLM responses.
 * The model is instructed to return JSON only, but parsing must never
 * throw — a malformed response degrades to a parse error the driver
 * records, not a crash. Same posture as parse-response.ts (enrich).
 *
 * Canonical reference + vitest-tested; Deno mirror in synthesis-shared.ts.
 */

import type {
    Critique,
    CritiqueIssue,
    CritiqueSeverity,
    DraftPattern,
    RecommendedMove,
    SixQuestions
} from "./types";

export interface DraftParseResult {
    readonly pattern: DraftPattern | null;
    readonly error: string | null;
}

export interface CritiqueParseResult {
    readonly critique: Critique | null;
    readonly error: string | null;
}

const TRAJECTORIES: ReadonlyArray<string> = ["rising", "stable", "declining"];
const SEVERITIES: ReadonlyArray<string> = ["minor", "significant", "major"];

function extractJsonObject(raw: string): string | null {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    let s = raw.trim();
    const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch && fenceMatch[1] !== undefined) s = fenceMatch[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return s.slice(start, end + 1);
}

function asString(v: unknown, fallback = ""): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return fallback;
    return String(v);
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
}

function asTrajectory(v: unknown): "rising" | "stable" | "declining" | null {
    if (typeof v === "string" && TRAJECTORIES.includes(v)) {
        return v as "rising" | "stable" | "declining";
    }
    return null;
}

function asSeverity(v: unknown): CritiqueSeverity {
    if (typeof v === "string" && SEVERITIES.includes(v)) {
        return v as CritiqueSeverity;
    }
    return "minor";
}

function asConfidence(v: unknown): number {
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
        const p = Number.parseFloat(v);
        n = Number.isFinite(p) ? p : 0.5;
    } else n = 0.5;
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
}

function asSixQuestions(v: unknown): SixQuestions {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    return {
        what_changed: asString(o["what_changed"]).trim(),
        evidence: asString(o["evidence"]).trim(),
        confidence_rationale: asString(o["confidence_rationale"]).trim(),
        why_it_matters: asString(o["why_it_matters"]).trim(),
        who_needs_to_know: asString(o["who_needs_to_know"]).trim(),
        what_next: asString(o["what_next"]).trim()
    };
}

function asMoves(v: unknown): RecommendedMove[] {
    if (!Array.isArray(v)) return [];
    const out: RecommendedMove[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const action = asString(o["action"]).trim();
        const destination = asString(o["destination"]).trim();
        if (action.length === 0 && destination.length === 0) continue;
        out.push({
            action,
            rationale: asString(o["rationale"]).trim(),
            destination
        });
    }
    return out;
}

/**
 * Parse a Draft (or Revise — same schema) response into a DraftPattern.
 * The draft may wrap the pattern under a "draft_pattern" / "pattern"
 * key alongside a "reasoning" block (extended thinking); accept either
 * the wrapped or the bare shape.
 */
export function parseDraftResponse(raw: string): DraftParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) {
        return { pattern: null, error: "no JSON object found in response" };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            pattern: null,
            error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { pattern: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    // Unwrap if the pattern is nested under a known key.
    const candidate =
        root["draft_pattern"] && typeof root["draft_pattern"] === "object"
            ? (root["draft_pattern"] as Record<string, unknown>)
            : root["pattern"] && typeof root["pattern"] === "object"
            ? (root["pattern"] as Record<string, unknown>)
            : root["revised_pattern"] && typeof root["revised_pattern"] === "object"
            ? (root["revised_pattern"] as Record<string, unknown>)
            : root;

    const name = asString(candidate["name"]).trim();
    const analysis = asString(candidate["analysis"]).trim();
    if (name.length === 0) {
        return { pattern: null, error: "pattern missing required 'name'" };
    }
    if (analysis.length === 0) {
        return { pattern: null, error: "pattern missing required 'analysis'" };
    }

    return {
        pattern: {
            name,
            trajectory: asTrajectory(candidate["trajectory"]),
            analysis,
            six_questions: asSixQuestions(candidate["six_questions"]),
            recommended_moves: asMoves(candidate["recommended_moves"]),
            evidence_item_ids: asStringArray(candidate["evidence_item_ids"]),
            confidence: asConfidence(candidate["confidence"])
        },
        error: null
    };
}

function asIssues(v: unknown): CritiqueIssue[] {
    if (!Array.isArray(v)) return [];
    const out: CritiqueIssue[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        out.push({
            quote: asString(o["quote"]).trim(),
            issue: asString(o["issue"]).trim(),
            severity: asSeverity(o["severity"])
        });
    }
    return out;
}

function asObjections(
    v: unknown
): Array<{ objection: string; severity: CritiqueSeverity }> {
    if (!Array.isArray(v)) return [];
    const out: Array<{ objection: string; severity: CritiqueSeverity }> = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        const objection = asString(o["objection"]).trim();
        if (objection.length === 0) continue;
        out.push({ objection, severity: asSeverity(o["severity"]) });
    }
    return out;
}

function asBool(v: unknown, fallback = false): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        const n = v.toLowerCase().trim();
        if (n === "true") return true;
        if (n === "false") return false;
    }
    return fallback;
}

export function parseCritiqueResponse(raw: string): CritiqueParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) {
        return { critique: null, error: "no JSON object found in response" };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            critique: null,
            error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { critique: null, error: "response root is not a JSON object" };
    }
    const root = parsed as Record<string, unknown>;
    const c =
        root["critique"] && typeof root["critique"] === "object"
            ? (root["critique"] as Record<string, unknown>)
            : root;

    return {
        critique: {
            overclaimed_assertions: asIssues(c["overclaimed_assertions"]),
            unsupported_claims: asIssues(c["unsupported_claims"]),
            banned_vocabulary_used: asStringArray(c["banned_vocabulary_used"]),
            excessive_hedging: asStringArray(c["excessive_hedging"]),
            marketing_soup: asStringArray(c["marketing_soup"]),
            weak_action: asStringArray(c["weak_action"]),
            obvious_objections: asObjections(c["obvious_objections"]),
            revise_required: asBool(root["revise_required"] ?? c["revise_required"]),
            overall_assessment: asString(
                root["overall_assessment"] ?? c["overall_assessment"]
            ).trim()
        },
        error: null
    };
}
