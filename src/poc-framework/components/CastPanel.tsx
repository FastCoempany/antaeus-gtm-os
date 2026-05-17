import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { draft, linkedDeal } from "../state";
import { computeQuality, deriveMolds } from "../lib/quality";
import { generateDocs } from "../lib/docs";
import type { ProofDocs } from "../lib/types";
import { RouteRack } from "./RouteRack";

const DOC_LABELS: Record<keyof ProofDocs, string> = {
    scope: "Pilot scope",
    kickoff: "Kickoff agenda",
    readout: "Readout agenda",
    email: "Proposal email"
};

/**
 * CastPanel — Wave 4 implementation (right, cream "cast" half).
 *
 * Per canon §4.15: the cast is the consequence of the forge —
 * weakest-mold diagnosis, the four generated documents, and the
 * route rack into Deal Workspace / Future Autopsy / Advisor Deploy.
 *
 * Wave 4 ships the docs section with copy-to-clipboard. Wave 5 wires
 * the route rack.
 */
export function CastPanel(): JSX.Element {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const quality = computeQuality(drft, linked);
    const molds = deriveMolds(drft, quality);
    const docs = generateDocs(drft, linked);
    const [activeDoc, setActiveDoc] = useState<keyof ProofDocs>("scope");

    return (
        <section class="poc-cast" aria-label="Proof cast">
            <header class="poc-cast__header">
                <p class="poc-cast__kicker">CAST</p>
                <h2 class="poc-cast__title">{quality.title}</h2>
                <p class="poc-cast__sub">
                    Quality {quality.score}/100 ·{" "}
                    <span class={`poc-cast__band poc-cast__band--${quality.band}`}>
                        {quality.bandLabel}
                    </span>
                </p>
            </header>

            <ul class="poc-mold-grid" aria-label="Mold grid">
                {molds.map((m) => (
                    <li
                        key={m.label}
                        class={`poc-mold poc-mold--${m.state}`}
                        aria-label={`${m.label}: ${m.value}`}
                    >
                        <span class="poc-mold__label">{m.label}</span>
                        <span class="poc-mold__value">{m.value}</span>
                    </li>
                ))}
            </ul>

            <section class="poc-weakest" aria-label="Weakest mold">
                <p class="poc-weakest__kicker">WEAKEST MOLD · NEXT MOVE</p>
                <p class="poc-weakest__title">{quality.weakest.title}</p>
                <p class="poc-weakest__copy">{quality.weakest.copy}</p>
            </section>

            <DocsRack docs={docs} active={activeDoc} onSelect={setActiveDoc} />

            <RouteRack />
        </section>
    );
}

interface DocsRackProps {
    readonly docs: ProofDocs;
    readonly active: keyof ProofDocs;
    readonly onSelect: (key: keyof ProofDocs) => void;
}

function DocsRack({ docs, active, onSelect }: DocsRackProps): JSX.Element {
    const keys: ReadonlyArray<keyof ProofDocs> = [
        "scope",
        "kickoff",
        "readout",
        "email"
    ];
    const text = docs[active];

    function copy(): void {
        if (typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            void navigator.clipboard.writeText(text);
        } catch {
            // best-effort
        }
    }

    return (
        <section class="poc-docs" aria-label="Proof documents">
            <header class="poc-docs__header">
                <p class="poc-docs__kicker">DOCUMENTS</p>
                <button type="button" class="poc-docs__copy" onClick={copy}>
                    Copy
                </button>
            </header>
            <nav class="poc-docs__tabs" aria-label="Document selector">
                {keys.map((key) => (
                    <button
                        key={key}
                        type="button"
                        class={`poc-docs__tab${
                            key === active ? " is-active" : ""
                        }`}
                        aria-pressed={key === active}
                        onClick={() => onSelect(key)}
                    >
                        {DOC_LABELS[key]}
                    </button>
                ))}
            </nav>
            <pre class="poc-docs__body">{text}</pre>
        </section>
    );
}
