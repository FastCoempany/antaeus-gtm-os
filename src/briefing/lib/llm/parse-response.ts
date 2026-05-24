/**
 * Response parsing for the Briefing LLM layer (B.2a — Stage 3.3 Enrich).
 *
 * Defensive parser for the EnrichedItem JSON the model returns. The
 * model is instructed to produce a strict JSON object matching the
 * schema in the prompt, but in practice LLMs:
 *   - sometimes wrap responses in markdown code fences
 *   - sometimes prefix with a "Here's the analysis:" preamble
 *   - sometimes drop optional fields
 *   - sometimes coerce booleans to strings ("true" vs true)
 *   - sometimes hallucinate enum values
 *
 * This parser handles all of that without throwing. Invalid responses
 * surface as null + an error message; the caller (Stage 3.3 dispatch)
 * records the error per-item and moves on. The pipeline doesn't
 * fail on one bad enrichment.
 */

export interface ExecMove {
    readonly person_name: string;
    readonly new_role: string;
    readonly company: string;
    readonly action: string;
    readonly prior_company: string | null;
    readonly effective_date: string | null;
}

export interface Entities {
    readonly companies: ReadonlyArray<string>;
    readonly people: ReadonlyArray<string>;
    readonly products: ReadonlyArray<string>;
    readonly technologies: ReadonlyArray<string>;
}

export type ClaimType = "fact" | "claim" | "speculation";

export interface EnrichedItem {
    readonly entities: Entities;
    readonly exec_move: ExecMove | null;
    readonly event_category: string;
    readonly topic_tags: ReadonlyArray<string>;
    readonly pain_tags: ReadonlyArray<string>;
    readonly claim_type: ClaimType;
    readonly summary: string;
    readonly what_changed: string;
    readonly user_relevance_score: number;
    readonly matches_triggers: ReadonlyArray<string>;
    readonly affects_deals: ReadonlyArray<string>;
    readonly is_noise: boolean;
}

export interface ParseResult {
    readonly enriched: EnrichedItem | null;
    readonly error: string | null;
}

const VALID_CLAIM_TYPES: ReadonlyArray<ClaimType> = [
    "fact",
    "claim",
    "speculation"
];

/**
 * Strip markdown code fences if the model wrapped the JSON in one,
 * trim whitespace, and return the JSON object substring (first '{'
 * through matching '}'). Returns null if no JSON object is detectable.
 */
function extractJsonObject(raw: string): string | null {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;

    let s = raw.trim();
    // Strip triple-backtick fences, optionally with a language tag.
    const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch && fenceMatch[1] !== undefined) {
        s = fenceMatch[1].trim();
    }

    // Find the first '{' and last '}' — handles preamble + postscript
    // text the model sometimes adds.
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return s.slice(start, end + 1);
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    if (!Array.isArray(v)) return [];
    return v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
}

function asString(v: unknown, fallback = ""): string {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return fallback;
    return String(v);
}

function asBool(v: unknown, fallback = false): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
        const norm = v.toLowerCase().trim();
        if (norm === "true") return true;
        if (norm === "false") return false;
    }
    return fallback;
}

function asNumberClamped(v: unknown, lo: number, hi: number, fallback: number): number {
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string") {
        const parsed = Number.parseFloat(v);
        n = Number.isFinite(parsed) ? parsed : fallback;
    } else n = fallback;
    if (!Number.isFinite(n)) return fallback;
    return Math.min(hi, Math.max(lo, n));
}

function asClaimType(v: unknown): ClaimType {
    if (typeof v === "string" && (VALID_CLAIM_TYPES as ReadonlyArray<string>).includes(v)) {
        return v as ClaimType;
    }
    return "claim";
}

function asEntities(v: unknown): Entities {
    if (!v || typeof v !== "object") {
        return { companies: [], people: [], products: [], technologies: [] };
    }
    const o = v as Record<string, unknown>;
    return {
        companies: asStringArray(o["companies"]),
        people: asStringArray(o["people"]),
        products: asStringArray(o["products"]),
        technologies: asStringArray(o["technologies"])
    };
}

function asExecMove(v: unknown): ExecMove | null {
    if (v === null || v === undefined) return null;
    if (typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const person_name = asString(o["person_name"]);
    const company = asString(o["company"]);
    // person_name + company are the minimum to be meaningful. If
    // either is missing, treat the whole exec_move as null.
    if (person_name.length === 0 || company.length === 0) return null;
    return {
        person_name,
        new_role: asString(o["new_role"]),
        company,
        action: asString(o["action"], "appointed"),
        prior_company:
            typeof o["prior_company"] === "string" && (o["prior_company"] as string).length > 0
                ? (o["prior_company"] as string)
                : null,
        effective_date:
            typeof o["effective_date"] === "string" && (o["effective_date"] as string).length > 0
                ? (o["effective_date"] as string)
                : null
    };
}

/**
 * Parse a raw model response into an EnrichedItem. Defensive against
 * every malformed-output mode I've seen. Returns { enriched, error }
 * — enriched is null on any parse failure, with a human-readable
 * error string.
 */
export function parseEnrichResponse(raw: string): ParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) {
        return {
            enriched: null,
            error: "no JSON object found in response"
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            enriched: null,
            error: `JSON parse failed: ${
                err instanceof Error ? err.message : String(err)
            }`
        };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
            enriched: null,
            error: "response root is not a JSON object"
        };
    }

    const o = parsed as Record<string, unknown>;

    // Summary is the one non-optional, semantically-load-bearing
    // field. If it's missing or empty, the enrichment failed.
    const summary = asString(o["summary"]).trim();
    if (summary.length === 0) {
        return {
            enriched: null,
            error: "response missing required 'summary' field"
        };
    }

    return {
        enriched: {
            entities: asEntities(o["entities"]),
            exec_move: asExecMove(o["exec_move"]),
            event_category: asString(o["event_category"], "other"),
            topic_tags: asStringArray(o["topic_tags"]),
            pain_tags: asStringArray(o["pain_tags"]),
            claim_type: asClaimType(o["claim_type"]),
            summary,
            what_changed: asString(o["what_changed"]),
            user_relevance_score: asNumberClamped(o["user_relevance_score"], 0, 1, 0.5),
            matches_triggers: asStringArray(o["matches_triggers"]),
            affects_deals: asStringArray(o["affects_deals"]),
            is_noise: asBool(o["is_noise"], false)
        },
        error: null
    };
}
