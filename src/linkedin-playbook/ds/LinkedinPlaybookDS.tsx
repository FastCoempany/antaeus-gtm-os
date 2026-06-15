import type { JSX } from "preact";
import { BandStack, FocalRail, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { stats } from "../state";
import { toPulling } from "./lib/adapters";
import { MotionRead } from "./components/MotionRead";
import { CueStage } from "./components/CueStage";
import { CueLadder } from "./components/CueLadder";
import { ChannelBoard } from "./components/ChannelBoard";

/**
 * LinkedinPlaybookDS — LinkedIn Playbook (canon §4.10) composed on the
 * design system as a Live Instrument: the live cue is the dominant focal,
 * the five-cue ladder beside it, the motion read above, the channel
 * memory below. The Wayfinder carries the Grounded-A lockup + the room
 * crumb + the move to compose the outbound line the air cover supports.
 * The cue ladder, the motion engine, the scripts, persistence, and the
 * handoffs are the unchanged legacy lib. The legacy dark stage is retired
 * — this is bright per canon Part II §1.
 *
 * Flag-gated (room_linkedin_playbook_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the live cue is the work.
 */
export function LinkedinPlaybookDS(): JSX.Element {
    const s = stats.value;
    const pulling = toPulling();

    return (
        <div class="lpd">
            <WayfinderBar
                room={t("LINKEDIN PLAYBOOK")}
                tail={s.total > 0 ? `${s.total} cues` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="lpd-why">
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
                    <MotionRead />
                    <FocalRail
                        railLabel={t("The cue ladder")}
                        focal={<CueStage />}
                        rail={<CueLadder />}
                    />
                    <ChannelBoard />
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
