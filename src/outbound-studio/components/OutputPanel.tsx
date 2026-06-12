import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import {
    canGenerate,
    currentSendLine,
    logTouchFromRack,
    rack,
    saveAngleFromRack
} from "../state";
import { ASSET_LABELS, CTA_LABELS } from "../lib/data";
import { CHANNEL_LABELS, PERSONA_LABELS } from "../lib/types";
import { saveAngle, saveTouch } from "../lib/cloud-persistence";

/**
 * OutputPanel — the generated send line + recommendation chips.
 *
 * Outbound Studio audit (2026-05):
 *   - Title made contextual ("Send line · for [Account]") so the
 *     operator knows what they're reading at a glance. Was: "The
 *     line." which was cryptic without context.
 *   - Output body switched from <pre> (monospace, reads as code) to
 *     normal paragraph styling. Sarah pastes this into Gmail/Outreach
 *     — she should see it the way the recipient will see it.
 *   - Chip tooltips clarify what each recommendation means (Channel,
 *     Asset, CTA, Quality). The numeric Quality score is unchanged
 *     but the chip has hover copy now.
 *   - Header context row names the buyer + persona below the title
 *     so the operator can sanity-check addressing without re-reading
 *     the switchboard.
 */
const QUALITY_BAND_LABEL: Record<string, string> = {
    ready: t("Ready to send"),
    workable: t("Workable — sharpen further"),
    thin: t("Too thin — add a real trigger", { class: "body" })
};

export function OutputPanel(): JSX.Element {
    const out = currentSendLine.value;
    const enabled = canGenerate.value;
    const r = rack.value;
    const [toast, setToast] = useState<string>("");

    function flashToast(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    }

    function copy(): void {
        if (typeof navigator === "undefined" || !navigator.clipboard) {
            flashToast(t("Copy unavailable — try selecting + Cmd-C.", { class: "body" }));
            return;
        }
        navigator.clipboard
            .writeText(out.content)
            .then(() => flashToast(t("Copied.")))
            .catch(() =>
                flashToast(
                    t("Copy failed — try selecting + Cmd-C.", { class: "body" })
                )
            );
    }

    function logTouch(): void {
        const touch = logTouchFromRack();
        if (touch) {
            flashToast(t("Touch logged."));
            void saveTouch(touch);
        }
    }

    function onSaveAngle(): void {
        const result = saveAngleFromRack();
        if (result.saved) {
            flashToast(t("Angle saved."));
            void saveAngle(result.angle);
        } else if (result.reason === "duplicate") {
            flashToast(t("Angle already saved."));
        }
    }

    const accountLabel = r.accountName.trim() || "the buyer";
    const buyerSummary =
        r.contactName.trim().length > 0
            ? `${r.contactName} · ${PERSONA_LABELS[r.persona]}`
            : `${PERSONA_LABELS[r.persona]} (no contact named yet)`;
    const qualityLabel =
        QUALITY_BAND_LABEL[out.motionBand] ?? out.motionBand;

    return (
        <section class="ob-output" aria-label={t("Generated send line")}>
            <header class="ob-output__header">
                <p class="ob-output__kicker">{t("SEND LINE")}</p>
                <h2 class="ob-output__title">
                    Send line · for {accountLabel}
                </h2>
                {enabled ? (
                    <p class="ob-output__context">{buyerSummary}</p>
                ) : null}
                <ul class="ob-output__chips" aria-label={t("Recommendations")}>
                    <li
                        class="ob-output__chip"
                        title={t("Which surface to send through — email, LinkedIn, or another channel — given the temperature + persona.", { class: "body" })}
                    >
                        <span class="ob-output__chip-label">{t("Channel")}</span>
                        <span class="ob-output__chip-value">
                            {CHANNEL_LABELS[out.channel]}
                        </span>
                    </li>
                    <li
                        class="ob-output__chip"
                        title={t("What this touch should carry — a case, a benchmark, or something the buyer would forward to someone else.", { class: "body" })}
                    >
                        <span class="ob-output__chip-label">{t("Asset")}</span>
                        <span class="ob-output__chip-value">
                            {ASSET_LABELS[out.asset]}
                        </span>
                    </li>
                    <li
                        class="ob-output__chip"
                        title={t("The ask shape (meeting, intro, demo) — or none, in no-ask mode.", { class: "body" })}
                    >
                        <span class="ob-output__chip-label">{t("CTA")}</span>
                        <span class="ob-output__chip-value">
                            {CTA_LABELS[out.ctaKey]}
                        </span>
                    </li>
                    <li
                        class={`ob-output__chip ob-output__chip--band ob-output__chip--${out.motionBand}`}
                        title={`Quality score ${out.qualityScore}/100. Ready ≥ 80, workable ≥ 60, thin below 60. Sharpen the switchboard inputs to lift the score.`}
                    >
                        <span class="ob-output__chip-label">{t("Quality")}</span>
                        <span class="ob-output__chip-value">
                            {out.qualityScore} · {qualityLabel}
                        </span>
                    </li>
                </ul>
            </header>

            <p class="ob-output__body" aria-live="polite">
                {enabled
                    ? out.content
                    : t(
                          "Set account + buyer in the switchboard to generate the line.",
                          { class: "body" }
                      )}
            </p>

            <footer class="ob-output__actions">
                <button
                    type="button"
                    class="ob-output__btn ob-output__btn--primary"
                    disabled={!enabled}
                    onClick={copy}
                >
                    {t("Copy")}
                </button>
                <button
                    type="button"
                    class="ob-output__btn"
                    disabled={!enabled}
                    onClick={logTouch}
                >
                    {t("Log touch")}
                </button>
                <button
                    type="button"
                    class="ob-output__btn"
                    disabled={!enabled}
                    onClick={onSaveAngle}
                >
                    {t("Save angle")}
                </button>
                {toast ? (
                    <span class="ob-output__toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </footer>
        </section>
    );
}
