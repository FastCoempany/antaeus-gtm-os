import type { JSX } from "preact";
import { searchQuery, setSearchQuery } from "../state";
import { AddAccountForm } from "./AddAccountForm";

/**
 * GridControls — search input + manual-add trigger above the grid.
 *
 * Wave 1 shipped search only. The cloud-sync gap closer (A3) added
 * the AddAccountForm so the new room isn't read-only — manual adds
 * persist through cloud-persistence and sync cross-device.
 */
export function GridControls(): JSX.Element {
    return (
        <nav class="sc-grid-controls" aria-label="Account list controls">
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
            <AddAccountForm />
        </nav>
    );
}
