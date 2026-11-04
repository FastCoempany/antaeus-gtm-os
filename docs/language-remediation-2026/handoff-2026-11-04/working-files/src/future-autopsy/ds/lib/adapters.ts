import type { AccentRole } from "@/components";
import type { AutopsyDoc, Vitals } from "../../lib/types";
import { buildActionPlan } from "../../lib/action-plan";

/**
 * Pure adapters — map the Future Autopsy engine (vitals + the generated
 * autopsy doc + the action-plan router) onto the design-system
 * components the DS surface composes. The engine is untouched; these
 * translate it into card tone, the Wayfinder pulling cell, and the
 * sentence-shaped sheet titles. Kept pure so the mapping is unit-tested
 * without rendering.
 */

export function fmtMoney(n: number): string {
    if (!n) return "$0";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

/** Risk score (0–100) → tone for the vitals chip + ledger rows. */
export function riskTone(risk: number): AccentRole {
    if (risk >= 66) return "red";
    if (risk >= 40) return "amber";
    return "blue";
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the pinned case's primary corrective
 * route, from the action-plan router. The verb is the route's move; the
 * reasons carry why + the kill-switch. Absent when nothing is pinned.
 */
export function toPulling(doc: AutopsyDoc | null): PullingData | undefined {
    if (!doc) return undefined;
    const plan = buildActionPlan(doc);
    if (!plan.primary) return undefined;
    const reasons = [plan.primary.reason, doc.killSwitch].filter(
        (r): r is string => typeof r === "string" && r.length > 0
    );
    return {
        verb: plan.primary.label,
        object: doc.deal.name,
        href: plan.primary.href,
        reasons: reasons.slice(0, 4)
    };
}

/**
 * Sentence-shaped sheet titles, ported from the legacy ForensicSheets —
 * authored forensic sentences tuned to the deal's specific shape, not
 * categorical labels. Pure over the autopsy doc.
 */
export function sentenceTitlesFor(doc: AutopsyDoc): {
    readonly symptom: string;
    readonly underneath: string;
    readonly pattern: string;
} {
    const v: Vitals = doc.deal;
    const topCause = doc.causes[0];

    const symptom = topCause?.label
        ? `${topCause.label}.`
        : v.staleDays >= 14
          ? `The deal record has not been updated for ${v.staleDays} days. Confirm buyer activity before forecasting.`
          : "No configured risk condition matched. Confirm the latest buyer activity before forecasting.";

    const underneath = !v.economicBuyer
        ? "No economic buyer is recorded. Confirm who controls the purchase decision."
        : !v.champion
          ? "An economic buyer is recorded, but no champion is named. Confirm who will coordinate internally."
          : v.qualScore < 10
            ? "Qualification details are incomplete. Review the missing information with the buyer."
            : "A champion and economic buyer are recorded. Confirm their roles in the next decision.";

    const pattern = !v.hasNextStep
        ? "The next-step description is missing or brief. Confirm the action, date, and owner."
        : v.staleDays >= 30
          ? "The deal record has not been updated in at least 30 days. Check whether the recorded next step still applies."
          : "Confirm that the next step and close date still match the buyer's process.";

    return { symptom, underneath, pattern };
}
