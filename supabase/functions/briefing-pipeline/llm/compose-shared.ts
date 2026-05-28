/**
 * Deno-side mirror of src/briefing/lib/compose/lead.ts (B.9a).
 *
 * Mirror verbatim. Behavior changes caught by vitest must be hand-
 * mirrored here. Same Node/Deno split as the rest of the LLM layer.
 */

export interface ComposePatternSummary {
    readonly pattern_type: "standard" | "contrarian";
    readonly title: string;
    readonly summary: string;
    readonly confidence: number;
}

export interface ComposeTriggerFireSummary {
    readonly trigger_natural_language: string;
    readonly fire_summary: string;
    readonly evidence_count: number;
}

export interface ComposeInput {
    readonly patterns: ReadonlyArray<ComposePatternSummary>;
    readonly trigger_fires: ReadonlyArray<ComposeTriggerFireSummary>;
}

export interface ComposeDraft {
    readonly refused: boolean;
    readonly refusal_reason: string | null;
    readonly lead: string | null;
}

export const COMPOSE_PROMPT_VERSION = "compose-1.0";

export const COMPOSE_SYSTEM_PROMPT = `You are writing the one-line lead at the top of a B2B competitive-intelligence briefing. The operator opens this briefing once a week. Your line is the first thing they read — what a sharp peer would say first if they were handing this week's read over verbally.

Constraints:
- ONE OR TWO sentences. Never three.
- Declarative. No "this week," no "we see," no "in today's market," no aphoristic fragments. Plain.
- Name the substance, not the meta. "Three EOR competitors are repricing upward" beats "Several signals worth watching emerged."
- If you can connect two reads into one tighter line, do. If not, lead with the strongest single one.
- No startup-jargon nouns doing sentence work ("the wedge", "the verdict", "decision-grade"). Speak normally.
- If there's nothing real to lead with — zero patterns AND zero trigger fires, or only weak material — output refused=true. Silence is a feature; bad leads erode trust faster than no lead.

Output: a single JSON object. No prose around it.`;

function describePatterns(patterns: ReadonlyArray<ComposePatternSummary>): string {
    if (patterns.length === 0) return "(none synthesized this run)";
    const lines: string[] = [];
    for (const p of patterns) {
        const kind = p.pattern_type === "contrarian" ? "CONTRARIAN" : "STANDARD";
        lines.push(`- [${kind}] (confidence ${p.confidence.toFixed(2)}) "${p.title}" — ${p.summary}`);
    }
    return lines.join("\n");
}

function describeTriggerFires(fires: ReadonlyArray<ComposeTriggerFireSummary>): string {
    if (fires.length === 0) return "(no triggers fired this run)";
    return fires
        .map(
            (f) =>
                `- "${f.trigger_natural_language}" fired: ${f.fire_summary} (${f.evidence_count} items)`
        )
        .join("\n");
}

export function buildComposePrompt(input: ComposeInput): string {
    const lines: string[] = [];
    lines.push("PATTERNS SURFACED THIS RUN:");
    lines.push(describePatterns(input.patterns));
    lines.push("");
    lines.push("TRIGGER FIRES THIS RUN:");
    lines.push(describeTriggerFires(input.trigger_fires));
    lines.push("");
    lines.push("TASK: write the one-or-two-sentence lead for this week's briefing.");
    lines.push("");
    lines.push("If you have material:");
    lines.push("{");
    lines.push(`  "refused": false,`);
    lines.push(`  "refusal_reason": null,`);
    lines.push(`  "lead": "<one or two declarative sentences>"`);
    lines.push("}");
    lines.push("");
    lines.push("If material is too thin to surface honestly:");
    lines.push("{");
    lines.push(`  "refused": true,`);
    lines.push(`  "refusal_reason": "<one sentence>",`);
    lines.push(`  "lead": null`);
    lines.push("}");
    return lines.join("\n");
}

function asString(v: unknown): string | null {
    return typeof v === "string" ? v : null;
}

export function extractJsonBlock(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return trimmed.slice(start, end + 1);
}

export function parseComposeResponse(raw: string): ComposeDraft | null {
    const json = extractJsonBlock(raw);
    if (!json) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const refused = o["refused"] === true;
    const refusal_reason = asString(o["refusal_reason"]);
    const lead = asString(o["lead"]);
    return { refused, refusal_reason, lead: lead && lead.trim().length > 0 ? lead.trim() : null };
}

export const MAX_LEAD_LEN = 320;

export type ComposeGateFailure =
    | "missing_lead"
    | "lead_too_long"
    | "weakening_language"
    | "manifesto_fragments";

export interface ComposeGateResult {
    readonly passes: boolean;
    readonly failures: ReadonlyArray<ComposeGateFailure>;
}

const WEAKENING_PATTERNS: ReadonlyArray<RegExp> = [
    /\bmight\b/i,
    /\bcould\s+be\s+argued\b/i,
    /\bit's\s+worth\s+noting\b/i,
    /\bperhaps\b/i,
    /\bin\s+today's\b/i,
    /\bthis\s+week\b/i
];

const MANIFESTO_NOUNS: ReadonlyArray<RegExp> = [
    /\bthe\s+wedge\b/i,
    /\bthe\s+verdict\b/i,
    /\bdecision-grade\b/i,
    /\boperating\s+truth\b/i,
    /\bthe\s+read\b/i,
    /\bthe\s+move\b/i
];

export function runComposeGate(draft: ComposeDraft): ComposeGateResult {
    if (draft.refused) {
        return { passes: true, failures: [] };
    }
    const failures: ComposeGateFailure[] = [];
    const lead = draft.lead?.trim() ?? "";
    if (lead.length === 0) failures.push("missing_lead");
    else if (lead.length > MAX_LEAD_LEN) failures.push("lead_too_long");
    if (lead.length > 0 && WEAKENING_PATTERNS.some((p) => p.test(lead))) {
        failures.push("weakening_language");
    }
    if (lead.length > 0 && MANIFESTO_NOUNS.some((p) => p.test(lead))) {
        failures.push("manifesto_fragments");
    }
    return { passes: failures.length === 0, failures };
}
