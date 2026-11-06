/**
 * Retroactive Briefing Pattern critic.
 *
 * The critic evaluates whether published language is explicit, evidence-aware,
 * and operational. It must not reward false certainty or penalize accurate
 * epistemic calibration merely because a sentence uses `may` or `suggests`.
 */

const BANNED_VOCABULARY: ReadonlyArray<string> = [
    "wedge",
    "verdict",
    "the move",
    "decision-grade",
    "operating truth",
    "command intelligence",
    "field read",
    "loom read",
    "ingot read",
    "execution-context temperature",
    "main risk",
    "replacement pressure",
    "operator move",
    "do not use",
    "required correction",
    "recovery cue",
    "output ingot"
];

const BANNED_INDIRECT_FRAMING: ReadonlyArray<string> = [
    "it's worth noting that",
    "it is worth noting that",
    "it could be argued that",
    "there may be reasons to consider",
    "some observers might suggest",
    "one could argue",
    "in today's",
    "the future of"
];

export interface CriticPromptInput {
    readonly title: string;
    readonly analysis: string;
    readonly six_questions: Record<string, unknown> | null;
    readonly recommended_moves: unknown;
    readonly confidence: number;
    readonly evidence_count: number;
    readonly source_count: number;
    readonly cluster_type: string | null;
    readonly anchor: string | null;
}

export interface CriticOutput {
    readonly score: number;
    readonly voice_concerns: ReadonlyArray<string>;
    readonly banned_vocabulary: ReadonlyArray<string>;
    readonly hedging_concerns: ReadonlyArray<string>;
    readonly strengths: ReadonlyArray<string>;
    readonly summary: string;
}

function formatSixQuestions(sq: Record<string, unknown> | null): string {
    if (!sq) return "(none)";
    const keys: ReadonlyArray<string> = [
        "what_changed",
        "evidence",
        "confidence_rationale",
        "why_it_matters",
        "who_needs_to_know",
        "what_next"
    ];
    const lines: string[] = [];
    for (const k of keys) {
        const v = sq[k];
        if (typeof v === "string" && v.trim()) lines.push(`- ${k}: ${v.trim()}`);
    }
    return lines.length === 0 ? "(none)" : lines.join("\n");
}

function formatMoves(moves: unknown): string {
    if (!Array.isArray(moves) || moves.length === 0) return "(none)";
    const lines: string[] = [];
    for (const m of moves) {
        if (!m || typeof m !== "object") continue;
        const o = m as Record<string, unknown>;
        // Current synthesis schema uses `action`; accept legacy `label` for old rows.
        const action =
            typeof o.action === "string"
                ? o.action
                : typeof o.label === "string"
                  ? o.label
                  : "";
        const dest = typeof o.destination === "string" ? o.destination : "";
        const rationale = typeof o.rationale === "string" ? o.rationale : "";
        const parts = [
            action,
            dest ? `→ ${dest}` : "",
            rationale ? `(${rationale})` : ""
        ].filter((s) => s.length > 0);
        if (parts.length > 0) lines.push(`- ${parts.join(" ")}`);
    }
    return lines.length === 0 ? "(none)" : lines.join("\n");
}

const SYSTEM_PROMPT = `You are a retroactive language critic for a B2B intelligence briefing. Evaluate whether the published Pattern is explicit, evidence-aware, and operational.

You score LANGUAGE QUALITY, not factual accuracy. However, language quality includes epistemic discipline: facts should sound like facts; assessments should be identifiable as assessments; predictions should not be presented as observed facts; correlation should not be presented as causation.

Banned private vocabulary: ${BANNED_VOCABULARY.join(", ")}.
Banned indirect/metadiscursive framing: ${BANNED_INDIRECT_FRAMING.join("; ")}.

Do NOT penalize a Pattern merely for using calibrated uncertainty words such as "may", "could", "suggests", "appears", or "likely". Flag uncertainty language only when it is repetitive, evasive, or makes the actual assessment impossible to identify.

Penalize unsupported certainty, slogan-like or aphoristic cadence, fragments used instead of explanation, personification, vague actions, and recommendations routed to nonexistent product surfaces.

Strengths to recognize: specific named entities, dates and numbers; direct complete sentences; clear separation of evidence from interpretation; confidence that matches evidence quality; and concrete recommended actions with valid destinations.

Output strict JSON only.`;

export function buildCriticPrompt(input: CriticPromptInput): {
    readonly system_prompt: string;
    readonly user_prompt: string;
} {
    const user_prompt = [
        `Score this Pattern's language quality from 0 to 1.`,
        ``,
        `Pattern title: "${input.title}"`,
        ``,
        `Analysis:`,
        input.analysis,
        ``,
        `Six questions:`,
        formatSixQuestions(input.six_questions),
        ``,
        `Recommended moves:`,
        formatMoves(input.recommended_moves),
        ``,
        `Cluster context:`,
        `- cluster_type: ${input.cluster_type ?? "(unknown)"}`,
        `- anchor: ${input.anchor ?? "(unknown)"}`,
        `- confidence (synthesizer self-report): ${input.confidence}`,
        `- evidence_count: ${input.evidence_count}`,
        `- source_count: ${input.source_count}`,
        ``,
        `Check specifically for:`,
        `- unsupported certainty or causal language`,
        `- evidence/interpretation being collapsed into one assertion`,
        `- indirect/metadiscursive qualification`,
        `- aphoristic or fragmentary explanation`,
        `- private/product jargon`,
        `- vague or invalid routed actions`,
        `- uncertainty language that is redundant rather than necessary`,
        ``,
        `Return JSON of this exact shape:`,
        `{`,
        `  "score": <number 0-1, two decimals>,`,
        `  "voice_concerns": [<short strings, max 3>],`,
        `  "banned_vocabulary": [<exact banned words/phrases that appeared, or []>],`,
        `  "hedging_concerns": [<only redundant/evasive uncertainty language, or []>],`,
        `  "strengths": [<short strings naming what's working, max 3>],`,
        `  "summary": "<one sentence assessment>"`,
        `}`
    ].join("\n");
    return { system_prompt: SYSTEM_PROMPT, user_prompt };
}

function clampScore(v: unknown): number | null {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return Math.round(v * 100) / 100;
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function tryExtractJson(text: string): string | null {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) return fenced[1].trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    return null;
}

export function parseCriticOutput(text: string): CriticOutput | null {
    const raw = tryExtractJson(text);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const score = clampScore(parsed.score);
        if (score === null) return null;
        const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
        return {
            score,
            voice_concerns: asStringArray(parsed.voice_concerns),
            banned_vocabulary: asStringArray(parsed.banned_vocabulary),
            hedging_concerns: asStringArray(parsed.hedging_concerns),
            strengths: asStringArray(parsed.strengths),
            summary
        };
    } catch (_err) {
        return null;
    }
}
