import type { JSX } from "preact";
import { allAccounts } from "../state";

/**
 * Topbar — kicker + thesis (now demoted) + account count meter.
 *
 * Per canon §4.7 (Live Instrument family) + Signal Console audit
 * (2026-05): the thesis line is a confident declaration, not a
 * marketing hero. The grid below is the visual hero.
 *
 * Audit deltas applied here:
 *   - BackButton removed. Signal Console is a primary destination;
 *     the wordmark in the room-chrome strip provides the home link.
 *   - H1 demoted (was hero weight). Now reads as a quiet declarative
 *     statement rather than competing with the account grid.
 *   - Subtitle removed entirely. Was design documentation, not work.
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
        </header>
    );
}
