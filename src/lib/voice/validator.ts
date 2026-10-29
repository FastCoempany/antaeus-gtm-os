/**
 * Operator-facing string validator.
 *
 * Direct language is required; false certainty is not. Authored prose may use
 * calibrated uncertainty terms when they accurately describe an assessment or
 * forecast. Indirect/metadiscursive qualification remains an error. Stacking
 * many uncertainty terms in one short string is a readability warning only.
 */
import { ALL_BANNED_TERMS, BANNED_COMPLETION_LABELS } from "./banned-vocabulary";
import { isBlessedLabel } from "./blessed-labels";
import {
    BANNED_META_HEDGE_CONSTRUCTIONS,
    UNCERTAINTY_STACK_REVIEW_THRESHOLD,
} from "./voice-document";
import {
    DEFAULT_FAMILY,
    FAMILY_TEMPERATURES,
    type VoiceFamily,
} from "./family-temperatures";

export type StringClass = "label" | "body" | "authored";

export interface VoiceContext {
    readonly class: StringClass;
    readonly family?: VoiceFamily;
}

export interface StringViolation {
    readonly severity: "error" | "warning";
    readonly rule: string;
    readonly detail: string;
}

export interface StringValidation {
    readonly ok: boolean;
    readonly violations: ReadonlyArray<StringViolation>;
}

const UNCERTAINTY_TERMS = [
    "may",
    "could",
    "might",
    "possibly",
    "potentially",
    "appears",
    "suggests",
    "seems",
    "likely",
    "unlikely",
    "arguably",
];

function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function findBannedTerms(text: string): string[] {
    const lower = text.toLowerCase();
    const hits: string[] = [];
    for (const term of ALL_BANNED_TERMS) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
        if (re.test(lower)) hits.push(term);
    }
    return hits;
}

function isCompletionShaped(text: string): boolean {
    const t = text.trim().toLowerCase().replace(/[.!]+$/, "");
    return BANNED_COMPLETION_LABELS.includes(t);
}

function countUncertaintyTerms(text: string): number {
    const lower = text.toLowerCase();
    return UNCERTAINTY_TERMS.reduce(
        (n, term) =>
            n + (lower.match(new RegExp(`\\b${term}\\b`, "g"))?.length ?? 0),
        0,
    );
}

export function validateString(
    text: string,
    context: VoiceContext,
): StringValidation {
    const violations: StringViolation[] = [];
    const family = FAMILY_TEMPERATURES[context.family ?? DEFAULT_FAMILY];
    const trimmed = text.trim();

    if (trimmed.length === 0) {
        return {
            ok: false,
            violations: [
                {
                    severity: "error",
                    rule: "empty-string",
                    detail: "An operator-facing string cannot be empty.",
                },
            ],
        };
    }

    if (!isBlessedLabel(trimmed)) {
        for (const term of findBannedTerms(trimmed)) {
            violations.push({
                severity: "error",
                rule: "banned-vocabulary",
                detail: `"${term}" is on the banned list. Write the underlying business meaning instead.`,
            });
        }
    }

    if (context.class === "label") {
        if (isBlessedLabel(trimmed)) {
            return { ok: violations.length === 0, violations };
        }
        if (isCompletionShaped(trimmed)) {
            violations.push({
                severity: "error",
                rule: "completion-label",
                detail: `A bare completion label ("${trimmed}") cannot carry the next action by itself.`,
            });
        }
        if (wordCount(trimmed) > 6) {
            violations.push({
                severity: "error",
                rule: "label-length",
                detail: `Labels cap at six words; "${trimmed}" is ${wordCount(trimmed)}. Longer text belongs in body prose.`,
            });
        }
        return { ok: violations.every((v) => v.severity !== "error"), violations };
    }

    const sentences = splitSentences(trimmed);

    if (sentences.some((s) => isCompletionShaped(s)) && sentences.length < 2) {
        violations.push({
            severity: "error",
            rule: "completion-without-loop",
            detail:
                "A completion announcement must include the next action or next state in the same string.",
        });
    }

    for (const s of sentences) {
        const words = wordCount(s);
        if (words > family.maxSentenceWords) {
            violations.push({
                severity: "warning",
                rule: "sentence-length",
                detail: `A ${words}-word sentence exceeds the ${family.family} threshold of ${family.maxSentenceWords}. Check whether it can be split without removing necessary logic.`,
            });
        }
    }

    if (sentences.length >= 3 && sentences.every((s) => wordCount(s) <= 6)) {
        violations.push({
            severity: "warning",
            rule: "manifesto-fragments",
            detail:
                "Three or more clipped sentences in series read as manifesto fragments. Use connected propositions instead.",
        });
    }

    if (context.class === "authored") {
        const lower = trimmed.toLowerCase();
        for (const phrase of BANNED_META_HEDGE_CONSTRUCTIONS) {
            if (lower.includes(phrase)) {
                violations.push({
                    severity: "error",
                    rule: "hedge-construction",
                    detail: `"${phrase}" is indirect framing. State the evidence and calibrated assessment directly.`,
                });
            }
        }

        const uncertaintyCount = countUncertaintyTerms(trimmed);
        if (uncertaintyCount > UNCERTAINTY_STACK_REVIEW_THRESHOLD) {
            violations.push({
                severity: "warning",
                rule: "uncertainty-density",
                detail: `${uncertaintyCount} uncertainty terms appear in one string. Keep them if each marks a distinct inference; otherwise simplify to one calibrated assessment.`,
            });
        }
    }

    return { ok: violations.every((v) => v.severity !== "error"), violations };
}

export function formatStringViolations(
    text: string,
    result: StringValidation,
): string {
    if (result.ok && result.violations.length === 0) return "ok";
    const lines = result.violations.map(
        (v) => `  [${v.severity}] ${v.rule}: ${v.detail}`,
    );
    return [`"${text}"`, ...lines].join("\n");
}
