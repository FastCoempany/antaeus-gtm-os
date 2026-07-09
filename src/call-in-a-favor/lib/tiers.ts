import type { Tier, TierId } from "./types";

/**
 * Phase 4 / Room 10 Wave 2 — tier table.
 *
 * Faithful TypeScript port of the legacy `TIERS` map (`js/advisor-deploy-
 * backchannel.js` lines 4-9). Four tiers with cooldown windows that
 * govern how often the same advisor can be deployed:
 *
 *   t1 — Board / Investor       — 90d cooldown
 *   t2 — Strategic Advisor      — 30d cooldown
 *   t3 — Angel / Portfolio      — 14d cooldown
 *   t4 — Customer Reference     — 30d cooldown
 *
 * Default tier when none specified is t2 (Strategic Advisor).
 */

export const TIERS: Readonly<Record<TierId, Tier>> = {
    t1: { id: "t1", label: "Board / Investor", cooldownDays: 90 },
    t2: { id: "t2", label: "Strategic Advisor", cooldownDays: 30 },
    t3: { id: "t3", label: "Angel / Portfolio", cooldownDays: 14 },
    t4: { id: "t4", label: "Customer Reference", cooldownDays: 30 }
};

/** Look up a tier by id, falling back to t2 (Strategic Advisor). */
export function findTier(id: TierId | string | null | undefined): Tier {
    if (id && (id === "t1" || id === "t2" || id === "t3" || id === "t4")) {
        return TIERS[id];
    }
    return TIERS.t2;
}
