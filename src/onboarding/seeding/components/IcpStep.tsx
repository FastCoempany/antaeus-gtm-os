import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft, patchDraft } from "../draft";
import { nextStep } from "../state";
import { ICP_FORKS, assembleIcp, type IcpOption } from "../lib/icp";

/**
 * IcpStep (slice 2) — the app draws the ICP out of the operator in real
 * choices, then assembles THEIR picks into the sharp statement. The forks
 * are driven off draft.icpPicks so the step is resumable. Each fork also
 * carries a write-in escape, so a motion the four chips don't cover isn't
 * a dead-end — the operator's own words go straight into the sentence.
 */
const otherOpen = signal(false);
const otherText = signal("");

function pick(value: string): void {
    const picks = [...draft.value.icpPicks, value];
    const statement = picks.length >= ICP_FORKS.length ? assembleIcp(picks) : "";
    patchDraft({ icpPicks: picks, icpStatement: statement });
    otherOpen.value = false;
    otherText.value = "";
}

/** @internal test reset. */
export function __resetIcpStepForTests(): void {
    otherOpen.value = false;
    otherText.value = "";
}

export function IcpStep(): JSX.Element {
    const picks = draft.value.icpPicks;
    const done = picks.length >= ICP_FORKS.length;
    const fork = done ? null : ICP_FORKS[picks.length]!;

    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("The lens · who you sell to", { class: "body" })}</p>
            <h1 class="sd-h1">{t("Let's get sharp about who you sell to.", { class: "body" })}</h1>
            <p class="sd-lede">
                {t(
                    "Three quick choices. Each one's a real call — and the system assembles them into a target it can actually hunt against. None of the chips fit? Write your own.",
                    { class: "body" }
                )}
            </p>

            <div class="sd-qa">
                {fork ? (
                    <>
                        <div class="sd-q">{fork.question}</div>
                        <div class="sd-opts">
                            {fork.options.map((o: IcpOption) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    class="sd-opt"
                                    onClick={() => pick(o.value)}
                                >
                                    {o.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                class="sd-opt sd-opt--other"
                                onClick={() => { otherOpen.value = true; }}
                            >
                                {t("Something else…", { class: "body" })}
                            </button>
                        </div>
                        {otherOpen.value ? (
                            <div class="sd-other">
                                <input
                                    class="sd-other__i"
                                    autofocus
                                    value={otherText.value}
                                    placeholder={t("In your own words…", { class: "body" })}
                                    onInput={(e) => { otherText.value = (e.currentTarget as HTMLInputElement).value; }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && otherText.value.trim()) pick(otherText.value.trim());
                                    }}
                                />
                                <button
                                    type="button"
                                    class="sd-btn sd-btn--sm"
                                    disabled={!otherText.value.trim()}
                                    onClick={() => { if (otherText.value.trim()) pick(otherText.value.trim()); }}
                                >
                                    {t("Use this →", { class: "body" })}
                                </button>
                            </div>
                        ) : null}
                    </>
                ) : null}

                {picks.length > 0 ? (
                    <div class="sd-chosen">
                        {ICP_FORKS.slice(0, picks.length).map((f, i) => (
                            <div class="sd-chip" key={f.id}>
                                {"✓ "}
                                <b>
                                    {f.options.find((o) => o.value === picks[i])?.label ?? picks[i]}
                                </b>
                            </div>
                        ))}
                    </div>
                ) : null}

                {done ? (
                    <div class="sd-sharp">
                        <div class="sd-sharp__l">{t("Your ICP — in your words", { class: "body" })}</div>
                        <div class="sd-sharp__t">
                            {draft.value.icpStatement}{" "}
                            <em>{t("Now the signals mean something.", { class: "body" })}</em>
                        </div>
                    </div>
                ) : null}
            </div>

            {done ? (
                <div class="sd-foot">
                    <button type="button" class="sd-btn" onClick={() => nextStep()}>
                        {t("That's us →", { class: "body" })}
                    </button>
                </div>
            ) : null}
        </section>
    );
}
