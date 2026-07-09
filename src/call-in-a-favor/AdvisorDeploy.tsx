import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { DeskBoard } from "./components/DeskBoard";
import { SecondaryStack } from "./components/SecondaryStack";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * AdvisorDeploy — Wave 1 root.
 *
 * Per canon §4.16 (Live Instrument family — private influence desk):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + advisor/loop count + 4 quick action chips    │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  DeskBoard: hero + 3-cell route + desktop                      │
 *   │  (Wave 3: proof blotter + rolodex + ask sheet + stamps)        │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  SecondaryStack: 3 sheets — Registry, Loops, Desk read         │
 *   │  (Wave 4: live form + ledger + impact grid)                    │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Wave 1: structural completeness.
 * Wave 2: cooldown engine + recommend logic + ask-builder + spend-read.
 * Wave 3: live DeskBoard UI (route selectors + desktop + stamps).
 * Wave 4: registry CRUD + outcome stamps + persistence + impact grid.
 * Wave 5: cross-room handoff (deal mirror reads + advisor effect
 *         writes back into gtmos_deal_workspaces) + URL inbound.
 * Wave 6: legacy flag-redirect cutover (room_advisor_deploy_v2).
 */
export function AdvisorDeploy(): JSX.Element {
    return (
        <div class="ad-shell">
            <RoomChrome kicker="ADVISOR DEPLOY"/>
            <Topbar />
            <DeskBoard />
            <SecondaryStack />
        </div>
    );
}
