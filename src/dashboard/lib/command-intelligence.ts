import type {
    CommandContextSummary,
    CommandEngineInput,
    CommandExplanation,
    CommandFamily,
    CommandObject,
    EngineOptions,
    PrimaryCard,
    RawCommandCard
} from "./types";
import {
    clamp,
    familyPriority,
    normalizeTone,
    roomFamilyLabel,
    signalBool,
    signalNumber,
    slug,
    tx
} from "./engine-helpers";
import { buildSignalProfile } from "./signal-profile";
import {
    buildReasons,
    labelRankingConfidence,
    scoreFamily,
    scoreRankingConfidence
} from "./scoring";

/**
 * Public engine — port of the 4 functions exposed by the legacy
 * `js/command-intelligence.js` (`window.gtmCommandIntelligence`):
 *
 *   - buildCommandObjects(input, options): CommandObject[]
 *   - rankCommandObjects(objects): CommandObject[]
 *   - summarizeCommandContext(objects, options): CommandContextSummary
 *   - explainCommandObject(object, mode): CommandExplanation
 *
 * Mostly a faithful port. Same algorithm, same outputs for same
 * inputs. The Wave 5 aggregator wires the live snapshots into
 * `CommandEngineInput`; Waves 3 + 4 consume the outputs.
 */

// ─── Stability bonus (re-rank smoothing) ────────────────────────────────

function computeStabilityBonus(
    object: { id?: string; title?: string },
    family: CommandFamily,
    options: EngineOptions | undefined
): number {
    const snapshot = options?.previousSnapshot ?? null;
    if (!snapshot) return 0;

    const objectId = tx(object.id);
    const objectTitle = slug(object.title);
    let bonus = 0;

    if (objectId && objectId === tx(snapshot.spotlightObjectId)) bonus += 6;
    else if (objectTitle && objectTitle === slug(snapshot.spotlightTitle)) bonus += 6;

    const topQueueIds = Array.isArray(snapshot.topQueueIds) ? snapshot.topQueueIds : [];
    const topQueueTitles = Array.isArray(snapshot.topQueueTitles)
        ? snapshot.topQueueTitles
        : [];
    if (objectId && topQueueIds.indexOf(objectId) >= 0) bonus += 2;
    else if (objectTitle && topQueueTitles.indexOf(objectTitle) >= 0) bonus += 2;

    if (family === "system") bonus = Math.min(bonus, 4);
    if (family === "icp") bonus = Math.min(bonus, 5);

    return clamp(bonus, 0, 8);
}

// ─── Family-specific object types ──────────────────────────────────────

function objectTypeForFamily(family: CommandFamily): string {
    if (family === "risk") return "deal";
    if (family === "opportunity") return "signal";
    if (family === "advisor") return "motion";
    if (family === "system") return "system";
    if (family === "icp") return "icp";
    return "motion";
}

// ─── finalizeCommandObject ─────────────────────────────────────────────

interface BaseDraft {
    id?: string;
    objectType?: string;
    title?: string;
    copy?: string;
    badge?: string;
    badgeTone?: string;
    metricLabel?: string;
    metricValue?: string;
    meta?: ReadonlyArray<string>;
    actions?: ReadonlyArray<{
        label?: string;
        href?: string;
        roomLabel?: string;
        tone?: string;
    }>;
    sheetKey?: string;
    focusObject?: string;
    focusRoom?: string;
    rankingSignals?: Readonly<Record<string, unknown>> | null;
    stateKey?: string;
    source?: unknown;
}

