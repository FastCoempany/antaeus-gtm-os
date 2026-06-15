import type { JSX } from "preact";
import { BandStack, HandoffStrip, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { activeDeals, allDeals, focusedDeal } from "../state";
import { rankRecovery } from "../lib/recovery";
import {
    hrefToAdvisorDeploy,
    hrefToFutureAutopsy,
    hrefToNegotiation,
    hrefToPocFramework
} from "../lib/handoff";
import { toPulling } from "./lib/adapters";
import { HealthStrip } from "./components/HealthStrip";
import { FilterChips } from "./components/FilterChips";
import { RecoveryBoard } from "./components/RecoveryBoard";
import { DealDrawer } from "./components/DealDrawer";
import { LossReasonModal } from "../components/LossReasonModal";

/**
 * DealWorkspaceDS — the Deal Workspace (canon §4.13) composed on the
 * design system: the Wayfinder carries the Grounded-A lockup + the room
 * crumb + the most-pressured deal's corrective move; the board is the
 * recovery queue as library RiskCards (cause + corrective move + score,
 * toned by lane) under Ribbon section threads; the editor opens in a
 * library Drawer. The recovery engine, persistence, cross-room handoffs,
 * and the 9-field health form are the unchanged legacy lib — this is
 * presentation composed on the foundation.
 *
 * Flag-gated (room_deal_workspace_v3; previewable via ?ds=1); the
 * existing room renders when the flag is off. No serif room-meaning
 * header — the chrome names the room, the health strip is the top, the
 * board is the work.
 */
export function DealWorkspaceDS(): JSX.Element {
    const deals = allDeals.value;
    const count = deals.length;
    const ranked = rankRecovery(activeDeals.value);
    const pulling = toPulling(ranked);
    const focus = focusedDeal.value;
    const focusName = focus?.accountName;

    return (
        <div class="dwd">
            <WayfinderBar
                room={t("DEAL WORKSPACE")}
                tail={
                    count > 0 ? `${count} deal${count === 1 ? "" : "s"}` : undefined
                }
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="dwd-why">
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
                    <HealthStrip />
                    <FilterChips />
                    <RecoveryBoard />
                    {count > 0 ? (
                        <HandoffStrip
                            label={t("Where the deal goes next")}
                            kicker={t("CARRY THE DEAL")}
                            title={t("Take the pressure somewhere it resolves")}
                            routes={[
                                {
                                    label: t("Pre-mortem a deal"),
                                    href: hrefToFutureAutopsy(focusName),
                                    primary: true
                                },
                                {
                                    label: t("Forge the proof"),
                                    href: hrefToPocFramework(focusName)
                                },
                                {
                                    label: t("Deploy an advisor"),
                                    href: hrefToAdvisorDeploy(focusName)
                                },
                                {
                                    label: t("Rehearse the negotiation"),
                                    href: hrefToNegotiation(focus?.id, focusName)
                                }
                            ]}
                        />
                    ) : null}
                </BandStack>
            </PageFrame>

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />

            <DealDrawer />
            <LossReasonModal />
        </div>
    );
}
