import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { inboundFocus, stats } from "../state";
import { toPulling } from "./lib/adapters";
import { WorkbenchObject } from "./components/WorkbenchObject";
import { WorkbenchBuilder } from "./components/WorkbenchBuilder";

/**
 * SourcingWorkbenchDS — Sourcing Workbench (canon §4.6) composed on the
 * design system as the ObjectControls Decision Bench: the shaped prospect
 * pipeline dominant, the query + prospect builders subordinate. The
 * Wayfinder carries the Grounded-A lockup + the room crumb + (once a
 * prospect is ready) the push into Signal Console. The read + quality
 * engine, persistence, and the handoffs are the unchanged legacy lib.
 *
 * Flag-gated (room_sourcing_workbench_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the bench read is the top, the
 * pipeline is the work.
 */
export function SourcingWorkbenchDS(): JSX.Element {
    const s = stats.value;
    const focus = inboundFocus.value;
    const pulling = toPulling(focus);

    return (
        <div class="swd">
            <WayfinderBar
                room={t("SOURCING WORKBENCH")}
                tail={s.total > 0 ? `${s.ready} ready · ${s.total}` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="swd-why">
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
                        controlsLabel={t("Build the pipeline")}
                        object={<WorkbenchObject />}
                        controls={<WorkbenchBuilder />}
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
