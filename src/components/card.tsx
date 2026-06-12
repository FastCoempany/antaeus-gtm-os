import type { ComponentChildren, JSX } from "preact";
import { t } from "@/lib/voice/t";
import type { AccentRole, DataState } from "./contract";
import { Gauge, Heading, Kicker } from "./display";

/**
 * Card — the Grounded primitive (03 §2.3): the card has gravity. It
 * rests on the field with a real (subtle) shadow; the gauge on its
 * left edge carries its state as color; at most ONE card per zone
 * breaks rank as `offset` (03 §2.4) and may carry the offset action.
 *
 * The five data states (03 §4.4) are part of the component, not the
 * room: loading holds the silhouette; empty is directional (why it
 * matters + one move), supplied by the caller as emptyWhy/emptyMove;
 * error is honest and recoverable; unsaved work carries the quiet
 * amber marker so a save is never ambiguous.
 */

export interface CardProps {
    readonly kicker?: string;
    readonly title?: string;
    readonly tone?: AccentRole;
    readonly offset?: boolean;
    readonly state?: DataState;
    /** Empty state: why the surface matters, in a sentence. */
    readonly emptyWhy?: string;
    /** Empty state: the one move that fills it. */
    readonly emptyMove?: JSX.Element;
    /** Error state: what happened + how to recover, plain words. */
    readonly errorText?: string;
    readonly errorRetry?: JSX.Element;
    readonly unsaved?: boolean;
    readonly children?: ComponentChildren;
    readonly footer?: ComponentChildren;
}

export function Card(props: CardProps): JSX.Element {
    const state = props.state ?? "ready";

    if (state === "empty") {
        return (
            <section class="ds-empty">
                {props.kicker ? <Kicker>{props.kicker}</Kicker> : null}
                {props.emptyWhy ? (
                    <p class="ds-empty__why">{props.emptyWhy}</p>
                ) : null}
                {props.emptyMove ?? null}
            </section>
        );
    }

    if (state === "error") {
        return (
            <section class="ds-error" role="alert">
                <span>{props.errorText}</span>
                {props.errorRetry ?? null}
            </section>
        );
    }

    return (
        <article
            class={`ds-card${props.offset ? " ds-card--offset" : ""}${
                state === "loading" ? " ds-card--loading" : ""
            }`}
            aria-busy={state === "loading"}
        >
            <Gauge tone={props.tone} />
            <div class="ds-card__body">
                {props.kicker ? <Kicker>{props.kicker}</Kicker> : null}
                {props.title ? (
                    <div class="ds-card__head">
                        <Heading level="title">{props.title}</Heading>
                        {props.unsaved ? (
                            <span class="ds-card__unsaved">
                                {t("Unsaved changes")}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                {props.children}
                {props.footer ? (
                    <footer class="ds-card__foot">{props.footer}</footer>
                ) : null}
            </div>
        </article>
    );
}