function finalizeCommandObject(
    base: BaseDraft,
    family: CommandFamily,
    input: CommandEngineInput,
    options: EngineOptions | undefined
): CommandObject {
    const id = tx(base.id) || slug(base.title);
    const meta = Array.isArray(base.meta) ? base.meta.slice() : [];
    const actions = Array.isArray(base.actions)
        ? base.actions.map((a) => ({
              label: tx(a?.label),
              href: tx(a?.href),
              ...(a?.roomLabel ? { roomLabel: tx(a.roomLabel) } : {}),
              ...(a?.tone ? { tone: tx(a.tone) } : {})
          }))
        : [];
    const focusRoom =
        tx(base.focusRoom) || tx((base.actions?.[0] as { roomLabel?: string } | undefined)?.roomLabel);

    // Build profile + score from a shape the helpers can read; the
    // engine helpers use RawCommandCard-style access for badge / meta /
    // actions / rankingSignals / title / copy.
    const profileCard: RawCommandCard & { copy?: string } = {
        ...(base.id ? { id } : {}),
        ...(base.title ? { title: tx(base.title) } : {}),
        ...(base.badge ? { badge: tx(base.badge) } : {}),
        meta,
        actions,
        ...(base.rankingSignals ? { rankingSignals: base.rankingSignals } : {}),
        ...(base.copy ? { copy: tx(base.copy) } : {})
    };

    const profile = buildSignalProfile(profileCard, family, input);
    const baseScore = scoreFamily(profile, family);
    const stabilityBonus = computeStabilityBonus({ id, title: base.title }, family, options);
    const rankingConfidence = scoreRankingConfidence(profile, family);
    const totalScore = clamp(baseScore + stabilityBonus, 0, 100);

    return {
        id,
        objectType: tx(base.objectType) || objectTypeForFamily(family),
        title: tx(base.title),
        copy: tx(base.copy),
        badge: tx(base.badge),
        badgeTone: normalizeTone(base, family),
        metricLabel: tx(base.metricLabel) || tx(base.badge) || "Command state",
        metricValue: tx(base.metricValue) || String(totalScore),
        meta,
        actions,
        sheetKey: tx(base.sheetKey),
        focusObject: tx(base.focusObject) || tx(base.title),
        focusRoom,
        stateKey: tx(base.stateKey) || family,
        rankingSignals: base.rankingSignals ? { ...base.rankingSignals } : null,
        commandFamily: family,
        score: totalScore,
        baseScore,
        stabilityBonus,
        scoreReasons: buildReasons(profileCard, family, profile),
        rankingConfidence,
        rankingConfidenceLabel: labelRankingConfidence(rankingConfidence),
        roomFamilyLabel: roomFamilyLabel(family),
        truthDebtCount: profile.truthDebtCount,
        nextStepOverdue: profile.nextStepOverdue,
        stageStuck: profile.stageStuck,
        causeId: profile.causeId,
        pressureType: profile.pressureType,
        readinessFragility: profile.readinessFragility,
        readinessIcpWeak: profile.readinessIcpWeak,
        quotaPressureScore: profile.quotaPressureScore,
        signalRoomMotionReady: profile.signalRoomMotionReady,
        ...(actions[0]?.href ? { primaryHref: actions[0].href } : {}),
        ...(base.source !== undefined ? { source: base.source } : {})
    };
}

// ─── Card → object converters ───────────────────────────────────────────

function buildObjectFromCard(
    card: RawCommandCard,
    family: CommandFamily,
    input: CommandEngineInput,
    options: EngineOptions | undefined
): CommandObject {
    const sourceId = tx(
        (card as RawCommandCard & { commandId?: string })?.commandId
    );
    const meta = Array.isArray(card.meta) ? card.meta.slice() : [];
    const actions = Array.isArray(card.actions) ? card.actions.slice() : [];
    return finalizeCommandObject(
        {
            id: sourceId || slug(card.title),
            title: tx(card.title),
            ...(card.subtitle ? { copy: tx(card.subtitle) } : {}),
            badge: tx(card.badge),
            badgeTone: normalizeTone(card, family),
            metricLabel: tx(card.badge) || "Command state",
            metricValue: "",
            meta,
            actions,
            ...(card.rankingSignals ? { rankingSignals: { ...card.rankingSignals } } : {}),
            focusObject: tx(card.title),
            focusRoom: tx(actions[0]?.roomLabel ?? ""),
            stateKey: family,
            source: card
        },
        family,
        input,
        options
    );
}

