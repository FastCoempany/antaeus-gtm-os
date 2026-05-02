import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { DealHealthModal } from "./components/DealHealthModal";
import { FilterBar } from "./components/FilterBar";
import { Hero } from "./components/Hero";
import { LaneGrid } from "./components/LaneGrid";
import { LossReasonModal } from "./components/LossReasonModal";
import { MicroGrid } from "./components/MicroGrid";
import { Spine } from "./components/Spine";
import { TargetFolio } from "./components/TargetFolio";
import { allDeals } from "./state";

/**
 * DealWorkspace — Phase 2 rework against picked variant-B
 * "Intervention Desk" (canon §4.13 Diagnosis Table).
 *
 * Layout:
 *
 *   ┌───────────┬───────────────────────────────────────────────────┐
 *   │  Spine    │  Topbar (BackButton + kicker)                     │
 *   │  (rail)   ├───────────────────────────────────────────────────┤
 *   │           │  Stage-grid (2-col)                               │
 *   │           │    Hero (left) + TargetFolio (right)              │
 *   │           ├───────────────────────────────────────────────────┤
 *   │           │  MicroGrid (3 stat tiles)                         │
 *   │           ├───────────────────────────────────────────────────┤
 *   │           │  LaneGrid (Now / Next / Keep honest)              │
 *   │           ├───────────────────────────────────────────────────┤
 *   │           │  Controls (FilterBar)                             │
 *   │           └───────────────────────────────────────────────────┘
 *   └───────────┘
 *
 * DealHealthModal is no longer the primary detail surface — it's the
 * "Open 9-field detail" full-screen expansion accessible from the
 * folio. LossReasonModal still triggers on the closed-lost transition.
 */
export function DealWorkspace(): JSX.Element {
    const dealCount = allDeals.value.length;

    return (
        <div class="dw-shell">
            <Spine />
            <div class="dw-surface">
                <header class="dw-topbar">
                    <BackButton />
                    <p class="dw-topbar__kicker">
                        DEAL WORKSPACE ·{" "}
                        {dealCount > 0
                            ? `${dealCount} deal${dealCount === 1 ? "" : "s"} loaded`
                            : "no deals yet"}
                    </p>
                </header>

                <div class="dw-stage-grid">
                    <Hero />
                    <TargetFolio />
                </div>

                <MicroGrid />
                <LaneGrid />

                <div class="dw-controls">
                    <FilterBar />
                </div>
            </div>

            <DealHealthModal />
            <LossReasonModal />
        </div>
    );
}
