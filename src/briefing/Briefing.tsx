import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { Topbar } from "./components/Topbar";
import { BriefingLead } from "./components/BriefingLead";
import { PatternList } from "./components/PatternList";
import { ContrarianRail } from "./components/ContrarianRail";
import { PeripheryRail } from "./components/PeripheryRail";
import { WatchList } from "./components/WatchList";
import { BriefingFooter } from "./components/BriefingFooter";

/**
 * Briefing — root component for the intelligence-surface room
 * specified in canon §4.21 + ADR-006.
 *
 * Build phases shipped (per `deliverables/specs/briefing/01-build-phase-plan.md`):
 *
 *   B.0  — schema + skeleton room + HydratedContext adapter shells
 *   B.1  — sources + ingest + filter (raw_items populates)
 *   B.2  — enrich + cluster + standard synthesis (Patterns render here)
 *   B.3  — Watchlist Triggers (parser + 5 type matchers + UI)
 *   B.4  — Periphery Detection (Coverage obligation; right-rail surface)
 *   B.5  — Contrarian Synthesis (Framing obligation; cooler-register surface)
 *   B.6  — Audit Envelopes + show-your-work UI (Defensibility obligation)
 *   B.7  — Evaluation Harness (production sampling into pattern_eval)
 *   B.8  — Cost ceilings + degradation policy + footer telemetry
 *   B.9a — Compose stage + "Read This Week" lead
 *   B.9b — Behavioral Feedback (Used / Met / Noise marks → weight tuning)
 *   B.9c — Polish (skip-link, focus-visible, stale-text cleanup)
 *
 *   Production cron — pg_cron weekly, Monday 14:00 UTC
 *   Auto-deploy chain — apply-supabase-migrations + deploy-supabase-functions
 *                       + verify-briefing-pipeline. Every merge to main with
 *                       function or migration changes lands end-to-end.
 */
export function Briefing(): JSX.Element {
    return (
        <>
            {/* Skip-link for keyboard + screen-reader operators. Hidden
                until focused; jumps past the room chrome straight into
                the first read. */}
            <a class="bf-skip-link" href="#bf-room-main">
                Skip to this week's reads
            </a>
            <RoomChrome kicker="BRIEFING" />
            <main id="bf-room-main" class="bf-room">
                <Topbar />
                <BriefingLead />
                <PatternList />
                <ContrarianRail />
                <PeripheryRail />
                <WatchList />
                <BriefingFooter />
            </main>
        </>
    );
}