function buildSystemObject(
    input: CommandEngineInput,
    options: EngineOptions | undefined
): CommandObject {
    return finalizeCommandObject(
        {
            id: "system-trust",
            title: "The dashboard is showing stale data right now.",
            copy:
                "Some inputs didn't sync from the cloud and fell back to the copy stored on this device. Don't over-trust the ordering until the sync recovers.",
            badge: "Risk",
            badgeTone: "state-risk",
            metricLabel: "System pressure",
            metricValue: "",
            meta: ["local fallback"],
            actions: [
                {
                    href: "/settings/",
                    label: "Open Settings",
                    tone: "btn-secondary",
                    roomLabel: "Settings"
                },
                {
                    href: "/dashboard/?mode=spotlight",
                    label: "Refresh view",
                    tone: "btn-secondary",
                    roomLabel: "Dashboard"
                }
            ],
            focusObject: "Dashboard out of sync",
            focusRoom: "Settings",
            stateKey: "system"
        },
        "system",
        input,
        options
    );
}

function buildIcpObject(
    input: CommandEngineInput,
    options: EngineOptions | undefined
): CommandObject {
    return finalizeCommandObject(
        {
            id: "icp-truth",
            title: "Save one ICP before the week drifts.",
            copy:
                "You have signals and deals, but no saved ICP. The rest of the app is having to guess who you're selling to. Save one in ICP Studio and the other rooms tighten up.",
            badge: "Missing ICP",
            badgeTone: "state-ready",
            metricLabel: "ICP pressure",
            metricValue: "",
            meta: ["missing ICP", "targeting layer"],
            actions: [
                {
                    href: "/icp-studio/",
                    label: "Open ICP Studio",
                    roomLabel: "ICP Studio"
                }
            ],
            focusObject: "No saved ICP",
            focusRoom: "ICP Studio",
            stateKey: "icp"
        },
        "icp",
        input,
        options
    );
}

function buildFallbackPrimaryObject(
    input: CommandEngineInput,
    options: EngineOptions | undefined
): CommandObject | null {
    const primary: PrimaryCard | null | undefined = input.primary;
    if (!primary) return null;
    return finalizeCommandObject(
        {
            id: "primary-fallback",
            title: tx(primary.title),
            copy: tx(primary.copy),
            badge: tx(primary.label) || "Now",
            badgeTone: normalizeTone(primary as { badgeTone?: string }, "move"),
            metricLabel: "Command state",
            metricValue: "",
            meta: Array.isArray(primary.tags) ? primary.tags.slice() : [],
            actions: Array.isArray(primary.actions) ? primary.actions.slice() : [],
            ...(primary.sheetKey ? { sheetKey: tx(primary.sheetKey) } : {}),
            focusObject: tx(primary.title),
            focusRoom: "",
            stateKey: "move",
            source: primary
        },
        "move",
        input,
        options
    );
}

function dedupeObjects(objects: ReadonlyArray<CommandObject>): CommandObject[] {
    const seen = new Set<string>();
    const out: CommandObject[] = [];
    for (const object of objects) {
        const key = tx(object?.title).toLowerCase();
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(object);
    }
    return out;
}

// ─── Public engine API ─────────────────────────────────────────────────

function inferMoveFamily(card: RawCommandCard): CommandFamily {
    const title = tx(card.title);
    if (/advisor/i.test(title)) return "advisor";
    const blob = title + " " + tx((card as RawCommandCard & { copy?: string }).copy);
    if (/outbound|signal/i.test(blob)) return "opportunity";
    return "move";
}

