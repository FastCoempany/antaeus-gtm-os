import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { HandoffStrip } from "./components/HandoffStrip";
import { Hero } from "./components/Hero";
import { InterventionRail } from "./components/InterventionRail";
import { LossReasonModal } from "./components/LossReasonModal";
import { MicroGrid } from "./components/MicroGrid";
import { TargetFolio } from "./components/TargetFolio";
import { activeDeals, allDeals } from "./state";
import { groupByLane, rankRecovery } from "./lib/recovery";

/**
 * DealWorkspace — Program 6 / PR 6 refacing.
 *
 * Per canon §4.13 (Deal Workspace — Diagnosis Table) + the picked-
 * winner Variant 02 / Intervention Desk + the founder lock note
 * "lower board rebuilt from Intervention Rail."
 *
 * Layout:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Chrome (RoomChrome — wordmark + back-pill + ⌘K palette)        │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Topbar kicker (contextual: deal count + critical/at-risk count)│
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Stage-grid (2-col): Hero (left) + TargetFolio (right)          │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  MicroGrid (3 stat tiles)                                       │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  InterventionRail (replaces LaneGrid + FilterBar + DealList     │
 *   │     trio). Toolbar with search + Now/Next/Reserve pills + "Run  │
 *   │     intervention" CTA → 3 rail rows: Now (full tickets) / Next  │
 *   │     (full tickets) / Keep honest (compact reserve tags).        │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  HandoffStrip (cross-room: Future Autopsy / PoC / Negotiation / │
 *   │     Advisor)                                                    │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * 2026-05-01 bootstrap punch list closeout:
 *   ✓ 2-col stage-grid (closed in Phase 2.6)
 *   ✓ Target-folio with inline tabbed detail (closed in Phase 6 polish)
 *   ✓ Spine retired (Phase 2.6 — decoration without operating value)
 *   ✓ Lower board rebuilt from Intervention Rail (THIS PR)
 *
 * LossReasonModal stays as a modal because it's a one-shot prompt
 * triggered by a closed-lost transition, not a primary surface.
 */
export function DealWorkspace(): JSX.Element {
    const dealCount = allDeals.value.length;

    let kicker = "DEAL WORKSPACE · no deals yet";
    if (dealCount > 0) {
        const lanes = groupByLane(rankRecovery(activeDeals.value));
        const critical = lanes.critical.length;
        const atRisk = lanes["at-risk"].length;
        const pieces = [
            `${dealCount} deal${dealCount === 1 ? "" : "s"}`
        ];
        if (critical > 0) pieces.push(`${critical} critical`);
        else if (atRisk > 0) pieces.push(`${atRisk} at risk`);
        kicker = `DEAL WORKSPACE · ${pieces.join(" · ")}`;
    }

    return (
        <div class="dw-shell">
            <RoomChrome kicker="DEAL WORKSPACE"/>
            <div class="dw-surface">
                <header class="dw-topbar">
                    <p class="dw-topbar__kicker">{kicker}</p>
                </header>

                <div class="dw-stage-grid">
                    <Hero />
                    <TargetFolio />
                </div>

                <MicroGrid />

                <InterventionRail />

                <HandoffStrip />
            </div>

            <LossReasonModal />
        </div>
    );
}
