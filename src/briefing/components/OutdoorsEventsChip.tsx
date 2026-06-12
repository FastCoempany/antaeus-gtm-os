import type { JSX } from "preact";
import { t } from "@/lib/voice/t";

/**
 * OutdoorsEventsChip — a small navigation chip on the Briefing's World
 * view that routes to the standalone Outdoors Events room (ADR-015 §5).
 *
 * Navigation only — no data flow from Outdoors Events into the
 * Briefing, no preview, no count badge. Per ADR-015 first-ship scope,
 * the chip is the lightest possible cross-reference: the operator is
 * reading what's moving in their market; the chip nudges them toward
 * the offline gatherings where those same players show up.
 */
export function OutdoorsEventsChip(): JSX.Element {
    return (
        <a class="bf-events-chip" href="/outdoors-events/">
            <span class="bf-events-chip__kicker">{t("ALSO OUT THERE")}</span>
            <span class="bf-events-chip__label">
                Outdoors Events — gatherings the system found for your category
            </span>
            <span class="bf-events-chip__arrow" aria-hidden="true">
                →
            </span>
        </a>
    );
}
