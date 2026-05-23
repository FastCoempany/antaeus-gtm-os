import type { JSX } from "preact";

/**
 * Topbar — kicker + thesis headline + subtitle for the Briefing room.
 *
 * Voice per canon §4.21 + Voice Document v0.1: a peer telling the
 * operator what they see, not a dashboard label. The room's job is to
 * test the operator's stated preferences (ICP, watchlist, competitive
 * set) against what the data is actually doing — and say so when they
 * stop agreeing. The headline names that, the subtitle expands it.
 *
 * No interactive controls in B.0b. The cmd+K palette opens via
 * RoomChrome (mounted in Briefing.tsx); the back-pill is part of the
 * same chrome strip. This topbar is presentational only.
 */
export function Topbar(): JSX.Element {
    return (
        <header class="bf-topbar">
            <p class="bf-topbar__kicker">
                Briefing · weekly read · scaffold
            </p>
            <h1 class="bf-topbar__title">
                What the system saw this week.
            </h1>
            <p class="bf-topbar__sub">
                The operator's stated preferences are a hypothesis. The
                pipeline tests them against what's actually moving in the
                world. This page tells you when the evidence and the
                hypothesis stop agreeing.
            </p>
        </header>
    );
}
