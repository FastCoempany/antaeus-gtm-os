import type {
    IcpQuality,
    QualityCheck,
    QualityTier,
    RoleKey
} from "./types";
import { containsBroadLanguage } from "./builders";

/**
 * Phase 4 / Room 11 Wave 2 — quality engine.
 *
 * Faithful TypeScript port of legacy `buildIcpQuality(role, industry,
 * size, geo, buyer, pain, trigger, proof, activeAccounts)` (lines
 * 1232-1325 of `app/icp-studio/index.html`).
 *
 * 8 input checks, each adding to the score with one of three tones:
 *   good — full points, the input is sharp
 *   warn — partial points, the input is workable but soft
 *   risk — zero points, the input is missing or broken
 *
 * Scoring (full credit):
 *   industry  +15 (good) / risk if missing
 *   size      +10 (good) / +7 (warn enterprise) / risk if missing
 *   geo       +10 (good tight) / +8 (warn region) / +4 (warn global) / risk if missing
 *   buyer     +15 (good) / +8 (warn broad language) / risk if missing
 *   pain      +15 (good) / risk if missing
 *   trigger   +15 (good) / risk if missing
 *   proof     +10 (good aggressive 7d/14d) / +8 (good defined) / risk if missing
 *   active    +10 (good 20-160) / +7 (warn 161-220) / +4 (warn <20) / +2 (warn >220) / +0 (warn missing)
 *   role-aware overage warnings (founder >120 or firstae >220) — no points
 *
 * Score clamps to 0-100. Tier thresholds:
 *   ≥85 sharp     "Sharp enough to run."
 *   ≥70 workable  "Workable, but tighten one more thing."
 *   ≥50 forming   "Borderline. Tighten before you trust it."
 *   else broad    "Too broad to trust yet."
 */

export interface QualityInput {
    readonly role: RoleKey;
    readonly industry: string;
    readonly size: string;
    readonly geo: string;
    readonly buyer: string;
    readonly pain: string;
    readonly trigger: string;
    readonly proofWindow: string;
    readonly activeAccounts: number;
}

export function buildIcpQuality(input: QualityInput): IcpQuality {
    let score = 0;
    const checks: QualityCheck[] = [];

    function good(points: number, text: string): void {
        score += points;
        checks.push({ tone: "good", text });
    }

    function warn(points: number, text: string): void {
        score += points;
        checks.push({ tone: "warn", text });
    }

    function risk(text: string): void {
        checks.push({ tone: "risk", text });
    }

    const {
        role,
        industry,
        size,
        geo,
        buyer,
        pain,
        trigger,
        proofWindow,
        activeAccounts
    } = input;

    // Industry
    if (industry.trim()) {
        good(
            15,
            "Industry wedge is defined. A real target list can exist."
        );
    } else {
        risk(
            "Choose one industry wedge. If a list does not exist, the ICP is not real yet."
        );
    }

    // Size
    if (size.trim()) {
        if (size === "5,000+ employees") {
            warn(
                7,
                "Size band is valid, but enterprise breadth raises process complexity fast."
            );
        } else {
            good(10, "Company-size band is defined. Complexity is bounded.");
        }
    } else {
        risk(
            "Choose one company-size band so downstream qualification stays believable."
        );
    }

    // Geo
    if (geo.trim()) {
        if (geo === "Global") {
            warn(
                4,
                "Global is usually too wide for the first 30-day slice."
            );
        } else if (
            geo === "North America" ||
            geo === "EMEA" ||
            geo === "APAC"
        ) {
            warn(
                8,
                "Region is workable, but coverage discipline still matters."
            );
        } else {
            good(10, "Geography is tight enough to route territory cleanly.");
        }
    } else {
        risk("Pick one geography you can actually cover right now.");
    }

    // Buyer
    if (buyer.trim()) {
        if (containsBroadLanguage(buyer)) {
            warn(
                8,
                "Primary buyer still sounds broad. Name one owner, not a committee."
            );
        } else {
            good(
                15,
                "Primary buyer is explicit. Messaging can stay owner-led."
            );
        }
    } else {
        risk(
            'Pick one primary buyer. "Team" language will break outbound and discovery.'
        );
    }

    // Pain
    if (pain.trim()) {
        good(
            15,
            "Primary pain is explicit. Copy and discovery can stay centered on one problem."
        );
    } else {
        risk("Choose one felt pain. Listing more than one blurs the ICP.");
    }

    // Trigger
    if (trigger.trim()) {
        good(
            15,
            "Trigger is explicit. Research can look for urgency instead of vague interest."
        );
    } else {
        risk(
            "Choose one trigger. Without urgency, the list becomes fake pipeline."
        );
    }

    // Proof window
    if (proofWindow.trim()) {
        if (proofWindow === "7 days" || proofWindow === "14 days") {
            good(
                10,
                "Proof window is aggressive enough to create fast first value."
            );
        } else {
            good(
                8,
                "Proof window is defined. Qualification now has a real bar."
            );
        }
    } else {
        risk(
            "Pick one proof window so the deal can be pressure-tested early."
        );
    }

    // Active accounts (working list size)
    if (!activeAccounts || activeAccounts <= 0) {
        warn(
            0,
            "No working-list size entered yet. Territory and sourcing will stay generic until you size the first 30-day slice."
        );
    } else if (activeAccounts < 20) {
        warn(
            4,
            "Working list may be too thin unless personalization is extremely high-touch."
        );
    } else if (activeAccounts <= 160) {
        good(
            10,
            "Working-list size is believable for a focused 30-day operating window."
        );
    } else if (activeAccounts <= 220) {
        warn(7, "Coverage is getting wide. Keep ranking ruthless.");
    } else {
        warn(
            2,
            "Working-list size is too wide for a first focused 30-day slice."
        );
    }

    // Role-aware overage warnings (no point change, just an extra check)
    if (role === "founder" && activeAccounts > 120) {
        checks.push({
            tone: "warn",
            text: "Founder-led motion usually performs better under roughly 120 active accounts at a time."
        });
    }
    if (role === "firstae" && activeAccounts > 220) {
        checks.push({
            tone: "risk",
            text: "First AE motion is probably too wide above roughly 220 active accounts without strong prioritization."
        });
    }

    score = Math.max(0, Math.min(100, score));

    let tier: QualityTier = "broad";
    let label = "Too broad to trust yet.";
    let summary =
        "This still needs too much founder interpretation before the rest of the app can use it cleanly.";

    if (score >= 85) {
        tier = "sharp";
        label = "Sharp enough to run.";
        summary =
            "This is specific enough to drive territory, sourcing, outbound, and discovery without translation.";
    } else if (score >= 70) {
        tier = "workable";
        label = "Workable, but tighten one more thing.";
        summary =
            "The wedge is real. Tighten the remaining pressure point before scaling the list or message.";
    } else if (score >= 50) {
        tier = "forming";
        label = "Borderline. Tighten before you trust it.";
        summary =
            "You have the outline of a wedge, but the user still has to infer too much downstream.";
    }

    return { score, tier, label, summary, checks };
}
