import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { draft, recentIcps } from "../state";
import { toPulling } from "./lib/adapters";
import { IcpObject } from "./components/IcpObject";
import { IcpBuilder } from "./components/IcpBuilder";

/**
 * IcpStudioDS — ICP Studio (canon §4.4) composed on the design system as
 * the ObjectControls Decision Bench: the shaped ICP object dominant, the
 * builder form subordinate. The Wayfinder carries the Grounded-A lockup
 * + the room crumb + (once the ICP is sharp enough) the move into the
 * strategy flow. The build + quality engine, persistence, and the
 * commercial profile are the unchanged legacy lib.
 *
 * Flag-gated (room_icp_studio_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. No serif room-meaning header — the
 * chrome names the room, the quality readout is the top, the ICP is the
 * work.
 */
export function IcpStudioDS(): JSX.Element {
    const count = recentIcps.value.length;
    const pulling = toPulling(draft.value);

    return (
        <div class="icpd">
            <WayfinderBar
                room={t("ICP STUDIO")}
                tail={
                    count > 0 ? `${count} saved` : undefined
                }
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="icpd-why">
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
                        controlsLabel={t("Sharpen the ICP")}
                        object={<IcpObject />}
                        controls={<IcpBuilder />}
                    />
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
