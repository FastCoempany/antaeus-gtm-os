import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { draft, patchDraft } from "../draft";
import { nextStep } from "../state";
import { ICP_FORKS, assembleIcp, type IcpOption } from "../lib/icp";

/**
 * IcpStep (slice 2) — the app draws the ICP out of the operator in real
 * choices, then assembles THEIR picks into the sharp statement. The forks
 * are driven off draft.icpPicks so the step is resumable.
 */
function pick(opt: IcpOption): void {
    const picks = [...draft.value.icpPicks, opt.value];
    const statement = picks.length >= ICP_FORKS.length ? assembleIcp(picks) : "";
    patchDraft({ icpPicks: picks, icpStatement: statement });
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
                    "You said “ops teams at mid-market.” That's a start, not an answer. A few real choices and it's a target the system can actually hunt against.",
                    { class: "body" }
                )}
            </p>

            <div class="sd-qa">
                {fork ? (
                    <>
                        <div class="sd-q">{fork.question}</div>
                        <div class="sd-opts">
                            {fork.options.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    class="sd-opt"
                                    onClick={() => pick(o)}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
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
