import type { JSX } from "preact";
import { FormField, Kicker, Select, StatusChip, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import {
    accountOptions,
    draft,
    patchDraft,
    selectedAccountName,
    setSelectedAccount
} from "../../state";
import { callRead, scoreTone } from "../lib/adapters";

/**
 * AccountBar — the live-call console header (canon §4.9). Pick the one
 * real account (no account means no call), name the human, and read the
 * live call score + the actual correction. The rep dials with a named
 * strain, never generic market language.
 */
export function AccountBar(): JSX.Element {
    const options = accountOptions.value;
    const selected = selectedAccountName.value ?? "";
    const d = draft.value;
    const read = callRead();

    const accountSelectOptions = [
        { value: "", label: t("Pick the account…") },
        ...options.map((a) => ({
            value: a.name,
            label: a.heat ? `${a.name} · ${a.heat}` : a.name
        }))
    ];

    return (
        <div class="ccd-bar">
            <div class="ccd-bar__inputs">
                <FormField label={t("Account")}>
                    <Select
                        value={selected}
                        onChange={(name) => setSelectedAccount(name || null)}
                        options={accountSelectOptions}
                    />
                </FormField>
                <FormField label={t("Contact")}>
                    <TextInput
                        value={d.contactName}
                        onInput={(contactName) => patchDraft({ contactName })}
                        placeholder={t("Who you're calling", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Title")}>
                    <TextInput
                        value={d.contactTitle}
                        onInput={(contactTitle) => patchDraft({ contactTitle })}
                    />
                </FormField>
            </div>
            <aside class="ccd-read" aria-label={t("Live call read")}>
                <div class="ccd-read__head">
                    <Kicker>{t("THE LIVE CALL")}</Kicker>
                    <span class="ccd-read__score">
                        {read.score}
                        <span class="ccd-read__cap">/100</span>
                    </span>
                </div>
                <StatusChip label={read.diagnosis} tone={scoreTone(read.score)} />
                <p class="ccd-read__correction">
                    <span class="ccd-read__correction-mark">{t("DO")}</span> {read.correction}
                </p>
            </aside>
        </div>
    );
}
