import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    cancelEnrichAll,
    enrichmentProgress,
    isEnrichmentRunning,
    runEnrichAll
} from "../lib/enrich-actions";
import { allAccounts } from "../state";

/**
 * EnrichAllButton — bulk enrich every account on the radar.
 *
 * Phase 4.5 / Signal Console Step 3 / Wave 5. The button sits in
 * GridControls between Add and Filter. Three visible states:
 *
 *   - idle: "Enrich all (N accounts)" — primary action, fires runEnrichAll
 *   - running: "Cancel · N of M" — secondary action, fires cancelEnrichAll
 *   - finished: same as idle, with a transient summary chip ("Enriched
 *     N of M") for 8s, then back to idle
 *
 * Server response time is 30-90s per account; the operator MUST see
 * progress. Total run for 10 accounts can take ~10 minutes; the
 * Cancel state must be reachable at all times.
 *
 * Disabled when no accounts exist (the GridControls hides altogether
 * in that case, so this is belt-and-suspenders).
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Site 7"
 */
export function EnrichAllButton(): JSX.Element | null {
    const total = allAccounts.value.length;
    if (total === 0) return null;

    const running = isEnrichmentRunning.value;
    const progress = enrichmentProgress.value;

    if (running) {
        const done = progress.done + progress.error + progress.skipped;
        return (
            <button
                type="button"
                class="sc-enrich-btn sc-enrich-btn--cancel"
                onClick={() => cancelEnrichAll()}
            >
                Cancel · {done} of {progress.total}
            </button>
        );
    }

    // Idle. If a previous run left status entries behind, show the
    // last-run summary inline.
    const hasPrior = progress.total > 0;
    return (
        <button
            type="button"
            class="sc-enrich-btn"
            onClick={() => {
                void runEnrichAll();
            }}
            title={t("Run the enrichment service against every account on the radar.", { class: "body" })}
        >
            {hasPrior
                ? `Enrich all (${progress.done} of ${progress.total} last run)`
                : `Enrich all (${total})`}
        </button>
    );
}
