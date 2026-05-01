import type { JSX } from "preact";
import type { Verdict } from "@/lib/readiness";

/**
 * Readiness Anchor — the compact topbar surface.
 *
 * Per canon §4.17: "Dashboard topbar carries a single Readiness Anchor —
 * verdict label + tiny chevron, max 1 line. Click → opens the Readiness
 * drawer (overlay, no route change)." Prominent but never obnoxious.
 *
 * The anchor never shows a number — the verdict is the value. The
 * dimension scoring is internal math revealed only inside the drawer.
 */

const VERDICT_TONE: Record<Verdict, string> = {
    you_are_the_system: "ink",
    building: "amber",
    inheritable_with_guardrails: "blue",
    hire_ready: "green",
    hire_ready_repeatable: "gold"
};

export interface ReadinessAnchorProps {
    readonly verdict: Verdict;
    readonly verdictLabel: string;
    readonly onOpen: () => void;
}

export function ReadinessAnchor(props: ReadinessAnchorProps): JSX.Element {
    const tone = VERDICT_TONE[props.verdict];
    return (
        <button
            type="button"
            class={`db-readiness-anchor db-readiness-anchor--${tone}`}
            onClick={props.onOpen}
            aria-label={`Readiness: ${props.verdictLabel}. Open drawer.`}
        >
            <span class="db-readiness-anchor__kicker">READINESS</span>
            <span class="db-readiness-anchor__label">{props.verdictLabel}</span>
            <span class="db-readiness-anchor__chevron" aria-hidden="true">›</span>
        </button>
    );
}
