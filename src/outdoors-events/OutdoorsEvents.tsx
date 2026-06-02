import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { Topbar } from "./components/Topbar";
import { DiscoveryConsole } from "./components/DiscoveryConsole";
import { EventComposer } from "./components/EventComposer";
import { EventList } from "./components/EventList";

/**
 * Outdoors Events — root component (ADR-015 + ADR-016).
 *
 * Live Instrument family: the discovery console drives the room (Run
 * discovery now + last-run summary), the tier-grouped event list sits
 * below. The manual composer is demoted to a secondary "add by hand"
 * fallback — discovery is the primary path per ADR-016.
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
                <DiscoveryConsole />
                <EventList />
                <EventComposer />
            </main>
        </>
    );
}
