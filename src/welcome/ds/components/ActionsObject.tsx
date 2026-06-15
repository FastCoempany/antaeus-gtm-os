import type { JSX } from "preact";
import { Card, Heading } from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import { actions } from "../../state";
import { hrefForActionDestination } from "../../lib/handoff";

/**
 * ActionsObject — the dominant half of the Welcome Threshold: the ranked
 * next moves (canon §4.1: one dominant move per surface). The top-ranked
 * action is an offset card (the spec's most-pressured object — offset
 * tag outside, the orange anchored edge, the action straddling the
 * bottom border + the ambient pulse), the rest are quiet Grounded cards
 * queued in order. The ranked-action builder is the unchanged engine;
 * the surface is composed on the library.
 */

const STATE_LABEL: Record<"now" | "next" | "ready", string> = {
    now: "NOW",
    next: "NEXT",
    ready: "READY"
};

export function ActionsObject(): JSX.Element {
    const list = actions.value;
    const annotate = showsAnnotations();

    return (
        <section class="weld-actions" aria-label={t("Next moves")}>
            <div class="weld-actions__head">
                <p class="weld-kicker">{t("NEXT MOVES")}</p>
                <Heading level="title">{t("Pick the action that compounds.")}</Heading>
            </div>
            <ol class="weld-actions__list">
                {list.map((a, i) => {
                    const dominant = i === 0;
                    const cta = (
                        <a
                            class={`ds-btn ${dominant ? "ds-btn--accent" : "ds-btn--ghost"} weld-cta`}
                            href={hrefForActionDestination(a.href)}
                        >
                            {a.cta}
                        </a>
                    );
                    return (
                        <li key={a.key} class="weld-action">
                            <Card
                                kicker={dominant ? undefined : STATE_LABEL[a.state]}
                                offset={dominant}
                                offsetTag={dominant ? STATE_LABEL.now : undefined}
                                pulse={dominant}
                                footer={cta}
                            >
                                <p class="weld-action__title">{a.title}</p>
                                <p class="weld-action__body">{a.body}</p>
                                {a.meta.length > 0 ? (
                                    <ul class="weld-action__meta">
                                        {a.meta.map((m) => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                ) : null}
                                {annotate && a.why ? (
                                    <p class="weld-action__why">
                                        <span class="weld-mono">{t("Why")}</span> {a.why}
                                    </p>
                                ) : null}
                                {annotate && a.unlocks ? (
                                    <p class="weld-action__unlocks">
                                        <span class="weld-mono">{t("Opens up")}</span>{" "}
                                        {a.unlocks}
                                    </p>
                                ) : null}
                            </Card>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
