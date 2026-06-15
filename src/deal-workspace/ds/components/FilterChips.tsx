import type { JSX } from "preact";
import { SegmentedControl } from "@/components";
import { t } from "@/lib/voice/t";
import { allDeals, dealFilter, setDealFilter, type DealFilter } from "../../state";

/**
 * FilterChips — the in-room lens over the recovery board (canon §4.13).
 * A SegmentedControl, not a door between rooms (spec 03): All / At risk /
 * Stalled / This quarter. Hidden on an empty board.
 */
const OPTIONS: ReadonlyArray<{ readonly key: DealFilter; readonly label: string }> = [
    { key: "all", label: t("All") },
    { key: "at-risk", label: t("At risk") },
    { key: "stalled", label: t("Stalled") },
    { key: "this-quarter", label: t("This quarter") }
];

export function FilterChips(): JSX.Element | null {
    if (allDeals.value.length === 0) return null;
    return (
        <SegmentedControl<DealFilter>
            label={t("Filter the board")}
            active={dealFilter.value}
            onChange={setDealFilter}
            options={OPTIONS}
        />
    );
}
