import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { nextStep } from "../state";

/**
 * Doorway — the first screen of setup. States plainly what the setup asks
 * for and how the answers are used afterwards. No claims about other teams.
 */
export function Doorway(): JSX.Element {
    return (
        <section class="sd-step">
            <p class="sd-kicker">
                {t("Before you start", { class: "label" })}
            </p>
            <h1 class="sd-h1">
                {t("This setup takes real thought from you.", {
                    class: "body"
                })}
            </h1>
            <p class="sd-lede">
                {t(
                    "It asks for things only you know: who you sell to, which companies you're going after, and where each of your open deals really stands.",
                    { class: "body" }
                )}
            </p>
            <div class="sd-compact">
                {t(
                    "You enter it once. After that, the Dashboard uses it each day to flag deals that are missing key information and to suggest which one to review first. The more accurate your answers, the more useful those suggestions are.",
                    { class: "body" }
                )}
            </div>
            <div class="sd-foot">
                <button type="button" class="sd-btn" onClick={() => nextStep()}>
                    {t("Start →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
