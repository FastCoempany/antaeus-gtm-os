import type { JSX } from "preact";
import { Wordmark } from "@/lib/wordmark";
import { DealList } from "./components/DealList";
import { FilterBar } from "./components/FilterBar";
import { Hero } from "./components/Hero";
import { LaneGrid } from "./components/LaneGrid";
import { LossReasonModal } from "./components/LossReasonModal";
import { MicroGrid } from "./components/MicroGrid";
import { TargetFolio } from "./components/TargetFolio";
import { allDeals } from "./state";

/**
 * DealWorkspace — Phase 2 rework against picked variant-B
 * "Intervention Desk" (canon §4.13 Diagnosis Table).
 *
 * Layout (post Deal Workspace audit 2026-05):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Chrome (wordmark)                                              │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Topbar kicker                                                  │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Stage-grid (2-col): Hero (left) + TargetFolio (right)          │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  MicroGrid (3 stat tiles)                                       │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  LaneGrid (Now / Next / Keep honest)                            │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  FilterBar (filter chips + export)                              │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  DealList (NEW — searchable, click-to-pin focal case)           │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Audit deltas applied here:
 *   - Spine left rail retired — decoration without operating value.
 *     Wordmark in the room-chrome strip provides brand presence.
 *   - BackButton removed from topbar — Deal Workspace is a primary
 *     destination.
 *   - DealList added below FilterBar — the room had NO list affordance
 *     before this. A CRO with 30 deals needed a searchable table +
 *     a click-to-pin mechanism for the focal case.
 *   - FilterBar moved above DealList (filter chips now scope BOTH the
 *     TargetFolio's lane and the list rendering — single mental model).
 *
 * LossReasonModal stays as a modal because it's a one-shot prompt
 * triggered by a closed-lost transition, not a primary editing surface.
 */
export function DealWorkspace(): JSX.Element {
    const dealCount = allDeals.value.length;

    return (
        <div class="dw-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="DEAL WORKSPACE" />
            </div>
            <div class="dw-surface">
                <header class="dw-topbar">
                    <p class="dw-topbar__kicker">
                        DEAL WORKSPACE ·{" "}
                        {dealCount > 0
                            ? `${dealCount} deal${dealCount === 1 ? "" : "s"} on the board`
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

                <DealList />
            </div>

            <LossReasonModal />
        </div>
    );
}
