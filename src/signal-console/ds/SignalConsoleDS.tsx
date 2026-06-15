import type { JSX } from "preact";
import { BandStack, PageFrame, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { allAccounts } from "../state";
import { toPulling } from "./lib/adapters";
import { HealthStrip } from "./components/HealthStrip";
import { GridControlsDS } from "./components/GridControlsDS";
import { AccountGridDS } from "./components/AccountGridDS";

/**
 * SignalConsoleDS — the Signal Console (canon §4.7) composed on the
 * design system: the Wayfinder un-nav carries the Grounded-A lockup +
 * the room crumb + the hottest account's one next move; the radar is a
 * heat-ranked column of library Cards, each wearing the account glyph
 * with its signals marked. The heat engine, persistence, cross-room
 * handoffs, and the add/enrich flows are the unchanged legacy lib —
 * this is presentation composed on the foundation.
 *
 * Flag-gated (room_signal_console_v3; previewable via ?ds=1); the
 * existing Signal Console renders when the flag is off. The
 * orchestration floats (Birdseye / Schedule / Briefing-draft) travel
 * with the operator the same way RoomChrome mounts them elsewhere.
 */
export function SignalConsoleDS(): JSX.Element {
    const accounts = allAccounts.value;
    const count = accounts.length;
    const pulling = toPulling(accounts);

    return (
        <div class="scd">
            <WayfinderBar
                room={t("SIGNAL CONSOLE")}
                tail={
                    count > 0
                        ? `${count} account${count === 1 ? "" : "s"}`
                        : undefined
                }
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="scd-why">
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
                <BandStack>
                    <HealthStrip />
                    <GridControlsDS />
                    <AccountGridDS />
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
