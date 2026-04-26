import type { JSX } from "preact";
import { commandMode } from "./state";
import { Topbar } from "./components/Topbar";
import { SpotlightView } from "./components/SpotlightView";
import { BriefView } from "./components/BriefView";
import { QueueView } from "./components/QueueView";

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
    return (
        <div class="db-shell">
            <Topbar />
            {mode === "spotlight" ? <SpotlightView /> : null}
            {mode === "brief" ? <BriefView /> : null}
            {mode === "queue" ? <QueueView /> : null}
        </div>
    );
}
