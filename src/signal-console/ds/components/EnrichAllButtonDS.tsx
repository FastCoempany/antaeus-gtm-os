import type { JSX } from "preact";
import { Button } from "@/components";
import { t } from "@/lib/voice/t";
import {
    cancelEnrichAll,
    enrichmentProgress,
    isEnrichmentRunning,
    runEnrichAll
} from "../../lib/enrich-actions";
import { allAccounts } from "../../state";

/**
 * EnrichAllButtonDS — bulk-enrich every account on the radar (canon
 * §4.7), library-composed. Replaces the legacy sc-enrich-btn so it
 * matches the DS controls. The enrichment engine signals are unchanged;
 * this is presentation. Idle fires runEnrichAll; running shows progress
 * + cancels.
 */
export function EnrichAllButtonDS(): JSX.Element | null {
    const total = allAccounts.value.length;
    if (total === 0) return null;

    const running = isEnrichmentRunning.value;
    const progress = enrichmentProgress.value;

    if (running) {
        const done = progress.done + progress.error + progress.skipped;
        return (
            <Button variant="secondary" onClick={() => cancelEnrichAll()}>
                {`${t("Cancel")} · ${done} ${t("of")} ${progress.total}`}
            </Button>
        );
    }

    const hasPrior = progress.total > 0;
    return (
        <Button variant="secondary" onClick={() => void runEnrichAll()}>
            {hasPrior
                ? `${t("Enrich all")} · ${progress.done}/${progress.total} ${t("last run")}`
                : `${t("Enrich all")} · ${total}`}
        </Button>
    );
}
