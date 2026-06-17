import type { JSX } from "preact";
import { BandStack, Heading, Kicker, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { DiscoveryConsoleDS } from "./components/DiscoveryConsoleDS";
import { EventListDS } from "./components/EventListDS";
import { EventComposerDS } from "./components/EventComposerDS";
import { totalEvents } from "./lib/adapters";

/**
 * OutdoorsEventsDS — Outdoors Events (canon §4.22) composed on the
 * design system as a Live Instrument. The discovery console is the
 * working surface at the top (the "Run discovery now" action is the one
 * dominant move — an in-room action, so there is no cross-room pulling
 * cell), the event list is grouped by relevance tier (the organizing
 * axis), and the manual composer is demoted to a quiet "add by hand"
 * affordance at the bottom. The discovery client, the persistence, the
 * tiering, and the status lifecycle are the unchanged legacy lib.
 *
 * Flag-gated room_outdoors_events_v3, previewable via ?ds=1; the
 * existing room renders when the flag is off.
 */
export function OutdoorsEventsDS(): JSX.Element {
    const n = totalEvents();
    const tail = n > 0 ? `${n} event${n === 1 ? "" : "s"}` : undefined;

    return (
        <div class="oed">
            <WayfinderBar room={t("OUTDOORS EVENTS")} tail={tail} />
            <PageFrame>
                <BandStack stage>
                    <header class="oed-head">
                        <Kicker>{t("OUTDOORS EVENTS")}</Kicker>
                        <Heading level="title">
                            {t("Where people are gathering, found for you.", { class: "body" })}
                        </Heading>
                        <p class="oed-head__sub">
                            {t(
                                "The system reads your product category and finds offline gatherings worth knowing about — direct to your space, adjacent to it, and indirect-but-buyer-relevant. You decide which ones matter.",
                                { class: "body" }
                            )}
                        </p>
                    </header>
                    <DiscoveryConsoleDS />
                    <EventListDS />
                    <EventComposerDS />
                </BandStack>
            </PageFrame>

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />
        </div>
    );
}
