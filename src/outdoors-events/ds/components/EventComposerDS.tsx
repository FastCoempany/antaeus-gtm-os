import type { JSX } from "preact";
import { Button, Card, FormField, Select, TextInput, Textarea } from "@/components";
import { t } from "@/lib/voice/t";
import {
    closeComposer,
    composerBusy,
    composerError,
    composerOpen,
    draft,
    openComposer,
    patchDraft,
    saveDraft
} from "../../state";
import {
    OUTDOORS_EVENT_STATUSES,
    STATUS_LABEL,
    type OutdoorsEventStatus
} from "../../lib/types";
import { joinTags, parseTags } from "../../lib/persistence";

/**
 * EventComposerDS — the demoted "add one by hand" affordance (ADR-016).
 * Discovery does the finding; this is the secondary path for a private
 * invite or a local hang the system hasn't surfaced. Closed by default
 * to a quiet ghost button; opens an inline form composed on the library
 * inputs. The persistence is the unchanged engine.
 */
export function EventComposerDS(): JSX.Element {
    if (!composerOpen.value) {
        return (
            <div class="oed-composer__closed">
                <Button variant="ghost" onClick={() => openComposer()}>
                    {t("+ Add one by hand")}
                </Button>
                <p class="oed-composer__nudge">
                    {t(
                        "Discovery does the finding. But if you already know about a private invite or a local hang the system hasn't surfaced — add it here.",
                        { class: "body" }
                    )}
                </p>
            </div>
        );
    }

    const d = draft.value;
    const busy = composerBusy.value;
    const err = composerError.value;

    return (
        <Card kicker={t("ADD ONE BY HAND")}>
            <div class="oed-composer__grid">
                <FormField label={t("Name")}>
                    <TextInput
                        value={d.name}
                        onInput={(name) => patchDraft({ name })}
                        placeholder={t("e.g. RSA Conference 2026", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Kind")}>
                    <TextInput
                        value={d.kind}
                        onInput={(kind) => patchDraft({ kind })}
                        placeholder={t("conference / mixer / show…", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Where")}>
                    <TextInput
                        value={d.whereAt}
                        onInput={(whereAt) => patchDraft({ whereAt })}
                        placeholder={t("San Francisco, CA", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Status")}>
                    <Select
                        value={d.status}
                        onChange={(v) => patchDraft({ status: v as OutdoorsEventStatus })}
                        options={OUTDOORS_EVENT_STATUSES.map((s) => ({
                            value: s,
                            label: STATUS_LABEL[s]
                        }))}
                    />
                </FormField>
                <FormField label={t("Starts")}>
                    <TextInput
                        type="date"
                        value={d.startDate}
                        onInput={(startDate) => patchDraft({ startDate })}
                    />
                </FormField>
                <FormField label={t("Ends")}>
                    <TextInput
                        type="date"
                        value={d.endDate}
                        onInput={(endDate) => patchDraft({ endDate })}
                    />
                </FormField>
                <div class="oed-composer__wide">
                    <FormField label={t("Tags")}>
                        <TextInput
                            value={joinTags(d.tags)}
                            onInput={(raw) => patchDraft({ tags: parseTags(raw) })}
                            placeholder={t("CRO, fintech, west-coast — comma-separated", { class: "body" })}
                        />
                    </FormField>
                </div>
                <div class="oed-composer__wide">
                    <FormField label={t("Source URL")}>
                        <TextInput
                            value={d.sourceUrl}
                            onInput={(sourceUrl) => patchDraft({ sourceUrl })}
                            placeholder={t("https://", { class: "body" })}
                        />
                    </FormField>
                </div>
                <div class="oed-composer__wide">
                    <FormField label={t("Notes")}>
                        <Textarea
                            rows={2}
                            value={d.notes}
                            onInput={(notes) => patchDraft({ notes })}
                            placeholder={t("Anything worth remembering.", { class: "body" })}
                        />
                    </FormField>
                </div>
            </div>
            {err ? (
                <p class="oed-composer__error" role="alert">
                    {err}
                </p>
            ) : null}
            <div class="oed-composer__actions">
                <Button
                    variant="accent"
                    onClick={() => void saveDraft()}
                    disabled={busy || d.name.trim().length === 0}
                >
                    {busy ? t("Saving…") : t("Add the event")}
                </Button>
                <Button variant="ghost" onClick={() => closeComposer()} disabled={busy}>
                    {t("Cancel")}
                </Button>
            </div>
        </Card>
    );
}
