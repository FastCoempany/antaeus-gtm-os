import type { JSX } from "preact";
import { Alert, Button, Heading, Kicker, WayfinderBar } from "@/components";
import type { AlertTone } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import {
    activeFramework,
    activeInterrupt,
    clearInterrupt,
    compressionMode,
    focusedAccount,
    frameworkRegistry,
    jumpToInterruptTarget
} from "../state";
// The dense, primitive-faithful control-face components are reused
// unchanged (canon §4.12 forbids flattening the 21 primitives + the
// control laws — they live inside these surfaces).
import { FrameworkRail } from "../components/FrameworkRail";
import { SegmentRail } from "../components/SegmentRail";
import { SkipAheadTray } from "../components/SkipAheadTray";
import { WorkedMemory } from "../components/WorkedMemory";
import { LearnedTruthLedger } from "../components/LearnedTruthLedger";
import { RecoverRail } from "../components/RecoverRail";
import { SupportDossier } from "../components/SupportDossier";
// The discrete chrome controls are rebuilt on the library.
import { CompressionToggleDS } from "./components/CompressionToggleDS";
import { NextStepDocketDS } from "./components/NextStepDocketDS";
import { HandoffStripDS } from "./components/HandoffStripDS";

/**
 * DiscoveryStudioDS — Discovery Studio (canon §4.12) composed on the
 * design system as a Live Instrument. The most strictly-specified room
 * in the codebase: 21 primitives + the 9-framework × 10-segment spine.
 * The radiation composes the SHELL + the discrete chrome on the library
 * (the WayfinderBar, the mast, the compression toggle, the next-step lock
 * on FormFields, the interrupt as an Alert with its jump-actions, the
 * handoff on the library HandoffStrip) and REUSES the dense, primitive-
 * faithful control-face components (the framework rail, the segment
 * spine, the on-call dock, the support dossier).
 *
 * Founder direction 2026-06-16: a discovery call is human-driven and
 * unpredictable. So there is no clock, no tempo, and no "push to the
 * deal" pull — the room answers whatever the buyer does, it does not
 * pace the call or presume its outcome. Compression's third state is the
 * RESCUE mode: when the call goes sideways, Emergency brings the recover
 * moves front and center.
 *
 * A live console wants width, so this room runs full-bleed rather than
 * inside the centered PageFrame the narrower rooms use.
 *
 * Flag-gated room_discovery_v3, previewable via ?ds=1; the existing room
 * renders when the flag is off.
 */

const INTERRUPT_TONE: Record<string, AlertTone> = {
    red: "red",
    org: "amber",
    orange: "amber",
    amber: "amber",
    blu: "blue",
    blue: "blue"
};

export function DiscoveryStudioDS(): JSX.Element {
    const fid = activeFramework.value;
    const fwLoaded = frameworkRegistry.value.length > 0;
    const interrupt = activeInterrupt.value;
    const activeFw = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)
        : null;
    const account = focusedAccount.value.trim();
    const rescue = compressionMode.value === "emergency";

    const stamp = !fwLoaded
        ? t("loading…")
        : activeFw
          ? activeFw.label
          : t("Pick a framework");
    const tailParts: string[] = [stamp];
    if (account) tailParts.push(account);

    return (
        <div class={`dsd${rescue ? " dsd--rescue" : ""}`}>
            <WayfinderBar room={t("DISCOVERY STUDIO")} tail={tailParts.join(" · ")} />

            <div class="dsd-stage">
                <header class="dsd-mast">
                    <Kicker>{t("DISCOVERY STUDIO · CONTROL FACE")}</Kicker>
                    <Heading level="title">
                        {t("Whatever they say, your next move.", { class: "body" })}
                    </Heading>
                </header>

                <div class="dsd-control-band">
                    <CompressionToggleDS />
                </div>

                {interrupt ? (
                    <Alert
                        tone={INTERRUPT_TONE[interrupt.tone] ?? "amber"}
                        move={
                            <div class="dsd-interrupt-actions">
                                {interrupt.actions
                                    .filter((a) => a.target.startsWith("node:"))
                                    .map((a) => (
                                        <Button
                                            key={a.target}
                                            variant="secondary"
                                            onClick={() =>
                                                jumpToInterruptTarget(a.target)
                                            }
                                        >
                                            {a.label}
                                        </Button>
                                    ))}
                                <Button variant="ghost" onClick={clearInterrupt}>
                                    {t("Dismiss")}
                                </Button>
                            </div>
                        }
                    >
                        <strong>{interrupt.label}</strong> — {interrupt.recover}
                    </Alert>
                ) : null}

                <main class="dsd-board">
                    <aside class="dsd-board__rail" aria-label={t("Frameworks")}>
                        <Kicker>{t("FRAMEWORKS")}</Kicker>
                        <FrameworkRail />
                        <p class="dsd-board__rail-note">
                            {t("Switch the lens only when the room actually changes.", { class: "body" })}
                        </p>
                    </aside>
                    <section class="dsd-board__main">
                        {rescue ? (
                            // Rescue mode — the recover moves come to the
                            // front, the spine collapses to the segment you're
                            // in (handled in SegmentRail). The panic button.
                            <section class="dsd-rescue-panel" aria-label={t("Recover the call")}>
                                <Kicker>{t("RECOVER THE CALL")}</Kicker>
                                <p class="dsd-rescue-panel__lead">
                                    {t("The call is going sideways. Here's how to get it back.", { class: "body" })}
                                </p>
                                <RecoverRail />
                            </section>
                        ) : null}
                        <p class="dsd-board__main-title">
                            {t("Open one segment. Run the call from there.", { class: "body" })}
                        </p>
                        <SegmentRail />
                        <NextStepDocketDS />
                    </section>
                    <aside class="dsd-board__dock" aria-label={t("On-call rails")}>
                        <SkipAheadTray />
                        <WorkedMemory />
                        <LearnedTruthLedger />
                        {/* In rescue mode the recover rail is hoisted into
                            the center; don't duplicate it in the dock. */}
                        {rescue ? null : <RecoverRail />}
                    </aside>
                </main>

                <footer class="dsd-footer">
                    <SupportDossier />
                    <HandoffStripDS />
                </footer>
            </div>

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />
        </div>
    );
}
