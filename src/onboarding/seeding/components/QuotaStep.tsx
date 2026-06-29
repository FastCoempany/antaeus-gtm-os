import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { dealCount, draft, patchDraft } from "../draft";
import { nextStep } from "../state";

/**
 * QuotaStep (slice 6) — the quick math. Their number becomes weekly
 * pressure, and a coverage read against the deals they just seeded
 * (3–4× quota in live pipeline is the benchmark). Bound to the draft.
 */
function num(raw: string): number {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

/** Live deals you'd want in motion to cover the quota (value-based, 3.5×). */
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
            <p class="sd-kicker">{t("The math · ninety seconds", { class: "body" })}</p>
            <h1 class="sd-h1">{t("What does the year owe you?", { class: "body" })}</h1>
            <p class="sd-lede">
                {t(
                    "Last quick thing. Drop your number in and the system turns it into weekly pressure — and tells you whether your deals actually cover it.",
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
                        "To cover this you'd want about {need} live deals in motion at once. You seeded {have} — {read}",
                        { class: "body" }
                    )
                        .replace("{need}", String(need))
                        .replace("{have}", String(have))
                        .replace(
                            "{read}",
                            have >= need
                                ? "you're covered, and the system tells you the moment you slip under."
                                : "you're building toward it, and the system tells you the moment you slip further behind."
                        )}
                </div>
            ) : null}
            <div class="sd-foot">
                <button type="button" class="sd-btn" disabled={!ready} onClick={() => nextStep()}>
                    {t("See it all →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
