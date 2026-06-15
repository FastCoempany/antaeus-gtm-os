import type { AccentRole } from "@/components";
import type { IconName } from "@/icons";
import type { IcpDraft, IcpQuality, QualityTier, QualityTone } from "../../lib/types";
import { buildStatement, buildBuyingGroup, buildEvidence, buildFocus } from "../../lib/builders";
import { buildIcpQuality } from "../../lib/quality";
import { hrefToTerritoryArchitect } from "../../lib/handoff";

/**
 * Pure adapters — map the ICP Studio build + quality engine onto the
 * design-system components the DS surface composes. The engine is
 * untouched; these translate the draft into the live shaped outputs, the
 * quality tier into tone, and the sharp ICP into the Wayfinder pulling
 * cell (the move onward into the strategy flow). Kept pure so the
 * mapping is unit-tested without rendering.
 */

/** ICP quality tier → the readout's tone. */
const TIER_TONE: Record<QualityTier, AccentRole> = {
    sharp: "green",
    workable: "blue",
    forming: "amber",
    broad: "red"
};

export function tierTone(tier: QualityTier): AccentRole {
    return TIER_TONE[tier];
}

/** A single quality check's tone → role + glyph. */
const CHECK_TONE: Record<QualityTone, AccentRole> = {
    good: "green",
    warn: "amber",
    risk: "red"
};
const CHECK_ICON: Record<QualityTone, IconName> = {
    good: "ready",
    warn: "attention",
    risk: "at-risk"
};

export function checkTone(tone: QualityTone): AccentRole {
    return CHECK_TONE[tone];
}
export function checkIcon(tone: QualityTone): IconName {
    return CHECK_ICON[tone];
}

/** Effective industry / buyer — the custom-fallback rule, pure. */
function effective(value: string, custom: string): string {
    return value === "custom" ? custom.trim() : value;
}

export interface LiveOutputs {
    readonly statement: string;
    readonly statementHint: string;
    readonly quality: IcpQuality;
    readonly focus: string;
    readonly buyingGroup: ReadonlyArray<string>;
    readonly evidence: ReadonlyArray<string>;
    readonly industry: string;
}

/**
 * Compose the live shaped ICP from the draft — the statement, the
 * quality readout, the focus recommendation, the buying-group minimum,
 * and the evidence signals. This IS the object the Decision Bench
 * sharpens; the form is just the controls that feed it.
 */
export function buildLiveOutputs(draft: IcpDraft): LiveOutputs {
    const industry = effective(draft.industry, draft.industryCustom);
    const buyer = effective(draft.buyer, draft.buyerCustom);
    const engineActive = Number(draft.engineActive) > 0 ? Math.floor(Number(draft.engineActive)) : 0;
    const statement = buildStatement({
        industry,
        size: draft.size,
        geo: draft.geo,
        buyer,
        pain: draft.pain,
        trigger: draft.trigger,
        proofWindow: draft.proofWindow
    });
    const quality = buildIcpQuality({
        role: draft.role,
        industry,
        size: draft.size,
        geo: draft.geo,
        buyer,
        pain: draft.pain,
        trigger: draft.trigger,
        proofWindow: draft.proofWindow,
        activeAccounts: engineActive
    });
    return {
        statement: statement.text,
        statementHint: statement.hint,
        quality,
        focus: buildFocus(draft.role, engineActive),
        buyingGroup: buildBuyingGroup(buyer),
        evidence: buildEvidence(draft.pain, draft.trigger),
        industry
    };
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: once the ICP is workable or sharper, the
 * one next move is to take it into the strategy flow — build the
 * territory. Absent while the ICP is still too soft to inherit (the
 * work stays in-room, sharpening).
 */
export function toPulling(draft: IcpDraft): PullingData | undefined {
    const outputs = buildLiveOutputs(draft);
    if (outputs.quality.score < 70 || !outputs.industry) return undefined;
    return {
        verb: "Build the territory",
        object: outputs.industry,
        href: hrefToTerritoryArchitect(outputs.industry),
        reasons: [outputs.quality.label, outputs.quality.summary].slice(0, 4)
    };
}
