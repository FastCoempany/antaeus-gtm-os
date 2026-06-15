import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { draft } from "../state";
import { toPulling } from "./lib/adapters";
import { AgendaObject } from "./components/AgendaObject";
import { WitnessForm } from "./components/WitnessForm";

/**
 * CallPlannerDS — Call Planner (canon §4.11) composed on the design
 * system as an ObjectControls Decision-Bench-shaped Live Instrument: the
 * prepared agenda is the dominant made object, the single witness the
 * subordinate controls. The Wayfinder carries the Grounded-A lockup + the
 * room crumb + (once a contact is named) the move into the live discovery
 * call. The four-stop spine, the quality engine, the persona banks, the
 * advance-ask helper, persistence, and the gtmos_call_handoff handoff are
 * the unchanged legacy lib.
 *
 * Flag-gated (room_call_planner_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. No serif room-meaning header — the
 * chrome names the room, the agenda quality is the top, the plan is the
 * work.
 */
export function CallPlannerDS(): JSX.Element {
    const d = draft.value;
    const pulling = toPulling();
    const contact = d.contactName.trim();

    return (
        <div class="cpd">
            <WayfinderBar
                room={t("CALL PLANNER")}
                tail={contact.length > 0 ? contact : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="cpd-why">
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
                        controlsLabel={t("Name the witness")}
                        object={<AgendaObject />}
                        controls={<WitnessForm />}
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
