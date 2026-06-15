import { effect, signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, FormField, IconButton, Select, Textarea, TextInput, Toggle } from "@/components";
import { t } from "@/lib/voice/t";
import {
    closeDealEditor,
    editingDeal,
    editingPrevStage,
    openLossReasonFor,
    transitionedToLost
} from "../../state";
import {
    ROLE_LABELS,
    STAGE_IDS,
    STAGE_LABELS,
    STAKEHOLDER_ROLES,
    type Deal,
    type Momentum,
    type StageId,
    type Stakeholder
} from "../../lib/deal-shape";
import { saveDealEdit } from "../../lib/persistence";

/**
 * DealHealthFormDS — the 9-field deal-health editor (canon §4.13),
 * library-composed. Replaces the legacy hook-based DealHealthForm inside
 * the DS room so the editor matches the surface around it. State lives in
 * a module-level draft signal synced to editingDeal via an effect (not
 * preact/hooks); the save path + the closed-lost → loss-reason trigger
 * are the unchanged engine.
 */

const draft: Signal<Deal | null> = signal(null);
const saving: Signal<boolean> = signal(false);
let syncedId: string | null = null;

// Sync the draft to whichever deal is open, once per deal — outside
// render so there's no render-time signal write.
effect(() => {
    const deal = editingDeal.value;
    const id = deal?.id ?? null;
    if (id !== syncedId) {
        syncedId = id;
        draft.value = deal;
        saving.value = false;
    }
});

function patch(part: Partial<Deal>): void {
    if (!draft.value) return;
    draft.value = { ...draft.value, ...part };
}

const FORECAST_OPTIONS = [
    { value: "", label: t("Unset") },
    { value: "commit", label: t("Commit") },
    { value: "best_case", label: t("Best case") },
    { value: "pipeline", label: t("Pipeline") },
    { value: "omitted", label: t("Omitted") }
];
const MOMENTUM_OPTIONS = [
    { value: "", label: t("Unset") },
    { value: "strong", label: t("Strong") },
    { value: "neutral", label: t("Neutral") },
    { value: "stalling", label: t("Stalling") }
];
const STAGE_OPTIONS = STAGE_IDS.map((s) => ({ value: s, label: STAGE_LABELS[s] }));

function asMomentum(v: string): Momentum | undefined {
    return v === "strong" || v === "neutral" || v === "stalling" ? v : undefined;
}

async function handleSave(): Promise<void> {
    const d = draft.value;
    if (!d) return;
    const prevStage = editingPrevStage.value;
    saving.value = true;
    const saved = await saveDealEdit(d);
    saving.value = false;
    const wentLost = transitionedToLost(prevStage, saved.stage);
    closeDealEditor();
    if (wentLost) {
        openLossReasonFor(saved.id, saved.accountName || "(untitled)");
    }
}

