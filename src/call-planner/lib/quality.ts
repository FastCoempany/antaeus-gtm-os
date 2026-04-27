import type {
    AgendaQuality,
    Draft,
    LinkedDeal,
    MatchedAccount,
    QualityBand,
    QualityGate
} from "./types";

/**
 * Phase 4 / Room 9 Wave 2 — agenda quality engine.
 *
 * Faithful TypeScript port of the legacy `getAgendaQuality()` from
 * `app/discovery-agenda/index.html` lines 689-723.
 *
 * Five weighted gates evaluated against the current draft + matched
 * account + linked deal:
 *   - Real person selected (≥ 2 chars)            weight 20
 *   - Persona is chosen                            weight 10
 *   - Account context is present (match OR linkedin) weight 20
 *   - Why-now angle exists (signal OR notes ≥ 20) weight 25
 *   - Advancement path is linked (deal attached)   weight 25
 *
 * Sum is 0-100. A +5 bonus applies if the matched account's heat
 * is ≥ 85 (live signal makes the call genuinely time-sensitive).
 * Score is clamped 0-100. Bands:
 *   - credible ≥ 85
 *   - workable ≥ 65
 *   - thin   < 65
 *
 * The `nextMove` string is a single coach line picked by the first
 * unmet gate (per legacy line 706-711); when all gates are met it
 * names the credible-path advance.
 *
 * Pure: takes everything explicitly so tests can probe every gate
 * + boundary independently.
 */

export interface QualityInputs {
    readonly draft: Draft;
    readonly matchedAccount: MatchedAccount | null;
    readonly linkedDeal: LinkedDeal | null;
}

const GATE_DEFINITIONS: ReadonlyArray<
    Omit<QualityGate, "met"> & {
        readonly met: (i: QualityInputs) => boolean;
    }
> = [
    {
        key: "person",
        label: "Real person selected",
        copy: "There is a named human or LinkedIn profile behind the plan.",
        weight: 20,
        met: (i) => i.draft.contactName.trim().length >= 2
    },
    {
        key: "persona",
        label: "Persona is chosen",
        copy: "The questions are tuned to a concrete buyer lens.",
        weight: 10,
        met: (i) => Boolean(i.draft.persona)
    },
    {
        key: "context",
        label: "Account context is present",
        copy: "Signal Console match or LinkedIn profile gives the call a real target.",
        weight: 20,
        met: (i) =>
            i.matchedAccount !== null ||
            i.draft.linkedinUrl.trim().length > 0
    },
    {
        key: "why_now",
        label: "Why-now angle exists",
        copy: "There is either a live signal or enough custom context to justify the meeting.",
        weight: 25,
        met: (i) =>
            (i.matchedAccount?.topSignal ?? null) !== null ||
            i.draft.customNotes.trim().length >= 20
    },
    {
        key: "advancement",
        label: "Advancement path is linked",
        copy: "A deal is attached so the call can move into pipeline truth instead of dying as notes.",
        weight: 25,
        met: (i) => i.linkedDeal !== null
    }
];

function bandFor(score: number): { band: QualityBand; bandLabel: string } {
    if (score >= 85) return { band: "credible", bandLabel: "Credible" };
    if (score >= 65) return { band: "workable", bandLabel: "Workable" };
    return { band: "thin", bandLabel: "Thin" };
}

function nextMoveFor(
    gates: ReadonlyArray<QualityGate>,
    inputs: QualityInputs
): string {
    const byKey = (k: QualityGate["key"]): QualityGate | undefined =>
        gates.find((g) => g.key === k);
    const person = byKey("person");
    const context = byKey("context");
    const whyNow = byKey("why_now");
    const advancement = byKey("advancement");
    if (person && !person.met) {
        return "Choose the actual human first. A vague target gives you a vague call.";
    }
    if (context && !context.met) {
        return "Add the LinkedIn profile or match the account in Signal Console so the agenda has real context.";
    }
    if (whyNow && !whyNow.met) {
        return "Capture a real why-now angle before the meeting starts.";
    }
    if (advancement && !advancement.met) {
        return "Link the call to the in-flight deal before you run it.";
    }
    void inputs;
    return "You have a credible agenda. Run the call, then move straight into Discovery Studio and Deal Workspace.";
}

export function evaluateQuality(inputs: QualityInputs): AgendaQuality {
    const gates: ReadonlyArray<QualityGate> = GATE_DEFINITIONS.map((def) => ({
        key: def.key,
        label: def.label,
        copy: def.copy,
        weight: def.weight,
        met: def.met(inputs)
    }));
    let score = gates.reduce((sum, g) => sum + (g.met ? g.weight : 0), 0);
    const heat = inputs.matchedAccount?.heat ?? 0;
    if (heat >= 85) score = Math.min(100, score + 5);
    const { band, bandLabel } = bandFor(score);
    const hasSignal = (inputs.matchedAccount?.topSignal ?? null) !== null;
    return {
        score,
        band,
        bandLabel,
        gates,
        nextMove: nextMoveFor(gates, inputs),
        hasSignal
    };
}
