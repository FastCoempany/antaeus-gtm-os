import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { BrandMark } from "@/components/brand";
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
    // The Living Mark grounds as the verdict climbs (canon Part II §3).
    // Lifted = the motion still lives in your head; grounded once the
    // workspace would survive a hire taking it over.
    const grounded =
        props.verdict === "hire_ready" ||
        props.verdict === "hire_ready_repeatable";
    return (
        <button
            type="button"
            class={`db-readiness-anchor db-readiness-anchor--${tone}`}
            onClick={props.onOpen}
            aria-label={`Readiness: ${props.verdictLabel}. Open drawer.`}
        >
            <span class="db-readiness-anchor__mark" aria-hidden="true">
                <BrandMark size={18} lifted={!grounded} />
            </span>
            <span class="db-readiness-anchor__kicker">{t("READINESS")}</span>
            <span class="db-readiness-anchor__label">{props.verdictLabel}</span>
            <span class="db-readiness-anchor__chevron" aria-hidden="true">›</span>
        </button>
    );
}
