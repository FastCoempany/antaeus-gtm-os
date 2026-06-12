import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { briefingLead, briefingLeadLoaded } from "../state";

/**
 * StaleRunBanner — surfaces when the most recent briefing run is
 * older than 8 days (one cron cycle + buffer). Reads run_started_at
 * from the briefingLead summary signal.
 *
 * Per canon Part II §6 — sparse / stale states must feel useful,
 * directional, intelligent. A silent "last week's reads, even though
 * it's been three weeks" surface degrades trust quickly. This banner
 * names the stale-ness explicitly so the operator knows the system
 * didn't run, not that nothing happened.
 *
 * Hidden when the lead hasn't loaded, when no run exists, or when the
 * latest run is within the normal cadence window.
 */

const STALE_THRESHOLD_MS = 8 * 24 * 60 * 60 * 1000;

function ageInDays(startedAtIso: string, now: Date = new Date()): number {
    const startedAt = Date.parse(startedAtIso);
    if (!Number.isFinite(startedAt)) return 0;
    const ms = now.getTime() - startedAt;
    return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function isStaleRun(
    runStartedAtIso: string | null | undefined,
    now: Date = new Date()
): boolean {
    if (!runStartedAtIso) return false;
    const startedAt = Date.parse(runStartedAtIso);
    if (!Number.isFinite(startedAt)) return false;
    return now.getTime() - startedAt > STALE_THRESHOLD_MS;
}

export function StaleRunBanner(): JSX.Element | null {
    if (!briefingLeadLoaded.value) return null;
    const lead = briefingLead.value;
    if (!lead) return null;
    if (!isStaleRun(lead.run_started_at)) return null;
    const days = ageInDays(lead.run_started_at);
    return (
        <aside
            class="bf-stale-banner"
            role="status"
            aria-label={t("This briefing is stale")}
        >
            <p class="bf-stale-banner__kicker">{t("HEADS UP · STALE READ")}</p>
            <p class="bf-stale-banner__body">
                The most recent briefing ran {days} days ago. The pipeline
                is meant to fire weekly. If that wasn't intentional, the
                heartbeat or the briefing cron may have stalled —
                check Supabase logs.
            </p>
        </aside>
    );
}
