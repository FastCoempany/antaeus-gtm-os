import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { Topbar } from "./components/Topbar";
import { EmptyState } from "./components/EmptyState";

/**
 * Briefing — root component for the intelligence-surface room
 * specified in canon §4.21 + ADR-006.
 *
 * B.0b ships the structural shell only: RoomChrome (wordmark +
 * back-pill + cmd+K palette trigger per Program 6 / PR 1), the topbar
 * carrying the room's thesis, and the empty-state card explaining
 * what will land here in B.1 / B.2.
 *
 * Subsequent phases per `deliverables/specs/briefing/01-build-phase-plan.md`:
 *
 *   B.0c — nine getState() adapter shells + RoomStateContract
 *   B.1  — sources + ingest + filter (raw_items table populates)
 *   B.2  — enrich + cluster + standard synthesis (first Patterns render here)
 *   B.3  — Watchlist Triggers (parser + 5 type matchers + UI)
 *   B.4  — Periphery Detection (Coverage obligation; right-rail surface)
 *   B.5  — Contrarian Synthesis (Framing obligation; cooler-register surface)
 *   B.6  — Audit Envelopes + show-your-work UI (Defensibility obligation)
 *   B.7  — Evaluation Harness (pre-merge gates + production sampling)
 *   B.8  — Behavioral Feedback (Used / Met / Noise marks → weight tuning)
 *   B.9  — cost-model wiring + production cron + first real briefing
 */
export function Briefing(): JSX.Element {
    return (
        <>
            <RoomChrome kicker="BRIEFING" />
            <main class="bf-room">
                <Topbar />
                <EmptyState />
            </main>
        </>
    );
}
