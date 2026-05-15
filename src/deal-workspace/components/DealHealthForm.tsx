import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
    closeDealEditor,
    editingDeal,
    editingPrevStage,
    openLossReasonFor,
    transitionedToLost
} from "../state";
import {
    ROLE_LABELS,
    STAGE_IDS,
    STAGE_LABELS,
    STAKEHOLDER_ROLES,
    type Deal,
    type Momentum,
    type StageId,
    type Stakeholder,
    type StakeholderRole
} from "../lib/deal-shape";
import { saveDealEdit } from "../lib/persistence";

/**
 * DealHealthForm — Phase 6 polish (PR #63 follow-up).
 *
 * The 9-field deal-health form per canon §4.13: champion, EB, use case,
 * pain, competition, decision process, notes + forecast + momentum.
 * Plus core fields: account, stage, value, dates, next-step, and a
 * stakeholders mini-editor.
 *
 * **Rendered inline inside TargetFolio**, NOT as a full-screen modal.
 * Replaces the residual DealHealthModal per the audit punch-list — full-
 * screen overlays don't belong on a Diagnosis Table room where the
 * commissioned case is already the focal object. Operator works the
 * 9 fields in the same plane as the signal-grid and folio dock.
 *
 * Save flow:
 *   1. saveDealEdit(draft) — optimistic upsert + Supabase round-trip
 *   2. If the save transitions the deal into closed-lost, open the
 *      LossReasonModal pre-loaded with the deal id; otherwise collapse
 *      back to the folio dock view.
 */

type Draft = Deal;

const FORECAST_OPTIONS = [
    { value: "", label: "Unset" },
    { value: "commit", label: "Commit" },
    { value: "best_case", label: "Best Case" },
    { value: "pipeline", label: "Pipeline" },
    { value: "omitted", label: "Omitted" }
] as const;

const MOMENTUM_OPTIONS: ReadonlyArray<{
    value: Momentum | "";
    label: string;
}> = [
    { value: "", label: "Unset" },
    { value: "strong", label: "Strong" },
    { value: "neutral", label: "Neutral" },
    { value: "stalling", label: "Stalling" }
];

function asMomentumValue(v: string): Momentum | undefined {
    if (v === "strong" || v === "neutral" || v === "stalling") return v;
    return undefined;
}

