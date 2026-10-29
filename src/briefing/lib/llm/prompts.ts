/**
 * Briefing enrichment prompt construction.
 *
 * This stage extracts what a source says. It must preserve the source's
 * epistemic status rather than forcing every claim into categorical prose.
 */

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
            "Score user_relevance_score by how much the item touches the operator's category, competitors, buyers, or active deals. Relevance is separate from factual certainty."
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
            "(Workspace context is incomplete. Score user_relevance_score conservatively and leave matches_triggers and affects_deals empty. Continue normal entity extraction, event categorization, claim_type, summary, what_changed, and noise classification.)"
        );
    }
    lines.push("");

    if (inputs.corporate_ownership_map.length > 0) {
        lines.push("CORPORATE OWNERSHIP MAP");
        lines.push("=======================");
        for (const rel of inputs.corporate_ownership_map) {
            lines.push(`${rel.parent} ${rel.relationship_type} ${rel.child} (since ${rel.since})`);
        }
        lines.push("");
    }

    lines.push("EXTRACTION RULES");
    lines.push("================");
    lines.push("Produce a JSON object matching this schema:");
    lines.push("{");
    lines.push('  "entities": {');
    lines.push('    "companies": string[],');
    lines.push('    "people": string[],');
    lines.push('    "products": string[],');
    lines.push('    "technologies": string[]');
    lines.push("  },");
    lines.push('  "exec_move": null | {');
    lines.push('    "person_name": string,');
    lines.push('    "new_role": string,');
    lines.push('    "company": string,');
    lines.push('    "action": "joined" | "promoted" | "departed" | "appointed" | "stepped_down",');
    lines.push('    "prior_company": string | null,');
    lines.push('    "effective_date": string | null');
    lines.push("  },");
    lines.push('  "event_category": string,');
    lines.push('  "topic_tags": string[],');
    lines.push('  "pain_tags": string[],');
    lines.push('  "claim_type": "fact" | "claim" | "speculation",');
    lines.push('  "summary": string,');
    lines.push('  "what_changed": string,');
    lines.push('  "user_relevance_score": number,');
    lines.push('  "matches_triggers": string[],');
    lines.push('  "affects_deals": string[],');
    lines.push('  "is_noise": boolean');
    lines.push("}");
    lines.push("");
    lines.push("summary: 1–2 plain sentences describing what the item says without adding certainty or causation.");
    lines.push("what_changed: one sentence naming what is new relative to the prior baseline; leave empty if the item does not establish a change.");
    lines.push("pain_tags: use only values supplied in Available pain tags.");
    lines.push("matches_triggers: use only trigger_ids supplied above.");
    lines.push("affects_deals: use only deal_ids supplied above.");
    lines.push("");

    if (inputs.corporate_ownership_map.length > 0) {
        lines.push(
            "When the item mentions a company that appears in the ownership map, include the ownership context in entities.companies, e.g. \"Segment (Twilio-owned)\". This prevents downstream synthesis from treating parent/subsidiary activity as independent corporate actions."
        );
        lines.push("");
    }

    lines.push("Respond with the JSON object only.");
    return lines.join("\n");
}
