import type { JSX } from "preact";
import { searchQuery, setSearchQuery } from "../state";

/**
 * GridControls — search input + sort affordance row above the grid.
 *
 * Wave 1 ships search only. Wave 5 will add the workspace-health
 * panel and enrich-all CTA.
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
        </nav>
    );
}
