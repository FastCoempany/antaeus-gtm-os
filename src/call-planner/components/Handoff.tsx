import type { JSX } from "preact";

/**
 * Handoff — Wave 1 placeholder for the cross-room route dock.
 *
 * Wave 5 fills this with the 3 routes:
 *   - Open Discovery Studio (writes gtmos_call_handoff payload first)
 *   - Open Deal Workspace (?deal=<id> when a deal is linked)
 *   - Copy agenda brief to clipboard
 * Plus the outcome buttons (advanced / stalled / no-show / ...).
 */
export function Handoff(): JSX.Element {
    return (
        <section class="cp-handoff" aria-label="Cross-room handoff + outcomes">
            <p class="cp-handoff__kicker">ROUTE THE TRUTH FORWARD</p>
            <h2 class="cp-handoff__title">
                Do not let the script die in prep.
            </h2>
            <p class="cp-handoff__placeholder">
                Wave 5 wires the 3-route dock (Discovery Studio /
                Deal Workspace / Copy brief) + Wave 4 wires the outcome
                buttons (advanced / stalled / no-show / rescheduled /
                lost) that bump <code>gtmos_discovery_stats</code> and
                persist <code>gtmos_call_handoff</code>.
            </p>
        </section>
    );
}
