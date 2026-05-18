import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import {
    closeReadinessDrawer,
    commandMode,
    commandSummary,
    readinessDrawerOpen,
    readinessSummary
} from "./state";
import { Topbar } from "./components/Topbar";
import { MainColumn } from "./components/MainColumn";
import { SliceRail } from "./components/SliceRail";
import { EmptyDashboard } from "./components/EmptyDashboard";
import { ReadinessDrawer } from "./components/ReadinessDrawer";

/**
 * Dashboard — Program 6 / PR 2 refacing.
 *
 * Per canon §4.2 (Command Chamber family) + the Slice 01 Soft Cut
 * picked-winner wireframe (`deliverables/prototypes/wireframes/
 * dashboard-softcut-canonical.html`). Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  RoomChrome (wordmark + back-pill + ⌘K palette)              │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Topbar (kicker + thesis + ReadinessAnchor + ModeSwitcher)   │
 *   ├─────────────────────────────────┬────────────────────────────┤
 *   │  MainColumn                     │  SliceRail                 │
 *   │   • SignalLine chip row         │   • header (MOST PRESSURE) │
 *   │   • Mode-specific content       │   • stacked Slice cards    │
 *   │     - brief: narrative          │     (one per ranked        │
 *   │     - spotlight: pointer        │      CommandObject;        │
 *   │     - queue: meta read          │      first is focal in     │
 *   │                                 │      spotlight mode)       │
 *   └─────────────────────────────────┴────────────────────────────┘
 *
 * Mind preserved (canon §4.2): three modes, command-intelligence
 * ranking, ReadinessAnchor + Drawer, EmptyDashboard, one-dominant-
 * move semantic. Structure adopts the Soft Cut 2-column shape +
 * Slice docket cards per the Program 6 / PR 2 audit.
 *
 * What this PR did NOT change (per canon evolution log):
 *   - Phase 2.2 H1 demote stays (ranked slices are the visual hero)
 *   - Phase 2.2 family vocabulary stays (risk/move/advisor/...)
 *   - Phase 5.A ReadinessAnchor + Drawer stays (post-triptych canon)
 *   - Flat 3-button ModeSwitcher stays (Phase 2.2 retired the 3D
 *     carousel hint)
 */
export function Dashboard(): JSX.Element {
    const mode = commandMode.value;
    const drawerOpen = readinessDrawerOpen.value;
    const summary = commandSummary.value;
    const isEmpty = summary.ranked.length === 0;
    return (
        <div class="db-shell">
            <RoomChrome kicker="DASHBOARD" />
            <Topbar />
            {isEmpty ? (
                <EmptyDashboard />
            ) : (
                <div class="db-grid">
                    <MainColumn mode={mode} />
                    <SliceRail objects={summary.ranked} mode={mode} />
                </div>
            )}
            {drawerOpen ? (
                <ReadinessDrawer
                    summary={readinessSummary.value}
                    onClose={closeReadinessDrawer}
                />
            ) : null}
        </div>
    );
}
