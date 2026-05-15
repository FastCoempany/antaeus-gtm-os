import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { WorkspaceHealth } from "./components/WorkspaceHealth";
import { GridControls } from "./components/GridControls";
import { AccountGrid } from "./components/AccountGrid";

import { Wordmark } from "@/lib/wordmark";
/**
 * SignalConsole — Wave 1 root.
 *
 * Per canon §4.7 (Live Instrument family + named premium asset):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + account count                        │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  GridControls: search filter (Wave 5: + workspace health)       │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  AccountGrid: ranked account cards by heat                      │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the heat engine.
 * Wave 3 fills the grid. Wave 4 wires persistence + snapshot
 * publishing. Wave 5 adds cross-room handoff + enrich-all + workspace-
 * health panel. Wave 6 adds the legacy flag-redirect cutover.
 */
export function SignalConsole(): JSX.Element {
    return (
        <div class="sc-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="SIGNAL CONSOLE" />
            </div>
            <Topbar />
            <WorkspaceHealth />
            <GridControls />
            <AccountGrid />
        </div>
    );
}
