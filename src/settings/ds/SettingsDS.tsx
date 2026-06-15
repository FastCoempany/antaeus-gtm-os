import type { JSX } from "preact";
import {
    BandStack,
    Heading,
    Kicker,
    PageFrame,
    Stat,
    WayfinderBar
} from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduleFloat } from "@/skills/ScheduleFloat";
import { ScheduleModal } from "@/skills/ScheduleModal";
import { BriefingDraftBanner } from "@/lib/briefing-draft-banner";
import { backup, demo } from "../state";
import { Toast } from "../components/Toast";
import { SettingsCardsDS } from "./components/SettingsCardsDS";

/**
 * SettingsDS — Settings (canon §4.20) composed on the design system as
 * a Trust Annex: calm, plainspoken utility. There is no pulling cell —
 * Settings has no "next move"; it reports the trust state (keys on this
 * device, last backup, real vs demo) and offers recovery moves. The
 * nine setting groups are Grounded cards; the destructive ones carry
 * the red anchored edge. The backup/restore, cloud sync, export,
 * delete, Phase F, and density engines are the unchanged legacy lib.
 *
 * Flag-gated room_settings_v3, previewable via ?ds=1; the existing
 * room renders when the flag is off.
 */
export function SettingsDS(): JSX.Element {
    const b = backup.value;
    const d = demo.value;
    const lastBackup = b.capturedAt
        ? new Date(b.capturedAt).toLocaleString()
        : "Never";
    const tail = d.active
        ? "demo workspace"
        : b.keyCount > 0
          ? `${b.keyCount} ${b.keyCount === 1 ? "key" : "keys"} on device`
          : undefined;

    return (
        <div class="stgd">
            <WayfinderBar room={t("SETTINGS")} tail={tail} />
            <PageFrame>
                <BandStack stage>
                    <div class="stgd-head">
                        <Kicker>{t("TRUST ANNEX")}</Kicker>
                        <Heading level="title">{t("Settings")}</Heading>
                        <p class="stgd-head__sub">
                            {t(
                                "Backup, restore, category, demo mode, and cloud sync — the controls that keep the workspace safe.",
                                { class: "body" }
                            )}
                        </p>
                        <div class="stgd-stats">
                            <Stat label={t("Keys on this device")} value={b.keyCount} />
                            <Stat label={t("Last backup")} value={lastBackup} />
                            <Stat
                                label={t("Mode")}
                                value={d.active ? "Demo workspace" : "Real workspace"}
                            />
                        </div>
                    </div>
                    <SettingsCardsDS />
                </BandStack>
            </PageFrame>
            <Toast />

            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduleFloat />
            <ScheduleModal />
            <BriefingDraftBanner />
        </div>
    );
}
