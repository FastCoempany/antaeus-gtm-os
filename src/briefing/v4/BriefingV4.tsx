import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { RoomChrome } from "@/lib/room-chrome";
import { Topbar } from "../components/Topbar";
import { FirstVisitPrimer } from "../components/FirstVisitPrimer";
import { StaleRunBanner } from "../components/StaleRunBanner";
import { DraftsTray } from "../components/DraftsTray";
import { ViewToggle, activeBriefingView } from "../components/ViewToggle";
import { WorkspaceReads } from "../components/WorkspaceReads";
import { BriefingLead } from "../components/BriefingLead";
import { PatternList } from "../components/PatternList";
import { ContrarianRail } from "../components/ContrarianRail";
import { PeripheryRail } from "../components/PeripheryRail";
import { WatchList } from "../components/WatchList";
import { OutdoorsEventsChip } from "../components/OutdoorsEventsChip";
import { SuggestionsSection } from "../components/SuggestionsSection";
import { BriefingFooter } from "../components/BriefingFooter";
import { patterns } from "../state";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./briefing-v4.css";

/**
 * BriefingV4 (canon §4.21) — the daily check-in reconciled to the
 * settled vivid design. The shipped room's structure is preserved
 * whole (the Workspace/World toggle stays the organizing axis; the
 * provocative obligations — Coverage, Framing, Defensibility — and the
 * suggestions/triggers/drafts/cost surfaces are untouched). The vivid
 * layer adds the AMBIENT GREETING (good morning + the live Central
 * clock — the daily-check-in feel) and the CONTROLLABLE TICKER of your
 * market's live reads (hover pauses; only renders when Patterns exist —
 * never a fake feed). Never a feed, never an inbox.
 */

const clock = signal("");

function fmtClock(): string {
    try {
        return new Date().toLocaleTimeString("en-US", {
            timeZone: "America/Chicago",
            hour: "numeric",
            minute: "2-digit"
        });
    } catch {
        return "";
    }
}

function greetingWord(): string {
    let hour: number;
    try {
        hour = Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Chicago",
                hour: "numeric",
                hour12: false
            }).format(new Date())
        );
    } catch {
        hour = new Date().getHours();
    }
    if (hour < 12) return t("Good morning.");
    if (hour < 17) return t("Good afternoon.");
    return t("Good evening.");
}

export function BriefingV4(): JSX.Element {
    const view = activeBriefingView();
    // Fewer than 3 titles makes a mostly-blank looping strip — skip it.
    const tickerItems = patterns.value.length >= 3 ? patterns.value.slice(0, 8) : [];

    useEffect(() => {
        clock.value = fmtClock();
        const id = setInterval(() => (clock.value = fmtClock()), 30_000);
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <a class="bf-skip-link" href="#bf-room-main">
                {t("Skip to this week's reads", { class: "body" })}
            </a>
            <RoomChrome kicker="BRIEFING" />
            <main id="bf-room-main" class="bf-room bfv4">
                {/* the ambient greeting — the daily check-in feel */}
                <div class="bfv4-greet">
                    <span class="bfv4-hello">{greetingWord()}</span>
                    <span class="bfv4-sub">{t("Here's what the system saw — in your work, and in your world.", { class: "body" })}</span>
                    {clock.value ? <span class="bfv4-clock">{clock.value} {t("CT")}</span> : null}
                </div>

                {/* the market ticker — live Patterns only, never a fake feed */}
                {tickerItems.length > 0 ? (
                    <div class="bfv4-ticker" title={t("Your market's live reads — hover to pause", { class: "body" })}>
                        <div class="bfv4-tape">
                            {[...tickerItems, ...tickerItems].map((p, i) => (
                                <span class="bfv4-tk" key={`${p.id}-${i}`}>
                                    <span class="bfv4-td" />{p.title}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                <FirstVisitPrimer />
                <Topbar />
                <StaleRunBanner />
                <DraftsTray />
                <ViewToggle />
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
                <BriefingFooter />
            </main>
            <GroundLine />
        </>
    );
}
