import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { allAccounts, searchQuery, setSearchQuery } from "../state";
import { AddAccountForm } from "./AddAccountForm";
import { EnrichAllButton } from "./EnrichAllButton";

/**
 * GridControls — Add + Enrich + search row above the grid.
 *
 * Signal Console audit (2026-05): on an empty workspace the search
 * box is meaningless (nothing to search). The Add Account form lives
 * inline in the EmptyState card instead, so this row hides entirely
 * until at least one account exists.
 *
 * On non-empty, the Add button moves to the LEFT of search — "add"
 * is the primary verb, search is the filter. The Enrich-all button
 * sits between Add and Filter as the bulk-action handle (Phase 4.5 /
 * Tier 1 / Signal Console Step 3 — Wave 5).
 */
export function GridControls(): JSX.Element | null {
    const total = allAccounts.value.length;
    if (total === 0) return null;

    return (
        <nav class="sc-grid-controls" aria-label={t("Account list controls")}>
            <AddAccountForm />
            <EnrichAllButton />
            <label class="sc-grid-controls__search">
                <span class="sc-grid-controls__search-label">{t("FILTER")}</span>
                <input
                    type="search"
                    placeholder={t("Search accounts by name, ticker, industry…", { class: "body" })}
                    value={searchQuery.value}
                    onInput={(e) =>
                        setSearchQuery(
                            (e.currentTarget as HTMLInputElement).value
                        )
                    }
                />
            </label>
        </nav>
    );
}