export function buildCommandObjects(
    input: CommandEngineInput,
    options?: EngineOptions
): CommandObject[] {
    const objects: CommandObject[] = [];
    const riskCards = Array.isArray(input.riskCards) ? input.riskCards : [];
    const moveCards = Array.isArray(input.moveCards) ? input.moveCards : [];

    for (const card of riskCards) {
        objects.push(buildObjectFromCard(card, "risk", input, options));
    }
    for (const card of moveCards) {
        const family = inferMoveFamily(card);
        objects.push(buildObjectFromCard(card, family, input, options));
    }

    if (!objects.length) {
        const fallback = buildFallbackPrimaryObject(input, options);
        if (fallback) objects.push(fallback);
    }

    if (Array.isArray(input.dependencyWarnings) && input.dependencyWarnings.length) {
        objects.push(buildSystemObject(input, options));
    }

    const context = (input.shellContext ?? {}) as Record<string, unknown>;
    const icps = Number(context.icps ?? 0);
    const accounts = Number(context.accounts ?? 0);
    const signals = Number(context.signals ?? 0);
    const deals = Number(context.deals ?? 0);
    if (!icps && (accounts || signals || deals)) {
        objects.push(buildIcpObject(input, options));
    }

    return dedupeObjects(objects);
}

export function rankCommandObjects(
    objects: ReadonlyArray<CommandObject>
): CommandObject[] {
    return objects.slice().sort((a, b) => {
        const aScore = a.score ?? 0;
        const bScore = b.score ?? 0;
        if (bScore !== aScore) return bScore - aScore;
        const aBase = a.baseScore ?? 0;
        const bBase = b.baseScore ?? 0;
        if (bBase !== aBase) return bBase - aBase;
        const aPri = familyPriority(a.commandFamily);
        const bPri = familyPriority(b.commandFamily);
        if (bPri !== aPri) return bPri - aPri;
        return tx(a.title).localeCompare(tx(b.title));
    });
}

export function summarizeCommandContext(
    objects: ReadonlyArray<CommandObject>,
    options?: { limit?: number }
): CommandContextSummary {
    const ranked = rankCommandObjects(objects);
    const limit = options?.limit ?? 6;
    const queue = ranked.slice(0, limit);
    return {
        ranked,
        spotlight: queue[0] ?? null,
        queue,
        riskCards: ranked.filter((o) => o.commandFamily === "risk").slice(0, 3),
        moveCards: ranked
            .filter((o) => o.commandFamily !== "risk" && o.commandFamily !== "system")
            .slice(0, 4),
        systemCards: ranked
            .filter((o) => o.commandFamily === "system" || o.commandFamily === "icp")
            .slice(0, 3)
    };
}

// ─── Explanations ──────────────────────────────────────────────────────

function joinReasons(reasons: ReadonlyArray<string> | undefined): string {
    const list = (Array.isArray(reasons) ? reasons : []).filter(Boolean).slice(0, 2);
    if (!list.length) return "the command pressure is higher than the surrounding work";
    if (list.length === 1) return list[0]!;
    return list[0] + " and " + list[1];
}

function explainLeadCopy(
    object: CommandObject,
    mode: "brief" | "spotlight" | "queue",
    because: string
): string {
    const confidenceLabel = tx(object.rankingConfidenceLabel);
    // Phase 2.2 audit — retired "It is in the light because…" /
    // "The lead is stable because…" canon-doc voice. Sarah parses
    // those as code comments. Plain operator phrasing now.
    if (mode === "queue") {
        if (confidenceLabel === "stable lead")
            return "Ranked here because " + because + ".";
        if (confidenceLabel === "supported")
            return "Ranked here because " + because + ".";
        return "Visible because " + because + ".";
    }
    if (confidenceLabel === "stable lead")
        return "At the top because " + because + ".";
    if (confidenceLabel === "supported")
        return "At the top because " + because + ".";
    return "At the top because " + because + ".";
}

