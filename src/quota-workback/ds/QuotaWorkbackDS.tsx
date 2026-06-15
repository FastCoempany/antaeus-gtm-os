import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { metrics } from "../state";
import { toPulling } from "./lib/adapters";
import { PlanLedger } from "./components/PlanLedger";
import { InputControls } from "./components/InputControls";

/**
 * QuotaWorkbackDS — Quota Workback (canon §4.18) composed on the design
 * system as an ObjectControls System Ledger: the plan ledger is the
 * dominant made object (the weekly touch pressure + the cascade + the
 * coverage + the system-health read + the run-the-plan handoff), the
 * targets form the subordinate controls. The Wayfinder carries the
 * Grounded-A lockup + the room crumb + (once a quota is set) the move to
 * run the outbound the pressure demands. The workback math, the
 * benchmarks, the coverage computation, persistence, and the downstream
 * seeds are the unchanged legacy lib.
 *
 * Flag-gated (room_quota_workback_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. Bright per canon Part II
 * §1. No serif room-meaning header — the chrome names the room, the
 * weekly pressure is the top.
 */
export function QuotaWorkbackDS(): JSX.Element {
    const m = metrics.value;
    const pulling = toPulling();

    return (
        <div class="qwd">
            <WayfinderBar
                room={t("QUOTA WORKBACK")}
                tail={m.touchesDay > 0 ? `${m.touchesDay}/day` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="qwd-why">
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
                        controlsLabel={t("Set the targets")}
                        object={<PlanLedger />}
                        controls={<InputControls />}
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
