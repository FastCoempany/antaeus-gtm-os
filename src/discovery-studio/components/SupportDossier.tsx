import type { JSX } from "preact";
import {
    inboundQuestionHandlers,
    objectionLibrary,
    supportDossier
} from "../state";

/**
 * SupportDossier — Wave 2.
 *
 * Three sections of reference content for the active framework:
 *   - Proof + decision anchors (the supportDossier topics)
 *   - Objection library (trigger → reply)
 *   - Inbound question handlers (question → bridge)
 *
 * Wave 2 keeps the dossier as an always-visible side panel for layout
 * testing. Wave 5 (guardian gaps) makes it a slide-in drawer triggered
 * by a topbar button, matching the legacy room's UX.
 *
 * Items in supportDossier topics can be either strings (terse) or
 * {heading, body} objects (richer); renderer handles both.
 */
export function SupportDossier(): JSX.Element {
    const dossier = supportDossier.value;
    const objections = objectionLibrary.value;
    const inbound = inboundQuestionHandlers.value;

    const hasContent =
        dossier.length > 0 || objections.length > 0 || inbound.length > 0;

    return (
        <aside class="ds-support-dossier" aria-label="Support dossier">
            <header class="ds-support-dossier__header">Dossier</header>
            {!hasContent ? (
                <p class="ds-support-dossier__empty">
                    Pick a framework above to load its proof, objection,
                    and inbound-question dossier.
                </p>
            ) : (
                <div class="ds-support-dossier__sections">
                    {dossier.length > 0 ? (
                        <section class="ds-support-dossier__section">
                            <h3 class="ds-support-dossier__section-title">
                                Proof + decision anchors
                            </h3>
                            {dossier.map((topic, i) => (
                                <div key={i} class="ds-support-dossier__topic">
                                    <h4>{topic.title}</h4>
                                    <ul>
                                        {topic.items.map((item, j) => (
                                            <li key={j}>
                                                {typeof item === "string" ? (
                                                    item
                                                ) : (
                                                    <>
                                                        <strong>
                                                            {item.heading}
                                                        </strong>
                                                        {" — "}
                                                        {item.body}
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    ) : null}
                    {objections.length > 0 ? (
                        <section class="ds-support-dossier__section">
                            <h3 class="ds-support-dossier__section-title">
                                Objection library
                            </h3>
                            <dl>
                                {objections.map((o, i) => (
                                    <div key={i} class="ds-support-dossier__pair">
                                        <dt>{o.trigger}</dt>
                                        <dd>{o.reply}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}
                    {inbound.length > 0 ? (
                        <section class="ds-support-dossier__section">
                            <h3 class="ds-support-dossier__section-title">
                                Inbound questions
                            </h3>
                            <dl>
                                {inbound.map((h, i) => (
                                    <div key={i} class="ds-support-dossier__pair">
                                        <dt>{h.question}</dt>
                                        <dd>{h.bridge}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}
                </div>
            )}
        </aside>
    );
}
