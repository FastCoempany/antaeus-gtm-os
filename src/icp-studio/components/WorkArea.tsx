import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
    draft,
    effectiveBuyer,
    effectiveIndustry,
    patchDraft,
    saveDraftAsIcp,
    setRole
} from "../state";
import {
    BUYER_OPTIONS,
    GEO_OPTIONS,
    INDUSTRY_OPTIONS,
    PAIN_OPTIONS,
    PROOF_WINDOW_OPTIONS,
    SIZE_OPTIONS,
    TRIGGER_OPTIONS
} from "../lib/options";
import { ICP_TEMPLATES, findTemplate } from "../lib/data";
import {
    buildBuyingGroup,
    buildEvidence,
    buildFocus,
    buildStatement
} from "../lib/builders";
import { saveIcp } from "../lib/cloud-persistence";
import type { RoleKey } from "../lib/types";
import { WedgeLedger } from "./WedgeLedger";
import { RunDocket } from "./RunDocket";

/**
 * WorkArea — Wave 3 implementation.
 *
 * Per Part II §4.8 the bright work area carries the actual decision.
 * Layout:
 *   - role toggle (founder / first AE)
 *   - template buttons (5 prefill options)
 *   - 7 input fields (industry / size / geo / buyer / pain / trigger /
 *     proof) + active accounts numeric input
 *   - 4 build outputs (Thin ICP statement / focus / buying group /
 *     evidence)
 *   - quality readout (8-check list + tier-tinted score)
 */

function applyTemplate(id: string): void {
    const t = findTemplate(id);
    if (!t) return;
    const isCustomIndustry = !INDUSTRY_OPTIONS.some(
        (o) => o.value !== "custom" && o.value === t.industry
    );
    const isCustomBuyer = !BUYER_OPTIONS.some(
        (o) => o.value !== "custom" && o.value === t.buyer
    );
    patchDraft({
        industry: isCustomIndustry ? "custom" : t.industry,
        industryCustom: isCustomIndustry ? t.industry : "",
        buyer: isCustomBuyer ? "custom" : t.buyer,
        buyerCustom: isCustomBuyer ? t.buyer : "",
        size: t.size,
        geo: t.geo,
        pain: t.pain,
        trigger: t.trigger,
        proofWindow: t.proofWindow,
        engineActive:
            typeof t.activeAccounts === "number"
                ? String(t.activeAccounts)
                : ""
    });
}

