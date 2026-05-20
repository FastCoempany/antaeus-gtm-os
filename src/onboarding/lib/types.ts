/**
 * Phase 4 / Room 17 — Onboarding types.
 *
 * Per canon §4.3 (Threshold family) the room produces real Brief items
 * as a side effect of setup, so the Dashboard wakes up live. This is
 * a greenfield rebuild — there is no legacy port — but it inherits the
 * sacred-noun shapes from upstream rooms (ICP, Account, Deal, Quota).
 *
 * Behavioral spine (Part III §5):
 *   - Endowed Progress Effect: 17% (1 of 6) endowed on arrival
 *   - Commitment + Consistency: each step is a low-friction
 *     micro-commitment that hardens the next step's psychological
 *     investment
 *   - Implementation Intentions: each step's "next" hint is a specific
 *     contextual action, not a generic prompt
 */

export type RoleKey =
    | "founder"
    | "first-gtm-hire"
    | "vp-sales"
    | "operator"
    | "advisor";

export const ROLE_OPTIONS: ReadonlyArray<{
    readonly key: RoleKey;
    readonly label: string;
    readonly copy: string;
}> = [
    {
        key: "founder",
        label: "Founder",
        copy: "You are still the one selling. Antaeus is the system holding everything you can't keep in your head."
    },
    {
        key: "first-gtm-hire",
        label: "First GTM hire",
        copy: "You are inheriting a founder-built motion. The system makes the hand-off legible."
    },
    {
        key: "vp-sales",
        label: "VP Sales",
        copy: "You are formalizing the system for the next 3-5 hires."
    },
    {
        key: "operator",
        label: "Operator",
        copy: "You run the day-to-day — you need the right object on top, fast."
    },
    {
        key: "advisor",
        label: "Advisor",
        copy: "You are an outside lens — the system shows you what is real."
    }
];

export type CategoryKey =
    | "cxai"
    | "cdp"
    | "legal"
    | "revenue"
    | "ai-native"
    | "manufacturing"
    | "data-intelligence"
    | "govtech"
    | "support";

export const CATEGORY_OPTIONS: ReadonlyArray<{
    readonly key: CategoryKey;
    readonly label: string;
}> = [
    { key: "cxai", label: "CX AI / Support Automation" },
    { key: "cdp", label: "Customer Data Platform" },
    { key: "legal", label: "Legal AI" },
    { key: "revenue", label: "Revenue Intelligence AI" },
    { key: "ai-native", label: "AI-Native Buyer" },
    { key: "manufacturing", label: "Manufacturing / Supply Chain" },
    { key: "data-intelligence", label: "Data Intelligence Infrastructure" },
    { key: "govtech", label: "GovTech / Compliance" },
    { key: "support", label: "Customer Support / Operations" }
];

export type StepId =
    | "intro"
    | "company"
    | "role"
    | "category"
    | "icp"
    | "account"
    | "quota"
    | "complete";

export const STEP_ORDER: ReadonlyArray<StepId> = [
    "intro",
    "company",
    "role",
    "category",
    "icp",
    "account",
    "quota",
    "complete"
];

export interface OnboardingDraft {
    readonly companyName: string;
    readonly role: RoleKey | null;
    readonly category: CategoryKey | null;
    readonly icpStatement: string;
    readonly icpPain: string;
    readonly firstAccountName: string;
    readonly firstAccountSignal: string;
    readonly annualQuota: number;
    readonly avgDealSize: number;
}

export const EMPTY_DRAFT: OnboardingDraft = {
    companyName: "",
    role: null,
    category: null,
    icpStatement: "",
    icpPain: "",
    firstAccountName: "",
    firstAccountSignal: "",
    annualQuota: 0,
    avgDealSize: 50_000
};
