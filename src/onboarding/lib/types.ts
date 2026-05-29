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
    | "cro"
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
        key: "cro",
        label: "CRO / Head of Revenue",
        copy: "You own the function. The system is the operating layer underneath your team."
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

/**
 * What the operator SELLS — their product's own category. Distinct
 * from the verticals they sell INTO (those are `IndustryKey` below).
 *
 * The earlier single dropdown conflated the two and excluded
 * horizontal product categories (EOR, payroll, HR tech, productivity)
 * whose sellers don't fit any vertical bucket. This list is intended
 * to be exhaustive-enough for a B2B audience without becoming a
 * marketplace taxonomy. Pick the closest; the workspace doesn't
 * fork on the specific value yet.
 */
export type ProductCategoryKey =
    | "hr-tech"
    | "eor-global-employment"
    | "sales-tech"
    | "marketing-tech"
    | "cx-support-automation"
    | "data-infrastructure"
    | "customer-data-platform"
    | "vertical-saas"
    | "horizontal-saas"
    | "devops-engineering-tools"
    | "cybersecurity-compliance"
    | "fintech-payments"
    | "legal-tech"
    | "ai-native"
    | "hardware-iot"
    | "services-consulting"
    | "other";

export const PRODUCT_CATEGORY_OPTIONS: ReadonlyArray<{
    readonly key: ProductCategoryKey;
    readonly label: string;
}> = [
    { key: "hr-tech", label: "HR Tech / People Ops" },
    { key: "eor-global-employment", label: "EOR / Global Employment / Payroll" },
    { key: "sales-tech", label: "Sales Tech / Revenue Intelligence" },
    { key: "marketing-tech", label: "Marketing Tech" },
    { key: "cx-support-automation", label: "CX / Support Automation" },
    { key: "data-infrastructure", label: "Data Infrastructure / Analytics" },
    { key: "customer-data-platform", label: "Customer Data Platform" },
    { key: "vertical-saas", label: "Vertical SaaS" },
    { key: "horizontal-saas", label: "Horizontal SaaS / Productivity" },
    { key: "devops-engineering-tools", label: "DevOps / Engineering Tools" },
    { key: "cybersecurity-compliance", label: "Cybersecurity / Compliance" },
    { key: "fintech-payments", label: "FinTech / Payments" },
    { key: "legal-tech", label: "Legal Tech" },
    { key: "ai-native", label: "AI-Native (foundation models / agents)" },
    { key: "hardware-iot", label: "Hardware / IoT" },
    { key: "services-consulting", label: "Services / Consulting" },
    { key: "other", label: "Other" }
];

/**
 * Industries the operator SELLS INTO. Multi-select.
 *
 * Paired with the `industryAgnostic` flag: when agnostic is true the
 * multi-select is suppressed and consumers treat the seller as
 * covering all industries. This is the right shape for horizontal
 * sellers (HR tech, productivity, EOR) whose buyers are everyone.
 */
export type IndustryKey =
    | "b2b-saas-tech"
    | "financial-services"
    | "healthcare"
    | "retail-ecommerce"
    | "manufacturing"
    | "logistics-supply-chain"
    | "energy-utilities"
    | "real-estate-proptech"
    | "construction"
    | "education"
    | "media-entertainment"
    | "telecommunications"
    | "travel-hospitality"
    | "insurance"
    | "legal-professional-services"
    | "government-public-sector"
    | "nonprofit"
    | "agriculture"
    | "aerospace-defense"
    | "pharma-biotech"
    | "consumer-goods-cpg"
    | "marketing-advertising"
    | "cybersecurity";

export const INDUSTRY_OPTIONS: ReadonlyArray<{
    readonly key: IndustryKey;
    readonly label: string;
}> = [
    { key: "b2b-saas-tech", label: "B2B SaaS / Tech" },
    { key: "financial-services", label: "Financial Services / FinTech" },
    { key: "healthcare", label: "Healthcare / Health Tech" },
    { key: "retail-ecommerce", label: "Retail / E-commerce" },
    { key: "manufacturing", label: "Manufacturing / Industrial" },
    { key: "logistics-supply-chain", label: "Logistics / Supply Chain" },
    { key: "energy-utilities", label: "Energy / Utilities" },
    { key: "real-estate-proptech", label: "Real Estate / PropTech" },
    { key: "construction", label: "Construction" },
    { key: "education", label: "Education / EdTech" },
    { key: "media-entertainment", label: "Media / Entertainment" },
    { key: "telecommunications", label: "Telecommunications" },
    { key: "travel-hospitality", label: "Travel / Hospitality" },
    { key: "insurance", label: "Insurance / InsurTech" },
    { key: "legal-professional-services", label: "Legal / Professional Services" },
    { key: "government-public-sector", label: "Government / Public Sector" },
    { key: "nonprofit", label: "Non-profit / Social Impact" },
    { key: "agriculture", label: "Agriculture / AgTech" },
    { key: "aerospace-defense", label: "Aerospace / Defense" },
    { key: "pharma-biotech", label: "Pharma / Biotech" },
    { key: "consumer-goods-cpg", label: "Consumer Goods / CPG" },
    { key: "marketing-advertising", label: "Marketing / Advertising" },
    { key: "cybersecurity", label: "Cybersecurity" }
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
    /**
     * What the operator SELLS — their product's own category.
     * (Replaces the earlier single `category` field which conflated
     * product-category with verticals-sold-into; those are now
     * `industries` + `industryAgnostic` below.)
     */
    readonly productCategory: ProductCategoryKey | null;
    /**
     * Industries the operator sells INTO. Multi-select. Empty array
     * means "not yet specified" OR (when `industryAgnostic === true`)
     * "covers all industries."
     */
    readonly industries: ReadonlyArray<IndustryKey>;
    /**
     * True when the operator's product is industry-agnostic
     * (horizontal seller). When true the industries multi-select is
     * suppressed and the seller is treated as covering everything.
     */
    readonly industryAgnostic: boolean;
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
    productCategory: null,
    industries: [],
    industryAgnostic: false,
    icpStatement: "",
    icpPain: "",
    firstAccountName: "",
    firstAccountSignal: "",
    annualQuota: 0,
    avgDealSize: 50_000
};
