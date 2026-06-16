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
    focusedAccount,
    frameworkRegistry
} from "../state";
// The dense, primitive-faithful control-face components are reused
// unchanged (canon §4.12 forbids flattening the 21 primitives + the
// on-call control laws — they live inside these surfaces).
import { FrameworkRail } from "../components/FrameworkRail";
import { SegmentRail } from "../components/SegmentRail";
import { SkipAheadTray } from "../components/SkipAheadTray";
import { WorkedMemory } from "../components/WorkedMemory";
import { LearnedTruthLedger } from "../components/LearnedTruthLedger";
import { RecoverRail } from "../components/RecoverRail";
import { SupportDossier } from "../components/SupportDossier";
// The discrete chrome controls are rebuilt on the library.
import { CallClockDS } from "./components/CallClockDS";
import { CompressionToggleDS } from "./components/CompressionToggleDS";
import { NextStepDocketDS } from "./components/NextStepDocketDS";
import { HandoffStripDS } from "./components/HandoffStripDS";
import { toPulling } from "./lib/adapters";

/**
 * DiscoveryStudioDS — Discovery Studio (canon §4.12) composed on the
 * design system as a Live Instrument. The most strictly-specified room
 * in the codebase: 21 primitives, the 9-framework × 10-segment Ledger
 * Spine, and seven on-call control laws that must never be flattened.
 * So the radiation composes the SHELL + the discrete chrome controls on
 * the library — the WayfinderBar (Grounded-A lockup + room crumb +
 * active-framework tail + the push-to-the-deal pull), the mast as a
 * Kicker + serif Heading, the call clock + compression toggle on the
 * library, the next-step lock on FormFields, the interrupt as an Alert,
 * the handoff on the library HandoffStrip — and REUSES the dense,
 * primitive-faithful, already-bright control-face components (the
 * framework rail, the segment spine, the on-call dock, the support
 * dossier) so the 21 primitives + the control laws stay intact.
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
    const pulling = toPulling();

    const stamp = !fwLoaded
        ? t("loading…")
        : activeFw
          ? activeFw.label
          : t("Pick a framework");
    const tailParts: string[] = [stamp];
    if (account) tailParts.push(account);

    return (
        <div class="dsd">
            <WayfinderBar
                room={t("DISCOVERY STUDIO")}
                tail={tailParts.join(" · ")}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="dsd-why">
                                          {pulling.reasons.map((r) => (
                                              <li key={r}>{r}</li>
                                          ))}
                                      </ul>
                                  ) : undefined
                          }
                        : undefined
                }
            />

            <div class="dsd-stage">
                <header class="dsd-mast">
                    <Kicker>{t("DISCOVERY STUDIO · CONTROL FACE")}</Kicker>
                    <Heading level="title">{t("Run the call live.")}</Heading>
                </header>

                <div class="dsd-control-band">
                    <CallClockDS />
                    <CompressionToggleDS />
                </div>

                {interrupt ? (
                    <Alert
                        tone={INTERRUPT_TONE[interrupt.tone] ?? "amber"}
                        move={
                            <Button variant="ghost" onClick={clearInterrupt}>
                                {t("Dismiss")}
                            </Button>
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
                        <RecoverRail />
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
