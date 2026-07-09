import { t } from "@/lib/voice/t";
import type {
    AllocationReadout,
    Approach,
    TerritoryAccount,
    Focus
} from "./types";

/**
 * Program 6 / PR 12 — engine that reads the territory back to the operator.
 *
 * Per the picked-winner Variant 02 / Signal Field refinement
 * (deliverables/prototypes/wireframes/antaeus-territory-architect-
 * signal-field-refinement-2026-04-17.html line 453+), the room's
 * top-of-page should not just count rows — it should interpret what
 * the territory is saying. Three lines + a score:
 *
 *   - A score (Runnable / Tight / Loose / Empty)
 *   - What's loose about the territory right now
 *   - What should come in to replace what's drifting off
 *   - The one prescribed next step
 *
 * Pure: takes accounts + focuses + approaches + allocation explicitly
 * so tests can probe every branch.
 */

export type FieldReadBand = "empty" | "loose" | "tight" | "runnable";

export interface FieldRead {
    readonly score: number;
    readonly band: FieldReadBand;
    readonly bandLabel: string;
    readonly mainRisk: string;
    readonly replacement: string;
    readonly operatorMove: string;
}

export interface FieldReadInputs {
    readonly accounts: ReadonlyArray<TerritoryAccount>;
    readonly focuses: ReadonlyArray<Focus>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly allocation: AllocationReadout;
}

/** Band labels — canon §10 state vocabulary, plain at a glance. */
const BAND_LABELS: Readonly<Record<FieldReadBand, string>> = {
    runnable: t("Operating"),
    tight: t("Tight"),
    loose: t("Loose"),
    empty: t("Empty")
};

export function computeFieldRead(input: FieldReadInputs): FieldRead {
    const { accounts, focuses, approaches, allocation } = input;

    // Active = accounts still in the field (not closed). Drift =
    // closed-lost rows still occupying the strategic memory but no
    // longer worth their slot. Paused = still in the field but not
    // actively worked. The wireframe's "watch ring" maps to paused.
    const active = accounts.filter((a) => a.disposition === "active");
    const paused = accounts.filter((a) => a.disposition === "paused");
    const lost = accounts.filter((a) => a.disposition === "closed-lost");
    const won = accounts.filter((a) => a.disposition === "closed-won");

    const score = computeScore({
        focusCount: focuses.length,
        approachCount: approaches.length,
        activeCount: active.length,
        wonCount: won.length,
        allocation
    });
    const band = scoreToBand(score, focuses.length, active.length);

    return {
        score,
        band,
        bandLabel: BAND_LABELS[band],
        mainRisk: pickMainRisk({
            focuses,
            allocation,
            paused,
            lost,
            active
        }),
        replacement: pickReplacement({ paused, lost }),
        operatorMove: pickOperatorMove({
            focuses,
            approaches,
            allocation,
            lost,
            paused
        })
    };
}

interface ScoreInputs {
    readonly focusCount: number;
    readonly approachCount: number;
    readonly activeCount: number;
    readonly wonCount: number;
    readonly allocation: AllocationReadout;
}

function computeScore(s: ScoreInputs): number {
    let score = 30;
    if (s.focusCount >= 1) score += 8;
    if (s.focusCount >= 3) score += 12;
    if (s.approachCount >= 1) score += 6;
    if (s.approachCount >= 3) score += 10;
    if (s.activeCount >= 5) score += 8;
    if (s.activeCount >= 30) score += 8;
    if (s.wonCount >= 1) score += 4;
    if (s.allocation.status === "headroom" && s.activeCount > 0) score += 4;
    if (s.allocation.status === "over") score -= 8;
    return Math.max(0, Math.min(92, score));
}

function scoreToBand(
    score: number,
    focusCount: number,
    activeCount: number
): FieldReadBand {
    if (focusCount === 0 || activeCount === 0) return "empty";
    if (score >= 75) return "runnable";
    if (score >= 55) return "tight";
    return "loose";
}

interface RiskInputs {
    readonly focuses: ReadonlyArray<Focus>;
    readonly allocation: AllocationReadout;
    readonly paused: ReadonlyArray<TerritoryAccount>;
    readonly lost: ReadonlyArray<TerritoryAccount>;
    readonly active: ReadonlyArray<TerritoryAccount>;
}

function pickMainRisk(s: RiskInputs): string {
    if (s.focuses.length === 0) {
        return t("You haven't carved a division yet, so there's nothing to organize the territory around.", { class: "body" });
    }
    if (s.focuses.length === 1) {
        return t("One division covers everything. If that one bet misses, the whole territory misses.", { class: "body" });
    }
    if (s.allocation.status === "over") {
        return `${t("You're over the", { class: "body" })} ${s.allocation.ceiling}${t("-account cap. Retier or close a few to come back inside.", { class: "body" })}`;
    }
    if (s.lost.length >= s.active.length && s.lost.length >= 3) {
        return t("More accounts have been lost than are being worked. A lot of what's on the map isn't going anywhere.", { class: "body" });
    }
    if (s.paused.length >= 5) {
        return t("Several paused accounts are just sitting there. Pick one up again, or take it off the map.", { class: "body" });
    }
    if (s.active.length === 0) {
        return t("No accounts are being worked yet — the map is still theoretical.", { class: "body" });
    }
    return t("The territory is being worked. The thing to watch is accounts quietly going stale.", { class: "body" });
}

interface ReplacementInputs {
    readonly paused: ReadonlyArray<TerritoryAccount>;
    readonly lost: ReadonlyArray<TerritoryAccount>;
}

function pickReplacement(s: ReplacementInputs): string {
    const backfillNeeded = s.lost.length + Math.floor(s.paused.length / 2);
    if (backfillNeeded === 0) {
        return t("Nothing needs replacing this week. The list is holding.", { class: "body" });
    }
    if (backfillNeeded === 1) {
        return t("One account should come off the list this week, with a better one added in its place.", { class: "body" });
    }
    return `${backfillNeeded} ${t("accounts should come off the list this week, with better ones added in their place.", { class: "body" })}`;
}

interface OperatorMoveInputs {
    readonly focuses: ReadonlyArray<Focus>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly allocation: AllocationReadout;
    readonly lost: ReadonlyArray<TerritoryAccount>;
    readonly paused: ReadonlyArray<TerritoryAccount>;
}

function pickOperatorMove(s: OperatorMoveInputs): string {
    if (s.focuses.length === 0) {
        return t("Carve one division. Name the group of buyers you believe you can win.", { class: "body" });
    }
    if (s.approaches.length === 0) {
        return t("Write down how you'll open the conversation with each division.", { class: "body" });
    }
    if (s.allocation.status === "over") {
        return t("Retier or close enough accounts to get back under the cap.", { class: "body" });
    }
    if (s.lost.length >= 3) {
        return t("Take the lost accounts off the map — they shouldn't hold a slot.", { class: "body" });
    }
    if (s.paused.length >= 3) {
        return t("Pick one paused account back up, or take it off the map.", { class: "body" });
    }
    return t("Add the next must-win account, or sharpen one of your divisions.", { class: "body" });
}
