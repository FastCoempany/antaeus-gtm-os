import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { ForgePanel } from "./components/ForgePanel";
import { CastPanel } from "./components/CastPanel";
import { StageStrip } from "./components/StageStrip";

/**
 * PocFramework — Phase 2 rework against AI-picked v3 thesis
 * "Proof is not a page. It is a forced event."
 *
 * Per canon §4.15 (Decision Bench), bright per Part II §1
 * (the §4.8 hybrid retired 2026-04-27).
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + dynamic count                  │
 *   ├───────────────────────────────────────────────────────────┤
 *   │  StageStrip: forge → cast → readout (temporal flow)       │
 *   ├──────────────────────────────────┬────────────────────────┤
 *   │  ForgePanel                      │  CastPanel             │
 *   │  - proof form                    │  - weakest-mold        │
 *   │  - heat ledger                   │  - documents + routes  │
 *   └──────────────────────────────────┴────────────────────────┘
 */
export function PocFramework(): JSX.Element {
    return (
        <div class="poc-shell">
            <Topbar />
            <StageStrip />
            <div class="poc-stage">
                <ForgePanel />
                <CastPanel />
            </div>
        </div>
    );
}
