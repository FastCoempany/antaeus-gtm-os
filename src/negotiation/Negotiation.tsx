import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { RouteRack } from "./components/RouteRack";
import { PositionRack } from "./components/PositionRack";
import { ConcessionLadder } from "./components/ConcessionLadder";
import { PushbackSheet } from "./components/PushbackSheet";
import { OutcomeRack } from "./components/OutcomeRack";

/**
 * Negotiation — Phase 3 of ADR-003 (canon §4.16b).
 *
 * Live Instrument family. Post-evaluation, pre-close. The room makes
 * every concession a deliberate move, not a reflex.
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + active counterparty              │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  RouteRack: Deal × Counterparty × Person                    │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  PositionRack: Starting / Walkaway / Opening line           │
 *   ├──────────────────────────────────┬──────────────────────────┤
 *   │  ConcessionLadder                │  PushbackSheet           │
 *   │  (3 steps, ascending cost)       │  (trigger → response)    │
 *   ├──────────────────────────────────┴──────────────────────────┤
 *   │  OutcomeRack: notes + outcome buttons + learnings + handoff │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Cross-room compounding: Deal Workspace ↔ Negotiation ↔ Advisor
 * Deploy triangle on the high-pressure phase of a deal.
 */
export function Negotiation(): JSX.Element {
    return (
        <div class="ng-shell">
            <Topbar />
            <RouteRack />
            <PositionRack />
            <div class="ng-twin">
                <ConcessionLadder />
                <PushbackSheet />
            </div>
            <OutcomeRack />
        </div>
    );
}
