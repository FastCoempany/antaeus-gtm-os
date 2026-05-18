import type { JSX } from "preact";
import type { CommandFamily, CommandObject } from "../lib/types";
import { explainCommandObject } from "../lib/command-intelligence";

/**
 * Slice — the Soft Cut card shape for one ranked CommandObject.
 *
 * Replaces FocalObject + QueueRail + QueueView item shapes with the
 * canonical 2-pane slice shape from Slice 01 Soft Cut.
 *
 * Layout (per dashboard-softcut-canonical.html):
 *
 *   ┌──────────────────────────────────────┬──────────────────┐
 *   │ left panel (fluid)                   │ right dock 104px │
 *   │   • family + badge                   │   • metric value │
 *   │   • card-name (title)                │   • 3 tone rules │
 *   │   • 3-row docket from scoreReasons   │                  │
 *   │   • footer copy + primary CTA        │                  │
 *   │   • 6px left tone-color rule         │                  │
 *   └──────────────────────────────────────┴──────────────────┘
 *
 * Tone color derived from `commandFamily`:
 *   risk → hot (orange) · advisor → live (green) · move/opp/icp → warm
 *   (blue) · system → cold (neutral). Same family → tone map the
 *   SoftCutSignalLine uses, so the chip-row and slice rules agree.
 *
 * Honest port: no Risk/Proof/Motion abstraction shoehorned in.
 * Surfaces what the ranking engine already produces (title, copy,
 * metricValue, scoreReasons, primary action) in the Soft Cut rhythm.
 */

interface Props {
    readonly object: CommandObject;
    readonly variant?: "default" | "focal";
    readonly onSelect?: (id: string) => void;
    readonly mode?: "brief" | "spotlight" | "queue";
}

export function Slice({
    object,
    variant = "default",
    onSelect,
    mode = "spotlight"
}: Props): JSX.Element {
    const tone = toneFor(object.commandFamily);
    const primary = object.actions[0];
    const explanation = explainCommandObject(object, mode);
    const docketRows = object.scoreReasons.slice(0, 3);

    return (
        <article
            class={`db-slice db-slice--${tone} db-slice--${variant}`}
            aria-labelledby={`slice-${object.id}`}
        >
            <div class="db-slice__left">
                <div class="db-slice__head">
                    <span class="db-slice__family">
                        {object.roomFamilyLabel}
                    </span>
                    {object.badge ? (
                        <span class="db-slice__badge">{object.badge}</span>
                    ) : null}
                </div>
                <h3 id={`slice-${object.id}`} class="db-slice__title">
                    {onSelect ? (
                        <button
                            type="button"
                            class="db-slice__title-btn"
                            onClick={() => onSelect(object.id)}
                        >
                            {object.title}
                        </button>
                    ) : (
                        object.title
                    )}
                </h3>
                {docketRows.length > 0 ? (
                    <ul class="db-slice__docket">
                        {docketRows.map((reason, idx) => (
                            <li
                                key={`${object.id}-r${idx}`}
                                class={`db-slice__docket-row db-slice__docket-row--${idx === 0 ? "hot" : idx === 1 ? "warm" : "live"}`}
                            >
                                <span class="db-slice__docket-mark" aria-hidden="true" />
                                <span class="db-slice__docket-text">{reason}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}
                <footer class="db-slice__foot">
                    {object.copy ? (
                        <p class="db-slice__copy">{object.copy}</p>
                    ) : (
                        <p class="db-slice__copy">{explanation.title}</p>
                    )}
                    {primary ? (
                        <a class="db-slice__cta" href={primary.href}>
                            {primary.label} →
                        </a>
                    ) : null}
                </footer>
            </div>
            <div class="db-slice__dock">
                {object.metricValue ? (
                    <div class="db-slice__amount">{object.metricValue}</div>
                ) : (
                    <div class="db-slice__amount db-slice__amount--score">
                        {object.score}
                    </div>
                )}
                <div class="db-slice__rules" aria-hidden="true">
                    <span class="db-slice__rule db-slice__rule--hot" />
                    <span class="db-slice__rule db-slice__rule--warm" />
                    <span class="db-slice__rule db-slice__rule--live" />
                </div>
            </div>
        </article>
    );
}

type SliceTone = "hot" | "warm" | "live" | "cold";

function toneFor(family: CommandFamily): SliceTone {
    switch (family) {
        case "risk":
            return "hot";
        case "advisor":
            return "live";
        case "opportunity":
        case "move":
        case "icp":
            return "warm";
        case "system":
            return "cold";
    }
}
