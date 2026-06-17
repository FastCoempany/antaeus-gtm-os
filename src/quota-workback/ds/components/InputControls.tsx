import type { JSX } from "preact";
import { Button, FormField, Kicker, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import { applyBenchmark, benchmark, inputs, patchInputs } from "../../state";
import type { PlanInputs } from "../../lib/types";

/**
 * InputControls — the subordinate controls of the Quota Workback ledger.
 * The operator's targets + conversion assumptions. It serves the plan
 * ledger; the ledger does not serve it (canon §4.18: quota math is
 * execution pressure, not isolated planning). State flows through the
 * inputs signal; the workback recomputes live.
 */

function setNum(field: keyof PlanInputs) {
    return (raw: string): void => {
        const cleaned = raw.replace(/[^0-9.\-]/g, "");
        const n = Number(cleaned);
        if (Number.isFinite(n)) {
            patchInputs({ [field]: n } as Partial<PlanInputs>);
        }
    };
}

export function InputControls(): JSX.Element {
    const i = inputs.value;
    const b = benchmark.value;

    return (
        <div class="qwd-form">
            <Kicker>{t("YOUR TARGETS")}</Kicker>

            <FormField label={t("Annual quota ($)")} microcopy={t("Your personal target.", { class: "body" })}>
                <TextInput
                    value={i.quota ? i.quota.toLocaleString() : ""}
                    onInput={setNum("quota")}
                    placeholder="0"
                />
            </FormField>
            <FormField label={t("Avg deal size ($)")} microcopy={t("Annual contract value.", { class: "body" })}>
                <TextInput
                    value={i.acv ? i.acv.toLocaleString() : ""}
                    onInput={setNum("acv")}
                    placeholder="50,000"
                />
            </FormField>
            <FormField label={t("Win rate (%)")} microcopy={t("Opp to closed-won.", { class: "body" })}>
                <TextInput value={String(i.win)} onInput={setNum("win")} />
            </FormField>

            <div class="qwd-bench">
                <p class="qwd-bench__copy">
                    {b.label} {t("benchmarks:")} {b.winRate}% win, {b.cycle}-day cycle, {b.coverage}x coverage.
                </p>
                <Button variant="ghost" onClick={() => applyBenchmark()}>
                    {t("Apply benchmark")}
                </Button>
            </div>

            <details class="qwd-adv">
                <summary>{t("Advanced conversion settings")}</summary>
                <div class="qwd-adv__grid">
                    <FormField label={t("Meeting → opp (%)")}>
                        <TextInput value={String(i.m2o)} onInput={setNum("m2o")} />
                    </FormField>
                    <FormField label={t("Touch → meeting (%)")}>
                        <TextInput value={String(i.t2m)} onInput={setNum("t2m")} />
                    </FormField>
                    <FormField label={t("Show rate (%)")}>
                        <TextInput value={String(i.show)} onInput={setNum("show")} />
                    </FormField>
                    <FormField label={t("Working days / mo")}>
                        <TextInput value={String(i.days)} onInput={setNum("days")} />
                    </FormField>
                    <FormField label={t("Touches / account")}>
                        <TextInput value={String(i.tpa)} onInput={setNum("tpa")} />
                    </FormField>
                    <FormField label={t("Avg cycle (days)")}>
                        <TextInput value={String(i.cycle)} onInput={setNum("cycle")} />
                    </FormField>
                </div>
            </details>
        </div>
    );
}
