import type { AccentRole } from "@/components";
import type {
    DeploymentOutcome,
    SpendBand
} from "../../lib/types";
import type { ImpactTone } from "../../lib/impact";
import { computeImpact } from "../../lib/impact";
import { computeSpendRead } from "../../lib/score";
import { findMoment } from "../../lib/moments";
import {
    activeDeals,
    advisors,
    deployments,
    desk,
    selectedAdvisor,
    selectedDeal
} from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Pure adapters — map the Advisor Deploy desk engine onto the design-
 * system tones the DS surface composes. The spend-read score, the
 * recommend logic, the ask builder, the cooldown, and the impact
 * readings are untouched. These translate band → tone, compute the live
 * spend read + impact off the signals, and route the prepared ask back
 * into the Deal Workspace so the deal can carry its effect.
 */

const SPEND_TONE: Record<SpendBand, AccentRole> = {
    ask_ready: "green",
    narrow_first: "amber",
    not_ready: "red"
};
export function spendTone(band: SpendBand): AccentRole {
    return SPEND_TONE[band];
}

const OUTCOME_TONE: Record<DeploymentOutcome, AccentRole | undefined> = {
    successful: "green",
    engaged: "green",
    pending: "blue",
    hold: "amber",
    reroute: "amber",
    no_response: "amber",
    declined: "red"
};
export function outcomeTone(outcome: DeploymentOutcome): AccentRole | undefined {
    return OUTCOME_TONE[outcome];
}

const IMPACT_TONE: Record<ImpactTone, AccentRole> = {
    red: "red",
    orange: "amber",
    blue: "blue",
    green: "green"
};
export function impactTone(tone: ImpactTone): AccentRole {
    return IMPACT_TONE[tone];
}

/** The live spend read, off the current desk routing. */
export function spendRead(): ReturnType<typeof computeSpendRead> {
    return computeSpendRead({
        deal: selectedDeal.value,
        advisor: selectedAdvisor.value,
        moment: findMoment(desk.value.momentId),
        advisors: advisors.value
    });
}

/** The live impact readings, off the registry + the active deals. */
export function impactReadings(): ReturnType<typeof computeImpact> {
    return computeImpact({
        advisors: advisors.value,
        deployments: deployments.value,
        activeDeals: activeDeals.value
    });
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the desk prepares one backchannel ask;
 * once a deal is on the desk, the one next move is to carry its effect
 * back to the Deal Workspace where the pressure lives. Absent until a
 * deal is selected.
 */
export function toPulling(): PullingData | undefined {
    const deal = selectedDeal.value;
    if (!deal) return undefined;
    const spend = spendRead();
    const moment = findMoment(desk.value.momentId);
    return {
        verb: "Track the deal",
        object: deal.accountName,
        href: hrefToDealWorkspace(deal.id, deal.accountName),
        reasons: [spend.bandCopy, `Ask moment: ${moment.name}`]
            .filter((s) => s && s.length > 0)
            .slice(0, 4)
    };
}
