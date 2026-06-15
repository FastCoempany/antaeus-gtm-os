import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, Kicker, StatusChip } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import {
    canGenerate,
    currentSendLine,
    logTouchFromRack,
    rack,
    saveAngleFromRack
} from "../../state";
import { CHANNEL_LABELS } from "../../lib/types";
import { ASSET_LABELS, CTA_LABELS } from "../../lib/data";
import { motionTone } from "../lib/adapters";

/**
 * SendLinePanel — the routed line, the dominant half of the Live
 * Instrument console (canon §4.8). The generator produces the exact
 * line from the rack (account × buyer × temperature × trigger); this
 * surfaces it with its channel / asset / ask + motion band, and the
 * three moves — copy, log the touch, save the angle. No send path
 * without a named strain: until the rack can generate, the panel is a
 * directional prompt, not an empty box.
 */

const flash: Signal<string> = signal("");
function showFlash(msg: string): void {
    flash.value = msg;
    setTimeout(() => (flash.value = ""), 2200);
}

function copyLine(content: string): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
            .writeText(content)
            .then(() => showFlash(t("Copied.")))
            .catch(() => showFlash(t("Couldn't copy — select and copy by hand.", { class: "body" })));
    } else {
        showFlash(t("Copy isn't available here.", { class: "body" }));
    }
}

function logTouch(): void {
    const touch = logTouchFromRack();
    showFlash(touch ? t("Touch logged.") : t("Set an account + contact first.", { class: "body" }));
}

function saveAngle(): void {
    const res = saveAngleFromRack();
    showFlash(
        res.saved
            ? t("Angle saved.")
            : res.reason === "duplicate"
              ? t("Angle already saved.")
              : t("Set an account + contact first.", { class: "body" })
    );
}

export function SendLinePanel(): JSX.Element {
    const ready = canGenerate.value;
    const out = currentSendLine.value;
    const r = rack.value;

    if (!ready) {
        return (
            <section class="osd-line osd-line--empty" aria-label={t("The line")}>
                <div class="osd-line__empty-head">
                    <Icon name="send" size={24} />
                    <Kicker>{t("NO LINE YET")}</Kicker>
                </div>
                <h2 class="osd-empty__title">
                    {t("Name an account and a contact — then the line routes itself.", {
                        class: "body"
                    })}
                </h2>
                <p class="osd-empty__body">
                    {t(
                        "The line is built from the rack: who, at what temperature, on what trigger. No generic category language goes into a live channel.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    return (
        <section class="osd-line" aria-label={`Line for ${r.accountName}`}>
            <div class="osd-line__head">
                <Kicker>{t("THE LINE")}</Kicker>
                <StatusChip label={out.motionBand} tone={motionTone(out.motionBand)} />
                <span class="osd-line__score">{out.qualityScore}<span class="osd-line__cap">/100</span></span>
            </div>

            <p class="osd-line__content">{out.content}</p>

            <div class="osd-line__chips">
                <StatusChip label={CHANNEL_LABELS[out.channel]} tone="blue" />
                {out.asset !== "none" ? <StatusChip label={ASSET_LABELS[out.asset]} /> : null}
                <StatusChip label={CTA_LABELS[out.ctaKey]} />
            </div>

            <footer class="osd-line__foot">
                <Button variant="accent" onClick={() => copyLine(out.content)}>
                    <span class="osd-btn-row"><Icon name="write-up" size={16} /> {t("Copy the line")}</span>
                </Button>
                <Button variant="primary" onClick={logTouch}>
                    {t("Log the touch")}
                </Button>
                <Button variant="ghost" onClick={saveAngle}>
                    {t("Save the angle")}
                </Button>
                {flash.value ? <span class="osd-line__flash" role="status">{flash.value}</span> : null}
            </footer>
        </section>
    );
}
