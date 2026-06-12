import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { draft, allProofs } from "../state";

/**
 * StageStrip — Phase 2 rework per AI-picked v3 design.
 *
 * The room frames proof as a forced EVENT (temporal sequence), not
 * a page. The strip lights up each stage as the operator advances:
 *
 *   FORGE → CAST → READOUT
 *
 * - FORGE active when no proof in current draft has been "cast"
 *   (no claim/owner/metric set yet)
 * - CAST active once the operator has shaped a claim + owner
 * - READOUT active once the proof has been frozen (saved to
 *   allProofs) — meaning the kit has a real artifact to show
 *
 * Sentence-shaped per stage. Recessive when ahead of the operator's
 * progress; orange dot when current; green check when complete.
 */

type StageState = "current" | "complete" | "ahead";

interface StageDef {
    readonly key: "forge" | "cast" | "readout";
    readonly label: string;
    readonly headline: string;
}

const STAGES: ReadonlyArray<StageDef> = [
    {
        key: "forge",
        label: "Forge",
        headline: "Shape the claim, owner, metric, and kill rule."
    },
    {
        key: "cast",
        label: "Cast",
        headline: "Freeze the proof. The pilot starts on a clock."
    },
    {
        key: "readout",
        label: "Readout",
        headline: "Carry the proof into the decision room."
    }
];

function stateFor(
    key: StageDef["key"],
    forgeStarted: boolean,
    castReady: boolean,
    hasReadout: boolean
): StageState {
    if (key === "forge") {
        if (castReady) return "complete";
        return forgeStarted ? "current" : "current";
    }
    if (key === "cast") {
        if (hasReadout) return "complete";
        if (castReady) return "current";
        return "ahead";
    }
    // readout
    if (hasReadout) return "current";
    return "ahead";
}

export function StageStrip(): JSX.Element {
    const d = draft.value;
    const proofs = allProofs.value;

    const forgeStarted =
        Boolean(d.account?.trim()) ||
        Boolean(d.vendor?.trim()) ||
        Boolean(d.successCriteria?.trim());

    const castReady =
        Boolean(d.account?.trim()) &&
        Boolean(d.vendor?.trim()) &&
        Boolean(d.readoutOwner?.trim()) &&
        Boolean(d.successCriteria?.trim());

    const hasReadout = proofs.length > 0;

    return (
        <nav
            class="poc-stage-strip"
            role="navigation"
            aria-label={t("Proof event sequence")}
        >
            {STAGES.map((s, i) => {
                const state = stateFor(s.key, forgeStarted, castReady, hasReadout);
                return (
                    <div
                        key={s.key}
                        class={`poc-stage-strip__step poc-stage-strip__step--${state}`}
                    >
                        <span class="poc-stage-strip__index">
                            {i + 1}.
                        </span>
                        <span class="poc-stage-strip__label">{s.label}</span>
                        <span class="poc-stage-strip__headline">{s.headline}</span>
                    </div>
                );
            })}
        </nav>
    );
}
