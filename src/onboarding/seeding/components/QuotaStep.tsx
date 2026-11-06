import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { dealCount, draft, patchDraft } from "../draft";
import { nextStep } from "../state";

/**
 * QuotaStep (slice 6) — the quick math. Their number becomes a target
 * and a rough coverage estimate against the deals they just added. The
 * 3.5× multiplier is an assumption and is stated as one on the face; it
 * does not use the entered win rate. Bound to the draft.
 */
function num(raw: string): number {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

/** Open deals needed to cover the quota, assuming 3.5× pipeline per cycle. */
export function dealsForCoverage(
    quota: number,
    avgDeal: number,
    cycleDays: number
): number {
    if (quota <= 0 || avgDeal <= 0) return 0;
    const perCycle = quota * (Math.max(cycleDays, 1) / 365);
    const pipelineNeeded = perCycle * 3.5;
    return Math.max(1, Math.round(pipelineNeeded / avgDeal));
}

export function QuotaStep(): JSX.Element {
    const d = draft.value;
    const need = dealsForCoverage(d.annualQuota, d.avgDeal, d.cycleDays);
    const have = dealCount.value;
    const ready = d.annualQuota > 0 && d.avgDeal > 0;
    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("Your sales target", { class: "label" })}</p>
            <h1 class="sd-h1">{t("What is your sales target for the year?", { class: "body" })}</h1>
            <p class="sd-lede">
                {t(
                    "Last step. Enter your annual target and typical deal size, and the workspace works out roughly how many open deals you need to reach it, and compares that with the deals you just added.",
                    { class: "body" }
                )}
            </p>
            <div class="sd-qrow">
                <label class="sd-qf">
                    <span class="sd-qf__l">{t("Annual target ($)")}</span>
                    <input class="sd-qf__i" value={d.annualQuota ? d.annualQuota.toLocaleString() : ""} placeholder="1,200,000"
                        onInput={(e) => patchDraft({ annualQuota: num((e.currentTarget as HTMLInputElement).value) })} />
                </label>
                <label class="sd-qf">
                    <span class="sd-qf__l">{t("Avg deal ($)")}</span>
                    <input class="sd-qf__i" value={d.avgDeal ? d.avgDeal.toLocaleString() : ""} placeholder="50,000"
                        onInput={(e) => patchDraft({ avgDeal: num((e.currentTarget as HTMLInputElement).value) })} />
                </label>
                <label class="sd-qf">
                    <span class="sd-qf__l">{t("Win rate (%)")}</span>
                    <input class="sd-qf__i" value={d.winRate || ""} placeholder="22"
                        onInput={(e) => patchDraft({ winRate: num((e.currentTarget as HTMLInputElement).value) })} />
                </label>
                <label class="sd-qf">
                    <span class="sd-qf__l">{t("Cycle (days)")}</span>
                    <input class="sd-qf__i" value={d.cycleDays || ""} placeholder="90"
                        onInput={(e) => patchDraft({ cycleDays: num((e.currentTarget as HTMLInputElement).value) })} />
                </label>
            </div>
            {ready ? (
                <div class="sd-qread">
                    {t(
                        "Assuming you need about 3.5 times your target in open deals over each sales cycle, you'd want about {need} open deals at once. You added {have}. {read}",
                        { class: "body" }
                    )
                        .replace("{need}", String(need))
                        .replace("{have}", String(have))
                        .replace(
                            "{read}",
                            have >= need
                                ? "That meets this estimate. Quota Workback will show if your open deals drop below it."
                                : "That is below this estimate. Quota Workback shows how far short you are as you add deals."
                        )}
                </div>
            ) : null}
            <div class="sd-foot">
                <button type="button" class="sd-btn" disabled={!ready} onClick={() => nextStep()}>
                    {t("Finish setup →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
