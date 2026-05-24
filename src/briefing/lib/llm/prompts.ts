/**
 * Prompt construction for the Briefing LLM layer (B.2a — Stage 3.3 Enrich).
 *
 * Per Recipe Layer Spec §3.3, the enrichment stage takes a raw item
 * (source title + body) plus the workspace's HydratedContext (watchlist
 * + competitive set + active deals + watchlist triggers + pain tag
 * library) and produces an EnrichedItem — structured per-item
 * understanding the clustering + synthesis stages reason about.
 *
 * The prompt structure mirrors the spec's example payload + the v0.4
 * Corporate Ownership Map addition. Three blocks:
 *
 *   ITEM            — what the source produced (verbatim)
 *   USER CONTEXT    — what the workspace has declared (filtered from
 *                     HydratedContext; sections omitted when empty)
 *   EXTRACTION RULES — what the LLM should produce + the v0.4 ownership-
 *                     map rule
 *
 * The model returns JSON conforming to EnrichedItemResponse (parse-
 * response.ts). The system prompt sets the JSON-only response mode +
 * the voice (factual, no hype).
 *
 * Prompt version: 1.0. Bump when you change the prompt structure —
 * the model_v_hash rebases on the version + content, so old enriched
 * items stay attributable to their generating prompt.
 */

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
    /** Companies the operator is actively watching. Empty in early runs. */
    readonly watchlist_companies: ReadonlyArray<string>;
    /** Competitor set per ICP. Empty in early runs. */
    readonly competitive_set: ReadonlyArray<string>;
    /** Active deal records (account_name + competitive_set + watch_for). */
    readonly active_deals: ReadonlyArray<{
        readonly deal_id: string;
        readonly account_name: string;
        readonly competitive_set: ReadonlyArray<string>;
        readonly watch_for: ReadonlyArray<string>;
    }>;
    /** Watchlist triggers — id + plain-English description. Empty until B.3. */
    readonly watchlist_triggers: ReadonlyArray<{
        readonly trigger_id: string;
        readonly natural_language: string;
    }>;
    /** Global pain tags the synthesis layer references. Empty until B.2c. */
    readonly available_pain_tags: ReadonlyArray<string>;
    /** Corporate ownership map per Recipe Layer Spec v0.4 §3.0. */
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
    if (inputs.published_date) {
        lines.push(`Published: ${inputs.published_date}`);
    }
    lines.push(`Title: ${inputs.title}`);
    if (inputs.body && inputs.body.trim().length > 0) {
        lines.push(`Body: ${inputs.body.trim()}`);
    }
    lines.push("");

    lines.push("USER CONTEXT");
    lines.push("============");
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
        lines.push(
            `Available pain tags: ${JSON.stringify(inputs.available_pain_tags)}`
        );
    }
    if (
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
    lines.push(
        "Produce a JSON object matching this schema (omit fields only when explicitly nullable):"
    );
    lines.push("");
    lines.push("{");
    lines.push('  "entities": {');
    lines.push('    "companies":     string[],   // distinct company names mentioned');
    lines.push('    "people":        string[],   // distinct person names mentioned');
    lines.push('    "products":      string[],   // distinct product names mentioned');
    lines.push('    "technologies":  string[]    // generic tech terms (e.g. "vector database")');
    lines.push("  },");
    lines.push('  "exec_move":      null | {');
    lines.push('    "person_name":     string,');
    lines.push('    "new_role":        string,    // e.g. "Chief Financial Officer"');
    lines.push('    "company":         string,');
    lines.push('    "action":          "joined" | "promoted" | "departed" | "appointed" | "stepped_down",');
    lines.push('    "prior_company":   string | null,');
    lines.push('    "effective_date":  string | null  // ISO date if stated');
    lines.push("  },");
    lines.push('  "event_category": string,     // pricing_change | exec_move | funding | layoff_event | product_launch | narrative_shift | partnership | regulatory | other');
    lines.push('  "topic_tags":     string[],   // 2-6 free-form short tags');
    lines.push('  "pain_tags":      string[],   // ONLY from "Available pain tags" above; empty if none match');
    lines.push('  "claim_type":     "fact" | "claim" | "speculation",');
    lines.push('  "summary":        string,     // 1-2 sentences, declarative, what the item says');
    lines.push('  "what_changed":   string,     // 1 sentence, what is new vs prior baseline; empty if unclear');
    lines.push('  "user_relevance_score": number,  // 0.0-1.0; high when item touches the watchlist / competitive set / active deals');
    lines.push('  "matches_triggers":    string[],   // trigger_ids from "Active watchlist triggers" that the item matches');
    lines.push('  "affects_deals":       string[],   // deal_ids from "Active deals" whose competitive_set or watch_for the item touches');
    lines.push('  "is_noise":            boolean     // true when off-category for B2B SaaS commercial intelligence');
    lines.push("}");
    lines.push("");

    if (inputs.corporate_ownership_map.length > 0) {
        lines.push(
            "ADDITIONAL RULE: when the item mentions a company that appears as parent or child in the ownership map, surface the relationship in entities.companies by appending the parent in parentheses, e.g. \"Segment (Twilio-owned)\". This prevents downstream synthesis from treating subsidiary moves as independent corporate actions."
        );
        lines.push("");
    }

    lines.push("Respond with the JSON object only.");

    return lines.join("\n");
}
