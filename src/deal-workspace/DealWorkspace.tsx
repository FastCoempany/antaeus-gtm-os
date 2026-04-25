import type { JSX } from "preact";
import { BridgeStats } from "./components/BridgeStats";
import { DealHealthModal } from "./components/DealHealthModal";
import { InterventionRail } from "./components/InterventionRail";
import { LossReasonModal } from "./components/LossReasonModal";
import { RecoveryQueue } from "./components/RecoveryQueue";
import { allDeals } from "./state";

/**
 * DealWorkspace — Wave 1 root.
 *
 * Layout (canonical Diagnosis Table family per CLAUDE.md Part II §4.5):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + title                                         │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  BridgeStats: active / pipeline / won / lost / top deal         │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  RecoveryQueue: top 5 at-risk deals + suggested next moves      │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  InterventionRail: critical / at-risk / healthy lanes           │
 *   └─────────────────────────────────────────────────────────────────┘
 *   (Modals overlay full screen when active)
 *
 * Wave 1 ships structural completeness. Wave 2+ fills out the data,
 * interactions, and persistence.
 */
export function DealWorkspace(): JSX.Element {
    const dealCount = allDeals.value.length;

    return (
        <div class="dw-shell">
            <header class="dw-topbar">
                <p class="dw-topbar__kicker">
                    DEAL WORKSPACE · WAVE 1 ·{" "}
                    {dealCount > 0
                        ? `${dealCount} deal${dealCount === 1 ? "" : "s"} loaded`
                        : "no deals yet"}
                </p>
                <h1 class="dw-topbar__title">
                    Find the weakest deals first.
                </h1>
                <p class="dw-topbar__sub">
                    Recovery queue + intervention board. Stage is not truth
                    unless next-step truth backs it up.
                </p>
            </header>

            <BridgeStats />
            <RecoveryQueue />
            <InterventionRail />

            <DealHealthModal />
            <LossReasonModal />
        </div>
    );
}
