import type { JSX } from "preact";
import { BandStack, ObjectControls, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { allNegotiations, draft, draftDeal } from "../state";
import { COUNTERPARTY_LABEL } from "../lib/types";
import { toPulling } from "./lib/adapters";
import { RehearsalObject } from "./components/RehearsalObject";
import { RouteControls } from "./components/RouteControls";

/**
 * NegotiationDS — Negotiation (canon §4.16b) composed on the design
 * system as an ObjectControls Decision-Bench-shaped Live Instrument: the
 * rehearsal is the dominant made object (the read, the opening line, the
 * concession ladder, the pushback sheet, the outcome, the handoff), the
 * route + the three pre-decided positions the subordinate controls. The
 * Wayfinder carries the Grounded-A lockup + the room crumb + (once a deal
 * is linked) the move back into the Deal Workspace where the rehearsal
 * outcome lands. The seed scripts, the persistence, the cross-room
 * handoff writers, and the cloud sync are the unchanged legacy lib.
 *
 * Flag-gated (room_negotiation_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. No serif room-meaning header — the
 * chrome names the room, the rehearsal read is the top, the prep is the
 * work. Completes the recovery-flow high-pressure triangle (Deal
 * Workspace ↔ Negotiation ↔ Advisor Deploy) on the library.
 */
export function NegotiationDS(): JSX.Element {
    const d = draft.value;
    const deal = draftDeal.value;
    const count = allNegotiations.value.length;
    const pulling = toPulling();

    const tailParts: string[] = [COUNTERPARTY_LABEL[d.counterparty]];
    if (deal?.accountName) tailParts.unshift(deal.accountName);
    if (count > 0) tailParts.push(`${count} on file`);
    const tail = tailParts.join(" · ");

    return (
        <div class="ngd">
            <WayfinderBar
                room={t("NEGOTIATION")}
                tail={tail}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="ngd-why">
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
                        controlsLabel={t("Route the negotiation")}
                        object={<RehearsalObject />}
                        controls={<RouteControls />}
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
