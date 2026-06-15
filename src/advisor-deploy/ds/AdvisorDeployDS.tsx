import type { JSX } from "preact";
import { BandStack, FocalRail, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { advisors, deployments } from "../state";
import { toPulling } from "./lib/adapters";
import { AskDesk } from "./components/AskDesk";
import { DeskSide } from "./components/DeskSide";

/**
 * AdvisorDeployDS — Advisor Deploy (canon §4.16) composed on the design
 * system as a FocalRail Live Instrument: the ask desk is the dominant
 * focal, the carriers / registry / loops / desk read the rail. The
 * Wayfinder carries the Grounded-A lockup + the room crumb + (once a deal
 * is on the desk) the move back into the Deal Workspace where the ask's
 * effect lands. The spend-read score, the ask builder, the recommend
 * logic, the cooldown, persistence, and the sync-back into
 * gtmos_deal_workspaces are the unchanged legacy lib.
 *
 * Flag-gated (room_advisor_deploy_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. The legacy dark proof
 * blotter is retired — bright per canon Part II §1. No serif room-meaning
 * header — the chrome names the room, the spend read is the top.
 */
export function AdvisorDeployDS(): JSX.Element {
    const advisorCount = advisors.value.length;
    const loopCount = deployments.value.length;
    const pulling = toPulling();
    const tail =
        advisorCount > 0 || loopCount > 0
            ? `${advisorCount} carriers · ${loopCount} loops`
            : undefined;

    return (
        <div class="add">
            <WayfinderBar
                room={t("ADVISOR DEPLOY")}
                tail={tail}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="add-why">
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
                    <FocalRail
                        railLabel={t("Carriers + the desk read")}
                        focal={<AskDesk />}
                        rail={<DeskSide />}
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
