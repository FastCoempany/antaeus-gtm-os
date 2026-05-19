import type { JSX } from "preact";
import { ModeSwitcher } from "./ModeSwitcher";
import { ReadinessAnchor } from "./ReadinessAnchor";
import {
    commandSummary,
    openReadinessDrawer,
    readinessSummary
} from "../state";

/**
 * Topbar — focus + mode switcher + readiness anchor.
 *
 * Per canon §4.2 (Command Chamber family): "the dashboard is where the
 * hallway dies." The topbar is the only navigation surface in this
 * room; everything else is the ranked work itself.
 *
 * Dashboard audit (2026-05) deltas applied here:
 *   - BackButton removed. Dashboard is the operator's home; "back"
 *     leads nowhere coherent. The global wordmark in the room-chrome
 *     strip provides the home link.
 *   - Focus H1 demoted (was clamp(40,5vw,76)px — hero-marketing
 *     weight). The ranked spotlight is now the visual hero; the
 *     focus is a confident kicker, not a headline.
 *   - Subtitle line ("One ranked object. One dominant move…") removed
 *     entirely. That was design documentation, not work.
 *   - Export snapshot moved off the topbar rail and into the
 *     Readiness drawer footer (verdict + snapshot are conceptually
 *     paired; export is a low-frequency action that doesn't belong
 *     next to a high-frequency mode switch).
 *   - Readiness Anchor suppressed when the workspace is empty (no
 *     ranked objects yet) — the "You are the system" verdict is
 *     gibberish without context; the anchor returns the moment any
 *     dimension has data.
 */
export function Topbar(): JSX.Element {
    const summary = readinessSummary.value;
    const cmd = commandSummary.value;
    // The anchor needs SOMETHING to anchor against. On a truly empty
    // workspace every dimension is zero and the verdict reads as a
    // meaningless label. Suppress until at least one dimension has data.
    const showAnchor = summary.dimensions.some((d) => d.score > 0);

    // Phase 2.2 audit — kicker carries contextual workspace tail
    // (parity with the kicker-tail pattern used across the audited
    // rooms). Was just "DASHBOARD" — duplicated the wordmark.
    const riskCount = cmd.riskCards.length;
    const moveCount = cmd.moveCards.length;
    const kickerTail =
        riskCount + moveCount > 0
            ? `${cmd.ranked.length} ranked · ${riskCount} ${riskCount === 1 ? "deal" : "deals"} at risk · ${moveCount} ${moveCount === 1 ? "move" : "moves"} queued`
            : "no live pressure";

    return (
        <header class="db-topbar">
            <div class="db-topbar__lead">
                <p class="db-topbar__kicker">DASHBOARD · {kickerTail}</p>
                <h1 class="db-topbar__title">
                    What is under the most pressure right now.
                </h1>
            </div>
            <div class="db-topbar__rail">
                {showAnchor ? (
                    <ReadinessAnchor
                        verdict={summary.verdict}
                        verdictLabel={summary.verdictLabel}
                        onOpen={openReadinessDrawer}
                    />
                ) : null}
                <ModeSwitcher />
            </div>
        </header>
    );
}
