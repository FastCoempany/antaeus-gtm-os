import type { JSX } from "preact";
import { hottestAccount, stats } from "../state";

/**
 * Topbar — Wave 1.
 *
 * Per canon §4.10: "the inbox is not the opening scene." The topbar
 * carries the kicker + thesis + a live "actions logged this session"
 * count. The cue booth + ledger live below.
 */
export function Topbar(): JSX.Element {
    const s = stats.value;
    const acct = hottestAccount.value;
    const headerState = acct
        ? `Cue booth · ${acct.name}`
        : "Cue booth";
    return (
        <header class="lp-topbar" aria-label="LinkedIn Playbook header">
            <p class="lp-topbar__kicker">OUTBOUND CHANNEL</p>
            <h1 class="lp-topbar__title">LinkedIn Playbook</h1>
            <p class="lp-topbar__subtitle">
                Use LinkedIn as live channel air cover for real account
                motion. Watch the cue, take the public touch, then log what
                actually happened.
            </p>
            <div class="lp-topbar__meta" role="status">
                <span class="lp-topbar__state">{headerState}</span>
                <span class="lp-topbar__count">
                    {s.total} {s.total === 1 ? "cue" : "cues"} logged
                    {s.total > 0 ? ` · accept ${s.acceptRate}%` : ""}
                </span>
            </div>
        </header>
    );
}
