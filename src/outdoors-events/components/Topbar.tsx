import type { JSX } from "preact";

export function Topbar(): JSX.Element {
    return (
        <header class="oe-topbar">
            <p class="oe-topbar__kicker">OUTDOORS EVENTS</p>
            <h1 class="oe-topbar__title">
                Where people are gathering this season.
            </h1>
            <p class="oe-topbar__sub">
                Conferences, mixers, trade shows, meetups — anywhere your
                buyers might be in a room together. You author what's
                worth knowing about; the room remembers.
            </p>
        </header>
    );
}
