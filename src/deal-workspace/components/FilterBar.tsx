import type { JSX } from "preact";
import { dealFilter, setDealFilter, type DealFilter } from "../state";

/**
 * FilterBar — Wave 5.
 *
 * Four chips that scope the intervention rail:
 *   - all          → no filter
 *   - at-risk      → critical + at-risk lanes
 *   - stalled      → cause text mentions stall / inactivity
 *   - this-quarter → close date in current quarter
 *
 * The active filter is held in the dealFilter signal; setDealFilter()
 * mutates it. The intervention rail re-renders reactively.
 */

interface ChipDef {
    readonly key: DealFilter;
    readonly label: string;
}

const CHIPS: ReadonlyArray<ChipDef> = [
    { key: "all", label: "All" },
    { key: "at-risk", label: "At risk" },
    { key: "stalled", label: "Stalled" },
    { key: "this-quarter", label: "This quarter" }
];

export function FilterBar(): JSX.Element {
    const active = dealFilter.value;
    return (
        <nav class="dw-filter-bar" aria-label="Deal filter">
            <span class="dw-filter-bar__label">Filter</span>
            <ul class="dw-filter-bar__list">
                {CHIPS.map((chip) => {
                    const isActive = chip.key === active;
                    return (
                        <li key={chip.key}>
                            <button
                                type="button"
                                class={`dw-filter-bar__chip${
                                    isActive ? " is-active" : ""
                                }`}
                                aria-pressed={isActive}
                                onClick={() => setDealFilter(chip.key)}
                            >
                                {chip.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
