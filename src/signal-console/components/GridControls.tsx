import type { JSX } from "preact";
import { allAccounts, searchQuery, setSearchQuery } from "../state";
import { AddAccountForm } from "./AddAccountForm";

/**
 * GridControls — Add + search row above the grid.
 *
 * Signal Console audit (2026-05): on an empty workspace the search
 * box is meaningless (nothing to search). The Add Account form lives
 * inline in the EmptyState card instead, so this row hides entirely
 * until at least one account exists.
 *
 * On non-empty, the Add button moves to the LEFT of search — "add"
 * is the primary verb, search is the filter.
 */
export function GridControls(): JSX.Element | null {
    const total = allAccounts.value.length;
    if (total === 0) return null;

    return (
        <nav class="sc-grid-controls" aria-label="Account list controls">
            <AddAccountForm />
            <label class="sc-grid-controls__search">
                <span class="sc-grid-controls__search-label">FILTER</span>
                <input
                    type="search"
                    placeholder="Search accounts by name, ticker, industry…"
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
