import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { nextStep } from "../state";

/**
 * Doorway — the honest compact (Earned Depth #4, #7). Before any work, we
 * name the cost and the payoff out loud: this asks real thinking; do it
 * once and the system reads your motion back every morning. No apology
 * for the work — we make it obviously worth it.
 */
export function Doorway(): JSX.Element {
    return (
        <section class="sd-step">
            <p class="sd-kicker">
                {t("Before the easy part — the honest part", { class: "body" })}
            </p>
            <h1 class="sd-h1">
                {t("This asks real work of you. Here's the deal.", {
                    class: "body"
                })}
            </h1>
            <p class="sd-lede">
                {t(
                    "Most setup flows pretend they're effortless. This one won't. You're going to put in the thinking that lives in your head and nowhere else — who you sell to, who you're chasing, where your deals really stand.",
                    { class: "body" }
                )}
            </p>
            <div class="sd-compact">
                {t(
                    "Do it once, and the system reads your motion back to you every morning — which deal is slipping, which move clears the most weight. The teams that do this work early are the ones that stop getting surprised. You're about to be one of them.",
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
