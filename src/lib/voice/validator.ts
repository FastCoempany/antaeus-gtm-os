/**
 * The voice validator — the strict-everywhere gate (01 Part II).
 *
 * One function, `validateString(text, context)`, applied to every
 * operator-facing string the product ships. Strings are declared via
 * the t() marker (./t.ts); the repo-walking gate in voice-gate.test.ts
 * runs every declared string through this validator and fails CI on
 * any error-severity violation.
 *
 * Three string classes (01 §2.1) get different granularity:
 *   - label   — banned check, 6-word cap, shape check, completion ban
 *   - body    — banned check, sentence structure, speakability
 *   - authored — body rules + hedging discipline
 *
 * Violations carry severity: "error" fails the gate; "warning" (the
 * Tier-2 rules, e.g. subject continuity) reports without failing,
 * per 01 §2.3.
 */
import { ALL_BANNED_TERMS, BANNED_COMPLETION_LABELS } from "./banned-vocabulary";
import { isBlessedLabel } from "./blessed-labels";
import {
    BANNED_HEDGE_CONSTRUCTIONS,
    MAX_HEDGE_ADVERBS,
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

const HEDGE_ADVERBS = [
    "possibly",
    "perhaps",
    "potentially",
    "arguably",
    "somewhat",
    "fairly",
    "relatively",
    "seemingly",
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
        // Whole-word / whole-phrase, case-insensitive. Word boundaries
        // keep "earn" from matching "learn" and "spine" from "spineless"
        // (which would still be its own ban if ever used, but boundaries
        // keep the matcher honest).
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

    // ── Banned vocabulary — all classes, no exceptions ────────────────
    if (!isBlessedLabel(trimmed)) {
        for (const term of findBannedTerms(trimmed)) {
            violations.push({
                severity: "error",
                rule: "banned-vocabulary",
                detail: `"${term}" is on the banned list (01 §2.2 / lexicon 07 Part III). Write what you mean instead.`,
            });
        }
    }

    if (context.class === "label") {
        // ── Labels: blessed pass, completion ban, 6-word cap ──────────
        if (isBlessedLabel(trimmed)) {
            return { ok: violations.length === 0, violations };
        }
        if (isCompletionShaped(trimmed)) {
            violations.push({
                severity: "error",
                rule: "completion-label",
                detail: `A bare completion label ("${trimmed}") cannot carry a forward loop. Transform the surface instead (canon Part III §7).`,
            });
        }
        if (wordCount(trimmed) > 6) {
            violations.push({
                severity: "error",
                rule: "label-length",
                detail: `Labels cap at six words; "${trimmed}" is ${wordCount(trimmed)}. Longer strings are body prose the component mislabeled.`,
            });
        }
        return { ok: violations.every((v) => v.severity !== "error"), violations };
    }

    // ── Body + authored prose ─────────────────────────────────────────
    const sentences = splitSentences(trimmed);

    // Completion announcement must pair with a forward loop in-string.
    if (sentences.some((s) => isCompletionShaped(s)) && sentences.length < 2) {
        violations.push({
            severity: "error",
            rule: "completion-without-loop",
            detail:
                "A completion announcement must pair with a forward-loop sentence in the same string (01 §2.3).",
        });
    }

    // Speakability: sentence length against the family threshold.
    for (const s of sentences) {
        const words = wordCount(s);
        if (words > family.maxSentenceWords) {
            violations.push({
                severity: "error",
                rule: "sentence-length",
                detail: `A ${words}-word sentence exceeds the ${family.family} threshold of ${family.maxSentenceWords}. Read it out loud; split it.`,
            });
        }
    }

    // Subject-continuity ships as a Tier-2 warning (01 §2.3): three or
    // more very short sentences in series reads as manifesto fragments.
    if (
        sentences.length >= 3 &&
        sentences.every((s) => wordCount(s) <= 6)
    ) {
        violations.push({
            severity: "warning",
            rule: "manifesto-fragments",
            detail:
                "Three or more clipped sentences in series read as manifesto fragments (canon §11). Write connected sentences with subjects.",
        });
    }

    if (context.class === "authored") {
        // Hedging discipline (01 §2.4), reusing the production rules.
        const lower = trimmed.toLowerCase();
        for (const hedge of BANNED_HEDGE_CONSTRUCTIONS) {
            if (lower.includes(hedge)) {
                violations.push({
                    severity: "error",
                    rule: "hedge-construction",
                    detail: `"${hedge}" is a banned hedge (01 §2.4). State the read and how sure the system is.`,
                });
            }
        }
        const hedgeCount = HEDGE_ADVERBS.reduce(
            (n, adverb) =>
                n +
                (lower.match(new RegExp(`\\b${adverb}\\b`, "g"))?.length ?? 0),
            0,
        );
        if (hedgeCount > MAX_HEDGE_ADVERBS) {
            violations.push({
                severity: "error",
                rule: "hedge-density",
                detail: `${hedgeCount} hedge adverbs in one string (max ${MAX_HEDGE_ADVERBS}). Commit to the read.`,
            });
        }
    }

    return { ok: violations.every((v) => v.severity !== "error"), violations };
}

/** Render violations for CLI / CI output. */
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
