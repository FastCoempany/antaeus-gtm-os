import { t } from "@/lib/voice/t";
import type {
    AllocationReadout,
    Approach,
    TerritoryAccount,
    Focus
} from "./types";

/**
 * Territory status summary. The engine still evaluates coverage,
 * prioritization, active work, and allocation; user-facing language names
 * those conditions directly instead of describing a metaphorical field.
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

const BAND_LABELS: Readonly<Record<FieldReadBand, string>> = {
    runnable: t("Operating"),
    tight: t("Well prioritized"),
    loose: t("Needs prioritization"),
    empty: t("No active territory")
};

export function computeFieldRead(input: FieldReadInputs): FieldRead {
    const { accounts, focuses, approaches, allocation } = input;

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
        return t("No territory segments have been created yet, so accounts do not have a segment structure to organize coverage.", { class: "body" });
    }
    if (s.focuses.length === 1) {
        return t("One segment currently contains the entire territory. Review whether that concentration reflects the accounts you actually want to cover.", { class: "body" });
    }
    if (s.allocation.status === "over") {
        return `${t("The territory is over the", { class: "body" })} ${s.allocation.ceiling}${t("-account limit. Reassign, pause, or close enough accounts to return below the limit.", { class: "body" })}`;
    }
    if (s.lost.length >= s.active.length && s.lost.length >= 3) {
        return t("The territory contains at least as many closed-lost accounts as active accounts. Review which accounts should remain in current coverage.", { class: "body" });
    }
    if (s.paused.length >= 5) {
        return t("Several accounts are paused. Decide which ones should return to active coverage and which should be removed from the current working set.", { class: "body" });
    }
    if (s.active.length === 0) {
        return t("No accounts are currently active. The territory structure exists, but no accounts are being worked.", { class: "body" });
    }
    return t("The territory is active. Continue reviewing inactive or aging accounts so current coverage remains intentional.", { class: "body" });
}

interface ReplacementInputs {
    readonly paused: ReadonlyArray<TerritoryAccount>;
    readonly lost: ReadonlyArray<TerritoryAccount>;
}

function pickReplacement(s: ReplacementInputs): string {
    const backfillNeeded = s.lost.length + Math.floor(s.paused.length / 2);
    if (backfillNeeded === 0) {
        return t("No account replacement is currently required by this model.", { class: "body" });
    }
    if (backfillNeeded === 1) {
        return t("Review one account for removal or replacement in the current working set.", { class: "body" });
    }
    return `${t("Review", { class: "body" })} ${backfillNeeded} ${t("accounts for removal or replacement in the current working set.", { class: "body" })}`;
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
        return t("Create one territory segment and define the group of accounts you want to cover.", { class: "body" });
    }
    if (s.approaches.length === 0) {
        return t("Record a sales approach for each active territory segment.", { class: "body" });
    }
    if (s.allocation.status === "over") {
        return t("Reassign, pause, or close enough accounts to return below the account limit.", { class: "body" });
    }
    if (s.lost.length >= 3) {
        return t("Remove closed-lost accounts from the current working set if they no longer need an active territory slot.", { class: "body" });
    }
    if (s.paused.length >= 3) {
        return t("Review paused accounts and either reactivate them or remove them from the current working set.", { class: "body" });
    }
    return t("Add the next priority account or refine an existing segment using current sales evidence.", { class: "body" });
}
