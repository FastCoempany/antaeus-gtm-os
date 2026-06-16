import type { JSX } from "preact";
import { BandStack, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { activeBriefingView } from "../components/ViewToggle";
import { FirstVisitPrimer } from "../components/FirstVisitPrimer";
import { StaleRunBanner } from "../components/StaleRunBanner";
import { DraftsTray } from "../components/DraftsTray";
import { WorkspaceReads } from "../components/WorkspaceReads";
import { BriefingLead } from "../components/BriefingLead";
import { PatternList } from "../components/PatternList";
import { ContrarianRail } from "../components/ContrarianRail";
import { PeripheryRail } from "../components/PeripheryRail";
import { WatchList } from "../components/WatchList";
import { OutdoorsEventsChip } from "../components/OutdoorsEventsChip";
import { SuggestionsSection } from "../components/SuggestionsSection";
import { TopbarDS } from "./components/TopbarDS";
import { ViewToggleDS } from "./components/ViewToggleDS";
import { BriefingFooterDS } from "./components/BriefingFooterDS";

/**
 * BriefingDS — Briefing (canon §4.21) composed on the design system as
 * an Intelligence Surface. The room shell + chrome are composed on the
 * library: the WayfinderBar carries the Grounded-A lockup + the room
 * crumb + the active view (there is no cross-room pulling cell — the
 * Briefing is provocative, not "do this next"; that is the Dashboard's
 * job), the Topbar is a Kicker + serif Heading, the Workspace / World
 * toggle is the library SegmentedControl (the room's organizing axis),
 * and the cost telemetry is a library Meter.
 *
 * The two streams' content — the workspace reads, the synthesized
 * Patterns, the Contrarian + Periphery rails, the Watch List, the
 * audit-enveloped show-your-work, the Phase F suggestions — is the
 * unchanged, already-bright, LLM-pipeline-governed surface. Canon §4.21
 * defers its validation to its own voice document + Recipe Layer pass;
 * the radiation composes the shell the streams sit in, not the
 * audit-enveloped, cost-gated reads themselves.
 *
 * Flag-gated room_briefing_v3, previewable via ?ds=1; the existing room
 * renders when the flag is off.
 */
export function BriefingDS(): JSX.Element {
    const view = activeBriefingView();
    const tail = view === "workspace" ? t("Your work") : t("Your market");

    return (
        <div class="bfd">
            <a class="bf-skip-link" href="#bfd-room-main">
                {t("Skip to this week's reads")}
            </a>
            <WayfinderBar room={t("BRIEFING")} tail={tail} />
            <PageFrame>
                <main id="bfd-room-main">
                    <BandStack stage>
                        <FirstVisitPrimer />
                        <TopbarDS />
                        <StaleRunBanner />
                        <DraftsTray />
                        <ViewToggleDS />
                        <SuggestionsSection />
                        {view === "workspace" ? (
                            <>
                                <WorkspaceReads />
                                <WatchList />
                            </>
                        ) : (
                            <>
                                <BriefingLead />
                                <PatternList />
                                <ContrarianRail />
                                <PeripheryRail />
                                <WatchList />
                                <OutdoorsEventsChip />
                            </>
                        )}
                        <BriefingFooterDS />
                    </BandStack>
                </main>
            </PageFrame>

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />
        </div>
    );
}
