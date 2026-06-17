import type { JSX } from "preact";
import {
    BandStack,
    FocalRail,
    Heading,
    Kicker,
    PageFrame,
    Progress,
    StatusChip,
    WayfinderBar
} from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { activation, model, roleLabel, stamp } from "../state";
import { anchorCount, dsMilestones, toPulling } from "./lib/adapters";
import { ActionsObject } from "./components/ActionsObject";

/**
 * WelcomeDS — Welcome (canon §4.1) composed on the design system as a
 * Threshold: one commanding statement (the activation headline), one
 * dominant next move (the top-ranked action, carried both as the
 * Wayfinder pull and as the offset card in the focal), and progress
 * visible but never gamified (the milestone ladder as the library
 * Progress — a real-anchor count, never a percent). The threshold never
 * reads "all done": even at 4/4 the dominant move is "Open the
 * Dashboard." The activation model + milestone ladder + ranked-action
 * builder are the unchanged legacy lib.
 *
 * Flag-gated room_welcome_v3, previewable via ?ds=1; the existing room
 * renders when the flag is off.
 */
export function WelcomeDS(): JSX.Element {
    const m = model.value;
    const ctx = activation.value;
    const role = roleLabel.value;
    const stampVal = stamp.value;
    const pulling = toPulling();
    const isEmpty = m.completed === 0;

    const chips: string[] = [];
    if (!isEmpty) {
        if (ctx.companyName) chips.push(ctx.companyName);
        chips.push(role);
        if (ctx.categoryLabel) chips.push(ctx.categoryLabel);
    }

    const tailParts: string[] = [stampVal.label];
    if (ctx.companyName) tailParts.unshift(ctx.companyName);
    const tail = tailParts.join(" · ");

    return (
        <div class="weld">
            <WayfinderBar
                room={t("WELCOME")}
                tail={tail}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="weld-why">
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
                    {/* The commanding statement. */}
                    <header class="weld-hero">
                        <Kicker>{t("WELCOME")}</Kicker>
                        <Heading level="display">{m.headline}</Heading>
                        <p class="weld-hero__sub">{m.body}</p>
                        {chips.length > 0 ? (
                            <div class="weld-hero__chips">
                                {chips.map((c) => (
                                    <StatusChip key={c} label={c} />
                                ))}
                            </div>
                        ) : null}
                    </header>

                    {/* The dominant move (focal) + the progress (rail). */}
                    <FocalRail
                        railLabel={t("Where you are")}
                        focal={<ActionsObject />}
                        rail={
                            <div class="weld-progress">
                                <Progress
                                    milestones={dsMilestones()}
                                    count={anchorCount()}
                                    label={t("Activation anchors")}
                                />
                            </div>
                        }
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
