import { validateObservation } from "@/lib/voice/voice-document";
import type { ObservationView } from "@/lib/observations/types";
import type { NextMove, NextMoveSourceKind, RankerResult } from "./types";

/**
 * NextMove ranker — pure function that ranks current observations,
 * deal-risk inputs, and account-priority inputs and returns the highest
 * ranked recommended action. Internal source-kind and score fields remain
 * stable; user-facing labels/reasons use explicit business language.
 */

export interface RankerInputs {
    readonly observations: ReadonlyArray<ObservationView>;
    readonly deals: ReadonlyArray<DealForRanking>;
    readonly hotAccounts: ReadonlyArray<HotAccount>;
    /** Optional: skip candidates that target the room the operator is currently on. */
    readonly currentRoomHref?: string;
}

export interface DealForRanking {
    readonly id: string;
    readonly account_name: string | null;
    readonly stage: string | null;
    readonly recovery_rank: number;
    readonly next_step_date: string | null;
}

export interface HotAccount {
    readonly id: string;
    readonly account_name: string;
    /** Stable internal field name for the account-priority input. */
    readonly heat: number;
}

function fromObservation(obs: ObservationView): NextMove | null {
    if (obs.dismissedAt) return null;
    if (obs.status !== "active") return null;
    const confidence = obs.confidence ?? "medium";
    const confidenceBoost =
        confidence === "high" ? 15 : confidence === "medium" ? 5 : 0;
    const score = Math.min(95, 60 + confidenceBoost);
    return {
        id: `obs:${obs.id}`,
        label: deriveObservationLabel(obs),
        reason: obs.observationText,
        score,
        targetUrl: buildObservationTargetUrl(obs),
        sourceKind: "observation"
    };
}

function deriveObservationLabel(obs: ObservationView): string {
    switch (obs.sourceGenerator) {
        case "phase-b/deal-decay":
            return "Review the deal with increasing risk";
        case "phase-b/signal-decay":
            return "Review aging account signals";
        case "phase-b/proof-staleness":
            return "Review overdue pilot evidence";
        case "phase-b/discovery-rhythm":
            return "Run a discovery call this week";
        default:
            return "Review the latest analysis";
    }
}

function buildObservationTargetUrl(obs: ObservationView): string {
    const base = (() => {
        switch (obs.relatedObjectType) {
            case "deal":
                return "/deal-workspace/";
            case "account":
                return "/signal-console/";
            case "proof":
                return "/pilot-desk/";
            default:
                return "/dashboard/";
        }
    })();
    const params = new URLSearchParams();
    if (obs.relatedObjectId) {
        params.set("focusObject", obs.relatedObjectId);
    }
    params.set("fromSurface", "birdseye");
    return params.size > 0 ? `${base}?${params.toString()}` : base;
}

function fromDeal(deal: DealForRanking): NextMove | null {
    if (deal.recovery_rank <= 0) return null;
    if (deal.stage === "closed-won" || deal.stage === "closed-lost") return null;
    const account = (deal.account_name ?? "").trim() || "Unnamed deal";
    const noNextStep =
        !deal.next_step_date || deal.next_step_date.trim().length === 0;
    const score = Math.min(95, deal.recovery_rank + (noNextStep ? 5 : 0));
    const reason = noNextStep
        ? `${account} has elevated deal risk and no dated next step.`
        : `${account} is currently the highest-ranked deal by risk.`;
    const targetUrl = `/deal-workspace/?focusObject=${encodeURIComponent(deal.id)}&fromSurface=birdseye`;
    return {
        id: `deal:${deal.id}`,
        label: "Review the highest-risk deal",
        reason,
        score,
        targetUrl,
        sourceKind: "deal-pressure"
    };
}

function fromHotAccount(account: HotAccount): NextMove | null {
    if (account.heat <= 0) return null;
    // `heat` remains the stable internal score field. User-facing copy
    // names the construct as account priority rather than temperature.
    const score = Math.min(75, Math.round(account.heat * 0.7));
    const reason = `${account.account_name} is currently the highest-priority account in your watchlist.`;
    const targetUrl = `/outbound-studio/?account=${encodeURIComponent(account.account_name)}&fromSurface=birdseye`;
    return {
        id: `hot:${account.id}`,
        label: `Compose outbound for ${account.account_name}`,
        reason,
        score,
        targetUrl,
        sourceKind: "hot-signal-account"
    };
}

const SOURCE_PRIORITY: Record<NextMoveSourceKind, number> = {
    observation: 3,
    "deal-pressure": 2,
    "hot-signal-account": 1
};

function passesVoice(move: NextMove): boolean {
    return (
        validateObservation(move.label).valid &&
        validateObservation(move.reason).valid
    );
}

export function rankNextMove(input: RankerInputs): RankerResult {
    const candidates: NextMove[] = [];
    for (const obs of input.observations) {
        const c = fromObservation(obs);
        if (c) candidates.push(c);
    }
    for (const deal of input.deals) {
        const c = fromDeal(deal);
        if (c) candidates.push(c);
    }
    for (const account of input.hotAccounts) {
        const c = fromHotAccount(account);
        if (c) candidates.push(c);
    }
    if (candidates.length === 0) {
        return { ok: false, reason: "no-candidates" };
    }

    const filtered = input.currentRoomHref
        ? candidates.filter((c) => !c.targetUrl.startsWith(input.currentRoomHref!))
        : candidates;
    const pool = filtered.length > 0 ? filtered : candidates;

    pool.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return SOURCE_PRIORITY[b.sourceKind] - SOURCE_PRIORITY[a.sourceKind];
    });

    for (const candidate of pool) {
        if (passesVoice(candidate)) {
            return { ok: true, move: candidate };
        }
    }
    return { ok: false, reason: "all-voice-failed" };
}

/**
 * Decide whether the Birdseye icon should show its count badge when a
 * higher-priority recommendation points to another workspace.
 */
export function shouldFlagOtherRoom(input: RankerInputs): boolean {
    if (!input.currentRoomHref) return false;
    const result = rankNextMove(input);
    if (!result.ok) return false;
    return !result.move.targetUrl.startsWith(input.currentRoomHref);
}
