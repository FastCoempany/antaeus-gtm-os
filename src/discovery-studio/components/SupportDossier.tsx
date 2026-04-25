import type { JSX } from "preact";
import {
    inboundQuestionHandlers,
    objectionLibrary,
    supportDossier
} from "../state";

/**
 * SupportDossier — Wave 1 skeleton.
 *
 * Slide-in drawer with reference content for the active framework: proof
 * + decision anchors, objection-handler library, inbound-question bridges.
 *
 * Wave 1 keeps this always-visible as a side panel for layout testing.
 * Wave 2 wires the toggleable drawer behavior + the framework-specific
 * topic content.
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
                    No dossier content for this framework.
                </p>
            ) : (
                <>
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
                                                <strong>{item.heading}</strong>{" "}
                                                — {item.body}
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
                                    <div key={i}>
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
                                    <div key={i}>
                                        <dt>{h.question}</dt>
                                        <dd>{h.bridge}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}
                </>
            )}
        </aside>
    );
}
