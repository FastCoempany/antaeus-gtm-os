import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { RouteRack } from "./components/RouteRack";
import { PositionRack } from "./components/PositionRack";
import { ConcessionLadder } from "./components/ConcessionLadder";
import { PushbackSheet } from "./components/PushbackSheet";
import { OutcomeRack } from "./components/OutcomeRack";
import { HandoffStrip } from "./components/HandoffStrip";

import { Wordmark } from "@/lib/wordmark";
/**
 * Negotiation — Phase 4 of the 2026-05 navigation-intelligence
 * roadmap (canon §4.16b).
 *
 * Live Instrument family. Post-evaluation, pre-close. The room makes
 * every concession a deliberate move, not a reflex.
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Topbar: contextual kicker + thesis + active counterparty   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  RouteRack: Deal × Counterparty × Person × Ask-moment       │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  PositionRack: Starting / Walkaway / Opening line           │
 *   ├──────────────────────────────────┬──────────────────────────┤
 *   │  ConcessionLadder                │  PushbackSheet           │
 *   │  (3 steps, ascending cost)       │  (trigger → response)    │
 *   ├──────────────────────────────────┴──────────────────────────┤
 *   │  OutcomeRack: notes + outcome buttons + learnings           │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  HandoffStrip: Update deal · Pre-mortem · Advisor · Proof   │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Cross-room compounding: Deal Workspace ↔ Negotiation ↔ Advisor
 * Deploy triangle on the high-pressure phase of a deal.
 */
export function Negotiation(): JSX.Element {
    return (
        <div class="ng-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="NEGOTIATION" />
            </div>
            <Topbar />
            <RouteRack />
            <PositionRack />
            <div class="ng-twin">
                <ConcessionLadder />
                <PushbackSheet />
            </div>
            <OutcomeRack />
            <HandoffStrip />
        </div>
    );
}
