import type { JSX } from "preact";
import { applyBenchmark, benchmark, inputs, patchInputs } from "../state";

/**
 * InputForm — the operator's targets + conversion assumptions. Two
 * tiers: primary inputs (quota / ACV / win) sit above the fold; an
 * <details> drawer hides the conversion-engineering knobs (m2o / t2m /
 * show / days / tpa / cycle).
 */
export function InputForm(): JSX.Element {
    const i = inputs.value;
    const b = benchmark.value;

    function num(field: keyof typeof i) {
        return (e: Event): void => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            const cleaned = raw.replace(/[^0-9.\-]/g, "");
            const n = Number(cleaned);
            if (Number.isFinite(n)) {
                patchInputs({ [field]: n } as Partial<typeof i>);
            }
        };
    }

    return (
        <section class="qw-form" aria-label="Plan inputs">
            <header class="qw-section__head">
                <p class="qw-section__kicker">YOUR TARGETS</p>
                <h2 class="qw-section__title">What is the quarter actually asking for?</h2>
                <p class="qw-section__sub">
                    Quota → deals → opps → meetings → touches → daily
                    activity. Tighten the inputs that matter most.
                </p>
            </header>

            <div class="qw-form__primary">
                <Field label="Annual quota ($)" hint="Your personal target">
                    <input
                        class="qw-input"
                        type="text"
                        inputMode="numeric"
                        value={i.quota ? i.quota.toLocaleString() : ""}
                        onInput={num("quota")}
                        placeholder="0"
                    />
                </Field>
                <Field label="Avg deal size ($)" hint="Annual contract value">
                    <input
                        class="qw-input"
                        type="text"
                        inputMode="numeric"
                        value={i.acv ? i.acv.toLocaleString() : ""}
                        onInput={num("acv")}
                        placeholder="50,000"
                    />
                </Field>
                <Field label="Win rate (%)" hint="Opp to closed-won">
                    <input
                        class="qw-input"
                        type="number"
                        value={i.win}
                        onInput={num("win")}
                    />
                </Field>
            </div>

            <div class="qw-bench-hint">
                <strong>{b.label} benchmarks</strong> for ${i.acv.toLocaleString()} ACV: {b.winRate}% win rate, {b.cycle}-day cycle, {b.coverage}x coverage.
                <button
                    type="button"
                    class="qw-btn qw-btn--ghost-sm"
                    onClick={() => applyBenchmark()}
                >
                    Apply benchmark
                </button>
            </div>

            <details class="qw-adv">
                <summary>Advanced conversion settings</summary>
                <div class="qw-form__adv">
                    <Field label="Meeting → opp (%)">
                        <input
                            class="qw-input"
                            type="number"
                            value={i.m2o}
                            onInput={num("m2o")}
                        />
                    </Field>
                    <Field label="Touch → meeting (%)">
                        <input
                            class="qw-input"
                            type="number"
                            step={0.1}
                            value={i.t2m}
                            onInput={num("t2m")}
                        />
                    </Field>
                    <Field label="Show rate (%)">
                        <input
                            class="qw-input"
                            type="number"
                            value={i.show}
                            onInput={num("show")}
                        />
                    </Field>
                    <Field label="Working days / mo">
                        <input
                            class="qw-input"
                            type="number"
                            value={i.days}
                            onInput={num("days")}
                        />
                    </Field>
                    <Field label="Touches / account">
                        <input
                            class="qw-input"
                            type="number"
                            value={i.tpa}
                            onInput={num("tpa")}
                        />
                    </Field>
                    <Field label="Avg cycle (days)">
                        <input
                            class="qw-input"
                            type="number"
                            value={i.cycle}
                            onInput={num("cycle")}
                        />
                    </Field>
                </div>
            </details>
        </section>
    );
}

function Field({
    label,
    hint,
    children
}: {
    readonly label: string;
    readonly hint?: string;
    readonly children: JSX.Element | ReadonlyArray<JSX.Element>;
}): JSX.Element {
    return (
        <label class="qw-field">
            <span class="qw-field__label">{label}</span>
            {children}
            {hint ? <span class="qw-field__hint">{hint}</span> : null}
        </label>
    );
}
