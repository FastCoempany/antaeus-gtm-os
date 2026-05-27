/**
 * Deno-side mirror of the Briefing LLM layer.
 *
 * Mirrors src/briefing/lib/llm/{prompts,parse-response,cost,model-version}.ts
 * verbatim. The src/ files are the canonical reference + vitest-tested;
 * if their behavior changes (caught by vitest), the change has to be
 * mirrored here by hand. There is no runtime sharing across Node + Deno.
 *
 * What lives here:
 *   - MODELS registry + computeCost + roundCost (mirror of cost.ts)
 *   - ENRICH_SYSTEM_PROMPT + PROMPT_VERSION + buildEnrichPrompt (mirror of prompts.ts)
 *   - parseEnrichResponse + types (mirror of parse-response.ts)
 *   - modelVersionHash + shortModelVersion (mirror of model-version.ts)
 *
 * Same duplication pattern as the parsers under
 * supabase/functions/briefing-pipeline/sources/_shared.ts.
 */

// deno-lint-ignore-file no-explicit-any

// ─── Cost ──────────────────────────────────────────────────────

export interface ModelPricing {
    readonly input_per_million_usd: number;
    readonly output_per_million_usd: number;
    readonly api_id: string;
    readonly label: string;
}

export const MODELS = {
    haiku_4_5: {
        api_id: "claude-haiku-4-5-20251001",
        label: "Haiku 4.5",
        input_per_million_usd: 1.0,
        output_per_million_usd: 5.0
    },
    sonnet_4_6: {
        api_id: "claude-sonnet-4-6",
        label: "Sonnet 4.6",
        input_per_million_usd: 3.0,
        output_per_million_usd: 15.0
    },
    opus_4_7: {
        api_id: "claude-opus-4-7",
        label: "Opus 4.7",
        input_per_million_usd: 5.0,
        output_per_million_usd: 25.0
    }
} as const;

export type ModelKey = keyof typeof MODELS;

export interface TokenUsage {
    readonly input_tokens: number;
    readonly output_tokens: number;
}

export function computeCost(model: ModelKey, usage: TokenUsage): number {
    const pricing = MODELS[model];
    return (
        (usage.input_tokens / 1_000_000) * pricing.input_per_million_usd +
        (usage.output_tokens / 1_000_000) * pricing.output_per_million_usd
    );
}

export function roundCost(usd: number): number {
    return Math.round(usd * 10_000) / 10_000;
}

// ─── Model version hash ────────────────────────────────────────

export interface ModelVersionInputs {
    readonly model_api_id: string;
    readonly system_prompt?: string;
    readonly user_prompt: string;
    readonly temperature?: number;
    readonly max_tokens?: number;
    readonly prompt_version: string;
}

async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hashBuffer);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex;
}

function canonicalize(inputs: ModelVersionInputs): string {
    return [
        `model=${inputs.model_api_id}`,
        `prompt_version=${inputs.prompt_version}`,
        `temperature=${inputs.temperature ?? "default"}`,
        `max_tokens=${inputs.max_tokens ?? "default"}`,
        `system_prompt_len=${(inputs.system_prompt ?? "").length}`,
        `system_prompt=${inputs.system_prompt ?? ""}`,
        `user_prompt_len=${inputs.user_prompt.length}`,
        `user_prompt=${inputs.user_prompt}`
    ].join("|");
}

export async function modelVersionHash(
    inputs: ModelVersionInputs
): Promise<string> {
    return sha256Hex(canonicalize(inputs));
}

// ─── Prompts ───────────────────────────────────────────────────

export const PROMPT_VERSION = "enrich-1.0";

export interface CorporateOwnership {
    readonly parent: string;
    readonly child: string;
    readonly relationship_type: string;
    readonly since: string;
}

export interface EnrichPromptInputs {
    readonly source_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly published_date: string | null;
    readonly commercial_profile: {
        readonly product_category: string | null;
        readonly value_prop: string | null;
    } | null;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly competitive_set: ReadonlyArray<string>;
    readonly active_deals: ReadonlyArray<{
        readonly deal_id: string;
        readonly account_name: string;
        readonly competitive_set: ReadonlyArray<string>;
        readonly watch_for: ReadonlyArray<string>;
    }>;
    readonly watchlist_triggers: ReadonlyArray<{
        readonly trigger_id: string;
        readonly natural_language: string;
    }>;
    readonly available_pain_tags: ReadonlyArray<string>;
    readonly corporate_ownership_map: ReadonlyArray<CorporateOwnership>;
}

export const ENRICH_SYSTEM_PROMPT = `You are the enrichment stage of a B2B competitive-intelligence pipeline. Each call you receive carries one raw item (a news headline, a release note, a forum post) plus the user's stated context (watchlist, active deals, watchlist triggers). Your job is to extract structured per-item understanding so the downstream clustering + synthesis stages can reason about it.

Voice: factual, declarative, no hedging. Do not editorialize. Do not speculate beyond what the text supports. If the item is genuinely off-topic for B2B SaaS commercial intelligence, set is_noise: true.

Respond with ONLY valid JSON matching the schema in the user message. No prose preamble, no markdown fences, no trailing commentary. The first character of your response must be '{' and the last must be '}'.`;

