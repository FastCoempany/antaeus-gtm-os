import type {
    CommandEngineInput,
    CommandFamily,
    RawCommandCard
} from "./types";
import {
    countActions,
    hasAction,
    parseHeat,
    parseMoney,
    parseRisk,
    parseStaleDays,
    readHealthSummary,
    readSignals,
    signalBool,
    signalNumber,
    signalText,
    summaryBool,
    summaryNumber,
    summaryText,
    testCardText
} from "./engine-helpers";

/**
 * SignalProfile — the ~50-field input shape every score + reason
 * function reads from. Faithful port of `buildSignalProfile` in the
 * legacy js/command-intelligence.js.
 *
 * Fields fall into three groups:
 *   1. Raw card signals (risk, heat, stale, amount, …)
 *   2. Boolean condition flags (missingChampion, nextStepOverdue, …)
 *   3. Health-summary projections (deal/signal/readiness/quota room state)
 * plus the workspace shellContext counts (accounts/signals/deals/icps/motions).
 */

export interface SignalProfile {
    risk: number;
    heat: number;
    staleDays: number;
    amount: number;
    stageAgeDays: number;
    qualScore: number;
    nextStepDaysAway: number;
    severity: number;
    urgency: number;
    truthDebtCount: number;
    signalCount: number;
    highConfidenceCount: number;
    recentCount: number;
    recoveryCount: number;
    weightedPipeline: number;
    roomReadiness: number;
    threadingDepth: number;
    warningCount: number;
    actionCount: number;
    missingChampion: boolean;
    weakChampion: boolean;
    missingNextStep: boolean;
    proofThin: boolean;
    coveragePressure: boolean;
    driftSignal: boolean;
    marketMotion: boolean;
    threadingRisk: boolean;
    nextStepOverdue: boolean;
    stageStuck: boolean;
    hasAutopsy: boolean;
    hasOpenDeal: boolean;
    hasSignalConsole: boolean;
    hasAdvisor: boolean;
    hasDiscovery: boolean;
    hasReplies: boolean;
    linkedRoomTop: boolean;
    causeId: string;
    pressureType: string;
    gapCount: number;
    dealRoomPressureScore: number;
    dealRoomTruthDebt: number;
    signalRoomPressureScore: number;
    signalRoomMotionReady: boolean;
    signalRoomEvidenceThin: boolean;
    readinessScore: number;
    readinessFragility: number;
    readinessWeakestDimension: string;
    readinessIcpWeak: boolean;
    readinessDiscoveryWeak: boolean;
    readinessOutreachWeak: boolean;
    readinessDealsWeak: boolean;
    readinessPlaybookWeak: boolean;
    quotaQualityScore: number;
    quotaPressureScore: number;
    quotaTouchesWeek: number;
    quotaActiveAccounts: number;
    quotaQualityBand: string;
    quotaFragile: boolean;
    contextAccounts: number;
    contextSignals: number;
    contextDeals: number;
    contextIcps: number;
    contextMotions: number;
}

