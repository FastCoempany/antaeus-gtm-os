import type { JSX } from "preact";
import type {
    AuthoredSection,
    SectionId,
    SectionStatus
} from "../lib/types";
import { SECTION_KICKER, SECTION_TITLE } from "../lib/types";

/**
 * SectionFrame — renders ONE of the seven authored sections.
 *
 * Layout (canon §4.19):
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  KICKER · §N             [status badge]                  │
 *   │  Serif title (the section's thesis)                      │
 *   │                                                          │
 *   │  Body paragraphs (1-3, authored prose, NOT bullets)      │
 *   │  Concrete evidence list (deal names, ICP labels)         │
 *   │                                                          │
 *   │  ┌────────────────────────────────────────────────────┐ │
 *   │  │  SURPRISE                                          │ │
 *   │  │  Cross-room headline                               │ │
 *   │  │  1-2 sentences of evidence                         │ │
 *   │  └────────────────────────────────────────────────────┘ │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Wave 1 renders empty placeholders for sections that don't yet have
 * authored content; Wave 3 fills them in.
 */

const STATUS_LABEL: Record<SectionStatus, string> = {
    ready: "Ready",
    partial: "Partial",
    empty: "Empty"
};

export interface SectionFrameProps {
    readonly id: SectionId;
    readonly section: AuthoredSection | null;
}

export function SectionFrame(props: SectionFrameProps): JSX.Element {
    const { id, section } = props;
    const kicker = section?.kicker ?? SECTION_KICKER[id];
    const title = section?.title ?? SECTION_TITLE[id];
    const status: SectionStatus = section?.status ?? "empty";

    return (
        <article class={`fg-section fg-section--${status}`} id={`fg-section-${id}`}>
            <header class="fg-section__head">
                <p class="fg-section__kicker">{kicker}</p>
                <span class={`fg-section__status fg-section__status--${status}`}>
                    {STATUS_LABEL[status]}
                </span>
            </header>
            <h2 class="fg-section__title">{title}</h2>

            {section && section.body.length > 0 ? (
                <div class="fg-section__body">
                    {section.body.map((p, i) => (
                        <p class="fg-section__para" key={i}>
                            {p}
                        </p>
                    ))}
                </div>
            ) : (
                <p class="fg-section__empty">
                    Not yet authored. This section fills in once the
                    underlying rooms have real evidence to draw from.
                </p>
            )}

            {section && section.evidence.length > 0 && (
                <ul class="fg-section__evidence">
                    {section.evidence.map((line) => (
                        <li class="fg-section__evidence-row" key={line}>
                            {line}
                        </li>
                    ))}
                </ul>
            )}

            {section?.surprise && (
                <aside
                    class={`fg-surprise fg-surprise--${section.surprise.tone}`}
                >
                    <p class="fg-surprise__kicker">SURPRISE</p>
                    <p class="fg-surprise__headline">
                        {section.surprise.headline}
                    </p>
                    <p class="fg-surprise__body">{section.surprise.body}</p>
                </aside>
            )}
        </article>
    );
}
