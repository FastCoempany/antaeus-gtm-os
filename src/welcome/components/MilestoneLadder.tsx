import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { model } from "../state";

/**
 * MilestoneLadder — the 4-row anchor list. Live anchors get a green
 * dot; the next missing anchor gets the orange "next" rule; future
 * anchors are quiet.
 */
export function MilestoneLadder(): JSX.Element {
    const m = model.value;
    const nextKey = m.nextMilestone?.key ?? null;
    return (
        <section class="wel-ladder" aria-label={t("Activation anchors")}>
            <header class="wel-section__head">
                <p class="wel-section__kicker">{t("ANCHORS")}</p>
                <h2 class="wel-section__title">{t("What week one is asking for.")}</h2>
                <p class="wel-section__sub">
                    Each anchor lights up another part of the workspace.
                    Hit them in order; the system gets sharper as you go.
                </p>
            </header>
            <ol class="wel-ladder__list">
                {m.milestones.map((ms) => {
                    const state = ms.done
                        ? "done"
                        : ms.key === nextKey
                          ? "next"
                          : "todo";
                    return (
                        <li key={ms.key} class={`wel-ms wel-ms--${state}`}>
                            <span class="wel-ms__mark" aria-hidden="true">
                                {ms.done ? "✓" : ""}
                            </span>
                            <div class="wel-ms__body">
                                <strong class="wel-ms__label">{ms.label}</strong>
                                <span class="wel-ms__copy">{ms.copy}</span>
                                <span class="wel-ms__status">
                                    {state === "done"
                                        ? "Live"
                                        : state === "next"
                                          ? "Next"
                                          : "Pending"}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
