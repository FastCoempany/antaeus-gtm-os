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
            kicker="Welcome"
            title="The system that turns founder revenue work into operating truth."
            subtitle="Antaeus is a pressure-and-truth system for commercial work — not a CRM, not an enablement library. Six small steps and the workspace will already be live."
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
                        The first ask is a one-line ICP — that is the wedge
                        the rest of the system compounds off of.
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
            kicker="Step 1 — A name"
            title="What should the system call you?"
            subtitle="The lowest-friction question first. Just the company name — everything else stays optional below."
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
            kicker="Step 2 — A lens"
            title="Which seat are you in?"
            subtitle="Role drives which downstream room is centered first. You can change this anytime from Settings."
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
            kicker="Step 3 — A frame"
            title="What category are you selling into?"
            subtitle="Category shapes which discovery framework appears in Discovery Studio + which copy variants surface elsewhere."
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
            kicker="Step 4 — The wedge"
            title="Write one sharp ICP."
            subtitle="One sentence is enough. Thin means fewer assumptions, fewer personas, fewer use cases. The system compounds off this."
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
            kicker="Step 5 — One real account"
            title="Pick one company that fits the ICP."
            subtitle="The system gets visibly more real after the first named account. Optional, but high-leverage."
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
            kicker="Step 6 — Pressure"
            title="What revenue does the year owe?"
            subtitle="Quota Workback uses these to translate revenue into a weekly execution plan. Optional — you can fill it later."
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
                    Soft coaching:{" "}
                    {validation.value.missingRequired.join(" · ")}. None of
                    these block finishing — but each one makes the Dashboard
                    wake up sharper.
                </p>
            ) : null}
        </StepShell>
    );
}

export function CompleteStep(): JSX.Element {
    const ok = seeded.value;
    return (
        <StepShell
            kicker="Onboarding complete"
            title="The workspace is live."
            subtitle={
                ok
                    ? "Every answer above turned into a real Brief item. The Dashboard is no longer empty."
                    : "Nothing was seeded — but the workspace is yours. You can come back anytime."
            }
            hideBack
        >
            <div class="ob-complete">
                <ul class="ob-complete__list">
                    <li>
                        <a class="ob-btn ob-btn--primary" href="/welcome/">
                            Open Welcome
                        </a>
                    </li>
                    <li>
                        <a class="ob-btn ob-btn--ghost" href="/dashboard/">
                            Open Dashboard (Spotlight)
                        </a>
                    </li>
                    <li>
                        <a class="ob-btn ob-btn--ghost" href="/quota-workback/">
                            Open Quota Workback
                        </a>
                    </li>
                    <li>
                        <a class="ob-btn ob-btn--ghost" href="/settings/">
                            Open Settings
                        </a>
                    </li>
                </ul>
            </div>
        </StepShell>
    );
}
