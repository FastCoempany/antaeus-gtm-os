/**
 * Critic prompt + output parser.
 *
 * Voice rules embedded inline rather than imported from
 * supabase/functions/briefing-pipeline/llm/synthesis-shared.ts because
 * Edge Functions deploy independently and can't cross-import. The
 * banned-vocabulary + hedging rules are the same shape the synthesis
 * critique pass uses — this critic re-checks the published Pattern
 * (post-gate, post-repair) for any signals the in-flight critique
 * missed.
 *
 * Output is strict JSON. parseCriticOutput accepts a fenced code
 * block or bare JSON; anything malformed returns null and the
 * caller logs + skips.
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

const HEDGING_ADVERBS: ReadonlyArray<string> = [
    "perhaps",
    "possibly",
    "potentially",
    "arguably",
    "presumably",
    "seemingly"
];

const BANNED_HEDGES: ReadonlyArray<string> = [
    "it's worth noting that",
    "it could be argued that",
    "in today's",
    "the future of",
    "might be the case that",
    "one could say"
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
    readonly score: number; // 0-1
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
        if (typeof v === "string" && v.trim().length > 0) {
            lines.push(`- ${k}: ${v.trim()}`);
        }
    }
    return lines.length === 0 ? "(none)" : lines.join("\n");
}

function formatMoves(moves: unknown): string {
    if (!Array.isArray(moves) || moves.length === 0) return "(none)";
    const lines: string[] = [];
    for (const m of moves) {
        if (!m || typeof m !== "object") continue;
        const o = m as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label : "";
        const dest = typeof o.destination === "string" ? o.destination : "";
        const rationale = typeof o.rationale === "string" ? o.rationale : "";
        const parts = [label, dest ? `→ ${dest}` : "", rationale ? `(${rationale})` : ""]
            .filter((s) => s.length > 0);
        if (parts.length > 0) lines.push(`- ${parts.join(" ")}`);
    }
    return lines.length === 0 ? "(none)" : lines.join("\n");
}

const SYSTEM_PROMPT = `You are a retroactive voice critic for a B2B intelligence briefing system. Your job is to read a Pattern the system has already published and score how well it matches the house voice — declarative, specific, evidence-anchored, no marketing throat-clearing, no manifesto-shape single-noun abstractions doing sentence work.

You score voice FIDELITY, not factual accuracy. A factually wrong but voice-clean Pattern still scores high here. A voice-broken Pattern that happens to be true scores low.

Banned vocabulary (subtract sharply if any appear): ${BANNED_VOCABULARY.join(", ")}. Also banned: ${BANNED_HEDGES.join("; ")}, and similar marketing throat-clearing.

Hedging adverbs (max 3 total across the analysis): ${HEDGING_ADVERBS.join(", ")}.

Voice strengths to recognize: specific named entities (companies, products, dollar amounts, dates); declarative sentence shape; evidence references with item ids; recommended moves that are concrete actions with destinations, not vague aspirations.

Output strict JSON. No prose around it. No code fences are required but are tolerated.`;

export function buildCriticPrompt(input: CriticPromptInput): {
    readonly system_prompt: string;
    readonly user_prompt: string;
} {
    const user_prompt = [
        `Score this Pattern's voice fidelity 0-1.`,
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
        `Return JSON of this exact shape:`,
        `{`,
        `  "score": <number 0-1, two decimals>,`,
        `  "voice_concerns": [<short strings, max 3>],`,
        `  "banned_vocabulary": [<exact banned words/phrases that appeared, or []>],`,
        `  "hedging_concerns": [<short strings naming hedging issues, or []>],`,
        `  "strengths": [<short strings naming what's working, max 3>],`,
        `  "summary": "<one sentence verdict>"`,
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
    // Fenced code block first.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced && fenced[1]) return fenced[1].trim();
    // Otherwise: find the first { and matching last }.
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
