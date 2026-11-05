import { getBand, benchmarkFor } from "@/quota-workback/lib/engine";
import { loadInputs } from "@/quota-workback/lib/persistence";
import type { SectionId } from "./types";

/**
 * Priors — what the kit says before the operator's own record exists.
 *
 * "Starts smart, gets personal" (the 2026-07-09 capture + priors plan):
 * an empty section no longer sits bare for a quarter. It renders the
 * authored pattern for teams selling deals this size — explicitly
 * labeled as not-your-record — and the operator's own pattern takes
 * the page over as real deals land (the existing authored path wins
 * the moment a section has anything real to say).
 *
 * Two rules keep this honest:
 * - Every number is the SAME benchmark the Quota room uses
 *   (benchmarkFor — one source of truth, no second set of claims).
 * - The face always carries the source note; the prior is never
 *   dressed as the operator's own read.
 */

export interface SectionPrior {
    /** 2–3 short paragraphs of plain, band-aware prose. */
    readonly body: ReadonlyArray<string>;
    /** The source line the face renders in the blue system role. */
    readonly note: string;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/**
 * Typical deal size, read through the Quota room's OWN loader — so the
 * priors resolve the same ACV the plan does, including the
 * gtmos_outbound_seed fallback and formatted values ("75,000"). 50k
 * (mid-market) when nothing is set anywhere.
 */
export function readAcv(s?: StorageLike | null): number {
    try {
        const acv = loadInputs(s).acv;
        return Number.isFinite(acv) && acv > 0 ? acv : 50_000;
    } catch {
        return 50_000;
    }
}

function money(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
    return `$${Math.round(v)}`;
}

/**
 * The authored pattern for one section, sized to the workspace's deal
 * band. Returns null only for unknown ids.
 */
export function priorForSection(
    id: SectionId,
    acv: number
): SectionPrior | null {
    const band = getBand(acv);
    const b = benchmarkFor(acv);
    const size = money(Math.max(acv, 1000));
    const bandName =
        band === "small"
            ? "SMB"
            : band === "mid"
              ? "mid-market"
              : band === "enterprise"
                ? "enterprise"
                : "strategic";
    const note = `Planning guidance for ${size} deals in the ${bandName} ACV band. Numbers use the configured Quota Workback benchmarks, not measured results from your workspace. Recorded outcomes from your own deals and calls replace this guidance as they become available.`;

    switch (id) {
        case "who_hits":
            return {
                note,
                body: [
                    `Define the target company size, buyer role, business problem, and observable reasons for outreach. Record disqualification criteria as well. Compare those assumptions with closed-deal outcomes before treating a customer profile as a reliable predictor.`,
                    `The configured planning defaults for this deal-size band are a ${b.winRate}% win rate (${b.winRange} range) and a ${b.cycle}-day sales cycle. Use these as initial assumptions, then replace them with your measured conversion and timing data.`
                ]
            };
        case "rails_that_worked":
            return {
                note,
                body: [
                    `Start with an account-specific message that names an observed change and asks a relevant business question. Record the channel, message, and outcome so another seller can compare approaches.`,
                    `The configured planning default is ${b.t2m} first meetings per 100 outreach attempts. That is an assumption for activity planning, not a measured result or a promise about your next campaign.`
                ]
            };
        case "questions_that_earned":
            return {
                note,
                body: [
                    `Prepare questions about the current workflow, the business impact of the problem, and the people responsible for a purchase decision. Confirm what the buyer has actually said before recording an assessment.`,
                    `Before ending the call, agree on the next action, owner, and date. Record the questions used and the call outcome; this section can then compare which topics appeared on calls that progressed.`
                ]
            };
        case "won_and_leaked":
            return {
                note,
                body: [
                    `The configured meeting-to-opportunity assumption is ${b.m2o}%. Track actual stage changes, next steps, and approval dependencies to identify where your opportunities progress or stop.`,
                    `Quota Workback uses ${b.coverage}× pipeline coverage as the starting requirement for this band. Coverage alone does not establish deal quality or predict attainment; review qualification and buyer commitments alongside the total.`
                ]
            };
        case "losses_paid_for":
            return {
                note,
                body: [
                    `Record the buyer's stated reason when a deal is lost. Separate that reason from your interpretation and from missing information. Review timing, approval, alternatives, and stakeholder involvement without assuming any one factor caused the outcome.`,
                    `Use Future Autopsy to inspect current risk conditions and log corrective actions. Compare those reviews with later outcomes before turning a recurring condition into a rule for another seller.`
                ]
            };
        case "why_we_win":
            return {
                note,
                body: [
                    `For each closed-won deal, record the customer profile, buyer role, purchase context, and the buyer's stated reasons for choosing you. Include the evidence they used to evaluate the decision.`,
                    `As wins accumulate, compare recurring traits with losses and open deals. A recurring trait is a hypothesis to test; a small sample cannot establish that a particular message, feature, or price caused the win.`
                ]
            };
        case "day_one_rhythm":
            return {
                note,
                body: [
                    `Start each day by reviewing the Dashboard's recommended action and supporting evidence. Schedule focused outreach and discovery preparation around account context and agreed buyer dates.`,
                    `At the end of the week, record outcomes, update next steps, and compare activity with the quota plan. Set your target and conversion assumptions in Quota Workback to calculate the activity requirement.`
                ]
            };
        default:
            return null;
    }
}

/**
 * For the share snapshot: an empty section carries its prior with the
 * source note as the LEADING paragraph, so the recipient reads it
 * self-labeled ("This is how it usually goes for teams selling…") and
 * never mistakes the pattern for this workspace's own results. Ready
 * and partial sections pass through untouched.
 */
export function withPriorsForShare<
    T extends {
        readonly id: SectionId;
        readonly status: string;
        readonly body: ReadonlyArray<string>;
    }
>(sections: ReadonlyArray<T>, acv: number): ReadonlyArray<T> {
    return sections.map((section) => {
        if (section.status !== "empty" || section.body.length > 0) {
            return section;
        }
        const prior = priorForSection(section.id, acv);
        if (!prior) return section;
        return { ...section, body: [prior.note, ...prior.body] };
    });
}
