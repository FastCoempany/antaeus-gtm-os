import type { JSX } from "preact";
import { TextInput } from "@/components";
import { t } from "@/lib/voice/t";
import { allAccounts, searchQuery, setSearchQuery } from "../../state";
import { AddAccountFormDS } from "./AddAccountFormDS";
import { EnrichAllButtonDS } from "./EnrichAllButtonDS";

/**
 * GridControlsDS — Add + Enrich + filter row above the radar. Hidden on
 * an empty workspace (the empty state embeds the add form as the
 * dominant move). Add is the primary verb, then the bulk enrich handle,
 * then the filter. The add form + enrich button are reused from the
 * legacy room (they own the cloud writes); the filter is a library
 * TextInput bound to the searchQuery signal.
 */
export function GridControlsDS(): JSX.Element | null {
    const total = allAccounts.value.length;
    if (total === 0) return null;

    return (
        <nav class="scd-controls" aria-label={t("Account list controls")}>
            <AddAccountFormDS />
            <EnrichAllButtonDS />
            <div class="scd-controls__filter">
                <span class="ds-kicker">{t("FILTER")}</span>
                <TextInput
                    type="search"
                    value={searchQuery.value}
                    onInput={setSearchQuery}
                    placeholder={t("Search by name, ticker, industry…", {
                        class: "body"
                    })}
                />
            </div>
        </nav>
    );
}
