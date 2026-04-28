import type { ComponentChildren, JSX } from "preact";
import { stepIndex } from "../state";
import { STEP_ORDER } from "../lib/types";

export interface StepShellProps {
    readonly kicker: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly children: ComponentChildren;
    readonly onNext?: () => void;
    readonly onBack?: () => void;
    readonly nextLabel?: string;
    readonly nextDisabled?: boolean;
    readonly hideBack?: boolean;
}

/**
 * StepShell — every step's outer chrome. Renders the kicker/title/sub,
 * the step body, and the back/next button row. Each step gets its own
 * focused content slot.
 */
export function StepShell(props: StepShellProps): JSX.Element {
    const idx = stepIndex.value;
    const isFirst = idx === 0;
    return (
        <article class="ob-step">
            <header class="ob-step__head">
                <p class="ob-step__kicker">{props.kicker}</p>
                <h2 class="ob-step__title">{props.title}</h2>
                {props.subtitle ? (
                    <p class="ob-step__sub">{props.subtitle}</p>
                ) : null}
            </header>
            <div class="ob-step__body">{props.children}</div>
            <footer class="ob-step__foot">
                {!isFirst && !props.hideBack ? (
                    <button
                        type="button"
                        class="ob-btn ob-btn--ghost"
                        onClick={() => props.onBack?.()}
                    >
                        Back
                    </button>
                ) : (
                    <span />
                )}
                {props.onNext ? (
                    <button
                        type="button"
                        class="ob-btn ob-btn--primary"
                        onClick={() => props.onNext?.()}
                        disabled={props.nextDisabled}
                    >
                        {props.nextLabel ?? "Continue"}
                    </button>
                ) : null}
            </footer>
        </article>
    );
}

export function isLastStepBeforeComplete(): boolean {
    return stepIndex.value === STEP_ORDER.length - 2;
}
