import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    currentAutopsy,
    currentVerdictMode
} from "../state";
import type { AutopsyDoc, VerdictMode } from "../lib/types";

/**
 * ForensicSheets — stacked sentence-titled evidence sheets per
 * picked variant 01 "Forensic Light Table" (Phase 2 rework).
 *
 * Replaces the legacy 3-tab rack (pattern / proof / symptom). All
 * three sheets render simultaneously on the pinned case — the room
 * "behaves like a lit evidence surface, not a page" (canon §4.14).
 * The reader's eye walks top to bottom; each sheet adds another
 * layer of evidence on the same pinned case.
 *
 * Sheet titles are authored sentences derived from the autopsy doc,
 * not categorical labels. Empty cases get a sentence-shaped empty
 * state, not a generic "no diagnosis."
 */

export function ForensicSheets(): JSX.Element {
    const doc = currentAutopsy.value;
    const mode = currentVerdictMode.value;

    if (!doc) {
        return (
            <section class="fa-sheet fa-sheet--empty" aria-label={t("Forensic sheets")}>
                <p class="fa-sheet__empty">
                    No diagnosis to render. Pin a deal to light up the
                    evidence stack.
                </p>
            </section>
        );
    }

    const titles = sentenceTitlesFor(doc);

    return (
        <section
            class={`fa-sheet fa-sheet--stacked fa-sheet--${mode}`}
            aria-label={t("Forensic sheets")}
        >
            {/*
             * Program 6 / PR 7 — each sheet carries a tone-colored tab
             * pill (orange / blue / green) and gets a slight rotation
             * applied via :nth-child CSS rules (-2.8° / +1.9° / -1.1°)
             * for the "lit evidence surface, not a page" tactility per
             * Variant 01 / Forensic Light Table. Rotations disable at
             * narrow widths so mobile/sub-1160px gets clean stacking.
             */}

            {/* Sheet 1 — Visible symptom (orange tab) */}
            <article
                class="fa-stack-sheet fa-stack-sheet--risk"
                aria-label={t("Visible symptom sheet")}
            >
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label fa-stack-sheet__label--orange">
                        Visible symptom
                    </span>
                    <h3 class="fa-stack-sheet__title">{titles.risk}</h3>
                </header>
                <PatternBody doc={doc} />
            </article>

            {/* Sheet 2 — What sits underneath (blue tab) */}
            <article
                class="fa-stack-sheet fa-stack-sheet--proof"
                aria-label={t("What sits underneath sheet")}
            >
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label fa-stack-sheet__label--blue">
                        What sits underneath
                    </span>
                    <h3 class="fa-stack-sheet__title">{titles.proof}</h3>
                </header>
                <ProofBody doc={doc} mode={mode} />
            </article>

            {/* Sheet 3 — Failure pattern (green tab) */}
            <article
                class="fa-stack-sheet fa-stack-sheet--motion"
                aria-label={t("Failure pattern sheet")}
            >
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label fa-stack-sheet__label--green">
                        Failure pattern
                    </span>
                    <h3 class="fa-stack-sheet__title">{titles.motion}</h3>
                </header>
                <SymptomBody doc={doc} />
            </article>
        </section>
    );
}

/**
 * Generate sentence-shaped sheet titles from the autopsy doc.
 *
 * Replaces the legacy categorical labels ("Causal pattern",
 * "Proof + decision", "Symptom evidence") with authored sentences
 * tuned to the deal's specific shape. Reads like a forensic write-up.
 */
function sentenceTitlesFor(doc: AutopsyDoc): {
    risk: string;
    proof: string;
    motion: string;
} {
    const v = doc.deal;

    const topCause = doc.causes[0];
    const risk = topCause?.label
        ? `${topCause.label}.`
        : v.staleDays >= 14
        ? `Stage is moving but the deal isn't — ${v.staleDays} days since anything happened.`
        : "The board looks healthy. Confirm before you forecast on it.";

    const proof = !v.economicBuyer
        ? "There's pilot evidence, but no one with authority owns it."
        : !v.champion
        ? "The buyer is identified, but no one inside their company is carrying this forward."
        : v.qualScore < 10
        ? "Qualification is thin — the buyer can't take the pilot results to their boss yet."
        : "Owner and inside carrier are both named. The pilot results can be carried into the room.";

    const motion = !v.hasNextStep
        ? "There's no dated next step — the process is running ahead of any control."
        : v.staleDays >= 30
        ? "The thread moved early in the cycle; no one is steering the close path now."
        : "The thread is alive. Confirm the close path still tracks what's actually happening.";

    return { risk, proof, motion };
}

interface BodyProps {
    readonly doc: AutopsyDoc;
}

function PatternBody({ doc }: BodyProps): JSX.Element {
    if (doc.chapters.length === 0) {
        return (
            <p class="fa-stack-sheet__copy">
                No failure pattern detected at this horizon. The deal
                looks healthy — but a pattern can emerge between now
                and the close gate.
            </p>
        );
    }
    return (
        <ul class="fa-stack-sheet__list">
            {doc.chapters.map((c, i) => {
                const cause = doc.causes[i];
                return (
                    <li key={c.cause} class="fa-stack-sheet__row">
                        <span class="fa-stack-sheet__row-label">
                            {cause?.label ?? c.cause}
                        </span>
                        <span class="fa-stack-sheet__row-text">{c.story}</span>
                    </li>
                );
            })}
        </ul>
    );
}

interface ProofBodyProps {
    readonly doc: AutopsyDoc;
    readonly mode: VerdictMode;
}

function ProofBody({ doc, mode }: ProofBodyProps): JSX.Element {
    const story = mode === "corrected" ? doc.winStory : doc.loseStory;
    const winList = doc.winConditions.slice(0, 3);
    return (
        <div class="fa-stack-sheet__proof">
            <p class="fa-stack-sheet__story">{story}</p>
            <ul class="fa-stack-sheet__list">
                {winList.map((w) => (
                    <li key={w.id} class="fa-stack-sheet__row">
                        <span class="fa-stack-sheet__row-label">
                            {w.id.replace(/_/g, " ")}
                        </span>
                        <span class="fa-stack-sheet__row-text">{w.story}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SymptomBody({ doc }: BodyProps): JSX.Element {
    const v = doc.deal;
    const rows = [
        { label: "Stage", value: v.stage },
        {
            label: "Days since last activity",
            value: v.staleDays === 0 ? "today" : `${v.staleDays}d`
        },
        { label: "Risk score", value: `${v.riskScore} / 100` },
        { label: "Qual score", value: `${v.qualScore} / 18` },
        { label: "Champion", value: v.champion ?? "missing" },
        { label: "Economic buyer", value: v.economicBuyer ?? "missing" },
        { label: "Next step", value: v.hasNextStep ? "set" : "missing" },
        { label: "Close date", value: v.closeDate ?? "unset" }
    ];
    return (
        <ul class="fa-stack-sheet__list fa-stack-sheet__list--rows">
            {rows.map((r) => (
                <li
                    key={r.label}
                    class="fa-stack-sheet__row fa-stack-sheet__row--evidence"
                >
                    <span class="fa-stack-sheet__row-label">{r.label}</span>
                    <span class="fa-stack-sheet__row-text">{r.value}</span>
                </li>
            ))}
        </ul>
    );
}