export function buildSignalProfile(
    card: RawCommandCard | null | undefined,
    family: CommandFamily,
    input: CommandEngineInput
): SignalProfile {
    const context = (input.shellContext ?? {}) as Record<string, unknown>;
    const warningCount = Array.isArray(input.dependencyWarnings)
        ? input.dependencyWarnings.length
        : 0;
    const dealHealth = readHealthSummary(input, "deal");
    const signalHealth = readHealthSummary(input, "signal");
    const readinessHealth = readHealthSummary(input, "readiness");
    const quotaHealth = readHealthSummary(input, "quota");
    const signals = readSignals(card);

    const risk = signalNumber(signals, "risk", parseRisk(card), 0, 100);
    const heat = signalNumber(signals, "heat", parseHeat(card), 0, 100);
    const staleDays = signalNumber(signals, "staleDays", parseStaleDays(card), 0, 365);
    const amount = signalNumber(signals, "amount", parseMoney(card), 0, 100000000);
    const stageAgeDays = signalNumber(signals, "stageAgeDays", 0, 0, 365);
    const qualScore = signalNumber(signals, "qualScore", 0, 0, 18);
    const nextStepDaysAway = signalNumber(signals, "nextStepDaysAway", 0, -365, 365);
    const severity = signalNumber(signals, "severity", 0, 0, 10);
    const urgency = signalNumber(signals, "urgency", 0, 0, 100);
    const truthDebtCount = signalNumber(signals, "truthDebtCount", 0, 0, 12);
    const signalCount = signalNumber(signals, "signalCount", 0, 0, 1000);
    const highConfidenceCount = signalNumber(signals, "highConfidenceCount", 0, 0, 1000);
    const recentCount = signalNumber(signals, "recentCount", 0, 0, 1000);
    const recoveryCount = signalNumber(signals, "recoveryCount", 0, 0, 50);
    const weightedPipeline = signalNumber(signals, "weightedPipeline", 0, 0, 100000000);
    const roomReadiness = signalNumber(signals, "roomReadiness", countActions(card), 0, 10);
    const threadingDepth = signalNumber(signals, "threadingDepth", 0, 0, 20);

    const missingChampion = signalBool(
        signals,
        "missingChampion",
        testCardText(card, /(champion(?:\s+\w+){0,4}\s+(?:assumed|unproven|missing)|no champion|single-threaded)/i)
    );
    const weakChampion = signalBool(
        signals,
        "weakChampion",
        testCardText(card, /(champion weak|non-committal)/i)
    );
    const missingNextStep = signalBool(
        signals,
        "missingNextStep",
        testCardText(
            card,
            /(no dated next step|next step missing|angle still missing|no real next step|act next)/i
        )
    );
    const proofThin = signalBool(
        signals,
        "proofThin",
        testCardText(
            card,
            /(proof thin|credibility still thin|proof owner not assigned|truth missing|targeting truth missing|missing ICP)/i
        )
    );
    const coveragePressure = signalBool(
        signals,
        "coveragePressure",
        testCardText(card, /(coverage pressure|coverage gap)/i)
    );
    const driftSignal = signalBool(
        signals,
        "driftSignal",
        testCardText(card, /(drift|drifting|stale|dark)/i)
    );
    const marketMotion = signalBool(
        signals,
        "marketMotion",
        testCardText(card, /(outbound|signal|heat|motion)/i)
    );
    const threadingRisk = signalBool(
        signals,
        "threadingRisk",
        testCardText(card, /(single-threaded)/i)
    );
    const nextStepOverdue = signalBool(signals, "nextStepOverdue", nextStepDaysAway < 0);
    const stageStuck = signalBool(signals, "stageStuck", stageAgeDays > 14);
    const hasAutopsy = signalBool(signals, "hasAutopsy", hasAction(card, /autopsy/i));
    const hasOpenDeal = signalBool(signals, "hasOpenDeal", hasAction(card, /open deal/i));
    const hasSignalConsole = signalBool(signals, "hasSignalConsole", hasAction(card, /signal console/i));
    const hasAdvisor = signalBool(signals, "hasAdvisor", hasAction(card, /advisor/i));
    const hasDiscovery = signalBool(signals, "hasDiscovery", hasAction(card, /discovery/i));
    const hasReplies = signalBool(signals, "hasReplies", false);
    const linkedRoomTop = signalBool(signals, "linkedRoomTop", false);
    const causeId = signalText(signals, "causeId", "");
    const pressureType = signalText(signals, "pressureType", "");
    let gapCount = signalNumber(signals, "gapCount", 0, 0, 20);

    const dealRoomPressureScore = summaryNumber(dealHealth, "pressureScore", 0, 0, 100);
    const dealRoomTruthDebt = summaryNumber(dealHealth, "truthDebtCount", 0, 0, 20);
    const signalRoomPressureScore = summaryNumber(signalHealth, "pressureScore", 0, 0, 100);
    const signalRoomMotionReady = summaryBool(signalHealth, "motionReady", false);
    const signalRoomEvidenceThin = summaryBool(signalHealth, "evidenceThin", false);
    const readinessScore = summaryNumber(readinessHealth, "score", 0, 0, 100);
    const readinessFragility = summaryNumber(
        readinessHealth,
        "fragilityScore",
        readinessScore ? 100 - readinessScore : 0,
        0,
        100
    );
    const readinessWeakestDimension = summaryText(readinessHealth, "weakestDimension", "");
    const readinessIcpWeak = summaryBool(readinessHealth, "icpWeak", /icp/i.test(readinessWeakestDimension));
    const readinessDiscoveryWeak = summaryBool(
        readinessHealth,
        "discoveryWeak",
        /discovery/i.test(readinessWeakestDimension)
    );
    const readinessOutreachWeak = summaryBool(
        readinessHealth,
        "outreachWeak",
        /outreach/i.test(readinessWeakestDimension)
    );
    const readinessDealsWeak = summaryBool(
        readinessHealth,
        "dealsWeak",
        /deals/i.test(readinessWeakestDimension)
    );
    const readinessPlaybookWeak = summaryBool(
        readinessHealth,
        "playbookWeak",
        /playbook/i.test(readinessWeakestDimension)
    );
    const quotaQualityScore = summaryNumber(quotaHealth, "qualityScore", 0, 0, 100);
    const quotaPressureScore = summaryNumber(quotaHealth, "pressureScore", 0, 0, 100);
    const quotaTouchesWeek = summaryNumber(quotaHealth, "touchesWeek", 0, 0, 1000000);
    const quotaActiveAccounts = summaryNumber(quotaHealth, "activeAccounts", 0, 0, 1000000);
    const quotaQualityBand = summaryText(quotaHealth, "qualityBand", "");
    const quotaFragile = summaryBool(
        quotaHealth,
        "fragile",
        quotaQualityScore > 0 && quotaQualityScore < 60
    );

    if (!gapCount) {
        if (missingChampion) gapCount += 1;
        if (missingNextStep) gapCount += 1;
        if (proofThin) gapCount += 1;
        if (coveragePressure) gapCount += 1;
        if (driftSignal && family === "risk") gapCount += 1;
        if (warningCount && family === "system") gapCount += warningCount;
        if (family === "icp") gapCount += 1;
        if (truthDebtCount) gapCount += Math.min(3, truthDebtCount);
        if (
            quotaFragile &&
            (family === "move" || family === "opportunity" || family === "risk")
        ) {
            gapCount += 1;
        }
        if (readinessIcpWeak && family === "icp") gapCount += 1;
    }

    return {
        risk,
        heat,
        staleDays,
        amount,
        stageAgeDays,
        qualScore,
        nextStepDaysAway,
        severity,
        urgency,
        truthDebtCount,
        signalCount,
        highConfidenceCount,
        recentCount,
        recoveryCount,
        weightedPipeline,
        roomReadiness,
        threadingDepth,
        warningCount,
        actionCount: countActions(card),
        missingChampion,
        weakChampion,
        missingNextStep,
        proofThin,
        coveragePressure,
        driftSignal,
        marketMotion,
        threadingRisk,
        nextStepOverdue,
        stageStuck,
        hasAutopsy,
        hasOpenDeal,
        hasSignalConsole,
        hasAdvisor,
        hasDiscovery,
        hasReplies,
        linkedRoomTop,
        causeId,
        pressureType,
        gapCount,
        dealRoomPressureScore,
        dealRoomTruthDebt,
        signalRoomPressureScore,
        signalRoomMotionReady,
        signalRoomEvidenceThin,
        readinessScore,
        readinessFragility,
        readinessWeakestDimension,
        readinessIcpWeak,
        readinessDiscoveryWeak,
        readinessOutreachWeak,
        readinessDealsWeak,
        readinessPlaybookWeak,
        quotaQualityScore,
        quotaPressureScore,
        quotaTouchesWeek,
        quotaActiveAccounts,
        quotaQualityBand,
        quotaFragile,
        contextAccounts: Number(context.accounts ?? 0),
        contextSignals: Number(context.signals ?? 0),
        contextDeals: Number(context.deals ?? 0),
        contextIcps: Number(context.icps ?? 0),
        contextMotions: Number(context.motions ?? 0)
    };
}
