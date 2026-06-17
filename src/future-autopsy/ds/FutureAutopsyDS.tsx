import type { JSX } from "preact";
import { BandStack, FocalRail, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { autopsyUniverse, currentAutopsy } from "../state";
import { toPulling } from "./lib/adapters";
import { PinnedCaseDS } from "./components/PinnedCaseDS";
import { LedgerDS } from "./components/LedgerDS";

/**
 * FutureAutopsyDS — the Future Autopsy (canon §4.14) composed on the
 * design system: a forensic light-table as the FocalRail archetype. The
 * Wayfinder carries the Grounded-A lockup + the room crumb + the pinned
 * case's primary corrective route. The focal pane is the pinned case at
 * depth (vitals, the left-alone/corrected verdict, the three evidence
 * sheets, the countermeasure docket, the kill switch, the route); the
 * rail is the pinned-case ledger. The autopsy engine, the deal loader,
 * persistence, and the task-log are the unchanged legacy lib.
 *
 * Flag-gated (room_future_autopsy_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the pinned case is the work.
 */
export function FutureAutopsyDS(): JSX.Element {
    const cases = autopsyUniverse.value;
    const count = cases.length;
    const pulling = toPulling(currentAutopsy.value);

    return (
        <div class="fad">
            <WayfinderBar
                room={t("FUTURE AUTOPSY")}
                tail={
                    count > 0 ? `${count} case${count === 1 ? "" : "s"}` : undefined
                }
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="fad-why">
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
                        railLabel={t("Pinned cases")}
                        focal={<PinnedCaseDS />}
                        rail={<LedgerDS />}
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
