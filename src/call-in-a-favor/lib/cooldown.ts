import type { Advisor, CooldownStatus, Deployment } from "./types";
import { findTier } from "./tiers";

/**
 * Phase 4 / Room 10 Wave 2 — cooldown engine.
 *
 * Faithful TypeScript port of the legacy `getCooldownStatus(advisor)`
 * (`js/advisor-deploy-backchannel.js` lines 169-177). An advisor is
 * "Available" when there are no prior deployments OR the most-recent
 * deployment is older than the tier's cooldownDays. Otherwise it's
 * "Cooling Xd" with X = ceil(cooldownDays - daysSinceLatest).
 *
 * Pure: takes the deployments list explicitly so tests can probe edge
 * cases without touching state.
 */

const MS_PER_DAY = 86400000;

export function daysSince(iso: string, now: number = Date.now()): number {
    if (!iso) return 999;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return 999;
    return Math.max(0, Math.floor((now - t) / MS_PER_DAY));
}

/**
 * Compute the cooldown status for an advisor given the full deployment
 * list. Filters to that advisor's deployments, sorts by createdAt desc,
 * and applies the tier's cooldownDays window against the latest entry.
 */
export function getCooldownStatus(
    advisor: Advisor,
    deployments: ReadonlyArray<Deployment>,
    now: number = Date.now()
): CooldownStatus {
    const tier = findTier(advisor.tier);
    const mine = deployments.filter((d) => d.advisorId === advisor.id);
    if (mine.length === 0) {
        return { ok: true, label: "Available", daysRemaining: 0 };
    }
    const sorted = mine.slice().sort((a, b) => {
        const ta = Date.parse(a.createdAt) || 0;
        const tb = Date.parse(b.createdAt) || 0;
        return tb - ta;
    });
    const days = daysSince(sorted[0]!.createdAt, now);
    if (days < tier.cooldownDays) {
        const remaining = Math.ceil(tier.cooldownDays - days);
        return {
            ok: false,
            label: `Cooling ${remaining}d`,
            daysRemaining: remaining
        };
    }
    return { ok: true, label: "Available", daysRemaining: 0 };
}
