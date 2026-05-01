import type { JSX } from "preact";
import {
    closeReadinessDrawer,
    commandMode,
    readinessDrawerOpen,
    readinessSummary
} from "./state";
import { Topbar } from "./components/Topbar";
import { SpotlightView } from "./components/SpotlightView";
import { BriefView } from "./components/BriefView";
import { QueueView } from "./components/QueueView";
import { ReadinessDrawer } from "./components/ReadinessDrawer";

/**
 * Dashboard — Wave 1 root.
 *
 * Per canon §4.2 (Command Chamber family):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + title + ModeSwitcher                          │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Active mode view (Spotlight / Brief / Queue)                   │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the ranking
 * engine. Wave 3 fills Spotlight. Wave 4 fills Brief + Queue. Wave 5
 * adds workspace-health aggregation + cross-room realtime. Wave 6
 * adds the legacy flag-redirect cutover.
 */
export function Dashboard(): JSX.Element {
    const mode = commandMode.value;
    const drawerOpen = readinessDrawerOpen.value;
    return (
        <div class="db-shell">
            <Topbar />
            {mode === "spotlight" ? <SpotlightView /> : null}
            {mode === "brief" ? <BriefView /> : null}
            {mode === "queue" ? <QueueView /> : null}
            {drawerOpen ? (
                <ReadinessDrawer
                    summary={readinessSummary.value}
                    onClose={closeReadinessDrawer}
                />
            ) : null}
        </div>
    );
}
