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
                    "It asks for things only you know: who you sell to, which companies you're going after, and where each of your open deals really stands. Most setup screens skip this work. Doing it is what lets the workspace flag deal problems before they surprise you.",
                    { class: "body" }
                )}
            </p>
            <div class="sd-compact">
                {t(
                    "You enter it once, and you'll get it back every morning on the Dashboard: which deals have gone quiet or missed a next step, what each one is missing, and which one to work on first. The more honest your answers, the more useful it gets.",
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
