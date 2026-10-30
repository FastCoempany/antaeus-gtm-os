import type {
    IcpQuality,
    QualityCheck,
    QualityTier,
    RoleKey
} from "./types";
import { containsBroadLanguage } from "./builders";

/**
 * ICP quality engine.
 *
 * The stable internal tier keys remain broad/forming/workable/sharp for
 * compatibility. User-facing labels describe ICP specificity directly.
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

    if (industry.trim()) {
        good(15, "Industry is defined. A target-account list can be built from it.");
    } else {
        risk("Choose one industry so the ICP can produce a concrete target-account list.");
    }

    if (size.trim()) {
        if (size === "5,000+ employees") {
            warn(7, "The company-size band is defined, but this enterprise range can include materially different buying processes.");
        } else {
            good(10, "Company-size band is defined.");
        }
    } else {
        risk("Choose one company-size band so account qualification uses a consistent criterion.");
    }

    if (geo.trim()) {
        if (geo === "Global") {
            warn(4, "Global coverage is broad for an initial 30-day account set.");
        } else if (
            geo === "North America" ||
            geo === "EMEA" ||
            geo === "APAC"
        ) {
            warn(8, "The region is usable, but account coverage still needs prioritization within it.");
        } else {
            good(10, "Geography is specific enough to assign account coverage.");
        }
    } else {
        risk("Choose one geography your team can cover now.");
    }

    if (buyer.trim()) {
        if (containsBroadLanguage(buyer)) {
            warn(8, "The primary buyer is still broad. Name one role that owns the problem.");
        } else {
            good(15, "Primary buyer is explicitly defined.");
        }
    } else {
        risk("Choose one primary buyer role so outbound and discovery can address a specific owner.");
    }

    if (pain.trim()) {
        good(15, "Primary problem is explicitly defined.");
    } else {
        risk("Choose one primary problem the buyer is responsible for solving.");
    }

    if (trigger.trim()) {
        good(15, "A current trigger is defined, so research can identify accounts with a timely reason to engage.");
    } else {
        risk("Choose one trigger that makes the problem timely for the buyer.");
    }

    if (proofWindow.trim()) {
        if (proofWindow === "7 days" || proofWindow === "14 days") {
            good(10, "The evidence window is defined and short enough to evaluate value quickly.");
        } else {
            good(8, "The evidence window is defined.");
        }
    } else {
        risk("Choose a time window for demonstrating value so opportunities can be qualified against a clear expectation.");
    }

    if (!activeAccounts || activeAccounts <= 0) {
        warn(0, "No working-list size is recorded yet. Add or size the initial account set to evaluate coverage.");
    } else if (activeAccounts < 20) {
        warn(4, "The working account list is small; confirm that the list is large enough to support the planned outreach volume.");
    } else if (activeAccounts <= 160) {
        good(10, "Working-list size is within the current focused 30-day range.");
    } else if (activeAccounts <= 220) {
        warn(7, "The working account list is broad. Prioritize accounts before increasing outreach volume.");
    } else {
        warn(2, "The working account list is too broad for the current focused 30-day range.");
    }

    if (role === "founder" && activeAccounts > 120) {
        checks.push({
            tone: "warn",
            text: "Founder-led sales coverage may be difficult to sustain above roughly 120 active accounts at a time."
        });
    }
    if (role === "firstae" && activeAccounts > 220) {
        checks.push({
            tone: "risk",
            text: "A first seller is unlikely to cover more than roughly 220 active accounts effectively without stronger prioritization."
        });
    }

    score = Math.max(0, Math.min(100, score));

    let tier: QualityTier = "broad";
    let label = "ICP quality: too broad";
    let summary =
        "The ICP is missing enough specificity that downstream account qualification still requires substantial interpretation.";

    if (score >= 85) {
        tier = "sharp";
        label = "ICP quality: highly specific";
        summary =
            "The ICP is specific enough to use consistently across territory planning, sourcing, outbound, and discovery.";
    } else if (score >= 70) {
        tier = "workable";
        label = "ICP quality: well defined";
        summary =
            "The ICP is usable across the sales process, but one or more criteria can still be made more specific.";
    } else if (score >= 50) {
        tier = "forming";
        label = "ICP quality: partially defined";
        summary =
            "Several ICP criteria are present, but downstream qualification still requires interpretation.";
    }

    return { score, tier, label, summary, checks };
}
