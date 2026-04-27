import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { Switchboard } from "./components/Switchboard";
import { OutputPanel } from "./components/OutputPanel";

/**
 * OutboundStudio — Wave 1 root.
 *
 * Per canon §4.8 (Live Instrument family):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + dynamic touch count                  │
 *   ├──────────────────────────────────┬──────────────────────────────┤
 *   │  Switchboard (operator rack)     │  OutputPanel (send line)     │
 *   │  - account / contact             │  - generated line            │
 *   │  - persona / temp / trigger      │  - copy / save / log         │
 *   │  - no-ask toggle                 │  - recommendations           │
 *   ├──────────────────────────────────┴──────────────────────────────┤
 *   │  TouchLog (Wave 5) + cross-room handoff strip                   │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the generator.
 * Wave 3 wires the switchboard form. Wave 4 wires output + persistence.
 * Wave 5 adds the touch log + URL inbound + cross-room handoff.
 * Wave 6 adds the legacy flag-redirect cutover.
 */
export function OutboundStudio(): JSX.Element {
    return (
        <div class="ob-shell">
            <Topbar />
            <div class="ob-stage">
                <Switchboard />
                <OutputPanel />
            </div>
        </div>
    );
}
