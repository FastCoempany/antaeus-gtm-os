import type { CommandFamily, RawCommandCard } from "./types";
import {
    amountPressure,
    clamp,
    formatCauseLabel,
    pushReason
} from "./engine-helpers";
import type { SignalProfile } from "./signal-profile";

/**
 * Score + reason builders. Faithful port of the legacy
 * scoreRiskCard / scoreMoveCard / scoreSystemCard / scoreIcpCard +
 * the four buildXxxReasons + scoreRankingConfidence /
 * labelRankingConfidence sections.
 */

// ─── Reason builders ────────────────────────────────────────────────────

export function buildRiskReasons(
    card: RawCommandCard | null | undefined,
    profile: SignalProfile
): string[] {
    const reasons: string[] = [];
    if (profile.risk) pushReason(reasons, "risk " + profile.risk);
    if (profile.staleDays) pushReason(reasons, profile.staleDays + "d stale");
    if (profile.nextStepOverdue) pushReason(reasons, "next step overdue");
    if (profile.proofThin) pushReason(reasons, "proof thin");
    if (profile.truthDebtCount >= 2) pushReason(reasons, "truth debt");
    if (profile.recoveryCount) pushReason(reasons, "recovery queue");
    if (profile.missingChampion) pushReason(reasons, "champion unproven");
    if (profile.weakChampion) pushReason(reasons, "champion weak");
    if (profile.missingNextStep) pushReason(reasons, "next step missing");
    if (profile.threadingRisk) pushReason(reasons, "single-threaded");
    if (profile.stageStuck) pushReason(reasons, "stage stuck");
    if (profile.dealRoomPressureScore >= 60) pushReason(reasons, "room pressure high");
    if (profile.readinessDealsWeak) pushReason(reasons, "deals weakest dimension");
    if (profile.quotaPressureScore >= 60) pushReason(reasons, "quota pressure");
    if (profile.linkedRoomTop) pushReason(reasons, "room lead");
    if (profile.hasAutopsy) pushReason(reasons, "failure mode exposed");
    const meta = Array.isArray(card?.meta) ? card!.meta : [];
    for (const item of meta) {
        if (/\$/.test(item)) continue;
        if (/stale|risk/i.test(item)) continue;
        if (reasons.length >= 4) break;
        pushReason(reasons, item);
    }
    return reasons.slice(0, 4);
}

export function buildMoveReasons(
    _card: RawCommandCard | null | undefined,
    profile: SignalProfile,
    family: CommandFamily
): string[] {
    const reasons: string[] = [];
    if (profile.causeId) pushReason(reasons, formatCauseLabel(profile.causeId));
    if (profile.heat) pushReason(reasons, "heat " + profile.heat);
    if (profile.coveragePressure) pushReason(reasons, "coverage pressure");
    if (profile.highConfidenceCount >= 2) pushReason(reasons, "high-conf cluster");
    if (profile.recentCount >= 2) pushReason(reasons, "fresh signals");
    if (profile.truthDebtCount >= 2) pushReason(reasons, "truth debt");
    if (profile.proofThin) pushReason(reasons, "proof thin");
    if (profile.nextStepOverdue) pushReason(reasons, "next step overdue");
    if (profile.missingNextStep) pushReason(reasons, "next step missing");
    if (profile.quotaPressureScore >= 60) pushReason(reasons, "quota pressure");
    if (profile.signalRoomMotionReady) pushReason(reasons, "signal room ready");
    if (profile.signalRoomEvidenceThin) pushReason(reasons, "evidence still thin");
    if (profile.readinessOutreachWeak) pushReason(reasons, "outreach weakest link");
    if (profile.readinessDiscoveryWeak) pushReason(reasons, "discovery weakest link");
    if (profile.readinessPlaybookWeak && family === "advisor") {
        pushReason(reasons, "playbook weakest link");
    }
    if (profile.hasReplies) pushReason(reasons, "reply path");
    if (family === "advisor" || profile.hasAdvisor) pushReason(reasons, "advisor leverage");
    if (family === "opportunity" || profile.hasSignalConsole) pushReason(reasons, "market motion");
    if (profile.linkedRoomTop) pushReason(reasons, "room lead");
    if (profile.roomReadiness >= 2) pushReason(reasons, "room ready");
    if (!reasons.length && profile.risk) pushReason(reasons, "risk " + profile.risk);
    if (!reasons.length && profile.hasOpenDeal) pushReason(reasons, "room ready");
    if (!reasons.length) pushReason(reasons, "next move ready");
    return reasons.slice(0, 4);
}