export function DealHealthFormDS(): JSX.Element | null {
    const d = draft.value;
    if (!editingDeal.value || !d) return null;
    const busy = saving.value;

    return (
        <div class="dwd-form" role="region" aria-label={t("Deal health form")}>
            <section class="dwd-form__section">
                <p class="ds-kicker">{t("ACCOUNT & STAGE")}</p>
                <div class="dwd-form__grid">
                    <FormField label={t("Account")}>
                        <TextInput value={d.accountName} onInput={(accountName) => patch({ accountName })} />
                    </FormField>
                    <FormField label={t("Stage")}>
                        <Select value={d.stage} onChange={(stage) => patch({ stage: stage as StageId })} options={STAGE_OPTIONS} />
                    </FormField>
                    <FormField label={t("Value (USD)")}>
                        <TextInput value={String(d.value || 0)} onInput={(v) => patch({ value: Number(v) || 0 })} />
                    </FormField>
                    <FormField label={t("Close date")}>
                        <TextInput type="date" value={d.closeDate ?? ""} onInput={(closeDate) => patch({ closeDate: closeDate || undefined })} />
                    </FormField>
                </div>
            </section>

            <section class="dwd-form__section">
                <p class="ds-kicker">{t("NEXT MOVE")}</p>
                <FormField label={t("Next step")}>
                    <TextInput
                        value={d.nextStep ?? ""}
                        onInput={(nextStep) => patch({ nextStep: nextStep || undefined })}
                        placeholder={t("e.g. Send pricing to Sarah by Tuesday", { class: "body" })}
                    />
                </FormField>
                <div class="dwd-form__grid">
                    <FormField label={t("Next step date")}>
                        <TextInput type="date" value={d.nextStepDate ?? ""} onInput={(nextStepDate) => patch({ nextStepDate: nextStepDate || undefined })} />
                    </FormField>
                    <FormField label={t("Forecast")}>
                        <Select value={d.forecastCategory ?? ""} onChange={(forecastCategory) => patch({ forecastCategory: forecastCategory || undefined })} options={FORECAST_OPTIONS} />
                    </FormField>
                    <FormField label={t("Momentum")}>
                        <Select value={d.momentum ?? ""} onChange={(m) => patch({ momentum: asMomentum(m) })} options={MOMENTUM_OPTIONS} />
                    </FormField>
                </div>
            </section>

            <section class="dwd-form__section">
                <p class="ds-kicker">{t("BUYING GROUP")}</p>
                <div class="dwd-form__grid">
                    <FormField label={t("Champion")}>
                        <TextInput value={d.champion ?? ""} onInput={(champion) => patch({ champion: champion || undefined })} />
                    </FormField>
                    <FormField label={t("Economic buyer")}>
                        <TextInput value={d.economicBuyer ?? ""} onInput={(economicBuyer) => patch({ economicBuyer: economicBuyer || undefined })} />
                    </FormField>
                </div>
                <StakeholdersEditor value={d.stakeholders ?? []} onChange={(stakeholders) => patch({ stakeholders })} />
            </section>

            <section class="dwd-form__section">
                <p class="ds-kicker">{t("DEAL INTEL")}</p>
                <FormField label={t("Use case")}>
                    <Textarea rows={2} value={d.useCase ?? ""} onInput={(useCase) => patch({ useCase: useCase || undefined })} />
                </FormField>
                <FormField label={t("Pain")}>
                    <Textarea rows={2} value={d.pain ?? ""} onInput={(pain) => patch({ pain: pain || undefined })} />
                </FormField>
                <FormField label={t("Competition")}>
                    <TextInput value={d.competition ?? ""} onInput={(competition) => patch({ competition: competition || undefined })} />
                </FormField>
                <FormField label={t("Decision process")}>
                    <Textarea rows={2} value={d.decisionProcess ?? ""} onInput={(decisionProcess) => patch({ decisionProcess: decisionProcess || undefined })} />
                </FormField>
                <FormField label={t("Notes")}>
                    <Textarea rows={3} value={d.notes ?? ""} onInput={(notes) => patch({ notes: notes || undefined })} />
                </FormField>
            </section>

            <footer class="dwd-form__foot">
                <Button variant="ghost" onClick={closeDealEditor} disabled={busy}>
                    {t("Back")}
                </Button>
                <Button variant="accent" onClick={() => void handleSave()} disabled={busy}>
                    {busy ? t("Saving…") : t("Save the deal")}
                </Button>
            </footer>
        </div>
    );
}

function StakeholdersEditor(props: {
    readonly value: ReadonlyArray<Stakeholder>;
    readonly onChange: (next: ReadonlyArray<Stakeholder>) => void;
}): JSX.Element {
    const list = props.value;
    function patchAt(i: number, part: Partial<Stakeholder>): void {
        const cur = list[i];
        if (!cur) return;
        const next = list.slice();
        next[i] = { ...cur, ...part } as Stakeholder;
        props.onChange(next);
    }
    return (
        <div class="dwd-stk">
            <div class="dwd-stk__head">
                <span class="ds-field__label">{t("Stakeholders")}</span>
                <Button
                    variant="ghost"
                    onClick={() => props.onChange([...list, { name: "", role: "" } as Stakeholder])}
                >
                    {t("Add one")}
                </Button>
            </div>
            {list.length === 0 ? (
                <p class="dwd-stk__empty">{t("No stakeholders mapped yet.", { class: "body" })}</p>
            ) : (
                <ul class="dwd-stk__list">
                    {list.map((s, i) => (
                        <li key={i} class="dwd-stk__row">
                            <TextInput value={s.name} onInput={(name) => patchAt(i, { name })} placeholder={t("Name")} />
                            <Select
                                value={s.role}
                                onChange={(role) => patchAt(i, { role: role as Stakeholder["role"] })}
                                options={[
                                    { value: "", label: t("Role…") },
                                    ...STAKEHOLDER_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))
                                ]}
                            />
                            <Toggle
                                pressed={s.engaged === true}
                                onToggle={(engaged) => patchAt(i, { engaged: engaged || undefined })}
                                label={t("Engaged")}
                            />
                            <IconButton
                                icon="dismiss"
                                label={t("Remove stakeholder")}
                                onClick={() => {
                                    const next = list.slice();
                                    next.splice(i, 1);
                                    props.onChange(next);
                                }}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
