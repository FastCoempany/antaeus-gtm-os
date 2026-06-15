import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, FormField, Textarea, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import { buildManualAccount, upsertAccount } from "../../state";
import { saveAccount } from "../../lib/cloud-persistence";

/**
 * AddAccountFormDS — the manual add-account composer (canon §4.7),
 * library-composed. Replaces the legacy hook-based AddAccountForm inside
 * the DS room. Name-first: the operator drops a name on the radar fast,
 * fills the rest later. Signals-based (not preact/hooks); the build +
 * cloud-save are the unchanged engine.
 */

interface AddDraft {
    name: string;
    domain: string;
    industry: string;
    hq: string;
    notes: string;
}
const EMPTY: AddDraft = { name: "", domain: "", industry: "", hq: "", notes: "" };

const draft: Signal<AddDraft> = signal({ ...EMPTY });
const open: Signal<boolean> = signal(false);
const saving: Signal<boolean> = signal(false);
const flash: Signal<string> = signal("");

function patch(part: Partial<AddDraft>): void {
    draft.value = { ...draft.value, ...part };
}

async function submit(embedded: boolean): Promise<void> {
    const name = draft.value.name.trim();
    if (!name) return;
    saving.value = true;
    const account = buildManualAccount({
        name,
        domain: draft.value.domain,
        industry: draft.value.industry,
        hq: draft.value.hq,
        notes: draft.value.notes
    });
    upsertAccount(account);
    try {
        await saveAccount(account);
    } finally {
        saving.value = false;
    }
    flash.value = `${t("Saved")} · ${name}`;
    setTimeout(() => (flash.value = ""), 2200);
    draft.value = { ...EMPTY };
    if (!embedded) open.value = false;
}

export function AddAccountFormDS(props: { readonly embedded?: boolean }): JSX.Element {
    const embedded = props.embedded === true;
    const d = draft.value;
    const busy = saving.value;

    if (!embedded && !open.value) {
        return (
            <div class="scd-add-trigger">
                <Button variant="accent" onClick={() => (open.value = true)}>
                    {t("Add an account")}
                </Button>
                {flash.value ? <span class="scd-add__flash" role="status">{flash.value}</span> : null}
            </div>
        );
    }

    return (
        <form
            class={`scd-add${embedded ? " scd-add--embedded" : ""}`}
            onSubmit={(e) => {
                e.preventDefault();
                void submit(embedded);
            }}
        >
            <FormField label={t("Account name")}>
                <TextInput value={d.name} onInput={(name) => patch({ name })} placeholder={t("e.g. Acme Robotics", { class: "body" })} />
            </FormField>
            <div class="scd-add__grid">
                <FormField label={t("Domain")}>
                    <TextInput value={d.domain} onInput={(domain) => patch({ domain })} placeholder="acme.com" />
                </FormField>
                <FormField label={t("Industry")}>
                    <TextInput value={d.industry} onInput={(industry) => patch({ industry })} placeholder={t("Logistics", { class: "body" })} />
                </FormField>
                <FormField label={t("HQ")}>
                    <TextInput value={d.hq} onInput={(hq) => patch({ hq })} placeholder={t("San Francisco, CA", { class: "body" })} />
                </FormField>
            </div>
            <FormField label={t("Why they're on the radar")}>
                <Textarea
                    rows={2}
                    value={d.notes}
                    onInput={(notes) => patch({ notes })}
                    placeholder={t("One sentence — the trigger or signal that brought them up.", { class: "body" })}
                />
            </FormField>
            <div class="scd-add__actions">
                <Button
                    type="submit"
                    variant="accent"
                    disabled={busy || !d.name.trim()}
                    disabledWhy={!d.name.trim() ? t("Name the account first.", { class: "body" }) : undefined}
                >
                    {busy ? t("Saving…") : t("Add the account")}
                </Button>
                {!embedded ? (
                    <Button variant="ghost" onClick={() => { draft.value = { ...EMPTY }; open.value = false; }} disabled={busy}>
                        {t("Cancel")}
                    </Button>
                ) : null}
                {flash.value ? <span class="scd-add__flash" role="status">{flash.value}</span> : null}
            </div>
        </form>
    );
}
