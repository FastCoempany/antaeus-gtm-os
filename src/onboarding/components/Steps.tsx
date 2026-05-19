import type { JSX } from "preact";
import {
    CATEGORY_OPTIONS,
    ROLE_OPTIONS,
    type CategoryKey,
    type RoleKey
} from "../lib/types";
import {
    draft,
    finishAndSeed,
    nextStep,
    patchDraft,
    prevStep,
    seeded,
    validation
} from "../state";
import { StepShell } from "./StepShell";

/**
 * Individual step contents. Each step is intentionally narrow — one
 * dominant move per surface (Part III §3 Rule 1). Every step writes
 * to the draft on input so a refresh mid-flow does not lose work.
 */

export function ThesisStep(): JSX.Element {
    return (
        <StepShell
            kicker="STEP 1 OF 7 — WELCOME"
            title="Antaeus turns the revenue work a founder is doing into a clear picture of what's actually happening."
            subtitle="It's not a CRM and it's not an enablement library. Six quick answers and the workspace will already be live."
            onNext={() => nextStep()}
            nextLabel="Begin"
            hideBack
        >
            <div class="ob-thesis">
                <ul class="ob-thesis__points">
                    <li>
                        <strong>The dashboard wakes up live.</strong> Every
                        answer here turns into a real Brief item before you
                        leave Onboarding.
                    </li>
                    <li>
                        <strong>You can skip any step except the first.</strong>{" "}
                        The first ask is a one-line ICP — everything else
                        the system does compounds off of it.
                    </li>
                    <li>
                        <strong>Nothing is sent anywhere.</strong> Everything
                        below stays on this device until you decide to wire
                        cloud sync from Settings.
                    </li>
                </ul>
            </div>
        </StepShell>
    );
}

export function CompanyStep(): JSX.Element {
    const d = draft.value;
    return (
        <StepShell
            kicker="STEP 2 OF 7 — COMPANY"
            title="Your company name?"
            subtitle="Lowest-friction question first. Everything else stays optional."
            onNext={() => nextStep()}
            onBack={() => prevStep()}
        >
            <label class="ob-field">
                <span class="ob-field__label">Company name</span>
                <input
                    class="ob-input"
                    type="text"
                    value={d.companyName}
                    onInput={(e) =>
                        patchDraft({
                            companyName: (e.currentTarget as HTMLInputElement)
                                .value
                        })
                    }
                    placeholder="e.g., Antaeus GTM"
                    autoFocus
                />
                <span class="ob-field__hint">
                    Doesn't have to be the legal entity. Just what your team
                    calls itself.
                </span>
            </label>
        </StepShell>
    );
}

