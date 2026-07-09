import type { Advisor, MomentId } from "./types";

/**
 * Program 6 / PR 15 — Deploy Cost engine.
 *
 * Per the picked-winner Variant 01 / Backchannel Desk wireframe
 * (deliverables/prototypes/wireframes/antaeus-advisor-deploy-radical-
 * triptych-v2-2026-04-20.html line 706+), the rolodex includes an
 * explicit "Do not use" anti-tab naming an advisor that's too
 * expensive for the current ask ("Board member is too expensive for
 * this ask.").
 *
 * Canon §4.16: "Trust is spent, not spent." Deploying a T1 advisor
 * on a low-stakes intro burns capital that should be saved for the
 * higher-stakes board signal or post-proof stall.
 *
 *   - "too-expensive"  : tier too high for ask weight (T1 on intro
 *                        or T1 on reference — burn capital)
 *   - "underpowered"   : tier too low for ask weight (T4 customer
 *                        reference on board_decision — not enough
 *                        gravity)
 *   - null             : the advisor is correctly matched to the
 *                        moment
 *
 * Pure: takes the advisor + moment id explicitly so tests can
 * probe every branch.
 */

export type DeployCost = "too-expensive" | "underpowered";

/** Low-stakes moments where burning T1 board capital is wasteful. */
const LOW_STAKES_MOMENTS: ReadonlySet<MomentId> = new Set<MomentId>([
    "intro",
    "reference",
    "renewal"
]);

/** High-stakes moments where T4 customer reference is underpowered. */
const HIGH_STAKES_MOMENTS: ReadonlySet<MomentId> = new Set<MomentId>([
    "board_decision",
    "eb_bridge",
    "budget_kill"
]);

export function deployCost(
    advisor: Advisor,
    momentId: MomentId
): DeployCost | null {
    if (advisor.tier === "t1" && LOW_STAKES_MOMENTS.has(momentId)) {
        return "too-expensive";
    }
    if (advisor.tier === "t4" && HIGH_STAKES_MOMENTS.has(momentId)) {
        return "underpowered";
    }
    return null;
}

/**
 * Returns the "Do not use" candidate for the current moment, or
 * null if no advisor in the registry would be a too-expensive or
 * underpowered match.
 *
 * Preference: too-expensive (T1 burning) first since trust is the
 * primary spend. Falls through to underpowered (T4 underpowered)
 * if no T1 over-spend candidate exists.
 *
 * Skips the currently selected advisor — if the operator
 * deliberately picked the costly carrier, the anti-tab would be
 * noisy. Surfaces only an unused advisor as the warning.
 */
export interface DoNotUseCandidate {
    readonly advisor: Advisor;
    readonly cost: DeployCost;
    readonly reason: string;
}

const REASONS: Readonly<Record<DeployCost, string>> = {
    "too-expensive":
        "Too expensive for this ask. Save board capital for a higher-stakes signal.",
    underpowered:
        "Too low-leverage for this ask. The deal needs more gravity than a customer reference."
};

export function findDoNotUseCandidate(
    advisors: ReadonlyArray<Advisor>,
    momentId: MomentId,
    activeAdvisorId: string | null
): DoNotUseCandidate | null {
    let underpoweredHit: DoNotUseCandidate | null = null;
    for (const a of advisors) {
        if (a.id === activeAdvisorId) continue;
        const c = deployCost(a, momentId);
        if (!c) continue;
        if (c === "too-expensive") {
            return { advisor: a, cost: c, reason: REASONS[c] };
        }
        if (c === "underpowered" && underpoweredHit === null) {
            underpoweredHit = { advisor: a, cost: c, reason: REASONS[c] };
        }
    }
    return underpoweredHit;
}