function parseActiveAccounts(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function RoleToggle(): JSX.Element {
    const role = draft.value.role;
    return (
        <div class="icp-roles" role="tablist" aria-label="Role">
            {(["founder", "firstae"] as ReadonlyArray<RoleKey>).map((r) => (
                <button
                    key={r}
                    type="button"
                    class={`icp-role${role === r ? " is-active" : ""}`}
                    role="tab"
                    aria-selected={role === r}
                    onClick={() => setRole(r)}
                >
                    {r === "founder" ? "Founder-led" : "First AE"}
                </button>
            ))}
            <span class="icp-roles__note">
                Switching the role changes the working-list recommendation
                + per-role overage warning.
            </span>
        </div>
    );
}

function TemplatePanel(): JSX.Element {
    return (
        <div class="icp-templates" aria-label="ICP templates">
            <p class="icp-templates__label">PREFILL FROM TEMPLATE</p>
            <div class="icp-templates__row">
                {ICP_TEMPLATES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        class="icp-templates__btn"
                        onClick={() => applyTemplate(t.id)}
                    >
                        {t.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

type FieldChild = JSX.Element | null | false;

function FormField({
    label,
    children,
    hint
}: {
    readonly label: string;
    readonly children: FieldChild | ReadonlyArray<FieldChild>;
    readonly hint?: string;
}): JSX.Element {
    return (
        <label class="icp-field">
            <span class="icp-field__label">{label}</span>
            {children}
            {hint ? <span class="icp-field__hint">{hint}</span> : null}
        </label>
    );
}

function FormFields(): JSX.Element {
    const d = draft.value;
    return (
        <div class="icp-form" aria-label="ICP inputs">
            <FormField
                label="Industry"
                hint="Be specific enough that a list exists."
            >
                <select
                    class="icp-select"
                    value={d.industry}
                    onChange={(e) =>
                        patchDraft({
                            industry: (
                                e.currentTarget as HTMLSelectElement
                            ).value
                        })
                    }
                >
                    <option value="">Choose industry</option>
                    {INDUSTRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                {d.industry === "custom" ? (
                    <input
                        class="icp-input"
                        type="text"
                        placeholder="Type industry"
                        value={d.industryCustom}
                        onInput={(e) =>
                            patchDraft({
                                industryCustom: (
                                    e.currentTarget as HTMLInputElement
                                ).value
                            })
                        }
                    />
                ) : null}
            </FormField>

            <FormField
                label="Company size"
                hint="A proxy for process complexity and buying friction."
            >
                <select
                    class="icp-select"
                    value={d.size}
                    onChange={(e) =>
                        patchDraft({
                            size: (e.currentTarget as HTMLSelectElement).value
                        })
                    }
                >
                    <option value="">Choose band</option>
                    {SIZE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Geography"
                hint="Pick a region you can actually cover."
            >
                <select
                    class="icp-select"
                    value={d.geo}
                    onChange={(e) =>
                        patchDraft({
                            geo: (e.currentTarget as HTMLSelectElement).value
                        })
                    }
                >
                    <option value="">Choose zone</option>
                    {GEO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Primary buyer (owner)"
                hint="Choose the person who owns the pain and can say yes."
            >
                <select
                    class="icp-select"
                    value={d.buyer}
                    onChange={(e) =>
                        patchDraft({
                            buyer: (
                                e.currentTarget as HTMLSelectElement
                            ).value
                        })
                    }
                >
                    <option value="">Choose owner</option>
                    {BUYER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                {d.buyer === "custom" ? (
                    <input
                        class="icp-input"
                        type="text"
                        placeholder="Type buyer/owner role"
                        value={d.buyerCustom}
                        onInput={(e) =>
                            patchDraft({
                                buyerCustom: (
                                    e.currentTarget as HTMLInputElement
                                ).value
                            })
                        }
                    />
                ) : null}
            </FormField>

            <FormField
                label="Primary pain"
                hint="One pain. Not a buffet."
            >
                <select
                    class="icp-select"
                    value={d.pain}
                    onChange={(e) =>
                        patchDraft({
                            pain: (e.currentTarget as HTMLSelectElement).value
                        })
                    }
                >
                    <option value="">Choose pain</option>
                    {PAIN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Trigger"
                hint="A trigger is the difference between interest and urgency."
            >
                <select
                    class="icp-select"
                    value={d.trigger}
                    onChange={(e) =>
                        patchDraft({
                            trigger: (
                                e.currentTarget as HTMLSelectElement
                            ).value
                        })
                    }
                >
                    <option value="">Choose trigger</option>
                    {TRIGGER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Proof window"
                hint="How fast you can demonstrate value (matters a lot early stage)."
            >
                <select
                    class="icp-select"
                    value={d.proofWindow}
                    onChange={(e) =>
                        patchDraft({
                            proofWindow: (
                                e.currentTarget as HTMLSelectElement
                            ).value
                        })
                    }
                >
                    <option value="">Choose window</option>
                    {PROOF_WINDOW_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField
                label="Active accounts (optional)"
                hint="If you enter this, the recommended focus becomes precise."
            >
                <input
                    class="icp-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 47"
                    value={d.engineActive}
                    onInput={(e) =>
                        patchDraft({
                            engineActive: (
                                e.currentTarget as HTMLInputElement
                            ).value
                        })
                    }
                />
            </FormField>
        </div>
    );
}

function Outputs(): JSX.Element {
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;
    const statement = buildStatement({
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow
    });
    const focus = buildFocus(d.role, parseActiveAccounts(d.engineActive));
    const buyingGroup = buildBuyingGroup(buyer);
    const evidence = buildEvidence(d.pain, d.trigger);

    return (
        <div class="icp-outputs" aria-label="Live build outputs">
            <article class="icp-out icp-out--statement">
                <p class="icp-out__kicker">THIN ICP STATEMENT</p>
                <p class="icp-out__statement">{statement.text}</p>
                <p class="icp-out__hint">{statement.hint}</p>
            </article>

            <article class="icp-out">
                <p class="icp-out__kicker">FOCUS RECOMMENDATION</p>
                <p class="icp-out__body">{focus}</p>
            </article>

            <article class="icp-out">
                <p class="icp-out__kicker">BUYING GROUP MINIMUM</p>
                <ul class="icp-out__list">
                    {buyingGroup.map((row, i) => (
                        <li key={i}>{row}</li>
                    ))}
                </ul>
            </article>

            <article class="icp-out">
                <p class="icp-out__kicker">EVIDENCE SIGNALS</p>
                <ul class="icp-out__list">
                    {evidence.map((row, i) => (
                        <li key={i}>{row}</li>
                    ))}
                </ul>
            </article>
        </div>
    );
}

// QualityReadout retired in Program 6 / PR 5 (Wedge Ledger refacing).
// Replaced by the WedgeLedger + RunDocket pair which carry the same
// quality data in the canonical Variant 01 visual shape.

function SaveBar(): JSX.Element {
    const [toast, setToast] = useState<string>("");
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;
    const canSave =
        industry.length > 0 && d.size.length > 0 && buyer.length > 0;

    function flash(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    }

    function onSave(): void {
        const icp = saveDraftAsIcp();
        if (!icp) {
            flash("Need at least industry + size + buyer to save.");
            return;
        }
        flash(`Saved · ${icp.industry} (${icp.qualityScore}/100).`);
        // Fire-and-forget cloud sync; errors are reported through Sentry.
        void saveIcp(icp);
    }

    return (
        <div class="icp-savebar" aria-label="Save ICP">
            <button
                type="button"
                class="icp-save-btn"
                disabled={!canSave}
                onClick={onSave}
            >
                Save ICP to library
            </button>
            <p class="icp-save-hint">
                Saved ICPs power the Match score on every account, deal,
                and outreach line.
            </p>
            {toast ? (
                <span class="icp-save-toast" role="status">
                    {toast}
                </span>
            ) : null}
        </div>
    );
}

export function WorkArea(): JSX.Element {
    return (
        <section class="icp-work" aria-label="ICP work surface">
            <p class="icp-work__kicker">BUILD THE ICP</p>
            <h2 class="icp-work__title">
                One industry. One buyer. One pain. One trigger.
            </h2>
            <RoleToggle />
            <TemplatePanel />
            <FormFields />
            <Outputs />
            <div class="icp-work__readout">
                <WedgeLedger />
                <RunDocket />
            </div>
            <SaveBar />
        </section>
    );
}
