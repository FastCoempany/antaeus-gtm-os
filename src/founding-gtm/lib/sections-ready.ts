import { loadSectionsInput, type LoadOptions } from "./cross-room";
import { authorAllSections, countReady } from "./sections";

/**
 * How many of the seven sales-handoff sections are ready, computed
 * LIVE from the workspace — the exact count the Founding GTM room
 * shows ("N of 7 sections ready").
 *
 * Other rooms (Dashboard status link, Readiness) used to read the
 * `gtmos_founding_gtm_health` snapshot instead. That snapshot is only
 * written after the Founding GTM room has been opened (and, before the
 * 2026-11 fix, not even then on a cold boot), so the Dashboard said
 * "0 / 7" while Founding GTM said "7 of 7" for the same workspace.
 * Every consumer now derives the number through this one function.
 */
export function computeHandoffSectionsReady(options: LoadOptions = {}): {
    readonly ready: number;
    readonly partial: number;
} {
    const counts = countReady(authorAllSections(loadSectionsInput(options)));
    return { ready: counts.ready, partial: counts.partial };
}
