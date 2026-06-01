import type { JSX } from "preact";

export function Topbar(): JSX.Element {
    return (
        <header class="oe-topbar">
            <p class="oe-topbar__kicker">OUTDOORS EVENTS</p>
            <h1 class="oe-topbar__title">
                Where people are gathering, found for you.
            </h1>
            <p class="oe-topbar__sub">
                The system reads your product category and finds offline
                gatherings worth knowing about — direct to your space,
                adjacent to it, and indirect-but-buyer-relevant.
                Conferences, mixers, trade shows, meetups. You decide
                which ones matter.
            </p>
        </header>
    );
}
