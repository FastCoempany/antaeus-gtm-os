import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { Witness } from "./components/Witness";
import { AgendaSpine } from "./components/AgendaSpine";
import { Quality } from "./components/Quality";
import { Handoff } from "./components/Handoff";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * CallPlanner — Program 6 / PR 8 refacing.
 *
 * Per canon §4.11 (Live Instrument family) + the picked-winner
 * Pressure Script Variant 01 wireframe
 * (`deliverables/prototypes/wireframes/antaeus-call-planner-triptych-
 * 2026-04-09.html`, board labelled "Variant 01 / Pressure Script").
 *
 * Layout:
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ RoomChrome (wordmark + back-pill + ⌘K palette)                 │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │ Topbar: kicker + thesis + state pill                           │
 *   ├──────────────────────────────────────────┬─────────────────────┤
 *   │ LEFT (wide):                             │ RIGHT (320px,       │
 *   │   Witness (contact form + credibility   │ sticky):            │
 *   │     chip; the V01 v1-dossier shape)      │   Handoff           │
 *   │   AgendaSpine (4 strips Open / Reason    │   (3 route cards:   │
 *   │     now / Probe / Advance ask, each      │     Discovery       │
 *   │     with a scripted-quote line)          │     Studio /        │
 *   │   Quality (5-gate breakdown)             │     Deal Workspace  │
 *   │                                          │     / Copy brief)   │
 *   │                                          │   + outcome buttons │
 *   └──────────────────────────────────────────┴─────────────────────┘
 *
 * Layout drops to single column at 1100px so the right rail folds
 * below the spine on narrow viewports.
 *
 * Mind preserved (canon §4.11): 4-stop spine, quality engine, persona
 * banks, advance-ask helper, brief generator, cross-room handoff via
 * gtmos_call_handoff payload, outcome capture writing
 * gtmos_discovery_stats. The visual restructure (2-col board) closes
 * the Pressure Script V01 layout drift; the scripted-quote treatment
 * + credibility chip close the cue-shape + dossier drift.
 */
export function CallPlanner(): JSX.Element {
    return (
        <div class="cp-shell">
            <RoomChrome kicker="CALL PLANNER"/>
            <Topbar />
            <div class="cp-board">
                <div class="cp-board__main">
                    <Witness />
                    <AgendaSpine />
                    <Quality />
                </div>
                <aside class="cp-board__aside" aria-label="Handoff routes">
                    <Handoff />
                </aside>
            </div>
        </div>
    );
}
