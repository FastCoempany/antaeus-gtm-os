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
          ? `Stage is moving but the deal isn't — ${v.staleDays} days since anything happened.`
          : "The board looks healthy. Confirm before you forecast on it.";

    const underneath = !v.economicBuyer
        ? "There's pilot evidence, but no one with authority owns it."
        : !v.champion
          ? "The buyer is identified, but no one inside their company is carrying this forward."
          : v.qualScore < 10
            ? "Qualification is thin — the buyer can't take the pilot results to their boss yet."
            : "Owner and inside carrier are both named. The pilot results can be carried into the room.";

    const pattern = !v.hasNextStep
        ? "There's no dated next step — the process is running ahead of any control."
        : v.staleDays >= 30
          ? "The thread moved early in the cycle; no one is steering the close path now."
          : "The thread is alive. Confirm the close path still tracks what's actually happening.";

    return { symptom, underneath, pattern };
}
