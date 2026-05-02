import type { JSX } from "preact";
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
            <section class="fa-sheet fa-sheet--empty" aria-label="Forensic sheets">
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
            aria-label="Forensic sheets"
        >
            {/* Sheet 1 — Risk: causal pattern */}
            <article class="fa-stack-sheet" aria-label="Risk sheet">
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label">Risk</span>
                    <h3 class="fa-stack-sheet__title">{titles.risk}</h3>
                </header>
                <PatternBody doc={doc} />
            </article>

            {/* Sheet 2 — Proof: ownership + decision evidence */}
            <article class="fa-stack-sheet" aria-label="Proof sheet">
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label">Proof</span>
                    <h3 class="fa-stack-sheet__title">{titles.proof}</h3>
                </header>
                <ProofBody doc={doc} mode={mode} />
            </article>

            {/* Sheet 3 — Motion: live thread state */}
            <article class="fa-stack-sheet" aria-label="Motion sheet">
                <header class="fa-stack-sheet__head">
                    <span class="fa-stack-sheet__label">Motion</span>
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
        ? `Stage outruns truth — ${v.staleDays} days quiet.`
        : "The board reads healthy. Confirm before forecasting.";

    const proof = !v.economicBuyer
        ? "Proof looks alive, ownership does not."
        : !v.champion
        ? "Buyer is identified; the carrier inside is not."
        : v.qualScore < 10
        ? "Qualification is thin — proof can't be carried yet."
        : "Owner + carrier are named. Proof is portable.";

    const motion = !v.hasNextStep
        ? "Process before control — no dated next step."
        : v.staleDays >= 30
        ? "The thread moved early; no one's controlling the close path now."
        : "The live thread is moving. Confirm the close path tracks the move.";

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
