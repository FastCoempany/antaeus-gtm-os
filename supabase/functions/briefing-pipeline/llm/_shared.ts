/**
 * Deno-side mirror of the Briefing enrichment layer.
 *
 * Mirrors `src/briefing/lib/llm/{prompts,parse-response,cost,model-version}.ts`.
 * The enrichment stage preserves source epistemic status instead of forcing
 * uncertain source material into categorical prose.
 */
// deno-lint-ignore-file no-explicit-any

// ── Cost ───────────────────────────────────────────────────────────────

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
    const p = MODELS[model];
    return (usage.input_tokens / 1_000_000) * p.input_per_million_usd +
        (usage.output_tokens / 1_000_000) * p.output_per_million_usd;
}
export function roundCost(usd: number): number {
    return Math.round(usd * 10_000) / 10_000;
}

// ── Model version hash ────────────────────────────────────────────────

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
    return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
export function modelVersionHash(inputs: ModelVersionInputs): Promise<string> {
    return sha256Hex(canonicalize(inputs));
}

// ── Enrichment prompt ─────────────────────────────────────────────────

export const PROMPT_VERSION = "enrich-1.1";

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

export const ENRICH_SYSTEM_PROMPT = `You are the enrichment stage of a B2B competitive-intelligence pipeline. Each call contains one raw item plus the operator's stated context. Extract structured per-item information for downstream clustering and synthesis.

Epistemic rules:
- Preserve what the source actually establishes. Do not strengthen a source claim into a fact.
- Use claim_type="fact" only for information the item presents as established fact; use "claim" for attributed assertions; use "speculation" for predictions, rumors, possibilities, or explicitly uncertain statements.
- summary and what_changed should use plain complete sentences. State direct facts directly and preserve necessary uncertainty when the source is uncertain.
- Do not editorialize, infer intent, or add causal conclusions the item does not support.
- If the item is genuinely off-topic for B2B SaaS commercial intelligence, set is_noise=true.

Respond with ONLY valid JSON matching the schema in the user message.`;

export function buildEnrichPrompt(inputs: EnrichPromptInputs): string {
    const lines: string[] = ["ITEM", "====", `Source type: ${inputs.source_id}`];
    if (inputs.published_date) lines.push(`Published: ${inputs.published_date}`);
    lines.push(`Title: ${inputs.title}`);
    if (inputs.body?.trim()) lines.push(`Body: ${inputs.body.trim()}`);
    lines.push("", "USER CONTEXT", "============");

    if (inputs.commercial_profile) {
        if (inputs.commercial_profile.product_category) {
            lines.push(`Operator's product category (what THEY sell): ${inputs.commercial_profile.product_category}`);
        }
        if (inputs.commercial_profile.value_prop) {
            lines.push(`Operator's value proposition: ${inputs.commercial_profile.value_prop}`);
        }
        lines.push("Score user_relevance_score by how much the item touches the operator's category, competitors, buyers, or active deals. Relevance is separate from factual certainty.");
    }
    if (inputs.watchlist_companies.length) lines.push(`Watchlist companies: ${JSON.stringify(inputs.watchlist_companies)}`);
    if (inputs.competitive_set.length) lines.push(`Competitive set: ${JSON.stringify(inputs.competitive_set)}`);
    if (inputs.active_deals.length) {
        const d = inputs.active_deals.map((x) => `${x.deal_id}: ${x.account_name} vs [${x.competitive_set.join(", ")}], watch_for=[${x.watch_for.join(", ")}]`);
        lines.push(`Active deals:\n  ${d.join("\n  ")}`);
    }
    if (inputs.watchlist_triggers.length) {
        const t = inputs.watchlist_triggers.map((x) => `${x.trigger_id}: ${x.natural_language}`);
        lines.push(`Active watchlist triggers:\n  ${t.join("\n  ")}`);
    }
    if (inputs.available_pain_tags.length) lines.push(`Available pain tags: ${JSON.stringify(inputs.available_pain_tags)}`);
    if (!inputs.commercial_profile && !inputs.watchlist_companies.length && !inputs.competitive_set.length && !inputs.active_deals.length && !inputs.watchlist_triggers.length && !inputs.available_pain_tags.length) {
        lines.push("(Workspace context is incomplete. Score user_relevance_score conservatively and leave matches_triggers and affects_deals empty. Continue normal entity extraction, event categorization, claim_type, summary, what_changed, and noise classification.)");
    }
    lines.push("");

    if (inputs.corporate_ownership_map.length) {
        lines.push("CORPORATE OWNERSHIP MAP", "=======================");
        for (const rel of inputs.corporate_ownership_map) {
            lines.push(`${rel.parent} ${rel.relationship_type} ${rel.child} (since ${rel.since})`);
        }
        lines.push("");
    }

    lines.push("EXTRACTION RULES", "================", "Produce a JSON object matching this schema:", "");
    lines.push(`{
  "entities": {
    "companies": string[],
    "people": string[],
    "products": string[],
    "technologies": string[]
  },
  "exec_move": null | {
    "person_name": string,
    "new_role": string,
    "company": string,
    "action": "joined" | "promoted" | "departed" | "appointed" | "stepped_down",
    "prior_company": string | null,
    "effective_date": string | null
  },
  "event_category": string,
  "topic_tags": string[],
  "pain_tags": string[],
  "claim_type": "fact" | "claim" | "speculation",
  "summary": string,
  "what_changed": string,
  "user_relevance_score": number,
  "matches_triggers": string[],
  "affects_deals": string[],
  "is_noise": boolean
}`);
    lines.push("", "summary: 1–2 plain sentences describing what the item says without adding certainty or causation.");
    lines.push("what_changed: one sentence naming what is new relative to the prior baseline; leave empty if the item does not establish a change.");
    lines.push("pain_tags: use only values supplied in Available pain tags.");
    lines.push("matches_triggers: use only trigger_ids supplied above.");
    lines.push("affects_deals: use only deal_ids supplied above.", "");

    if (inputs.corporate_ownership_map.length) {
        lines.push("When the item mentions a company that appears in the ownership map, include the ownership context in entities.companies, e.g. \"Segment (Twilio-owned)\". This prevents downstream synthesis from treating parent/subsidiary activity as independent corporate actions.", "");
    }
    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}