export function buildSystemReasons(profile: SignalProfile): string[] {
    const reasons: string[] = [];
    if (profile.warningCount) {
        pushReason(
            reasons,
            profile.warningCount + " sync warning" + (profile.warningCount === 1 ? "" : "s")
        );
    }
    if (profile.readinessScore) {
        pushReason(reasons, "readiness " + profile.readinessScore + "/100");
    }
    if (profile.readinessWeakestDimension) {
        pushReason(reasons, profile.readinessWeakestDimension.toLowerCase() + " weakest dimension");
    }
    if (profile.quotaPressureScore >= 60) pushReason(reasons, "quota pressure");
    if (profile.quotaQualityBand) {
        pushReason(reasons, "plan " + profile.quotaQualityBand.toLowerCase());
    }
    pushReason(reasons, "local fallback active");
    return reasons.slice(0, 4);
}

export function buildIcpReasons(profile: SignalProfile): string[] {
    const reasons: string[] = [];
    if (profile.readinessIcpWeak) pushReason(reasons, "ICP weakest dimension");
    pushReason(reasons, "targeting truth missing");
    if (profile.quotaPressureScore >= 60) {
        pushReason(reasons, "quota pressure is downstream");
    }
    if (profile.contextSignals || profile.contextAccounts) {
        pushReason(reasons, "market layer already live");
    }
    if (profile.contextDeals) pushReason(reasons, "deal layer depends on ICP");
    return reasons.slice(0, 4);
}

export function buildReasons(
    card: RawCommandCard | null | undefined,
    family: CommandFamily,
    profile: SignalProfile
): string[] {
    if (family === "risk") return buildRiskReasons(card, profile);
    if (family === "system") return buildSystemReasons(profile);
    if (family === "icp") return buildIcpReasons(profile);
    return buildMoveReasons(card, profile, family);
}

// ─── Score builders ─────────────────────────────────────────────────────

export function scoreRiskCard(profile: SignalProfile): number {
    let score = profile.risk * 0.5 + profile.staleDays * 1.1 + amountPressure(profile.amount);
    score += Math.max(0, 14 - profile.qualScore) * 1.1;
    score += Math.min(14, profile.stageAgeDays * 0.45);
    score += profile.truthDebtCount * 3;
    score += Math.min(8, profile.recoveryCount * 2);
    if (profile.hasAutopsy) score += 11;
    if (profile.proofThin) score += 7;
    if (profile.missingChampion) score += 7;
    if (profile.weakChampion) score += 4;
    if (profile.missingNextStep) score += 8;
    if (profile.nextStepOverdue) score += 9;
    if (profile.threadingRisk) score += 7;
    if (profile.stageStuck) score += 7;
    if (profile.linkedRoomTop) score += 5;
    if (profile.driftSignal) score += 4;
    if (profile.dealRoomPressureScore >= 60) score += 4;
    if (profile.readinessDealsWeak) score += 5;
    if (profile.quotaPressureScore >= 60) score += 4;
    return clamp(Math.round(score), 0, 100);
}

