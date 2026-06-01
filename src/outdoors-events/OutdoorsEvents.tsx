import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { Topbar } from "./components/Topbar";
import { ReframeBanner } from "./components/ReframeBanner";
import { EventComposer } from "./components/EventComposer";
import { EventList } from "./components/EventList";

/**
 * Outdoors Events — root component (ADR-015).
 *
 * Live Instrument family (canon Part II §4.3): top of the room is a
 * working console (the composer), the tracked-events list sits below.
 * Strictly informational — the operator authors offline gatherings
 * where their buyers might be. No cross-room handoff in first-ship.
 */
export function OutdoorsEvents(): JSX.Element {
    return (
        <>
            <a class="oe-skip-link" href="#oe-room-main">
                Skip to your events
            </a>
            <RoomChrome kicker="OUTDOORS EVENTS" />
            <main id="oe-room-main" class="oe-room">
                <Topbar />
                <ReframeBanner />
                <EventComposer />
                <EventList />
            </main>
        </>
    );
}
