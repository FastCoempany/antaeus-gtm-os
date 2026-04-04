(function () {
    'use strict';

    function tx(value) {
        return String(value || '').trim();
    }

    function slug(value) {
        return tx(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'item';
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function pushReason(list, reason) {
        var next = tx(reason);
        if (!next) return;
        if (list.indexOf(next) >= 0) return;
        list.push(next);
    }

    function parseNumber(source) {
        var match = String(source || '').match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : 0;
    }

    function parseRisk(card) {
        return clamp(parseNumber(card && card.badge), 0, 100);
    }

    function parseHeat(card) {
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        for (var i = 0; i < meta.length; i++) {
            if (/heat/i.test(meta[i])) return clamp(parseNumber(meta[i]), 0, 100);
        }
        return 0;
    }

    function parseStaleDays(card) {
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        for (var i = 0; i < meta.length; i++) {
            if (/stale/i.test(meta[i])) return clamp(parseNumber(meta[i]), 0, 365);
        }
        return 0;
    }

    function parseMoney(card) {
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        for (var i = 0; i < meta.length; i++) {
            if (/\$/.test(meta[i])) return clamp(parseNumber(meta[i]), 0, 100000000);
        }
        return 0;
    }

    function hasAction(card, pattern) {
        var actions = Array.isArray(card && card.actions) ? card.actions : [];
        return actions.some(function (action) {
            return pattern.test(String((action && action.label) || ''));
        });
    }

    function countActions(card) {
        var actions = Array.isArray(card && card.actions) ? card.actions : [];
        return actions.length;
    }

    function normalizeTone(card, family) {
        if (card && card.badgeTone) return card.badgeTone;
        if (family === 'risk') return 'state-risk';
        if (family === 'system') return 'state-risk';
        if (family === 'icp') return 'state-ready';
        return 'state-live';
    }

    function familyPriority(family) {
        if (family === 'risk') return 5;
        if (family === 'advisor') return 4;
        if (family === 'opportunity') return 4;
        if (family === 'move') return 3;
        if (family === 'icp') return 2;
        if (family === 'system') return 1;
        return 0;
    }

    function roomFamilyLabel(family) {
        if (family === 'risk') return 'Pipeline';
        if (family === 'advisor') return 'Leverage';
        if (family === 'opportunity') return 'Motion';
        if (family === 'move') return 'Command';
        if (family === 'icp') return 'Truth';
        if (family === 'system') return 'System';
        return 'Command';
    }

    function amountPressure(amount) {
        if (amount >= 1000000) return 16;
        if (amount >= 500000) return 13;
        if (amount >= 250000) return 10;
        if (amount >= 100000) return 7;
        if (amount > 0) return 3;
        return 0;
    }

    function readSignals(card) {
        return card && card.rankingSignals && typeof card.rankingSignals === 'object'
            ? card.rankingSignals
            : {};
    }

    function signalNumber(signals, key, fallback, min, max) {
        if (signals && signals[key] !== undefined && signals[key] !== null && signals[key] !== '') {
            return clamp(parseNumber(signals[key]), min, max);
        }
        return fallback;
    }

    function signalBool(signals, key, fallback) {
        if (signals && signals[key] !== undefined && signals[key] !== null) return !!signals[key];
        return !!fallback;
    }

    function signalText(signals, key, fallback) {
        var value = signals && signals[key] !== undefined && signals[key] !== null ? signals[key] : fallback;
        return tx(value);
    }

    function readHealthSummary(input, key) {
        var summaries = input && input.healthSummaries && typeof input.healthSummaries === 'object'
            ? input.healthSummaries
            : {};
        var summary = summaries[key];
        return summary && typeof summary === 'object' ? summary : null;
    }

    function summaryNumber(summary, key, fallback, min, max) {
        if (summary && summary[key] !== undefined && summary[key] !== null && summary[key] !== '') {
            return clamp(parseNumber(summary[key]), min, max);
        }
        return fallback;
    }

    function summaryBool(summary, key, fallback) {
        if (summary && summary[key] !== undefined && summary[key] !== null) return !!summary[key];
        return !!fallback;
    }

    function summaryText(summary, key, fallback) {
        var value = summary && summary[key] !== undefined && summary[key] !== null ? summary[key] : fallback;
        return tx(value);
    }

    function formatCauseLabel(causeId) {
        var label = tx(causeId).replace(/_/g, ' ');
        if (!label) return '';
        if (label === 'no nextstep') return 'next step missing';
        if (label === 'stale thread') return 'thread stale';
        if (label === 'no champion') return 'champion missing';
        if (label === 'champion weak') return 'champion weak';
        if (label === 'no eb') return 'economic buyer missing';
        if (label === 'no process') return 'process unclear';
        if (label === 'impact not real') return 'impact vague';
        if (label === 'usecase blurry') return 'use case blurry';
        if (label === 'single threaded') return 'single-threaded';
        if (label === 'next step overdue') return 'next step overdue';
        return label;
    }

    function testCardText(card, pattern) {
        var source = [
            tx(card && card.title),
            tx(card && card.copy),
            Array.isArray(card && card.meta) ? card.meta.join(' ') : ''
        ].join(' ');
        return pattern.test(source);
    }

    function buildSignalProfile(card, family, input) {
        var context = input && input.shellContext ? input.shellContext : {};
        var warningCount = Array.isArray(input && input.dependencyWarnings) ? input.dependencyWarnings.length : 0;
        var dealHealth = readHealthSummary(input, 'deal');
        var signalHealth = readHealthSummary(input, 'signal');
        var readinessHealth = readHealthSummary(input, 'readiness');
        var quotaHealth = readHealthSummary(input, 'quota');
        var signals = readSignals(card);
        var risk = signalNumber(signals, 'risk', parseRisk(card), 0, 100);
        var heat = signalNumber(signals, 'heat', parseHeat(card), 0, 100);
        var staleDays = signalNumber(signals, 'staleDays', parseStaleDays(card), 0, 365);
        var amount = signalNumber(signals, 'amount', parseMoney(card), 0, 100000000);
        var stageAgeDays = signalNumber(signals, 'stageAgeDays', 0, 0, 365);
        var qualScore = signalNumber(signals, 'qualScore', 0, 0, 18);
        var nextStepDaysAway = signalNumber(signals, 'nextStepDaysAway', 0, -365, 365);
        var severity = signalNumber(signals, 'severity', 0, 0, 10);
        var urgency = signalNumber(signals, 'urgency', 0, 0, 100);
        var truthDebtCount = signalNumber(signals, 'truthDebtCount', 0, 0, 12);
        var signalCount = signalNumber(signals, 'signalCount', 0, 0, 1000);
        var highConfidenceCount = signalNumber(signals, 'highConfidenceCount', 0, 0, 1000);
        var recentCount = signalNumber(signals, 'recentCount', 0, 0, 1000);
        var recoveryCount = signalNumber(signals, 'recoveryCount', 0, 0, 50);
        var weightedPipeline = signalNumber(signals, 'weightedPipeline', 0, 0, 100000000);
        var roomReadiness = signalNumber(signals, 'roomReadiness', countActions(card), 0, 10);
        var threadingDepth = signalNumber(signals, 'threadingDepth', 0, 0, 20);
        var missingChampion = signalBool(signals, 'missingChampion', testCardText(card, /(champion(?:\s+\w+){0,4}\s+(?:assumed|unproven|missing)|no champion|single-threaded)/i));
        var weakChampion = signalBool(signals, 'weakChampion', testCardText(card, /(champion weak|non-committal)/i));
        var missingNextStep = signalBool(signals, 'missingNextStep', testCardText(card, /(no dated next step|next step missing|angle still missing|no real next step|act next)/i));
        var proofThin = signalBool(signals, 'proofThin', testCardText(card, /(proof thin|credibility still thin|proof owner not assigned|truth missing|targeting truth missing|missing ICP)/i));
        var coveragePressure = signalBool(signals, 'coveragePressure', testCardText(card, /(coverage pressure|coverage gap)/i));
        var driftSignal = signalBool(signals, 'driftSignal', testCardText(card, /(drift|drifting|stale|dark)/i));
        var marketMotion = signalBool(signals, 'marketMotion', testCardText(card, /(outbound|signal|heat|motion)/i));
        var threadingRisk = signalBool(signals, 'threadingRisk', testCardText(card, /(single-threaded)/i));
        var nextStepOverdue = signalBool(signals, 'nextStepOverdue', nextStepDaysAway < 0);
        var stageStuck = signalBool(signals, 'stageStuck', stageAgeDays > 14);
        var hasAutopsy = signalBool(signals, 'hasAutopsy', hasAction(card, /autopsy/i));
        var hasOpenDeal = signalBool(signals, 'hasOpenDeal', hasAction(card, /open deal/i));
        var hasSignalConsole = signalBool(signals, 'hasSignalConsole', hasAction(card, /signal console/i));
        var hasAdvisor = signalBool(signals, 'hasAdvisor', hasAction(card, /advisor/i));
        var hasDiscovery = signalBool(signals, 'hasDiscovery', hasAction(card, /discovery/i));
        var hasReplies = signalBool(signals, 'hasReplies', false);
        var linkedRoomTop = signalBool(signals, 'linkedRoomTop', false);
        var causeId = signalText(signals, 'causeId', '');
        var pressureType = signalText(signals, 'pressureType', '');
        var gapCount = signalNumber(signals, 'gapCount', 0, 0, 20);
        var dealRoomPressureScore = summaryNumber(dealHealth, 'pressureScore', 0, 0, 100);
        var dealRoomTruthDebt = summaryNumber(dealHealth, 'truthDebtCount', 0, 0, 20);
        var signalRoomPressureScore = summaryNumber(signalHealth, 'pressureScore', 0, 0, 100);
        var signalRoomMotionReady = summaryBool(signalHealth, 'motionReady', false);
        var signalRoomEvidenceThin = summaryBool(signalHealth, 'evidenceThin', false);
        var readinessScore = summaryNumber(readinessHealth, 'score', 0, 0, 100);
        var readinessFragility = summaryNumber(readinessHealth, 'fragilityScore', readinessScore ? (100 - readinessScore) : 0, 0, 100);
        var readinessWeakestDimension = summaryText(readinessHealth, 'weakestDimension', '');
        var readinessIcpWeak = summaryBool(readinessHealth, 'icpWeak', /icp/i.test(readinessWeakestDimension));
        var readinessDiscoveryWeak = summaryBool(readinessHealth, 'discoveryWeak', /discovery/i.test(readinessWeakestDimension));
        var readinessOutreachWeak = summaryBool(readinessHealth, 'outreachWeak', /outreach/i.test(readinessWeakestDimension));
        var readinessDealsWeak = summaryBool(readinessHealth, 'dealsWeak', /deals/i.test(readinessWeakestDimension));
        var readinessPlaybookWeak = summaryBool(readinessHealth, 'playbookWeak', /playbook/i.test(readinessWeakestDimension));
        var quotaQualityScore = summaryNumber(quotaHealth, 'qualityScore', 0, 0, 100);
        var quotaPressureScore = summaryNumber(quotaHealth, 'pressureScore', 0, 0, 100);
        var quotaTouchesWeek = summaryNumber(quotaHealth, 'touchesWeek', 0, 0, 1000000);
        var quotaActiveAccounts = summaryNumber(quotaHealth, 'activeAccounts', 0, 0, 1000000);
        var quotaQualityBand = summaryText(quotaHealth, 'qualityBand', '');
        var quotaFragile = summaryBool(quotaHealth, 'fragile', quotaQualityScore > 0 && quotaQualityScore < 60);

        if (!gapCount) {
            if (missingChampion) gapCount += 1;
            if (missingNextStep) gapCount += 1;
            if (proofThin) gapCount += 1;
            if (coveragePressure) gapCount += 1;
            if (driftSignal && family === 'risk') gapCount += 1;
            if (warningCount && family === 'system') gapCount += warningCount;
            if (family === 'icp') gapCount += 1;
            if (truthDebtCount) gapCount += Math.min(3, truthDebtCount);
            if (quotaFragile && (family === 'move' || family === 'opportunity' || family === 'risk')) gapCount += 1;
            if (readinessIcpWeak && family === 'icp') gapCount += 1;
        }

        return {
            risk: risk,
            heat: heat,
            staleDays: staleDays,
            amount: amount,
            stageAgeDays: stageAgeDays,
            qualScore: qualScore,
            nextStepDaysAway: nextStepDaysAway,
            severity: severity,
            urgency: urgency,
            truthDebtCount: truthDebtCount,
            signalCount: signalCount,
            highConfidenceCount: highConfidenceCount,
            recentCount: recentCount,
            recoveryCount: recoveryCount,
            weightedPipeline: weightedPipeline,
            roomReadiness: roomReadiness,
            threadingDepth: threadingDepth,
            warningCount: warningCount,
            actionCount: countActions(card),
            missingChampion: missingChampion,
            weakChampion: weakChampion,
            missingNextStep: missingNextStep,
            proofThin: proofThin,
            coveragePressure: coveragePressure,
            driftSignal: driftSignal,
            marketMotion: marketMotion,
            threadingRisk: threadingRisk,
            nextStepOverdue: nextStepOverdue,
            stageStuck: stageStuck,
            hasAutopsy: hasAutopsy,
            hasOpenDeal: hasOpenDeal,
            hasSignalConsole: hasSignalConsole,
            hasAdvisor: hasAdvisor,
            hasDiscovery: hasDiscovery,
            hasReplies: hasReplies,
            linkedRoomTop: linkedRoomTop,
            causeId: causeId,
            pressureType: pressureType,
            gapCount: gapCount,
            dealRoomPressureScore: dealRoomPressureScore,
            dealRoomTruthDebt: dealRoomTruthDebt,
            signalRoomPressureScore: signalRoomPressureScore,
            signalRoomMotionReady: signalRoomMotionReady,
            signalRoomEvidenceThin: signalRoomEvidenceThin,
            readinessScore: readinessScore,
            readinessFragility: readinessFragility,
            readinessWeakestDimension: readinessWeakestDimension,
            readinessIcpWeak: readinessIcpWeak,
            readinessDiscoveryWeak: readinessDiscoveryWeak,
            readinessOutreachWeak: readinessOutreachWeak,
            readinessDealsWeak: readinessDealsWeak,
            readinessPlaybookWeak: readinessPlaybookWeak,
            quotaQualityScore: quotaQualityScore,
            quotaPressureScore: quotaPressureScore,
            quotaTouchesWeek: quotaTouchesWeek,
            quotaActiveAccounts: quotaActiveAccounts,
            quotaQualityBand: quotaQualityBand,
            quotaFragile: quotaFragile,
            contextAccounts: Number(context.accounts || 0),
            contextSignals: Number(context.signals || 0),
            contextDeals: Number(context.deals || 0),
            contextIcps: Number(context.icps || 0),
            contextMotions: Number(context.motions || 0)
        };
    }

    function buildRiskReasons(card, profile) {
        var reasons = [];
        if (profile.risk) pushReason(reasons, 'risk ' + profile.risk);
        if (profile.staleDays) pushReason(reasons, profile.staleDays + 'd stale');
        if (profile.nextStepOverdue) pushReason(reasons, 'next step overdue');
        if (profile.proofThin) pushReason(reasons, 'proof thin');
        if (profile.truthDebtCount >= 2) pushReason(reasons, 'truth debt');
        if (profile.recoveryCount) pushReason(reasons, 'recovery queue');
        if (profile.missingChampion) pushReason(reasons, 'champion unproven');
        if (profile.weakChampion) pushReason(reasons, 'champion weak');
        if (profile.missingNextStep) pushReason(reasons, 'next step missing');
        if (profile.threadingRisk) pushReason(reasons, 'single-threaded');
        if (profile.stageStuck) pushReason(reasons, 'stage stuck');
        if (profile.dealRoomPressureScore >= 60) pushReason(reasons, 'room pressure high');
        if (profile.readinessDealsWeak) pushReason(reasons, 'deals weakest dimension');
        if (profile.quotaPressureScore >= 60) pushReason(reasons, 'quota pressure');
        if (profile.linkedRoomTop) pushReason(reasons, 'room lead');
        if (profile.hasAutopsy) pushReason(reasons, 'failure mode exposed');
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        meta.forEach(function (item) {
            if (/\$/.test(item)) return;
            if (/stale|risk/i.test(item)) return;
            if (reasons.length >= 4) return;
            pushReason(reasons, item);
        });
        return reasons.slice(0, 4);
    }

    function buildMoveReasons(card, profile, family) {
        var reasons = [];
        if (profile.causeId) pushReason(reasons, formatCauseLabel(profile.causeId));
        if (profile.heat) pushReason(reasons, 'heat ' + profile.heat);
        if (profile.coveragePressure) pushReason(reasons, 'coverage pressure');
        if (profile.highConfidenceCount >= 2) pushReason(reasons, 'high-conf cluster');
        if (profile.recentCount >= 2) pushReason(reasons, 'fresh signals');
        if (profile.truthDebtCount >= 2) pushReason(reasons, 'truth debt');
        if (profile.proofThin) pushReason(reasons, 'proof thin');
        if (profile.nextStepOverdue) pushReason(reasons, 'next step overdue');
        if (profile.missingNextStep) pushReason(reasons, 'next step missing');
        if (profile.quotaPressureScore >= 60) pushReason(reasons, 'quota pressure');
        if (profile.signalRoomMotionReady) pushReason(reasons, 'signal room ready');
        if (profile.signalRoomEvidenceThin) pushReason(reasons, 'evidence still thin');
        if (profile.readinessOutreachWeak) pushReason(reasons, 'outreach weakest link');
        if (profile.readinessDiscoveryWeak) pushReason(reasons, 'discovery weakest link');
        if (profile.readinessPlaybookWeak && family === 'advisor') pushReason(reasons, 'playbook weakest link');
        if (profile.hasReplies) pushReason(reasons, 'reply path');
        if (family === 'advisor' || profile.hasAdvisor) pushReason(reasons, 'advisor leverage');
        if (family === 'opportunity' || profile.hasSignalConsole) pushReason(reasons, 'market motion');
        if (profile.linkedRoomTop) pushReason(reasons, 'room lead');
        if (profile.roomReadiness >= 2) pushReason(reasons, 'room ready');
        if (!reasons.length && profile.risk) pushReason(reasons, 'risk ' + profile.risk);
        if (!reasons.length && profile.hasOpenDeal) pushReason(reasons, 'room ready');
        if (!reasons.length) pushReason(reasons, 'next move ready');
        return reasons.slice(0, 4);
    }

    function buildSystemReasons(profile) {
        var reasons = [];
        if (profile.warningCount) pushReason(reasons, profile.warningCount + ' sync warning' + (profile.warningCount === 1 ? '' : 's'));
        if (profile.readinessScore) pushReason(reasons, 'readiness ' + profile.readinessScore + '/100');
        if (profile.readinessWeakestDimension) pushReason(reasons, profile.readinessWeakestDimension.toLowerCase() + ' weakest dimension');
        if (profile.quotaPressureScore >= 60) pushReason(reasons, 'quota pressure');
        if (profile.quotaQualityBand) pushReason(reasons, 'plan ' + profile.quotaQualityBand.toLowerCase());
        pushReason(reasons, 'local fallback active');
        return reasons.slice(0, 4);
    }

    function buildIcpReasons(profile) {
        var reasons = [];
        if (profile.readinessIcpWeak) pushReason(reasons, 'ICP weakest dimension');
        pushReason(reasons, 'targeting truth missing');
        if (profile.quotaPressureScore >= 60) pushReason(reasons, 'quota pressure is downstream');
        if (profile.contextSignals || profile.contextAccounts) pushReason(reasons, 'market layer already live');
        if (profile.contextDeals) pushReason(reasons, 'deal layer depends on ICP');
        return reasons.slice(0, 4);
    }

    function scoreRiskCard(profile) {
        var score = (profile.risk * 0.5) + (profile.staleDays * 1.1) + amountPressure(profile.amount);
        score += Math.max(0, (14 - profile.qualScore)) * 1.1;
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

    function scoreMoveCard(profile, family) {
        var score = family === 'advisor' ? 66 : family === 'opportunity' ? 62 : 56;
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
        if (profile.causeId === 'coverage_gap') score += 8;
        if (profile.causeId === 'no_nextstep' || profile.causeId === 'next_step_overdue') score += 7;
        if (profile.causeId === 'no_champion' || profile.causeId === 'champion_weak') score += 6;
        if (profile.quotaPressureScore >= 60 && (family === 'move' || family === 'opportunity')) score += 7;
        if (profile.signalRoomMotionReady && family === 'opportunity') score += 6;
        if (profile.readinessOutreachWeak && (family === 'move' || family === 'opportunity')) score += 4;
        if (profile.readinessDiscoveryWeak && family === 'move') score += 3;
        if (profile.readinessPlaybookWeak && family === 'advisor') score += 5;
        if (family === 'advisor') score += 8;
        if (family === 'opportunity') score += 6;
        return clamp(Math.round(score), 0, 100);
    }

    function scoreSystemCard(profile) {
        return clamp(Math.round(
            48 +
            (profile.warningCount * 10) +
            (profile.contextDeals ? 4 : 0) +
            Math.min(18, profile.readinessFragility * 0.18) +
            Math.min(14, profile.quotaPressureScore * 0.14)
        ), 0, 94);
    }

    function scoreIcpCard(profile) {
        var score = 52;
        if (profile.contextAccounts || profile.contextSignals) score += 8;
        if (profile.contextDeals) score += 10;
        if (profile.contextMotions) score += 4;
        if (profile.readinessIcpWeak) score += 18;
        if (profile.quotaPressureScore >= 60) score += 4;
        return clamp(Math.round(score), 0, 86);
    }

    function scoreRankingConfidence(profile, family) {
        var confidence = 36;
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
        if (family === 'advisor' || family === 'opportunity') confidence += 6;
        if (family === 'system' || family === 'icp') confidence += 10;
        return clamp(Math.round(confidence), 40, 94);
    }

    function labelRankingConfidence(score) {
        if (score >= 78) return 'stable lead';
        if (score >= 58) return 'supported';
        return 'mixed signal';
    }

    function computeStabilityBonus(object, family, options) {
        var snapshot = options && options.previousSnapshot ? options.previousSnapshot : null;
        if (!snapshot) return 0;

        var objectId = tx(object && object.id);
        var objectTitle = slug(object && object.title);
        var bonus = 0;

        if (objectId && objectId === tx(snapshot.spotlightObjectId)) bonus += 6;
        else if (objectTitle && objectTitle === slug(snapshot.spotlightTitle)) bonus += 6;

        var topQueueIds = Array.isArray(snapshot.topQueueIds) ? snapshot.topQueueIds : [];
        var topQueueTitles = Array.isArray(snapshot.topQueueTitles) ? snapshot.topQueueTitles : [];
        if (objectId && topQueueIds.indexOf(objectId) >= 0) bonus += 2;
        else if (objectTitle && topQueueTitles.indexOf(objectTitle) >= 0) bonus += 2;

        if (family === 'system') bonus = Math.min(bonus, 4);
        if (family === 'icp') bonus = Math.min(bonus, 5);

        return clamp(bonus, 0, 8);
    }

    function buildReasons(card, family, profile) {
        if (family === 'risk') return buildRiskReasons(card, profile);
        if (family === 'system') return buildSystemReasons(profile);
        if (family === 'icp') return buildIcpReasons(profile);
        return buildMoveReasons(card, profile, family);
    }

    function scoreFamily(profile, family) {
        if (family === 'risk') return scoreRiskCard(profile);
        if (family === 'system') return scoreSystemCard(profile);
        if (family === 'icp') return scoreIcpCard(profile);
        return scoreMoveCard(profile, family);
    }

    function objectTypeForFamily(family) {
        if (family === 'risk') return 'deal';
        if (family === 'opportunity') return 'signal';
        if (family === 'advisor') return 'motion';
        if (family === 'system') return 'system';
        if (family === 'icp') return 'icp';
        return 'motion';
    }

    function finalizeCommandObject(base, family, input, options) {
        var object = {
            id: tx(base && base.id) || slug(base && base.title),
            objectType: tx(base && base.objectType) || objectTypeForFamily(family),
            title: tx(base && base.title),
            copy: tx(base && base.copy),
            badge: tx(base && base.badge),
            badgeTone: normalizeTone(base, family),
            metricLabel: tx(base && base.metricLabel) || tx(base && base.badge) || 'Command state',
            metricValue: tx(base && base.metricValue),
            meta: Array.isArray(base && base.meta) ? base.meta.slice() : [],
            actions: Array.isArray(base && base.actions) ? base.actions.slice() : [],
            sheetKey: tx(base && base.sheetKey),
            focusObject: tx(base && base.focusObject) || tx(base && base.title),
            focusRoom: tx(base && base.focusRoom) || (((base && base.actions && base.actions[0]) || {}).roomLabel || ''),
            rankingSignals: base && base.rankingSignals ? Object.assign({}, base.rankingSignals) : null,
            commandFamily: family,
            stateKey: tx(base && base.stateKey) || family,
            source: base && base.source ? base.source : null
        };
        var profile = buildSignalProfile(object, family, input);
        var baseScore = scoreFamily(profile, family);
        var stabilityBonus = computeStabilityBonus(object, family, options);
        var rankingConfidence = scoreRankingConfidence(profile, family);

        object.baseScore = baseScore;
        object.stabilityBonus = stabilityBonus;
        object.score = clamp(baseScore + stabilityBonus, 0, 100);
        object.metricValue = object.metricValue || String(object.score);
        object.scoreReasons = buildReasons(object, family, profile);
        object.rankingConfidence = rankingConfidence;
        object.rankingConfidenceLabel = labelRankingConfidence(rankingConfidence);
        object.roomFamilyLabel = roomFamilyLabel(family);
        object.truthDebtCount = profile.truthDebtCount;
        object.nextStepOverdue = profile.nextStepOverdue;
        object.stageStuck = profile.stageStuck;
        object.causeId = profile.causeId;
        object.pressureType = profile.pressureType;
        object.readinessFragility = profile.readinessFragility;
        object.readinessIcpWeak = profile.readinessIcpWeak;
        object.quotaPressureScore = profile.quotaPressureScore;
        object.signalRoomMotionReady = profile.signalRoomMotionReady;

        return object;
    }

    function buildObjectFromCard(card, family, input, options) {
        return finalizeCommandObject({
            id: tx(card && card.commandId) || slug(card && card.title),
            title: tx(card && card.title),
            copy: tx(card && card.copy),
            badge: tx(card && card.badge),
            badgeTone: normalizeTone(card, family),
            metricLabel: tx(card && card.badge) || 'Command state',
            metricValue: '',
            meta: Array.isArray(card && card.meta) ? card.meta.slice() : [],
            actions: Array.isArray(card && card.actions) ? card.actions.slice() : [],
            sheetKey: tx(card && card.sheetKey),
            rankingSignals: card && card.rankingSignals ? Object.assign({}, card.rankingSignals) : null,
            focusObject: tx(card && card.title),
            focusRoom: card && card.actions && card.actions[0] && card.actions[0].roomLabel ? card.actions[0].roomLabel : '',
            stateKey: family,
            source: card || null
        }, family, input, options);
    }

    function buildSystemObject(input, options) {
        return finalizeCommandObject({
            id: 'system-trust',
            title: 'Repair trust in the command surface.',
            copy: 'Some synced inputs fell back to local state. Rebuild trust before you over-read the current ordering.',
            badge: 'Risk',
            badgeTone: 'state-risk',
            metricLabel: 'System pressure',
            metricValue: '',
            meta: ['local fallback'],
            actions: [
                { href: '/app/settings/', label: 'Open Settings', tone: 'btn-secondary', roomLabel: 'Settings' },
                { href: '/app/dashboard/?mode=spotlight', label: 'Refresh view', tone: 'btn-secondary', roomLabel: 'Dashboard' }
            ],
            focusObject: 'Command surface trust',
            focusRoom: 'Settings',
            stateKey: 'system'
        }, 'system', input, options);
    }

    function buildIcpObject(input, options) {
        return finalizeCommandObject({
            id: 'icp-truth',
            title: 'Save one ICP before the week drifts.',
            copy: 'Market signals or deals exist, but targeting truth is still missing. The system is carrying that ambiguity everywhere else.',
            badge: 'Truth gap',
            badgeTone: 'state-ready',
            metricLabel: 'ICP pressure',
            metricValue: '',
            meta: ['missing ICP', 'targeting layer'],
            actions: [
                { href: '/app/icp-studio/', label: 'Open ICP Studio', roomLabel: 'ICP Studio' }
            ],
            focusObject: 'ICP truth',
            focusRoom: 'ICP Studio',
            stateKey: 'icp'
        }, 'icp', input, options);
    }

    function buildFallbackPrimaryObject(input, options) {
        var primary = input && input.primary ? input.primary : null;
        if (!primary) return null;
        return finalizeCommandObject({
            id: 'primary-fallback',
            title: tx(primary.title),
            copy: tx(primary.copy),
            badge: tx(primary.label) || 'Now',
            badgeTone: normalizeTone(primary, 'move'),
            metricLabel: 'Command state',
            metricValue: '',
            meta: Array.isArray(primary.tags) ? primary.tags.slice() : [],
            actions: Array.isArray(primary.actions) ? primary.actions.slice() : [],
            sheetKey: tx(primary.sheetKey),
            focusObject: tx(primary.title),
            focusRoom: '',
            stateKey: 'move',
            source: primary
        }, 'move', input, options);
    }

    function dedupeObjects(objects) {
        var seen = {};
        return (objects || []).filter(function (object) {
            var key = tx(object && object.title).toLowerCase();
            if (!key) return false;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function buildCommandObjects(input, options) {
        var objects = [];
        var riskCards = Array.isArray(input && input.riskCards) ? input.riskCards : [];
        var moveCards = Array.isArray(input && input.moveCards) ? input.moveCards : [];

        riskCards.forEach(function (card) {
            objects.push(buildObjectFromCard(card, 'risk', input, options));
        });

        moveCards.forEach(function (card) {
            var family = /advisor/i.test(tx(card && card.title))
                ? 'advisor'
                : (/outbound|signal/i.test(tx(card && card.title) + ' ' + tx(card && card.copy)) ? 'opportunity' : 'move');
            objects.push(buildObjectFromCard(card, family, input, options));
        });

        if (!objects.length) {
            var fallback = buildFallbackPrimaryObject(input, options);
            if (fallback) objects.push(fallback);
        }

        if (Array.isArray(input && input.dependencyWarnings) && input.dependencyWarnings.length) {
            objects.push(buildSystemObject(input, options));
        }

        var context = input && input.shellContext ? input.shellContext : {};
        if (!context.icps && (context.accounts || context.signals || context.deals)) {
            objects.push(buildIcpObject(input, options));
        }

        return dedupeObjects(objects);
    }

    function rankCommandObjects(objects) {
        return (objects || []).slice().sort(function (a, b) {
            if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
            if ((b.baseScore || 0) !== (a.baseScore || 0)) return (b.baseScore || 0) - (a.baseScore || 0);
            if (familyPriority(b.commandFamily) !== familyPriority(a.commandFamily)) {
                return familyPriority(b.commandFamily) - familyPriority(a.commandFamily);
            }
            return tx(a.title).localeCompare(tx(b.title));
        });
    }

    function summarizeCommandContext(objects, options) {
        var ranked = rankCommandObjects(objects);
        var limit = options && options.limit ? options.limit : 6;
        var queue = ranked.slice(0, limit);
        return {
            ranked: ranked,
            spotlight: queue[0] || null,
            queue: queue,
            riskCards: ranked.filter(function (object) { return object.commandFamily === 'risk'; }).slice(0, 3),
            moveCards: ranked.filter(function (object) { return object.commandFamily !== 'risk' && object.commandFamily !== 'system'; }).slice(0, 4),
            systemCards: ranked.filter(function (object) { return object.commandFamily === 'system' || object.commandFamily === 'icp'; }).slice(0, 3)
        };
    }

    function joinReasons(reasons) {
        var list = (Array.isArray(reasons) ? reasons : []).filter(Boolean).slice(0, 2);
        if (!list.length) return 'the command pressure is higher than the surrounding work';
        if (list.length === 1) return list[0];
        return list[0] + ' and ' + list[1];
    }

    function explainLeadCopy(object, mode, because) {
        var confidenceLabel = tx(object && object.rankingConfidenceLabel);
        if (mode === 'queue') {
            if (confidenceLabel === 'stable lead') return 'The order is stable because ' + because + '.';
            if (confidenceLabel === 'supported') return 'The order is supported because ' + because + '.';
            return 'This stays visible because ' + because + '.';
        }
        if (confidenceLabel === 'stable lead') return 'The lead is stable because ' + because + '.';
        if (confidenceLabel === 'supported') return 'It is in the light because ' + because + '.';
        return 'It stays in the light because ' + because + '.';
    }

    function explainTitleForObject(object, mode) {
        var family = tx(object && object.commandFamily);
        var causeId = tx(object && object.causeId);
        var truthDebtCount = Number(object && object.truthDebtCount || 0);
        var nextStepOverdue = !!(object && object.nextStepOverdue);
        var stageStuck = !!(object && object.stageStuck);
        var signals = object && object.rankingSignals ? object.rankingSignals : null;
        var highConfidenceCount = signalNumber(signals, 'highConfidenceCount', 0, 0, 1000);
        var hasReplies = signalBool(signals, 'hasReplies', false);
        var linkedRoomTop = signalBool(signals, 'linkedRoomTop', false);
        var quotaPressureScore = Number(object && object.quotaPressureScore || 0);
        var readinessFragility = Number(object && object.readinessFragility || 0);
        var readinessIcpWeak = !!(object && object.readinessIcpWeak);

        if (mode === 'queue') {
            if (family === 'risk') {
                if (linkedRoomTop) return 'The live room says this deal needs intervention.';
                if (truthDebtCount >= 2) return 'Truth debt is dragging this deal down.';
                if (quotaPressureScore >= 60) return 'Quota pressure is exposing deal weakness.';
                if (nextStepOverdue || stageStuck) return 'Execution drift is visible now.';
                return 'Recovery is ahead of expansion.';
            }
            if (family === 'advisor') return 'Leverage is earned here, not decorative.';
            if ((family === 'opportunity' || family === 'move') && quotaPressureScore >= 60) return 'Quota pressure makes this motion real.';
            if ((family === 'opportunity' || family === 'move') && hasReplies) return 'This thread has earned the next motion.';
            if (family === 'opportunity' && highConfidenceCount >= 2) return 'Signal density makes this move real.';
            if (family === 'opportunity' && causeId === 'coverage_gap') return 'Coverage pressure makes this move real.';
            if (family === 'opportunity' || family === 'move') return 'This is the next move with leverage.';
            if (family === 'icp' && readinessIcpWeak) return 'Readiness still says targeting truth is weakest.';
            if (family === 'icp') return 'Truth work stays ahead of scale work.';
            if (readinessFragility >= 45) return 'System fragility is still visible in readiness.';
            if (quotaPressureScore >= 60) return 'The plan is still more fragile than believable.';
            return 'This keeps the command surface honest.';
        }

        if (family === 'risk') {
            if (linkedRoomTop) return 'The live room says this deal is slipping.';
            if (truthDebtCount >= 2) return 'This deal is weak where it matters.';
            if (quotaPressureScore >= 60) return 'Quota pressure is exposing deal weakness.';
            if (nextStepOverdue || stageStuck) return 'This deal is drifting in the open.';
            return 'The week is drifting through this object.';
        }
        if (family === 'advisor') return 'Leverage is earned here, not decorative.';
        if ((family === 'opportunity' || family === 'move') && quotaPressureScore >= 60) return 'Quota pressure makes this motion real.';
        if ((family === 'opportunity' || family === 'move') && hasReplies) return 'This thread has earned the next motion.';
        if (family === 'opportunity' && highConfidenceCount >= 2) return 'Signal density makes this move real.';
        if (family === 'opportunity' && causeId === 'coverage_gap') return 'Coverage pressure makes this move real.';
        if (family === 'opportunity' || family === 'move') return 'This is the highest-leverage move right now.';
        if (family === 'icp' && readinessIcpWeak) return 'Readiness still says targeting truth is weakest.';
        if (family === 'icp') return 'Targeting truth is still upstream of everything else.';
        if (readinessFragility >= 45) return 'System fragility is still visible in readiness.';
        if (quotaPressureScore >= 60) return 'The plan is still more fragile than believable.';
        return 'System trust is affecting the rest of the stack.';
    }

    function explainCommandObject(object, mode) {
        var family = tx(object && object.commandFamily);
        var reasons = Array.isArray(object && object.scoreReasons) ? object.scoreReasons : [];
        var because = joinReasons(reasons);

        if (mode === 'queue') {
            if (family === 'risk') {
                return {
                    label: 'Why this order',
                    title: explainTitleForObject(object, mode),
                    copy: explainLeadCopy(object, mode, because)
                };
            }
            if (family === 'advisor' || family === 'opportunity' || family === 'move') {
                return {
                    label: 'Why this order',
                    title: explainTitleForObject(object, mode),
                    copy: explainLeadCopy(object, mode, because)
                };
            }
            if (family === 'icp') {
                return {
                    label: 'Why this order',
                    title: explainTitleForObject(object, mode),
                    copy: explainLeadCopy(object, mode, because)
                };
            }
            return {
                label: 'Why this order',
                title: explainTitleForObject(object, mode),
                copy: explainLeadCopy(object, mode, because)
            };
        }

        if (family === 'risk') {
            return {
                label: 'Why this is here',
                title: explainTitleForObject(object, mode),
                copy: explainLeadCopy(object, mode, because)
            };
        }
        if (family === 'advisor' || family === 'opportunity' || family === 'move') {
            return {
                label: 'Why this is here',
                title: explainTitleForObject(object, mode),
                copy: explainLeadCopy(object, mode, because)
            };
        }
        if (family === 'icp') {
            return {
                label: 'Why this is here',
                title: explainTitleForObject(object, mode),
                copy: explainLeadCopy(object, mode, because)
            };
        }
        return {
            label: 'Why this is here',
            title: explainTitleForObject(object, mode),
            copy: explainLeadCopy(object, mode, because)
        };
    }

    window.gtmCommandIntelligence = {
        buildCommandObjects: buildCommandObjects,
        rankCommandObjects: rankCommandObjects,
        summarizeCommandContext: summarizeCommandContext,
        explainCommandObject: explainCommandObject
    };
})();