export function scoreMoveCard(profile: SignalProfile, family: CommandFamily): number {
    let score = family === "advisor" ? 66 : family === "opportunity" ? 62 : 56;
    score += profile.heat * 0.24;
    score += profile.risk * 0.18;
    score += amountPressure(profile.amount) * 0.7;
    score += profile.urgency * 0.9;
    score += profile.severity * 2;
    score += Math.min(8, profile.signalCount * 0.5);
    score += Math.min(10, profile.highConfidenceCount * 2);
    score += Math.min(8, profile.recentCount * 1.5);
    if (profile.coveragePressure) score += 8;
    if (profile.marketMotion) score += 6;
    if (profile.truthDebtCount >= 2) score += 6;
    if (profile.proofThin) score += 5;
    if (profile.missingNextStep) score += 4;
    if (profile.nextStepOverdue) score += 6;
    if (profile.hasOpenDeal) score += 3;
    if (profile.hasReplies) score += 5;
    if (profile.hasSignalConsole) score += 4;
    if (profile.roomReadiness >= 2) score += 4;
    if (profile.linkedRoomTop) score += 5;
    if (profile.causeId === "coverage_gap") score += 8;
    if (profile.causeId === "no_nextstep" || profile.causeId === "next_step_overdue") {
        score += 7;
    }
    if (profile.causeId === "no_champion" || profile.causeId === "champion_weak") {
        score += 6;
    }
    if (
        profile.quotaPressureScore >= 60 &&
        (family === "move" || family === "opportunity")
    ) {
        score += 7;
    }
    if (profile.signalRoomMotionReady && family === "opportunity") score += 6;
    if (
        profile.readinessOutreachWeak &&
        (family === "move" || family === "opportunity")
    ) {
        score += 4;
    }
    if (profile.readinessDiscoveryWeak && family === "move") score += 3;
    if (profile.readinessPlaybookWeak && family === "advisor") score += 5;
    if (family === "advisor") score += 8;
    if (family === "opportunity") score += 6;
    return clamp(Math.round(score), 0, 100);
}

export function scoreSystemCard(profile: SignalProfile): number {
    return clamp(
        Math.round(
            48 +
                profile.warningCount * 10 +
                (profile.contextDeals ? 4 : 0) +
                Math.min(18, profile.readinessFragility * 0.18) +
                Math.min(14, profile.quotaPressureScore * 0.14)
        ),
        0,
        94
    );
}

export function scoreIcpCard(profile: SignalProfile): number {
    let score = 52;
    if (profile.contextAccounts || profile.contextSignals) score += 8;
    if (profile.contextDeals) score += 10;
    if (profile.contextMotions) score += 4;
    if (profile.readinessIcpWeak) score += 18;
    if (profile.quotaPressureScore >= 60) score += 4;
    return clamp(Math.round(score), 0, 86);
}

export function scoreFamily(profile: SignalProfile, family: CommandFamily): number {
    if (family === "risk") return scoreRiskCard(profile);
    if (family === "system") return scoreSystemCard(profile);
    if (family === "icp") return scoreIcpCard(profile);
    return scoreMoveCard(profile, family);
}

export function scoreRankingConfidence(
    profile: SignalProfile,
    family: CommandFamily
): number {
    let confidence = 36;
    confidence += Math.min(18, profile.risk * 0.12);
    confidence += Math.min(14, profile.heat * 0.12);
    confidence += profile.staleDays ? 10 : 0;
    confidence += profile.amount ? 8 : 0;
    confidence += Math.min(12, profile.actionCount * 6);
    confidence += Math.min(18, profile.gapCount * 5);
    confidence += profile.warningCount ? Math.min(16, profile.warningCount * 8) : 0;
    confidence += Math.min(12, profile.truthDebtCount * 4);
    confidence += Math.min(10, profile.highConfidenceCount * 2);
    confidence += Math.min(8, profile.recentCount * 2);
    confidence += Math.min(8, profile.recoveryCount * 2);
    confidence += profile.nextStepOverdue ? 6 : 0;
    confidence += profile.stageStuck ? 6 : 0;
    confidence += profile.roomReadiness >= 2 ? 6 : 0;
    confidence += profile.linkedRoomTop ? 6 : 0;
    confidence += profile.urgency ? Math.min(10, profile.urgency * 0.45) : 0;
    confidence += profile.readinessScore ? 4 : 0;
    confidence += profile.quotaPressureScore ? 4 : 0;
    if (family === "advisor" || family === "opportunity") confidence += 6;
    if (family === "system" || family === "icp") confidence += 10;
    return clamp(Math.round(confidence), 40, 94);
}

export function labelRankingConfidence(score: number): string {
    if (score >= 78) return "stable lead";
    if (score >= 58) return "supported";
    return "mixed signal";
}
