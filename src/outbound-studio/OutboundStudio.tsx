import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { Switchboard } from "./components/Switchboard";
import { OutputPanel } from "./components/OutputPanel";
import { SwitchLaws } from "./components/SwitchLaws";
import { SwitchReads } from "./components/SwitchReads";
import { TouchLog } from "./components/TouchLog";
import { HandoffStrip } from "./components/HandoffStrip";

import { RoomChrome } from "@/lib/room-chrome";

/**
 * OutboundStudio — Program 6 / PR 9 (Switchboard Loft refacing).
 *
 * Per the picked-winner Variant 03 / Switchboard Loft wireframe
 * (deliverables/prototypes/wireframes/antaeus-outbound-studio-
 * triptych-2026-04-18.html line 628+) the loft is a 3-column
 * surface — operating laws on the left, the switchboard + output
 * in the center, the live board read on the right:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + dynamic touch count             │
 *   ├──────────┬───────────────────────────────────┬─────────────┤
 *   │  Laws    │  Switchboard (operator rack)      │  Board read │
 *   │  (left)  │  OutputPanel (send line)          │  Op move    │
 *   │          │  (center, ob-stage)               │  (right)    │
 *   ├──────────┴───────────────────────────────────┴─────────────┤
 *   │  TouchLog + cross-room handoff strip                       │
 *   └────────────────────────────────────────────────────────────┘
 *
 * SwitchLaws (left) is static doctrine — the two operating laws
 * the rack enforces. SwitchReads (right) is the live interpretive
 * readout that compresses what the operator just patched into a
 * board read + next move. The center (`ob-stage`) is unchanged
 * structurally — Switchboard + OutputPanel keep their existing
 * shape from Wave 3-5.
 */
export function OutboundStudio(): JSX.Element {
    return (
        <div class="ob-shell">
            <RoomChrome kicker="OUTBOUND STUDIO" />
            <Topbar />
            <div class="ob-loft">
                <SwitchLaws />
                <div class="ob-loft__center">
                    <div class="ob-stage">
                        <Switchboard />
                        <OutputPanel />
                    </div>
                </div>
                <SwitchReads />
            </div>
            <TouchLog />
            <HandoffStrip />
        </div>
    );
}
