import type { JSX } from "preact";
import { BandStack, FocalRail, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { callStats } from "../state";
import { toPulling } from "./lib/adapters";
import { AccountBar } from "./components/AccountBar";
import { ThreadConsole } from "./components/ThreadConsole";
import { ThreadRail } from "./components/ThreadRail";
import { CallMemoryDS } from "./components/CallMemoryDS";

/**
 * ColdCallStudioDS — Cold Call Studio (canon §4.9) composed on the design
 * system as a Live Instrument: the live thread is the dominant focal, the
 * six-thread rail beside it, the account header above, the call memory
 * below. The Wayfinder carries the Grounded-A lockup + the room crumb +
 * (once a meeting is booked) the move to work the deal it created. The
 * thread spine, the score, persistence, and the handoffs are the
 * unchanged legacy lib.
 *
 * Flag-gated (room_cold_call_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. No serif room-meaning header — the
 * chrome names the room, the live thread is the work.
 */
export function ColdCallStudioDS(): JSX.Element {
    const s = callStats.value;
    const pulling = toPulling();

    return (
        <div class="ccd">
            <WayfinderBar
                room={t("COLD CALL STUDIO")}
                tail={s.total > 0 ? `${s.meetings}/${s.total} booked` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="ccd-why">
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
                    <AccountBar />
                    <FocalRail
                        railLabel={t("The threads")}
                        focal={<ThreadConsole />}
                        rail={<ThreadRail />}
                    />
                    <CallMemoryDS />
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
