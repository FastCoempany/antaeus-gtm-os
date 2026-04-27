import type { JSX } from "preact";
import {
    currentAutopsy,
    currentForensicSheet,
    currentVerdictMode,
    setForensicSheet
} from "../state";
import type { AutopsyDoc, ForensicSheetKey, VerdictMode } from "../lib/types";

/**
 * ForensicSheets — three-tab evidence rack inside the pinned-case
 * panel. Per canon §4.14: "the deal is pinned as evidence." Each
 * sheet surfaces one dimension of the autopsy:
 *
 *   pattern  — causal pattern: chapters per top cause
 *   proof    — proof + decision evidence: verdict-mode story
 *   symptom  — concrete deal-state evidence rows
 */

const TABS: ReadonlyArray<{ key: ForensicSheetKey; label: string }> = [
    { key: "pattern", label: "Causal pattern" },
    { key: "proof", label: "Proof + decision" },
    { key: "symptom", label: "Symptom evidence" }
];

export function ForensicSheets(): JSX.Element {
    const doc = currentAutopsy.value;
    const sheet = currentForensicSheet.value;
    const mode = currentVerdictMode.value;

    return (
        <section class="fa-sheet" aria-label="Forensic sheets">
            <nav class="fa-sheet__tabs" aria-label="Sheet selector">
                {TABS.map((t) => {
                    const isActive = t.key === sheet;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            class={`fa-sheet__tab${isActive ? " is-active" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => setForensicSheet(t.key)}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </nav>
            <div class={`fa-sheet__body fa-sheet__body--${mode}`}>
                {!doc ? (
                    <p class="fa-sheet__empty">
                        No diagnosis yet — the active sheet lights up when a
                        case is pinned.
                    </p>
                ) : sheet === "pattern" ? (
                    <PatternSheet doc={doc} />
                ) : sheet === "proof" ? (
                    <ProofSheet doc={doc} mode={mode} />
                ) : (
                    <SymptomSheet doc={doc} />
                )}
            </div>
        </section>
    );
}

interface PatternProps {
    readonly doc: AutopsyDoc;
}

function PatternSheet({ doc }: PatternProps): JSX.Element {
    if (doc.chapters.length === 0) {
        return (
            <p class="fa-sheet__empty">
                No failure pattern detected. The deal looks healthy at this
                horizon.
            </p>
        );
    }
    return (
        <ul class="fa-sheet__list">
            {doc.chapters.map((c, i) => {
                const cause = doc.causes[i];
                return (
                    <li key={c.cause} class="fa-sheet__row">
                        <span class="fa-sheet__row-label">
                            {cause?.label ?? c.cause}
                        </span>
                        <span class="fa-sheet__row-text">{c.story}</span>
                    </li>
                );
            })}
        </ul>
    );
}

interface ProofProps {
    readonly doc: AutopsyDoc;
    readonly mode: VerdictMode;
}

function ProofSheet({ doc, mode }: ProofProps): JSX.Element {
    const story = mode === "corrected" ? doc.winStory : doc.loseStory;
    const winList = doc.winConditions.slice(0, 3);
    return (
        <div class="fa-sheet__proof">
            <p class="fa-sheet__story">{story}</p>
            <ul class="fa-sheet__list">
                {winList.map((w) => (
                    <li key={w.id} class="fa-sheet__row">
                        <span class="fa-sheet__row-label">{w.id.replace(/_/g, " ")}</span>
                        <span class="fa-sheet__row-text">{w.story}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface SymptomProps {
    readonly doc: AutopsyDoc;
}

function SymptomSheet({ doc }: SymptomProps): JSX.Element {
    const v = doc.deal;
    const rows = [
        { label: "Stage", value: v.stage },
        {
            label: "Days since last activity",
            value: v.staleDays === 0 ? "today" : `${v.staleDays}d`
        },
        { label: "Risk score", value: `${v.riskScore} / 100` },
        { label: "Qual score", value: `${v.qualScore} / 18` },
        {
            label: "Champion",
            value: v.champion ?? "missing"
        },
        {
            label: "Economic buyer",
            value: v.economicBuyer ?? "missing"
        },
        {
            label: "Next step",
            value: v.hasNextStep ? "set" : "missing"
        },
        {
            label: "Close date",
            value: v.closeDate ?? "unset"
        }
    ];
    return (
        <ul class="fa-sheet__list fa-sheet__list--rows">
            {rows.map((r) => (
                <li key={r.label} class="fa-sheet__row fa-sheet__row--evidence">
                    <span class="fa-sheet__row-label">{r.label}</span>
                    <span class="fa-sheet__row-text">{r.value}</span>
                </li>
            ))}
        </ul>
    );
}
