import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { PinnedCase } from "./components/PinnedCase";
import { Ledger } from "./components/Ledger";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * FutureAutopsy — Wave 1 root.
 *
 * Per canon §4.14 (Diagnosis Table family + named premium asset):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + headline + horizon + dynamic count              │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  PinnedCase: causal pattern + intervention + route rack         │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Ledger: 6-row pinned-case selector                             │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 wires deal-loading +
 * vitals computation. Wave 3 wires the autopsy generator. Wave 4
 * fills the sheet tabs + verdict toggle. Wave 5 wires the route rack
 * + task-completion log persistence. Wave 6 adds the legacy
 * flag-redirect cutover.
 */
export function FutureAutopsy(): JSX.Element {
    return (
        <div class="fa-shell">
            <RoomChrome kicker="FUTURE AUTOPSY"/>
            <Topbar />
            <PinnedCase />
            <Ledger />
        </div>
    );
}
