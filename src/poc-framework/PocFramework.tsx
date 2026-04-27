import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { ForgePanel } from "./components/ForgePanel";
import { CastPanel } from "./components/CastPanel";

/**
 * PocFramework — Wave 1 root.
 *
 * Per canon §4.15 (Decision Bench) + Part II §4.8 (dark hero hybrid):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + serif thesis + dynamic count                  │
 *   ├──────────────────────────────────┬──────────────────────────────┤
 *   │  ForgePanel (dark "forge" half)  │  CastPanel (cream "cast")    │
 *   │  - proof form                    │  - weakest-mold              │
 *   │  - heat ledger                   │  - generated documents       │
 *   │                                  │  - route rack                │
 *   └──────────────────────────────────┴──────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the heat +
 * weakest-mold + quality engines. Wave 3 wires the forge form. Wave 4
 * wires the cast docs + persistence. Wave 5 wires cross-room handoff
 * + URL ?deal= inbound + sync-back into the deal record. Wave 6
 * adds the legacy flag-redirect cutover.
 */
export function PocFramework(): JSX.Element {
    return (
        <div class="poc-shell">
            <Topbar />
            <div class="poc-stage">
                <ForgePanel />
                <CastPanel />
            </div>
        </div>
    );
}
