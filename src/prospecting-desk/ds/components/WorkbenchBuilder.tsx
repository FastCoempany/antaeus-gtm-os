import type { JSX } from "preact";
import { Button, FormField, Kicker, Select, TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import {
    patchProspectDraft,
    patchQueryCardDraft,
    prospectDraft,
    queryCardDraft,
    queryCards,
    saveProspectFromDraft,
    saveQueryCardFromDraft
} from "../../state";
import {
    PLATFORM_LABELS,
    PLATFORMS,
    type LeverageKey,
    type Platform
} from "../../lib/types";
import { saveProspect, saveQueryCard } from "../../lib/cloud-persistence";
import { EDGE_LABELS } from "../lib/adapters";

/**
 * WorkbenchBuilder — the subordinate controls of the Decision Bench. The
 * two builders that feed the pipeline: the query studio (reproducible,
 * platform-specific searches) and the prospect composer (capture a name
 * the query surfaced). The forms support the pipeline; they don't
 * dominate it (canon §4.6). State lives in the two draft signals.
 */

const PLATFORM_OPTIONS = PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }));
const LEVERAGE_KEYS: ReadonlyArray<LeverageKey> = [
    "network-connection",
    "existing-proof-point",
    "market-signal",
    "geographic-advantage",
    "cold"
];
const LEVERAGE_OPTIONS = LEVERAGE_KEYS.map((k) => ({ value: k, label: EDGE_LABELS[k] }));

function onSaveQueryCard(): void {
    const c = saveQueryCardFromDraft();
    if (c) void saveQueryCard(c);
}
function onSaveProspect(): void {
    const p = saveProspectFromDraft();
    if (p) void saveProspect(p);
}

export function WorkbenchBuilder(): JSX.Element {
    const qd = queryCardDraft.value;
    const pd = prospectDraft.value;
    const cards = queryCards.value;
    const queryOptions = [
        { value: "", label: t("From which query…") },
        ...cards.map((c) => ({ value: c.id, label: `${PLATFORM_LABELS[c.platform]}: ${c.query}` }))
    ];

    return (
        <div class="swd-builder">
            {/* Query studio — reproducible searches. */}
            <section class="swd-form">
                <Kicker>{t("BUILD A QUERY")}</Kicker>
                <FormField label={t("Platform")}>
                    <Select
                        value={qd.platform}
                        onChange={(platform) => patchQueryCardDraft({ platform: platform as Platform })}
                        options={PLATFORM_OPTIONS}
                    />
                </FormField>
                <FormField label={t("Query")}>
                    <TextInput
                        value={qd.query}
                        onInput={(query) => patchQueryCardDraft({ query })}
                        placeholder={t("The search string, verbatim", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("What it surfaces")}>
                    <TextInput
                        value={qd.intent}
                        onInput={(intent) => patchQueryCardDraft({ intent })}
                        placeholder={t("What you're hoping to find", { class: "body" })}
                    />
                </FormField>
                <Button
                    variant="accent"
                    onClick={onSaveQueryCard}
                    disabled={!qd.query.trim()}
                    disabledWhy={!qd.query.trim() ? t("Write the query first.", { class: "body" }) : undefined}
                >
                    {t("Save the query")}
                </Button>
                {cards.length > 0 ? (
                    <ul class="swd-cards">
                        {cards.slice(0, 5).map((c) => (
                            <li key={c.id} class="swd-cards__row">
                                <span class="swd-cards__platform">{PLATFORM_LABELS[c.platform]}</span>
                                <span class="swd-cards__query">{c.query}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>

            {/* Prospect composer — capture a name. */}
            <section class="swd-form">
                <Kicker>{t("CAPTURE A PROSPECT")}</Kicker>
                <FormField label={t("Account")}>
                    <TextInput
                        value={pd.accountName}
                        onInput={(accountName) => patchProspectDraft({ accountName })}
                        placeholder={t("Company name", { class: "body" })}
                    />
                </FormField>
                <div class="swd-form__grid">
                    <FormField label={t("Contact")}>
                        <TextInput value={pd.contactName} onInput={(contactName) => patchProspectDraft({ contactName })} />
                    </FormField>
                    <FormField label={t("Title")}>
                        <TextInput value={pd.contactTitle} onInput={(contactTitle) => patchProspectDraft({ contactTitle })} />
                    </FormField>
                </div>
                <FormField label={t("Edge")}>
                    <Select
                        value={pd.leverage}
                        onChange={(leverage) => patchProspectDraft({ leverage: leverage as LeverageKey })}
                        options={LEVERAGE_OPTIONS}
                    />
                </FormField>
                <FormField label={t("Entry point")}>
                    <TextInput
                        value={pd.entryPoint}
                        onInput={(entryPoint) => patchProspectDraft({ entryPoint })}
                        placeholder={t("How you get in", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("From which query")}>
                    <Select
                        value={pd.sourceQueryId}
                        onChange={(sourceQueryId) => patchProspectDraft({ sourceQueryId })}
                        options={queryOptions}
                    />
                </FormField>
                <Button
                    variant="accent"
                    onClick={onSaveProspect}
                    disabled={!pd.accountName.trim()}
                    disabledWhy={!pd.accountName.trim() ? t("Name the account first.", { class: "body" }) : undefined}
                >
                    {t("Capture the prospect")}
                </Button>
            </section>
        </div>
    );
}
