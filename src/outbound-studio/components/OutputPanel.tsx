import type { JSX } from "preact";
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
    ready: "Ready to send",
    workable: "Workable — sharpen further",
    thin: "Too thin — add a real trigger"
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
            flashToast("Copy unavailable — try selecting + Cmd-C.");
            return;
        }
        navigator.clipboard
            .writeText(out.content)
            .then(() => flashToast("Copied."))
            .catch(() => flashToast("Copy failed — try selecting + Cmd-C."));
    }

    function logTouch(): void {
        const t = logTouchFromRack();
        if (t) {
            flashToast("Touch logged.");
            void saveTouch(t);
        }
    }

    function onSaveAngle(): void {
        const result = saveAngleFromRack();
        if (result.saved) {
            flashToast("Angle saved.");
            void saveAngle(result.angle);
        } else if (result.reason === "duplicate") {
            flashToast("Angle already saved.");
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
        <section class="ob-output" aria-label="Generated send line">
            <header class="ob-output__header">
                <p class="ob-output__kicker">SEND LINE</p>
                <h2 class="ob-output__title">
                    Send line · for {accountLabel}
                </h2>
                {enabled ? (
                    <p class="ob-output__context">{buyerSummary}</p>
                ) : null}
                <ul class="ob-output__chips" aria-label="Recommendations">
                    <li
                        class="ob-output__chip"
                        title="Which surface to send through — email, LinkedIn, or another channel — given the temperature + persona."
                    >
                        <span class="ob-output__chip-label">Channel</span>
                        <span class="ob-output__chip-value">
                            {CHANNEL_LABELS[out.channel]}
                        </span>
                    </li>
                    <li
                        class="ob-output__chip"
                        title="The proof artifact this touch should carry — a case, a benchmark, a forwardable insight."
                    >
                        <span class="ob-output__chip-label">Asset</span>
                        <span class="ob-output__chip-value">
                            {ASSET_LABELS[out.asset]}
                        </span>
                    </li>
                    <li
                        class="ob-output__chip"
                        title="The ask shape (meeting, intro, demo) — or none, in no-ask mode."
                    >
                        <span class="ob-output__chip-label">CTA</span>
                        <span class="ob-output__chip-value">
                            {CTA_LABELS[out.ctaKey]}
                        </span>
                    </li>
                    <li
                        class={`ob-output__chip ob-output__chip--band ob-output__chip--${out.motionBand}`}
                        title={`Quality score ${out.qualityScore}/100. Ready ≥ 80, workable ≥ 60, thin below 60. Sharpen the switchboard inputs to lift the score.`}
                    >
                        <span class="ob-output__chip-label">Quality</span>
                        <span class="ob-output__chip-value">
                            {out.qualityScore} · {qualityLabel}
                        </span>
                    </li>
                </ul>
            </header>

            <p class="ob-output__body" aria-live="polite">
                {enabled
                    ? out.content
                    : "Set account + buyer in the switchboard to generate the line."}
            </p>

            <footer class="ob-output__actions">
                <button
                    type="button"
                    class="ob-output__btn ob-output__btn--primary"
                    disabled={!enabled}
                    onClick={copy}
                >
                    Copy
                </button>
                <button
                    type="button"
                    class="ob-output__btn"
                    disabled={!enabled}
                    onClick={logTouch}
                >
                    Log touch
                </button>
                <button
                    type="button"
                    class="ob-output__btn"
                    disabled={!enabled}
                    onClick={onSaveAngle}
                >
                    Save angle
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
