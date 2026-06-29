import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { seedingStep } from "../state";
import { evidenceFor } from "../lib/evidence";

/**
 * EvidenceMargin (ADR-019) — the recessive "why we ask" rail down the
 * side of the seeding flow. Blue (the system-intelligence role, canon
 * §3) so it reads as the app thinking, never as the move to take. One
 * glanceable note per step that opens to a real source. Present in the
 * operator's peripheral the whole way through.
 */
export function EvidenceMargin(): JSX.Element {
    const ev = evidenceFor(seedingStep.value);
    return (
        <aside class="sd-margin" aria-label={t("Why we ask")}>
            <div class="sd-margin__k">{t("Why we ask")}</div>
            <p class="sd-margin__note">{ev.note}</p>
            {ev.source ? (
                <div class="sd-margin__src">
                    <div class="sd-margin__src-l">{t("The evidence")}</div>
                    <a
                        class="sd-margin__src-a"
                        href={ev.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {ev.source.label} ↗
                    </a>
                </div>
            ) : null}
        </aside>
    );
}
