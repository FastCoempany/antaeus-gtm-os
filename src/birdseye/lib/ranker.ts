import { validateObservation } from "@/lib/voice/voice-document";
import type { ObservationView } from "@/lib/observations/types";
import type { NextMove, NextMoveSourceKind, RankerResult } from "./types";

/**
 * NextMove ranker — Phase D core logic.
 *
 * Per ADR-011 (2026-05-31). Pure function that takes the workspace's
 * inputs (observations, deals, hot accounts) and returns the single
 * highest-pressure NextMove candidate (or null if nothing passes).
 *
 * Source priority is a stable composite score — higher pressure wins
 * regardless of source kind. Equal scores break by source priority:
 * observation > deal-pressure > hot-signal-account.
 *
 * Voice gate: each candidate's label + reason are validated against
 * `src/lib/voice/voice-document.ts` before being considered. Failing
 * candidates are dropped silently; the ranker returns the next best
 * or "all-voice-failed" if nothing survives.
 */

// ─── Inputs ────────────────────────────────────────────────────────────

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
    readonly heat: number;
}

// ─── Source-to-candidate adapters ──────────────────────────────────────

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
    // Map source_generator to a verb-shape action label. Falls back to
    // a generic "Review this read" if the generator id isn't known.
    switch (obs.sourceGenerator) {
        case "phase-b/deal-decay":
            return "Look at the stalling deal";
        case "phase-b/signal-decay":
            return "Refresh signal coverage";
        case "phase-b/proof-staleness":
            return "Close out the overdue proof";
        case "phase-b/discovery-rhythm":
            return "Run a discovery call this week";
        default:
            return "Review the latest system read";
    }
}

function buildObservationTargetUrl(obs: ObservationView): string {
    // Route based on the related-object type. Observations without an
    // entity land on the Dashboard (WeekReadsCard is there).
    const base = (() => {
        switch (obs.relatedObjectType) {
            case "deal":
                return "/deal-workspace/";
            case "account":
                return "/signal-console/";
            case "proof":
                return "/poc-framework/";
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
    // Score: anchor to recovery_rank (0-100 in the Deal Workspace's
    // computation). Bonus for missing next step.
    const noNextStep =
        !deal.next_step_date || deal.next_step_date.trim().length === 0;
    const score = Math.min(95, deal.recovery_rank + (noNextStep ? 5 : 0));
    const reason = noNextStep
        ? `${account} is stalling with no dated next step.`
        : `${account} is the deal with the most recovery pressure right now.`;
    const targetUrl = `/deal-workspace/?focusObject=${encodeURIComponent(deal.id)}&fromSurface=birdseye`;
    return {
        id: `deal:${deal.id}`,
        label: "Work the deal under most pressure",
        reason,
        score,
        targetUrl,
        sourceKind: "deal-pressure"
    };
}

function fromHotAccount(account: HotAccount): NextMove | null {
    if (account.heat <= 0) return null;
    // Score: scale heat (0-100) down so hot accounts only win when
    // observations + deal pressure are both quiet. Heat is a proxy
    // for opportunity; observations + deals are proxies for risk —
    // risk wins ties.
    const score = Math.min(75, Math.round(account.heat * 0.7));
    const reason = `${account.account_name} has the highest heat in your watchlist right now.`;
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

// ─── Ranking ───────────────────────────────────────────────────────────

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

    // Optionally drop candidates that would route to the room the
    // operator is currently on (count-badge semantic).
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
 * Decide whether the Birdseye icon should show its count badge —
 * fires when there's at least ONE candidate that targets a room the
 * operator is NOT currently on. (Phase D doesn't surface counts; the
 * badge is a binary "more-urgent-than-here-exists" indicator.)
 */
export function shouldFlagOtherRoom(input: RankerInputs): boolean {
    if (!input.currentRoomHref) return false;
    const result = rankNextMove(input);
    if (!result.ok) return false;
    return !result.move.targetUrl.startsWith(input.currentRoomHref);
}