function explainTitleForObject(
    object: CommandObject,
    mode: "brief" | "spotlight" | "queue"
): string {
    const family = tx(object.commandFamily);
    const causeId = tx(object.causeId);
    const truthDebtCount = Number(object.truthDebtCount ?? 0);
    const nextStepOverdue = !!object.nextStepOverdue;
    const stageStuck = !!object.stageStuck;
    const signals = object.rankingSignals ?? null;
    const highConfidenceCount = signalNumber(signals, "highConfidenceCount", 0, 0, 1000);
    const hasReplies = signalBool(signals, "hasReplies", false);
    const linkedRoomTop = signalBool(signals, "linkedRoomTop", false);
    const quotaPressureScore = Number(object.quotaPressureScore ?? 0);
    const readinessFragility = Number(object.readinessFragility ?? 0);
    const readinessIcpWeak = !!object.readinessIcpWeak;

    // Phase 2.2 audit — rewritten in operator voice. Was canon-doc
    // ("Signal density makes this move real" / "The live room says
    // this deal needs intervention" / "Targeting truth still anchors
    // the rest"). Sarah reads these now without canon fluency.
    if (mode === "queue") {
        if (family === "risk") {
            if (linkedRoomTop) return "Deal Workspace flagged this for intervention.";
            if (truthDebtCount >= 2) return "Qualification gaps are real here.";
            if (quotaPressureScore >= 60) return "Quota pressure is showing up as deal weakness.";
            if (nextStepOverdue || stageStuck) return "Next step is overdue.";
            return "Worth recovering before chasing new pipeline.";
        }
        if (family === "advisor") return "An advisor ask would actually move this.";
        if ((family === "opportunity" || family === "move") && quotaPressureScore >= 60) {
            return "The week's pipeline math needs this move.";
        }
        if ((family === "opportunity" || family === "move") && hasReplies) {
            return "The thread is warm — push the next touch now.";
        }
        if (family === "opportunity" && highConfidenceCount >= 2) {
            return "Multiple high-confidence signals make this real.";
        }
        if (family === "opportunity" && causeId === "coverage_gap") {
            return "Coverage gap needs more open opportunities.";
        }
        if (family === "opportunity" || family === "move") {
            return "Highest-leverage next move on the radar.";
        }
        if (family === "icp" && readinessIcpWeak) {
            return "ICP sharpness needs another round.";
        }
        if (family === "icp") return "ICP shapes how everything below ranks.";
        if (readinessFragility >= 45) return "Workspace maturity needs another anchor.";
        if (quotaPressureScore >= 60) return "Plan math is still ahead of execution.";
        return "Visible so the system stays honest.";
    }

    if (family === "risk") {
        if (linkedRoomTop) return "Deal Workspace flagged this deal as slipping.";
        if (truthDebtCount >= 2) return "Qualification gaps are real here.";
        if (quotaPressureScore >= 60) return "Quota pressure is showing up as deal weakness.";
        if (nextStepOverdue || stageStuck) return "Next step is overdue and the stage is stuck.";
        return "Worth recovering before chasing new pipeline.";
    }
    if (family === "advisor") return "An advisor ask would actually move this.";
    if ((family === "opportunity" || family === "move") && quotaPressureScore >= 60) {
        return "The week's pipeline math needs this move.";
    }
    if ((family === "opportunity" || family === "move") && hasReplies) {
        return "The thread is warm — push the next touch now.";
    }
    if (family === "opportunity" && highConfidenceCount >= 2) {
        return "Multiple high-confidence signals make this real.";
    }
    if (family === "opportunity" && causeId === "coverage_gap") {
        return "Coverage gap needs more open opportunities.";
    }
    if (family === "opportunity" || family === "move") {
        return "Highest-leverage move available right now.";
    }
    if (family === "icp" && readinessIcpWeak) {
        return "ICP sharpness needs another round.";
    }
    if (family === "icp") return "ICP shapes how everything below ranks.";
    if (readinessFragility >= 45) return "Workspace maturity needs another anchor.";
    if (quotaPressureScore >= 60) return "Plan math is still ahead of execution.";
    return "Visible so the rest of the system stays honest.";
}

export function explainCommandObject(
    object: CommandObject,
    mode: "brief" | "spotlight" | "queue"
): CommandExplanation {
    const because = joinReasons(object.scoreReasons);
    const label = mode === "queue" ? "Why this order" : "Why this is here";
    return {
        label,
        title: explainTitleForObject(object, mode),
        copy: explainLeadCopy(object, mode, because)
    };
}
