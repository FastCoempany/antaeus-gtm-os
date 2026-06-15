import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { allocation, focusedIcp } from "../state";
import { toPulling } from "./lib/adapters";
import { TerritoryObject } from "./components/TerritoryObject";
import { TerritoryBuilder } from "./components/TerritoryBuilder";

/**
 * TerritoryArchitectDS — Territory Architect (canon §4.5) composed on the
 * design system as the ObjectControls Decision Bench: the shaped
 * territory dominant, the builders subordinate. The Wayfinder carries the
 * Grounded-A lockup + the room crumb + (once the field has focuses +
 * accounts) the move into sourcing. The field-read + allocation engine,
 * persistence, and the cross-room handoffs are the unchanged legacy lib.
 *
 * Flag-gated (room_territory_architect_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the field read is the top, the
 * territory is the work.
 */
export function TerritoryArchitectDS(): JSX.Element {
    const alloc = allocation.value;
    const focusObject = focusedIcp.value;
    const pulling = toPulling(focusObject);

    return (
        <div class="tad">
            <WayfinderBar
                room={t("TERRITORY ARCHITECT")}
                tail={alloc.total > 0 ? `${alloc.total}/${alloc.ceiling}` : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="tad-why">
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
                        controlsLabel={t("Build the territory")}
                        object={<TerritoryObject />}
                        controls={<TerritoryBuilder />}
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
