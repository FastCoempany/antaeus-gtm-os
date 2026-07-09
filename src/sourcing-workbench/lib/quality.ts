import type { Prospect, ProspectQuality } from "./types";

/**
 * Phase 4 / Room 13 Wave 2 — prospect quality engine.
 *
 * Faithful port of the legacy `getProspectQuality(prospect)` from
 * `app/sourcing-workbench/index.html` lines 1402-1460. Returns a
 * 0-100 score + 3-band classification (ready / researched /
 * captured) + reasons + remaining gaps.
 *
 * Score build-up:
 *   base 18
 *   + leverage bonus (network/proof/signal +12 / +12 / +10, geo +6, cold 0)
 *   + 12 if accountName present
 *   + 12 if contactName present
 *   + 10 if contactTitle present
 *   + 12 if entryPoint present
 *   + 12 if approach present
 *   + 12 if notes >= 40 chars
 *
 * Band thresholds: ≥80 ready / ≥55 researched / else captured.
 */

const LEVERAGE_POINTS: Record<string, number> = {
    "network-connection": 12,
    "existing-proof-point": 12,
    "market-signal": 10,
    "geographic-advantage": 6,
    cold: 0
};

const LEVERAGE_LABELS: Record<string, string> = {
    "network-connection": "network leverage",
    "existing-proof-point": "evidence angle",
    "market-signal": "live signal leverage",
    "geographic-advantage": "geographic leverage",
    cold: "cold entry only"
};

export function getProspectQuality(prospect: Prospect): ProspectQuality {
    let score = 18;
    const reasons: string[] = [];
    const gaps: string[] = [];

    const leveragePts = LEVERAGE_POINTS[prospect.leverage] ?? 0;
    score += leveragePts;
    if (leveragePts > 0) {
        reasons.push(LEVERAGE_LABELS[prospect.leverage] ?? "leverage");
    } else {
        gaps.push("Pick a non-cold leverage if one exists.");
    }

    if (prospect.accountName.trim()) {
        score += 12;
        reasons.push("named account");
    } else {
        gaps.push("Account name missing.");
    }

    if (prospect.contactName.trim()) {
        score += 12;
        reasons.push("named contact");
    } else {
        gaps.push("Contact name missing.");
    }

    if (prospect.contactTitle.trim()) {
        score += 10;
        reasons.push("contact role specified");
    } else {
        gaps.push("Contact title missing.");
    }

    if (prospect.entryPoint.trim()) {
        score += 12;
        reasons.push("entry point identified");
    } else {
        gaps.push("Entry point not yet defined.");
    }

    if (prospect.approach.trim()) {
        score += 12;
        reasons.push("approach attached");
    } else {
        gaps.push("No approach attached yet.");
    }

    if (prospect.notes.trim().length >= 40) {
        score += 12;
        reasons.push("research depth");
    } else if (prospect.notes.trim().length > 0) {
        score += 4;
        gaps.push("Research notes are still thin.");
    } else {
        gaps.push("No research notes yet.");
    }

    score = Math.max(0, Math.min(100, score));

    let band: ProspectQuality["band"];
    if (score >= 80) band = "ready";
    else if (score >= 55) band = "researched";
    else band = "captured";

    return {
        score,
        recommendedStage: band,
        band,
        reasons,
        gaps
    };
}
