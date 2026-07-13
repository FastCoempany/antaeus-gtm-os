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
import { loadWeather, type WeatherKind, type WeatherRead } from "./lib/weather";
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
const weather = signal<WeatherRead | null>(null);
const forecastOpen = signal(false);
let weatherRequested = false;

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

function WeatherGlyph({ kind, isDay, small }: { kind: WeatherKind; isDay: boolean; small?: boolean }): JSX.Element {
    const cls = `bfv4-glyph${small ? " bfv4-glyph--sm" : ""}`;
    if (kind === "sun" && isDay) return <span class={`${cls} bfv4-glyph--sun`} aria-hidden="true" />;
    if (kind === "sun") {
        return (
            <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 3a8 8 0 1 0 6 13A9 9 0 0 1 15 3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
        );
    }
    if (kind === "rain") {
        return (
            <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 13a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18 6.5 3.75 3.75 0 0 1 17.5 14H7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M9 17l-1 3M13.5 17l-1 3M18 17l-1 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
        );
    }
    if (kind === "snow") {
        return (
            <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v16M5 8l14 8M19 8L5 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
        );
    }
    if (kind === "storm") {
        return (
            <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 12a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18 5.5 3.75 3.75 0 0 1 17.5 13H7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M12.5 14l-2.5 4h3l-2 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        );
    }
    if (kind === "fog") {
        return (
            <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 9h16M6 13h14M4 17h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
        );
    }
    return (
        <svg class={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 16a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18 9.5 3.75 3.75 0 0 1 17.5 17H7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
    );
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
        if (!weatherRequested) {
            weatherRequested = true;
            void loadWeather().then((w) => {
                weather.value = w;
            });
        }
        return () => clearInterval(id);
    }, []);

    const w = weather.value;

    return (
        <>
            <a class="bf-skip-link" href="#bf-room-main">
                {t("Skip to this week's reads", { class: "body" })}
            </a>
            <RoomChrome kicker="BRIEFING" />
            <main id="bf-room-main" class="bf-room bfv4">
                {/* the ambient greeting — the daily check-in feel. With a
                    live weather read it becomes the sky band from the locked
                    design; without one it stays the plain greeting. */}
                <div class={`bfv4-greet${w ? ` bfv4-greet--sky${w.current.isDay ? "" : " is-night"}` : ""}`}>
                    <div class="bfv4-greetrow">
                        <span class="bfv4-hello">{greetingWord()}</span>
                        <span class="bfv4-sub">{t("Here's what the system saw — in your work, and in your world.", { class: "body" })}</span>
                        {clock.value ? <span class="bfv4-clock">{clock.value} {t("CT")}</span> : null}
                    </div>
                    {w ? (
                        <div class="bfv4-wx">
                            <WeatherGlyph kind={w.current.kind} isDay={w.current.isDay} />
                            <span class="bfv4-temp">{w.current.tempF}°</span>
                            <span class="bfv4-cond">
                                {w.current.label}
                                {w.current.place ? ` · ${w.current.place}` : ""}
                            </span>
                            {w.days.length > 0 ? (
                                <button
                                    type="button"
                                    class="bfv4-fcbtn"
                                    onClick={() => (forecastOpen.value = !forecastOpen.value)}
                                >
                                    {forecastOpen.value
                                        ? `${t("Close", { class: "label" })} ✕`
                                        : `${t("7-day forecast", { class: "label" })} ↗`}
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {w && forecastOpen.value ? (
                        <div class="bfv4-fc">
                            {w.days.map((d) => (
                                <div class="bfv4-fday" key={d.day}>
                                    <span class="bfv4-fdn">{d.day}</span>
                                    <WeatherGlyph kind={d.kind} isDay={true} small />
                                    <span class="bfv4-fhi">{d.hiF}°</span>
                                    <span class="bfv4-flo">{d.loF}°</span>
                                </div>
                            ))}
                        </div>
                    ) : null}
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
