import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { Witness } from "./components/Witness";
import { AgendaSpine } from "./components/AgendaSpine";
import { Quality } from "./components/Quality";
import { Handoff } from "./components/Handoff";

import { Wordmark } from "@/lib/wordmark";
/**
 * CallPlanner — Wave 1 root.
 *
 * Per canon §4.11 (Live Instrument family):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Topbar: kicker + thesis + state pill                          │
 *   ├──────────────────┬─────────────────────────────────────────────┤
 *   │  Witness rail    │  AgendaSpine (4 strips: Open / Reason now / │
 *   │  (left col,      │   Probe / Advance ask) — Wave 3 fills       │
 *   │   workspace      │   with the personalized copy from Wave 2's  │
 *   │   health-style)  │   persona banks + opener helpers            │
 *   │                  ├─────────────────────────────────────────────┤
 *   │                  │  Quality (5-gate breakdown — Wave 2 + 3)    │
 *   ├──────────────────┴─────────────────────────────────────────────┤
 *   │  Handoff: Discovery Studio / Deal Workspace / Copy brief       │
 *   │  + outcome buttons (Wave 4 + 5)                                │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Wave 1 ships structural completeness. Wave 2 ports the persona
 * question banks + the 5-gate quality engine + advance-ask + brief
 * generator. Wave 3 fills the live UI. Wave 4 wires outcome capture
 * + persistence (gtmos_discovery_agenda / gtmos_discovery_stats).
 * Wave 5 wires cross-room handoff (gtmos_call_handoff payload to
 * Discovery Studio + Deal Workspace handoff). Wave 6 wires the
 * legacy flag-redirect cutover (room_call_planner_v2).
 */
export function CallPlanner(): JSX.Element {
    return (
        <div class="cp-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="CALL PLANNER" />
            </div>
            <Topbar />
            <div class="cp-stage">
                <Witness />
                <div class="cp-stage__main">
                    <AgendaSpine />
                    <Quality />
                </div>
            </div>
            <Handoff />
        </div>
    );
}
