import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
    canGenerate,
    currentSendLine,
    logTouchFromRack,
    saveAngleFromRack
} from "../state";
import { ASSET_LABELS, CTA_LABELS } from "../lib/data";
import { CHANNEL_LABELS } from "../lib/types";

/**
 * OutputPanel — Wave 4 implementation.
 *
 * Per canon §4.8: "the line." Surface the generated send line +
 * recommendation chips (channel / asset / CTA / quality band) + 3
 * actions (copy / save angle / log touch).
 */
export function OutputPanel(): JSX.Element {
    const out = currentSendLine.value;
    const enabled = canGenerate.value;
    const [toast, setToast] = useState<string>("");

    function flashToast(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    }

    function copy(): void {
        if (typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            void navigator.clipboard.writeText(out.content);
            flashToast("Copied.");
        } catch {
            flashToast("Copy failed — try selecting + Cmd-C.");
        }
    }

    function logTouch(): void {
        const t = logTouchFromRack();
        if (t) flashToast("Touch logged.");
    }

    function saveAngle(): void {
        const a = saveAngleFromRack();
        if (a) flashToast("Angle saved.");
    }

    return (
        <section class="ob-output" aria-label="Generated send line">
            <header class="ob-output__header">
                <p class="ob-output__kicker">SEND LINE</p>
                <h2 class="ob-output__title">The line.</h2>
                <ul class="ob-output__chips" aria-label="Recommendations">
                    <li class="ob-output__chip">
                        <span class="ob-output__chip-label">Channel</span>
                        <span class="ob-output__chip-value">
                            {CHANNEL_LABELS[out.channel]}
                        </span>
                    </li>
                    <li class="ob-output__chip">
                        <span class="ob-output__chip-label">Asset</span>
                        <span class="ob-output__chip-value">
                            {ASSET_LABELS[out.asset]}
                        </span>
                    </li>
                    <li class="ob-output__chip">
                        <span class="ob-output__chip-label">CTA</span>
                        <span class="ob-output__chip-value">
                            {CTA_LABELS[out.ctaKey]}
                        </span>
                    </li>
                    <li
                        class={`ob-output__chip ob-output__chip--band ob-output__chip--${out.motionBand}`}
                    >
                        <span class="ob-output__chip-label">Quality</span>
                        <span class="ob-output__chip-value">
                            {out.qualityScore} · {out.motionBand}
                        </span>
                    </li>
                </ul>
            </header>

            <pre class="ob-output__body" aria-live="polite">
                {enabled
                    ? out.content
                    : "Set account + buyer in the switchboard to generate the line."}
            </pre>

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
                    onClick={saveAngle}
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
