import type { JSX } from "preact";
import {
    BandStack,
    HandoffStrip,
    Kicker,
    PageFrame,
    Progress,
    SingleColumn,
    StatusChip,
    WayfinderBar
} from "@/components";
import { SECTION_TITLE } from "../lib/types";
import { buildFoundingGtmHref } from "../lib/handoff";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import {
    authoredSections,
    ceremonyEvent,
    ceremonyOpen,
    readinessVerdictLabel
} from "../state";
import { SECTION_IDS } from "../lib/types";
import { CeremonyOverlay } from "../components/CeremonyOverlay";
import { SectionCard } from "./components/SectionCard";
import { sectionCounts, toPulling } from "./lib/adapters";

/**
 * FoundingGtmDS — Founding GTM / Handoff Kit (canon §4.19) composed on the
 * design system as a System Ledger: the kit-readiness state is the
 * dominant synthesis, the seven authored sections the body the first hire
 * reads top-to-bottom on day one. The Wayfinder carries the Grounded-A
 * lockup + the room crumb + (once a section is ready) the move into the
 * daily rhythm on the Dashboard. The seven authoring engines, the
 * cross-room readers, the health publisher, and the ceremony moment are
 * the unchanged legacy lib.
 *
 * Flag-gated (room_founding_gtm_v3; previewable via ?ds=1); the existing
 * room renders when the flag is off. Bright per canon Part II §1. No
 * serif room-meaning header — the chrome names the room, the kit
 * readiness is the top, the seven sections are the work.
 */
export function FoundingGtmDS(): JSX.Element {
    const sections = authoredSections.value;
    const counts = sectionCounts();
    const verdict = readinessVerdictLabel.value;
    const pulling = toPulling();
    const showCeremony = ceremonyOpen.value;
    const event = ceremonyEvent.value;

    return (
        <div class="fgd">
            <WayfinderBar
                room={t("FOUNDING GTM")}
                tail={`${counts.ready}/7 ready`}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="fgd-why">
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
                    {/* The synthesis state — is the kit inheritable yet? */}
                    <div class="fgd-summary">
                        <div class="fgd-summary__head">
                            <Kicker>{t("THE DAY-ONE KIT")}</Kicker>
                            {verdict ? (
                                <StatusChip
                                    label={verdict}
                                    tone={counts.ready >= 5 ? "green" : counts.ready >= 2 ? "amber" : undefined}
                                />
                            ) : null}
                        </div>
                        <p class="fgd-summary__read">
                            {t(
                                "What your first hire reads on day one. Each section is authored from the rooms — not aggregated.",
                                { class: "body" }
                            )}
                        </p>
                        <Progress
                            count={t("{n} of 7 sections ready", { class: "body" }).replace(
                                "{n}",
                                String(counts.ready)
                            )}
                            label={t("Section readiness")}
                            milestones={SECTION_IDS.map((id) => {
                                const s = sections.find((x) => x.id === id) ?? null;
                                return {
                                    label: SECTION_TITLE[id],
                                    done: s?.status === "ready"
                                };
                            })}
                        />
                    </div>

                    {/* The seven authored sections. */}
                    <SingleColumn>
                        {SECTION_IDS.map((id) => {
                            const section =
                                sections.find((s) => s.id === id) ?? null;
                            return <SectionCard id={id} section={section} key={id} />;
                        })}
                    </SingleColumn>

                    <HandoffStrip
                        label={t("Carry the kit forward")}
                        kicker={t("CARRY THE KIT FORWARD")}
                        title={t("Run the daily rhythm. Sharpen the math.", { class: "body" })}
                        sub={t("The kit is read-mode here — real updates come from the rooms that feed it.", { class: "body" })}
                        routes={[
                            { label: t("Open the Dashboard"), href: buildFoundingGtmHref("/dashboard/"), primary: true },
                            { label: t("Refine the quota math"), href: buildFoundingGtmHref("/quota-workback/") },
                            { label: t("Re-run onboarding"), href: buildFoundingGtmHref("/onboarding/") }
                        ]}
                    />
                </BandStack>
            </PageFrame>

            {showCeremony && event ? (
                <CeremonyOverlay
                    fromLabel={event.fromLabel}
                    toLabel={event.toLabel}
                    sectionsBefore={event.sectionsBefore}
                    sectionsAfter={event.sectionsAfter}
                />
            ) : null}

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />
        </div>
    );
}