// ── Response parsing ──────────────────────────────────────────────────

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
    if (typeof raw !== "string" || !raw.trim()) return null;
    let s = raw.trim();
    const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fence?.[1]) s = fence[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    return start >= 0 && end > start ? s.slice(start, end + 1) : null;
}
function asStringArray(v: unknown): ReadonlyArray<string> {
    return Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];
}
function asString(v: unknown, fallback = ""): string {
    if (typeof v === "string") return v;
    return v === null || v === undefined ? fallback : String(v);
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
function asNumberClamped(v: unknown, lo: number, hi: number, fallback: number): number {
    const parsed = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : fallback;
    const n = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(hi, Math.max(lo, n));
}
function asClaimType(v: unknown): ClaimType {
    return typeof v === "string" && (VALID_CLAIM_TYPES as ReadonlyArray<string>).includes(v)
        ? v as ClaimType
        : "claim";
}
function asEntities(v: unknown): Entities {
    if (!v || typeof v !== "object") return { companies: [], people: [], products: [], technologies: [] };
    const o = v as Record<string, unknown>;
    return {
        companies: asStringArray(o["companies"]),
        people: asStringArray(o["people"]),
        products: asStringArray(o["products"]),
        technologies: asStringArray(o["technologies"])
    };
}
function asExecMove(v: unknown): ExecMove | null {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const person_name = asString(o["person_name"]);
    const company = asString(o["company"]);
    if (!person_name || !company) return null;
    return {
        person_name,
        new_role: asString(o["new_role"]),
        company,
        action: asString(o["action"], "appointed"),
        prior_company: typeof o["prior_company"] === "string" && o["prior_company"] ? o["prior_company"] : null,
        effective_date: typeof o["effective_date"] === "string" && o["effective_date"] ? o["effective_date"] : null
    };
}

export function parseEnrichResponse(raw: string): ParseResult {
    const jsonText = extractJsonObject(raw);
    if (!jsonText) return { enriched: null, error: "no JSON object found in response" };
    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); } catch (err) {
        return { enriched: null, error: `JSON parse failed: ${err instanceof Error ? err.message : String(err)}` };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { enriched: null, error: "response root is not a JSON object" };
    }
    const o = parsed as Record<string, unknown>;
    const summary = asString(o["summary"]).trim();
    if (!summary) return { enriched: null, error: "response missing required 'summary' field" };
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