export function RoleStep(): JSX.Element {
    const d = draft.value;
    return (
        <StepShell
            kicker="STEP 3 OF 7 — ROLE"
            title="Which seat are you in?"
            subtitle="Role decides which surface the Dashboard centers first. You can change this anytime from Settings."
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={d.role === null}
        >
            <ul class="ob-options" role="radiogroup" aria-label="Role">
                {ROLE_OPTIONS.map((r) => (
                    <li key={r.key}>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={d.role === r.key}
                            class={`ob-option${d.role === r.key ? " is-selected" : ""}`}
                            onClick={() => patchDraft({ role: r.key as RoleKey })}
                        >
                            <strong class="ob-option__label">{r.label}</strong>
                            <span class="ob-option__copy">{r.copy}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </StepShell>
    );
}

export function CategoryStep(): JSX.Element {
    const d = draft.value;
    return (
        <StepShell
            kicker="STEP 4 OF 7 — CATEGORY"
            title="What category are you selling into?"
            subtitle="Category shapes which discovery framework loads when you run a live call."
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={d.category === null}
        >
            <ul class="ob-options ob-options--grid" role="radiogroup" aria-label="Category">
                {CATEGORY_OPTIONS.map((c) => (
                    <li key={c.key}>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={d.category === c.key}
                            class={`ob-option ob-option--compact${d.category === c.key ? " is-selected" : ""}`}
                            onClick={() => patchDraft({ category: c.key as CategoryKey })}
                        >
                            <strong class="ob-option__label">{c.label}</strong>
                        </button>
                    </li>
                ))}
            </ul>
        </StepShell>
    );
}

export function IcpStep(): JSX.Element {
    const d = draft.value;
    return (
        <StepShell
            kicker="STEP 5 OF 7 — ICP"
            title="Write one sharp ICP."
            subtitle="One sentence is enough. Thin means fewer assumptions, fewer personas, fewer use cases — that's the definition every other room in the app runs against."
            onNext={() => nextStep()}
            onBack={() => prevStep()}
            nextDisabled={d.icpStatement.trim().length === 0}
        >
            <label class="ob-field">
                <span class="ob-field__label">Who is this for?</span>
                <textarea
                    class="ob-input"
                    rows={2}
                    value={d.icpStatement}
                    onInput={(e) =>
                        patchDraft({
                            icpStatement: (e.currentTarget as HTMLTextAreaElement)
                                .value
                        })
                    }
                    placeholder="e.g., Mid-market freight forwarders in EU expanding past their first compliance audit."
                />
            </label>
            <label class="ob-field">
                <span class="ob-field__label">
                    What pain do you solve for them? (optional)
                </span>
                <textarea
                    class="ob-input"
                    rows={2}
                    value={d.icpPain}
                    onInput={(e) =>
                        patchDraft({
                            icpPain: (e.currentTarget as HTMLTextAreaElement).value
                        })
                    }
                    placeholder="e.g., Compliance prep is a 3-month manual scramble."
                />
            </label>
        </StepShell>
    );
}

export function AccountStep(): JSX.Element {
    const d = draft.value;
    return (
        <StepShell
            kicker="STEP 6 OF 7 — FIRST ACCOUNT"
            title="Pick one company that fits the ICP."
            subtitle="Optional, but the workspace feels real once a named account lands in Signal Console."
            onNext={() => nextStep()}
            onBack={() => prevStep()}
        >
            <label class="ob-field">
                <span class="ob-field__label">Account name (optional)</span>
                <input
                    class="ob-input"
                    type="text"
                    value={d.firstAccountName}
                    onInput={(e) =>
                        patchDraft({
                            firstAccountName: (e.currentTarget as HTMLInputElement)
                                .value
                        })
                    }
                    placeholder="e.g., Meridian Logistics"
                />
            </label>
            <label class="ob-field">
                <span class="ob-field__label">
                    Why now? (one signal that pulled them up — optional)
                </span>
                <input
                    class="ob-input"
                    type="text"
                    value={d.firstAccountSignal}
                    onInput={(e) =>
                        patchDraft({
                            firstAccountSignal: (e.currentTarget as HTMLInputElement)
                                .value
                        })
                    }
                    placeholder="e.g., Just announced EU expansion."
                />
            </label>
        </StepShell>
    );
}

export function QuotaStep(): JSX.Element {
    const d = draft.value;
    function num(field: "annualQuota" | "avgDealSize") {
        return (e: Event): void => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            const cleaned = raw.replace(/[^0-9.]/g, "");
            const n = Number(cleaned);
            if (Number.isFinite(n)) patchDraft({ [field]: n });
        };
    }
    return (
        <StepShell
            kicker="STEP 7 OF 7 — QUOTA"
            title="What revenue does the year owe?"
            subtitle="Quota Workback turns these into a weekly execution plan. Optional — you can fill it later."
            onNext={() => {
                const result = finishAndSeed();
                if (!result.items.length) {
                    // nothing to seed — still advance so the operator
                    // sees the completion screen
                    finishAndSeed();
                }
            }}
            onBack={() => prevStep()}
            nextLabel="Finish onboarding"
            nextDisabled={!validation.value.canSeedAnything}
        >
            <div class="ob-form-row">
                <label class="ob-field">
                    <span class="ob-field__label">Annual quota ($)</span>
                    <input
                        class="ob-input"
                        type="text"
                        inputMode="numeric"
                        value={d.annualQuota ? d.annualQuota.toLocaleString() : ""}
                        onInput={num("annualQuota")}
                        placeholder="e.g., 1,200,000"
                    />
                </label>
                <label class="ob-field">
                    <span class="ob-field__label">Avg deal size ($)</span>
                    <input
                        class="ob-input"
                        type="text"
                        inputMode="numeric"
                        value={d.avgDealSize ? d.avgDealSize.toLocaleString() : ""}
                        onInput={num("avgDealSize")}
                        placeholder="e.g., 50,000"
                    />
                </label>
            </div>
            {validation.value.missingRequired.length > 0 ? (
                <p class="ob-coach">
                    Worth filling: {validation.value.missingRequired.join(" · ")}.
                    None of these block finishing — they just make the
                    Dashboard land with sharper context.
                </p>
            ) : null}
        </StepShell>
    );
}

export function CompleteStep(): JSX.Element {
    const ok = seeded.value;
    return (
        <StepShell
            kicker="ONBOARDING COMPLETE"
            title="The workspace is live."
            subtitle={
                ok
                    ? "Your answers seeded an ICP, an account, and a quota plan. Welcome will guide the next real moves."
                    : "Nothing was seeded — but the workspace is yours. You can come back anytime."
            }
            hideBack
        >
            <div class="ob-complete">
                <a
                    class="ob-btn ob-btn--primary ob-complete__primary"
                    href="/welcome/?returnTo=%2Fonboarding%2F&returnLabel=Back%20to%20setup&fromMode=threshold&fromSurface=onboarding-complete"
                >
                    Start the first move
                </a>
                <p class="ob-complete__alt">
                    Or jump straight to{" "}
                    <a href="/dashboard/">the Dashboard</a>,{" "}
                    <a href="/quota-workback/">Quota Workback</a>, or{" "}
                    <a href="/settings/">Settings</a>.
                </p>
            </div>
        </StepShell>
    );
}