export function buildEnrichPrompt(inputs: EnrichPromptInputs): string {
    const lines: string[] = [];
    lines.push("ITEM");
    lines.push("====");
    lines.push(`Source type: ${inputs.source_id}`);
    if (inputs.published_date) lines.push(`Published: ${inputs.published_date}`);
    lines.push(`Title: ${inputs.title}`);
    if (inputs.body && inputs.body.trim().length > 0) {
        lines.push(`Body: ${inputs.body.trim()}`);
    }
    lines.push("");
    lines.push("USER CONTEXT");
    lines.push("============");
    if (inputs.commercial_profile) {
        const cp = inputs.commercial_profile;
        if (cp.product_category) {
            lines.push(`Operator's product category (what THEY sell): ${cp.product_category}`);
        }
        if (cp.value_prop) {
            lines.push(`Operator's value proposition: ${cp.value_prop}`);
        }
        lines.push(
            "Relevance is anchored on this category — score user_relevance_score by how much the item touches the operator's space, competitors, or buyers."
        );
    }
    if (inputs.watchlist_companies.length > 0) {
        lines.push(`Watchlist companies: ${JSON.stringify(inputs.watchlist_companies)}`);
    }
    if (inputs.competitive_set.length > 0) {
        lines.push(`Competitive set: ${JSON.stringify(inputs.competitive_set)}`);
    }
    if (inputs.active_deals.length > 0) {
        const dealSummaries = inputs.active_deals.map(
            (d) =>
                `${d.deal_id}: ${d.account_name} vs [${d.competitive_set.join(", ")}], watch_for=[${d.watch_for.join(", ")}]`
        );
        lines.push(`Active deals:\n  ${dealSummaries.join("\n  ")}`);
    }
    if (inputs.watchlist_triggers.length > 0) {
        const triggerSummaries = inputs.watchlist_triggers.map(
            (t) => `${t.trigger_id}: ${t.natural_language}`
        );
        lines.push(`Active watchlist triggers:\n  ${triggerSummaries.join("\n  ")}`);
    }
    if (inputs.available_pain_tags.length > 0) {
        lines.push(`Available pain tags: ${JSON.stringify(inputs.available_pain_tags)}`);
    }
    if (
        inputs.commercial_profile === null &&
        inputs.watchlist_companies.length === 0 &&
        inputs.competitive_set.length === 0 &&
        inputs.active_deals.length === 0 &&
        inputs.watchlist_triggers.length === 0 &&
        inputs.available_pain_tags.length === 0
    ) {
        lines.push(
            "(Workspace has not yet declared a watchlist, competitive set, or active deals. Score user_relevance_score conservatively and leave matches_triggers + affects_deals empty. Other fields — entity extraction, event categorization, claim_type, summary, what_changed, is_noise — apply as normal.)"
        );
    }
    lines.push("");
    if (inputs.corporate_ownership_map.length > 0) {
        lines.push("CORPORATE OWNERSHIP MAP");
        lines.push("=======================");
        for (const rel of inputs.corporate_ownership_map) {
            lines.push(
                `${rel.parent} ${rel.relationship_type} ${rel.child} (since ${rel.since})`
            );
        }
        lines.push("");
    }
    lines.push("EXTRACTION RULES");
    lines.push("================");
    lines.push("Produce a JSON object matching this schema (omit fields only when explicitly nullable):");
    lines.push("");
    lines.push("{");
    lines.push('  "entities": {');
    lines.push('    "companies":     string[],');
    lines.push('    "people":        string[],');
    lines.push('    "products":      string[],');
    lines.push('    "technologies":  string[]');
    lines.push("  },");
    lines.push('  "exec_move":      null | {');
    lines.push('    "person_name":     string,');
    lines.push('    "new_role":        string,');
    lines.push('    "company":         string,');
    lines.push('    "action":          "joined" | "promoted" | "departed" | "appointed" | "stepped_down",');
    lines.push('    "prior_company":   string | null,');
    lines.push('    "effective_date":  string | null');
    lines.push("  },");
    lines.push('  "event_category": string,');
    lines.push('  "topic_tags":     string[],');
    lines.push('  "pain_tags":      string[],');
    lines.push('  "claim_type":     "fact" | "claim" | "speculation",');
    lines.push('  "summary":        string,');
    lines.push('  "what_changed":   string,');
    lines.push('  "user_relevance_score": number,');
    lines.push('  "matches_triggers":    string[],');
    lines.push('  "affects_deals":       string[],');
    lines.push('  "is_noise":            boolean');
    lines.push("}");
    lines.push("");
    if (inputs.corporate_ownership_map.length > 0) {
        lines.push(
            'ADDITIONAL RULE: when the item mentions a company that appears as parent or child in the ownership map, surface the relationship in entities.companies by appending the parent in parentheses, e.g. "Segment (Twilio-owned)". This prevents downstream synthesis from treating subsidiary moves as independent corporate actions.'
        );
        lines.push("");
    }
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

// ─── Response parsing ──────────────────────────────────────────

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

const VALID_CLAIM_TYPES: ReadonlyArray<ClaimType> = ["fact", "claim", "speculation"];

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

export function parseEnrichResponse(raw: string): ParseResult {
    const jsonText = extractJsonObject(raw);
    if (jsonText === null) {
        return { enriched: null, error: "no JSON object found in response" };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        return {
            enriched: null,
            error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { enriched: null, error: "response root is not a JSON object" };
    }
    const o = parsed as Record<string, unknown>;
    const summary = asString(o["summary"]).trim();
    if (summary.length === 0) {
        return { enriched: null, error: "response missing required 'summary' field" };
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
