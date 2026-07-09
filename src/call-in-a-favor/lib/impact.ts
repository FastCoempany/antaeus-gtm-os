import type {
    Advisor,
    AdvisorDeal,
    Deployment
} from "./types";
import { advisorsForDeal } from "./recommend";

/**
 * Phase 4 / Room 10 Wave 4 — desk read / impact computation.
 *
 * Faithful TypeScript port of legacy `renderImpact()` (lines 409-432).
 * Computes the 4-cell stat grid + the readline list shown in the
 * "Desk read" sheet of the secondary stack.
 *
 * The stats:
 *   - registered carriers (count)
 *   - live deal coverage (covered/total)
 *   - open loops (pending + engaged)
 *   - success read (rate %)
 *
 * The readline list surfaces system-health rules:
 *   - Registry first      (red)    — no advisors registered
 *   - Coverage gap        (orange) — N deals lack any mapped advisor
 *   - Follow-through      (blue)   — N loops still need a result
 *   - Compounding         (green)  — N loops produced movement
 *   - Clean desk          (green)  — fall-through when nothing weak
 */

export type ImpactTone = "red" | "orange" | "blue" | "green";

export interface ImpactCell {
    readonly value: string;
    readonly label: string;
}

export interface ImpactRow {
    readonly title: string;
    readonly copy: string;
    readonly tone: ImpactTone;
}

export interface ImpactReadings {
    readonly cells: ReadonlyArray<ImpactCell>;
    readonly rows: ReadonlyArray<ImpactRow>;
}

export interface ImpactInput {
    readonly advisors: ReadonlyArray<Advisor>;
    readonly deployments: ReadonlyArray<Deployment>;
    readonly activeDeals: ReadonlyArray<AdvisorDeal>;
}

export function computeImpact(input: ImpactInput): ImpactReadings {
    const { advisors, deployments, activeDeals } = input;
    const covered = activeDeals.filter(
        (d) => advisorsForDeal(advisors, d).length > 0
    ).length;
    const pending = deployments.filter(
        (d) => !d.outcome || d.outcome === "pending" || d.outcome === "engaged"
    ).length;
    const successful = deployments.filter(
        (d) => d.outcome === "successful"
    ).length;
    const rate =
        deployments.length > 0
            ? Math.round((successful / deployments.length) * 100)
            : 0;

    const cells: ImpactCell[] = [
        { value: String(advisors.length), label: "registered carriers" },
        {
            value: `${covered}/${activeDeals.length}`,
            label: "live deal coverage"
        },
        { value: String(pending), label: "open loops" },
        { value: `${rate}%`, label: "success read" }
    ];

    const rows: ImpactRow[] = [];
    if (advisors.length === 0) {
        rows.push({
            title: "Registry first",
            copy: "No advisor can carry the ask until the relationship is registered.",
            tone: "red"
        });
    }
    if (activeDeals.length > 0 && covered < activeDeals.length) {
        const gap = activeDeals.length - covered;
        rows.push({
            title: "Coverage gap",
            copy: `${gap} live deal${gap === 1 ? "" : "s"} have no mapped advisor path.`,
            tone: "orange"
        });
    }
    if (pending > 0) {
        rows.push({
            title: "Follow-through",
            copy: `${pending} advisor loop${pending === 1 ? "" : "s"} still need a result.`,
            tone: "blue"
        });
    }
    if (successful > 0) {
        rows.push({
            title: "Compounding",
            copy: `${successful} advisor loop${successful === 1 ? "" : "s"} produced useful movement.`,
            tone: "green"
        });
    }
    if (rows.length === 0) {
        rows.push({
            title: "Clean desk",
            copy: "No urgent advisor weakness is visible right now.",
            tone: "green"
        });
    }

    return { cells, rows };
}
