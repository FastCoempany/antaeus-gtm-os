import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { seedingStep } from "../state";
import { evidenceFor } from "../lib/evidence";

/**
 * EvidenceMargin (ADR-019) — the recessive "why we ask" rail down the
 * side of the seeding flow. Blue (the information role, canon §3). One
 * note per step explaining how that step's inputs are used. A source link
 * renders only when a note carries a real source.
 */
export function EvidenceMargin(): JSX.Element {
    const ev = evidenceFor(seedingStep.value);
    return (
        <aside class="sd-margin" aria-label={t("Why we ask this")}>
            <div class="sd-margin__k">{t("Why we ask this")}</div>
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
