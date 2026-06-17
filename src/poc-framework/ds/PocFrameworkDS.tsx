import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { allProofs } from "../state";
import { toPulling } from "./lib/adapters";
import { ProofObject } from "./components/ProofObject";
import { ForgeForm } from "./components/ForgeForm";

/**
 * PocFrameworkDS — PoC Framework (canon §4.15) composed on the design
 * system as an ObjectControls Decision Bench: the cast proof is the
 * dominant made object, the forge form the subordinate controls. The
 * Wayfinder carries the Grounded-A lockup + the room crumb + (once the
 * account is named) the move to carry the proof into the deal. The
 * quality engine, the heat ledger, the mold derivation, the document
 * generators, persistence, and the gtmos_deal_workspaces sync-back are
 * the unchanged legacy lib.
 *
 * Flag-gated (room_poc_framework_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. The legacy dark forge half is
 * retired — bright per canon Part II §1. No serif room-meaning header —
 * the chrome names the room, the quality read is the top, the proof is
 * the work.
 */
export function PocFrameworkDS(): JSX.Element {
    const count = allProofs.value.length;
    const pulling = toPulling();

    return (
        <div class="pocd">
            <WayfinderBar
                room={t("POC FRAMEWORK")}
                tail={count > 0 ? `${count} cast` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="pocd-why">
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
                        controlsLabel={t("Shape the molds")}
                        object={<ProofObject />}
                        controls={<ForgeForm />}
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
