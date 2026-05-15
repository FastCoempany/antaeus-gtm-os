import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { QueryStudio } from "./components/QueryStudio";
import { ProspectComposer } from "./components/ProspectComposer";
import { ProspectKanban } from "./components/ProspectKanban";
import { HandoffStrip } from "./components/HandoffStrip";

import { Wordmark } from "@/lib/wordmark";
/**
 * SourcingWorkbench — Phase 4 / Room 13 root.
 *
 * Per canon §4.6 (Decision Bench family): the room turns theses into
 * named, pushable prospects. Layout:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + 5-stat counter    │
 *   ├──────────────────────────────────────────────┤
 *   │  QueryStudio  │  ProspectComposer            │
 *   ├──────────────────────────────────────────────┤
 *   │  ProspectKanban: 5-stage lifecycle           │
 *   ├──────────────────────────────────────────────┤
 *   │  HandoffStrip: Territory / Signal / Outbound │
 *   └──────────────────────────────────────────────┘
 *
 * Bright field per founder directive (no dark backgrounds anywhere).
 */
export function SourcingWorkbench(): JSX.Element {
    return (
        <div class="sw-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="SOURCING WORKBENCH" />
            </div>
            <Topbar />
            <div class="sw-bench-grid">
                <QueryStudio />
                <ProspectComposer />
            </div>
            <ProspectKanban />
            <HandoffStrip />
        </div>
    );
}
