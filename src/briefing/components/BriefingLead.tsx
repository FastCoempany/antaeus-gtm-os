import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { briefingLead, briefingLeadLoaded } from "../state";

/**
 * BriefingLead (B.9a) — the "Read This Week" lead at the top of the
 * briefing.
 *
 * Renders the one-or-two-sentence lead the compose stage produced
 * after synthesis + contrarian. Quoted-style typography — magazine
 * cover energy, not Pattern-card energy. Sits between the static
 * Topbar (room identity) and the PatternList (the per-run reads).
 *
 * Renders nothing when:
 *   - the lead hasn't loaded yet
 *   - the latest run pre-dates B.9a (no compose pass on file)
 *   - the latest run refused (compose decided nothing rose to the bar)
 *
 * Silent failure modes — the briefing surface remains readable, just
 * without the headline this week.
 */
export function BriefingLead(): JSX.Element | null {
    if (!briefingLeadLoaded.value) return null;
    const summary = briefingLead.value;
    if (!summary || !summary.lead) return null;

    return (
        <section class="bf-lead" aria-label={t("The read this week")}>
            <p class="bf-lead__kicker">{t("The read this week")}</p>
            <p class="bf-lead__line">{summary.lead}</p>
        </section>
    );
}
