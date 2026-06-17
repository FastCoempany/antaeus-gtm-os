import type { JSX } from "preact";
import { BandStack, HandoffStrip, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { allTouches, rack } from "../state";
import {
    hrefToColdCallStudio,
    hrefToLinkedInPlaybook,
    hrefToSignalConsole
} from "../lib/handoff";
import { toPulling } from "./lib/adapters";
import { SendLinePanel } from "./components/SendLinePanel";
import { OperatorRack } from "./components/OperatorRack";
import { TouchLogDS } from "./components/TouchLogDS";

/**
 * OutboundStudioDS — Outbound Studio (canon §4.8) composed on the design
 * system as a Live Instrument console: the routed line is the dominant
 * readout, the operator rack the proximal controls (ObjectControls), the
 * touch log the recovery cable beneath. The Wayfinder carries the
 * Grounded-A lockup + the room crumb + (once a line is routed) the
 * LinkedIn air-cover move. The send-line generator, persistence, and the
 * handoffs are the unchanged legacy lib.
 *
 * Flag-gated (room_outbound_studio_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the console is the top, the line
 * is the work.
 */
export function OutboundStudioDS(): JSX.Element {
    const account = rack.value.accountName.trim();
    const touchCount = allTouches.value.length;
    const pulling = toPulling();

    return (
        <div class="osd">
            <WayfinderBar
                room={t("OUTBOUND STUDIO")}
                tail={touchCount > 0 ? `${touchCount} touches` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="osd-why">
                                          {pulling.reasons.map((r) => (
                                              <li key={r}>{r}</li>
                                          ))}
                                      </ul>
                                  ) : undefined
                          }
                        : undefined
                }
            />
            <PageFrame>
                <BandStack stage>
                    <ObjectControls
                        controlsLabel={t("Route the line")}
                        object={<SendLinePanel />}
                        controls={<OperatorRack />}
                    />
                    <TouchLogDS />
                    {account ? (
                        <HandoffStrip
                            label={t("Carry the motion onward")}
                            kicker={t("CARRY THE MOTION")}
                            title={t("Line up the channels around this account", {
                                class: "body"
                            })}
                            routes={[
                                {
                                    label: t("Add LinkedIn air cover"),
                                    href: hrefToLinkedInPlaybook(account),
                                    primary: true
                                },
                                { label: t("Prep a cold call"), href: hrefToColdCallStudio(account) },
                                { label: t("Check the radar"), href: hrefToSignalConsole(account) }
                            ]}
                        />
                    ) : null}
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
