import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { CueBooth } from "./components/CueBooth";
import { CueLedger } from "./components/CueLedger";
import { MethodSheets } from "./components/MethodSheets";

/**
 * LinkedinPlaybook — Wave 1 root.
 *
 * Per canon §4.10 (Live Instrument family — disciplined air cover):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + live cue count                      │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  CueBooth: 5-cue ladder + dark stage + booth-read aside        │
 *   │  (Wave 3 wires the live console; Wave 5 wires the handoffs)    │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  CueLedger: form + channel memory grid                         │
 *   │  (Wave 4 wires logCue + persistence + activity board)          │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  MethodSheets: 4 reference templates (Wave 3 fills)            │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the cue ladder +
 * motion engine + scripts. Wave 3 builds the live cue rail + stage +
 * booth-read. Wave 4 wires cue logging + persistence. Wave 5 wires
 * cross-room handoff + URL inbound + context loaders. Wave 6 wires the
 * legacy flag-redirect cutover.
 */
export function LinkedinPlaybook(): JSX.Element {
    return (
        <div class="lp-shell">
            <Topbar />
            <CueBooth />
            <CueLedger />
            <MethodSheets />
        </div>
    );
}
