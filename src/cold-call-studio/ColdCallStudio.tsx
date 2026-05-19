import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { AccountRow } from "./components/AccountRow";
import { TalkLoom } from "./components/TalkLoom";
import { CallMemory } from "./components/CallMemory";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * ColdCallStudio — Wave 1 root.
 *
 * Per canon §4.9 (Live Instrument family):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + headline + live call count                     │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  AccountRow: account select + contact name + handoff buttons   │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  TalkLoom: 6-thread spine, branch picker, say-next capture     │
 *   │  (Wave 3 wires the full live console)                          │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  CallMemory: outcome log + cross-room handoff strip            │
 *   │  (Wave 4 wires persistence; Wave 5 wires the strip)            │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the threads +
 * data tables. Wave 3 builds the live thread navigation + branch
 * picker UI. Wave 4 wires outcome logging + persistence + score read.
 * Wave 5 wires cross-room handoff (`meeting_booked` writes Deal),
 * URL inbound, and the call memory grid. Wave 6 wires the legacy
 * flag-redirect cutover.
 */
export function ColdCallStudio(): JSX.Element {
    return (
        <div class="cc-shell">
            <RoomChrome kicker="COLD CALL STUDIO"/>
            <Topbar />
            <AccountRow />
            <TalkLoom />
            <CallMemory />
        </div>
    );
}
