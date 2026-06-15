import type { ComponentChildren, JSX } from "preact";
import { Button, Heading, Kicker } from "@/components";
import { t } from "@/lib/voice/t";
import { stepIndex } from "../../state";

export interface DsStepShellProps {
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
 * DsStepShell — every onboarding step's chrome, composed on the library.
 * Kicker + serif title + subtitle, the step body, and the back/continue
 * row (library Buttons — continue is the one dominant move per surface,
 * accent; back is a quiet ghost). Threshold posture per canon §4.3.
 */
export function DsStepShell(props: DsStepShellProps): JSX.Element {
    const isFirst = stepIndex.value === 0;
    return (
        <article class="obd-step">
            <header class="obd-step__head">
                <Kicker>{props.kicker}</Kicker>
                <Heading level="title">{props.title}</Heading>
                {props.subtitle ? (
                    <p class="obd-step__sub">{props.subtitle}</p>
                ) : null}
            </header>
            <div class="obd-step__body">{props.children}</div>
            <footer class="obd-step__foot">
                {!isFirst && !props.hideBack ? (
                    <Button variant="ghost" onClick={() => props.onBack?.()}>
                        {t("Back")}
                    </Button>
                ) : (
                    <span />
                )}
                {props.onNext ? (
                    <Button
                        variant="accent"
                        onClick={() => props.onNext?.()}
                        disabled={props.nextDisabled}
                    >
                        {props.nextLabel ?? t("Continue")}
                    </Button>
                ) : null}
            </footer>
        </article>
    );
}
