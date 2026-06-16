import type { AccentRole } from "@/components";
import type { OutdoorsEventTier } from "../../lib/types";
import type { DiscoveryRunStatus } from "../../lib/discovery";
import { allEvents } from "../../state";

/**
 * Pure adapters — map the Outdoors Events discovery surface onto the
 * design-system tones the DS surface composes. The discovery client,
 * the persistence, the relevance tiering, and the status lifecycle are
 * untouched. Outdoors Events is a Live Instrument (canon §4.22): the
 * system finds events, the operator marks them; relevance tier is the
 * organizing axis. Informational, not attributional.
 */

const TIER_TONE: Record<OutdoorsEventTier, AccentRole> = {
    direct: "amber", // the orange family — closest to your category
    adjacent: "blue",
    indirect: "green"
};
export function tierTone(tier: OutdoorsEventTier): AccentRole {
    return TIER_TONE[tier];
}

const RUN_STATUS_LABEL: Record<DiscoveryRunStatus, string> = {
    completed: "Last run",
    throttled: "Last run (budget-limited)",
    failed: "Last run failed",
    paused: "Paused — weekly budget reached",
    running: "Running…"
};
export function runStatusLabel(status: DiscoveryRunStatus): string {
    return RUN_STATUS_LABEL[status] ?? "Last run";
}

const RUN_STATUS_TONE: Record<DiscoveryRunStatus, AccentRole> = {
    completed: "green",
    throttled: "amber",
    failed: "red",
    paused: "amber",
    running: "blue"
};
export function runStatusTone(status: DiscoveryRunStatus): AccentRole {
    return RUN_STATUS_TONE[status] ?? "green";
}

export function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const then = Date.parse(iso);
    if (!Number.isFinite(then)) return "";
    const mins = Math.round((Date.now() - then) / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

/** Total events on file — drives the Wayfinder tail. */
export function totalEvents(): number {
    return allEvents.value.length;
}