export function DealHealthForm(): JSX.Element | null {
    const deal = editingDeal.value;
    const prevStage = editingPrevStage.value;
    const [draft, setDraft] = useState<Draft | null>(deal);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(deal);
    }, [deal?.id]);

    if (!deal || !draft) return null;

    function patch(part: Partial<Draft>): void {
        setDraft((d) => (d ? { ...d, ...part } : d));
    }

    function patchStakeholders(next: ReadonlyArray<Stakeholder>): void {
        patch({ stakeholders: next });
    }

    async function handleSave(): Promise<void> {
        if (!draft) return;
        setSaving(true);
        const saved = await saveDealEdit(draft);
        setSaving(false);
        const wentLost = transitionedToLost(prevStage, saved.stage);
        closeDealEditor();
        if (wentLost) {
            openLossReasonFor(saved.id, saved.accountName || "(untitled)");
        }
    }

    return (
        <div class="dw-folio-form" role="region" aria-label="Deal health form">
            <div class="dw-folio-form__body">
                <section class="dw-form-section">
                    <h3 class="dw-form-section__title">Account &amp; stage</h3>
                    <div class="dw-form-grid">
                        <Field label="Account name">
                            <input
                                type="text"
                                value={draft.accountName}
                                onInput={(e) =>
                                    patch({
                                        accountName: (
                                            e.currentTarget as HTMLInputElement
                                        ).value
                                    })
                                }
                            />
                        </Field>
                        <Field label="Stage">
                            <select
                                value={draft.stage}
                                onChange={(e) =>
                                    patch({
                                        stage: (
                                            e.currentTarget as HTMLSelectElement
                                        ).value as StageId
                                    })
                                }
                            >
                                {STAGE_IDS.map((s) => (
                                    <option key={s} value={s}>
                                        {STAGE_LABELS[s]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Value (USD)">
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={String(draft.value || 0)}
                                onInput={(e) =>
                                    patch({
                                        value:
                                            Number(
                                                (
                                                    e.currentTarget as HTMLInputElement
                                                ).value
                                            ) || 0
                                    })
                                }
                            />
                        </Field>
                        <Field label="Close date">
                            <input
                                type="date"
                                value={draft.closeDate ?? ""}
                                onInput={(e) =>
                                    patch({
                                        closeDate:
                                            (
                                                e.currentTarget as HTMLInputElement
                                            ).value || undefined
                                    })
                                }
                            />
                        </Field>
                    </div>
                </section>

                <section class="dw-form-section">
                    <h3 class="dw-form-section__title">Next move</h3>
                    <div class="dw-form-grid">
                        <Field label="Next step" wide>
                            <input
                                type="text"
                                value={draft.nextStep ?? ""}
                                placeholder="e.g. Send pricing proposal to Sarah by Tuesday"
                                onInput={(e) =>
                                    patch({
                                        nextStep:
                                            (
                                                e.currentTarget as HTMLInputElement
                                            ).value || undefined
                                    })
                                }
                            />
                        </Field>
                        <Field label="Next step date">
                            <input
                                type="date"
                                value={draft.nextStepDate ?? ""}
                                onInput={(e) =>
                                    patch({
                                        nextStepDate:
                                            (
                                                e.currentTarget as HTMLInputElement
                                            ).value || undefined
                                    })
                                }
                            />
                        </Field>
                        <Field label="Forecast">
                            <select
                                value={draft.forecastCategory ?? ""}
                                onChange={(e) =>
                                    patch({
                                        forecastCategory:
                                            (
                                                e.currentTarget as HTMLSelectElement
                                            ).value || undefined
                                    })
                                }
                            >
                                {FORECAST_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Momentum">
                            <select
                                value={draft.momentum ?? ""}
                                onChange={(e) =>
                                    patch({
                                        momentum: asMomentumValue(
                                            (
                                                e.currentTarget as HTMLSelectElement
                                            ).value
                                        )
                                    })
                                }
                            >
                                {MOMENTUM_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </section>

                <section class="dw-form-section">
                    <h3 class="dw-form-section__title">Buying group</h3>
                    <div class="dw-form-grid">
                        <Field label="Champion">
                            <input
                                type="text"
                                value={draft.champion ?? ""}
                                onInput={(e) =>
                                    patch({
                                        champion:
                                            (
                                                e.currentTarget as HTMLInputElement
                                            ).value || undefined
                                    })
                                }
                            />
                        </Field>
                        <Field label="Economic Buyer">
                            <input
                                type="text"
                                value={draft.economicBuyer ?? ""}
                                onInput={(e) =>
                                    patch({
                                        economicBuyer:
                                            (
                                                e.currentTarget as HTMLInputElement
                                            ).value || undefined
                                    })
                                }
                            />
                        </Field>
                    </div>
                    <StakeholdersEditor
                        value={draft.stakeholders ?? []}
                        onChange={patchStakeholders}
                    />
                </section>

                <section class="dw-form-section">
                    <h3 class="dw-form-section__title">Deal intel</h3>
                    <Field label="Use case" wide>
                        <textarea
                            rows={2}
                            value={draft.useCase ?? ""}
                            onInput={(e) =>
                                patch({
                                    useCase:
                                        (
                                            e.currentTarget as HTMLTextAreaElement
                                        ).value || undefined
                                })
                            }
                        />
                    </Field>
                    <Field label="Pain" wide>
                        <textarea
                            rows={2}
                            value={draft.pain ?? ""}
                            onInput={(e) =>
                                patch({
                                    pain:
                                        (
                                            e.currentTarget as HTMLTextAreaElement
                                        ).value || undefined
                                })
                            }
                        />
                    </Field>
                    <Field label="Competition" wide>
                        <input
                            type="text"
                            value={draft.competition ?? ""}
                            onInput={(e) =>
                                patch({
                                    competition:
                                        (
                                            e.currentTarget as HTMLInputElement
                                        ).value || undefined
                                })
                            }
                        />
                    </Field>
                    <Field label="Decision process" wide>
                        <textarea
                            rows={2}
                            value={draft.decisionProcess ?? ""}
                            onInput={(e) =>
                                patch({
                                    decisionProcess:
                                        (
                                            e.currentTarget as HTMLTextAreaElement
                                        ).value || undefined
                                })
                            }
                        />
                    </Field>
                    <Field label="Notes" wide>
                        <textarea
                            rows={3}
                            value={draft.notes ?? ""}
                            onInput={(e) =>
                                patch({
                                    notes:
                                        (
                                            e.currentTarget as HTMLTextAreaElement
                                        ).value || undefined
                                })
                            }
                        />
                    </Field>
                </section>
            </div>

            <footer class="dw-folio-form__footer">
                <button
                    type="button"
                    class="dw-folio-form__btn dw-folio-form__btn--ghost"
                    onClick={closeDealEditor}
                    disabled={saving}
                >
                    ← Back to folio
                </button>
                <button
                    type="button"
                    class="dw-folio-form__btn dw-folio-form__btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Saving…" : "Save deal"}
                </button>
            </footer>
        </div>
    );
}

interface FieldProps {
    label: string;
    wide?: boolean;
    children: JSX.Element | JSX.Element[];
}

function Field({ label, wide, children }: FieldProps): JSX.Element {
    return (
        <label class={`dw-form-field${wide ? " dw-form-field--wide" : ""}`}>
            <span class="dw-form-field__label">{label}</span>
            {children}
        </label>
    );
}

interface StakeholdersEditorProps {
    value: ReadonlyArray<Stakeholder>;
    onChange: (next: ReadonlyArray<Stakeholder>) => void;
}

function StakeholdersEditor({
    value,
    onChange
}: StakeholdersEditorProps): JSX.Element {
    function patchAt(i: number, part: Partial<Stakeholder>): void {
        const current = value[i];
        if (!current) return;
        const next = value.slice();
        next[i] = { ...current, ...part } as Stakeholder;
        onChange(next);
    }

    function removeAt(i: number): void {
        const next = value.slice();
        next.splice(i, 1);
        onChange(next);
    }

    function add(): void {
        onChange([...value, { name: "", role: "" } as Stakeholder]);
    }

    return (
        <div class="dw-stakeholders">
            <div class="dw-stakeholders__header">
                <span class="dw-form-field__label">Stakeholders</span>
                <button
                    type="button"
                    class="dw-stakeholders__add"
                    onClick={add}
                >
                    + Add
                </button>
            </div>
            {value.length === 0 ? (
                <p class="dw-stakeholders__empty">
                    No stakeholders mapped yet.
                </p>
            ) : (
                <ul class="dw-stakeholders__list">
                    {value.map((s, i) => (
                        <li key={i} class="dw-stakeholders__row">
                            <input
                                type="text"
                                class="dw-stakeholders__name"
                                placeholder="Name"
                                value={s.name}
                                onInput={(e) =>
                                    patchAt(i, {
                                        name: (
                                            e.currentTarget as HTMLInputElement
                                        ).value
                                    })
                                }
                            />
                            <select
                                class="dw-stakeholders__role"
                                value={s.role}
                                onChange={(e) =>
                                    patchAt(i, {
                                        role: (
                                            e.currentTarget as HTMLSelectElement
                                        ).value as StakeholderRole | ""
                                    })
                                }
                            >
                                <option value="">Role…</option>
                                {STAKEHOLDER_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {ROLE_LABELS[r]}
                                    </option>
                                ))}
                            </select>
                            <label class="dw-stakeholders__engaged">
                                <input
                                    type="checkbox"
                                    checked={s.engaged === true}
                                    onChange={(e) =>
                                        patchAt(i, {
                                            engaged:
                                                (
                                                    e.currentTarget as HTMLInputElement
                                                ).checked || undefined
                                        })
                                    }
                                />
                                Engaged
                            </label>
                            <button
                                type="button"
                                class="dw-stakeholders__remove"
                                onClick={() => removeAt(i)}
                                aria-label="Remove stakeholder"
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
