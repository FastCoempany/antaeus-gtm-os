import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { rack } from "../state";
import {
    hrefToColdCallStudio,
    hrefToLinkedInPlaybook,
    hrefToSignalConsole
} from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room cross-room handoff.
 *
 * Three CTAs across the bottom of the room. All carry continuity
 * params so the destination renders a "Back to Outbound Studio"
 * affordance + restores focus when an account is in the rack.
 *
 * Phase 2.4 audit:
 *   - Used to render href="#" + aria-disabled on cold landing — the
 *     CTAs looked clickable but did nothing. Now always navigates;
 *     when no account is in the rack, destination loads at default
 *     state (no focusObject).
 *   - "RECOVERY CABLES" kicker (internal metaphor — Recovery Studio
 *     /motion-loom vocab) replaced with the standard
 *     "CARRY THE WORK FORWARD" pattern other rooms use.
 *   - Two-line label+sub format flattened to single-line verb-shape
 *     sales moves matching the destination room's intent.
 */
export function HandoffStrip(): JSX.Element {
    const account = rack.value.accountName.trim();
    const focus = account.length > 0 ? account : "";

    return (
        <nav class="ob-handoff" aria-label={t("Cross-room routes")}>
            <span class="ob-handoff__kicker">{t("CARRY THE WORK FORWARD")}</span>
            <div class="ob-handoff__list">
                <a
                    class="ob-handoff__cta"
                    href={hrefToSignalConsole(focus)}
                >
                    {t("Check the signals")}
                </a>
                <a
                    class="ob-handoff__cta ob-handoff__cta--primary"
                    href={hrefToLinkedInPlaybook(focus)}
                >
                    {t("Send LinkedIn air cover")}
                </a>
                <a
                    class="ob-handoff__cta"
                    href={hrefToColdCallStudio(focus)}
                >
                    {t("Run a cold call")}
                </a>
            </div>
        </nav>
    );
}
