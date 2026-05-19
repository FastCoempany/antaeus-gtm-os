import type { JSX } from "preact";
import { allAccounts } from "../state";

/**
 * Topbar — kicker + thesis title + room mental-model line.
 *
 * Per canon §4.7 (Live Instrument family) + the picked-winner
 * Signal Console Variant 01 (AI-selected, 2026-05-01): the title
 * is a confident declaration, and the room frames its mental
 * model in one compressed italic line beneath.
 *
 * Audit deltas applied here:
 *   - BackButton removed. Signal Console is a primary destination;
 *     the wordmark in the room-chrome strip provides the home link.
 *   - H1 demoted (was hero weight). Now reads as a quiet declarative
 *     statement rather than competing with the account grid.
 *   - Subtitle restored — but compressed to one sentence and
 *     italicized per the winner. The 2026-05 audit removed the
 *     prior subtitle because it was design-documentation; the
 *     winner's line is the operator's mental model, not docs.
 */
export function Topbar(): JSX.Element {
    const count = allAccounts.value.length;
    return (
        <header class="sc-topbar">
            <p class="sc-topbar__kicker">
                SIGNAL CONSOLE ·{" "}
                {count > 0
                    ? `${count} account${count === 1 ? "" : "s"} on the radar`
                    : "no accounts yet"}
            </p>
            <h1 class="sc-topbar__title">
                Where account heat becomes real work.
            </h1>
            <p class="sc-topbar__thesis">
                Signals are time-limited. Heat ranks them. Motion comes
                from the account ledger — not from research piling up.
            </p>
        </header>
    );
}
