import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { LoomRead } from "./components/LoomRead";
import { QueryStudio } from "./components/QueryStudio";
import { ProspectComposer } from "./components/ProspectComposer";
import { ProspectKanban } from "./components/ProspectKanban";
import { HandoffStrip } from "./components/HandoffStrip";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * SourcingWorkbench — Program 6 / PR 13 (Ticket Loom refacing).
 *
 * Per canon §4.6 (Decision Bench) + the picked-winner Variant 02 /
 * Ticket Loom wireframe. The room turns focuses into named, pushable
 * prospects. Layout:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: kicker + focus + 5-stat counter    │
 *   ├──────────────────────────────────────────────┤
 *   │  LoomRead: live posture (Week read + Move)   │
 *   ├──────────────────────────────────────────────┤
 *   │  QueryStudio  │  ProspectComposer            │
 *   ├──────────────────────────────────────────────┤
 *   │  ProspectKanban: 5-stage lifecycle           │
 *   ├──────────────────────────────────────────────┤
 *   │  HandoffStrip: Territory / Signal / Outbound │
 *   └──────────────────────────────────────────────┘
 *
 * Bright field per founder directive (no dark backgrounds anywhere).
 * The LoomRead aside replaces the wireframe's tactile "hanging
 * ticket" metaphor with the actual interpretive substance (score +
 * Week read + Operator move). The wireframe's decorative hangers
 * + rotated tickets are explicitly deferred as drift-mode
 * "Metaphor ornament" — the kanban + quality score already encode
 * the same information without theater.
 */
export function SourcingWorkbench(): JSX.Element {
    return (
        <div class="sw-shell">
            <RoomChrome kicker="SOURCING WORKBENCH" />
            <Topbar />
            <LoomRead />
            <div class="sw-bench-grid">
                <QueryStudio />
                <ProspectComposer />
            </div>
            <ProspectKanban />
            <HandoffStrip />
        </div>
    );
}
