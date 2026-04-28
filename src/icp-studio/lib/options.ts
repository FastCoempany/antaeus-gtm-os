/**
 * Phase 4 / Room 11 Wave 3 — form select option lists.
 *
 * Verbatim from `app/icp-studio/index.html` lines 564-665. Each option
 * value is the string the build/quality engine matches against; each
 * label is what the operator sees. The "custom" sentinel (industry +
 * buyer) signals that the operator wants to type their own value into
 * the corresponding *_custom input.
 */

export interface SelectOption {
    readonly value: string;
    readonly label: string;
}

export const INDUSTRY_OPTIONS: ReadonlyArray<SelectOption> = [
    { value: "Software (B2B SaaS)", label: "Software (B2B SaaS)" },
    { value: "Fintech", label: "Fintech" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Manufacturing", label: "Manufacturing" },
    { value: "Logistics & Supply Chain", label: "Logistics & Supply Chain" },
    { value: "Retail & E-commerce", label: "Retail & E-commerce" },
    { value: "Professional Services", label: "Professional Services" },
    { value: "Public Sector", label: "Public Sector" },
    { value: "custom", label: "Other (type)" }
];

export const SIZE_OPTIONS: ReadonlyArray<SelectOption> = [
    { value: "50-200 employees", label: "50-200 employees" },
    { value: "200-1,000 employees", label: "200-1,000 employees" },
    { value: "1,000-5,000 employees", label: "1,000-5,000 employees" },
    { value: "5,000+ employees", label: "5,000+ employees" }
];

export const GEO_OPTIONS: ReadonlyArray<SelectOption> = [
    { value: "US", label: "US" },
    { value: "North America", label: "North America" },
    { value: "EMEA", label: "EMEA" },
    { value: "APAC", label: "APAC" },
    { value: "Global", label: "Global" }
];

export const BUYER_OPTIONS: ReadonlyArray<SelectOption> = [
    { value: "CFO", label: "CFO" },
    { value: "COO", label: "COO" },
    { value: "VP Operations", label: "VP Operations" },
    { value: "Head of Procurement", label: "Head of Procurement" },
    { value: "CHRO / Head of People", label: "CHRO / Head of People" },
    { value: "VP Revenue Operations", label: "VP Revenue Operations" },
    { value: "CISO / Security", label: "CISO / Security" },
    { value: "custom", label: "Other (type)" }
];

export const PAIN_OPTIONS: ReadonlyArray<SelectOption> = [
    {
        value: "Cost control / spend leakage",
        label: "Cost control / spend leakage"
    },
    {
        value: "Risk & compliance exposure",
        label: "Risk & compliance exposure"
    },
    { value: "Time-to-launch / slow ops", label: "Time-to-launch / slow ops" },
    {
        value: "Revenue leakage / billing ops",
        label: "Revenue leakage / billing ops"
    },
    {
        value: "Fragmented vendors / consolidation",
        label: "Fragmented vendors / consolidation"
    },
    { value: "Visibility / reporting gaps", label: "Visibility / reporting gaps" }
];

export const TRIGGER_OPTIONS: ReadonlyArray<SelectOption> = [
    {
        value: "Recent expansion (new regions, entities, acquisitions)",
        label: "Recent expansion (new regions, entities, acquisitions)"
    },
    {
        value: "Hiring spike / org change",
        label: "Hiring spike / org change"
    },
    {
        value: "Vendor consolidation initiative",
        label: "Vendor consolidation initiative"
    },
    {
        value: "Audit / compliance pressure",
        label: "Audit / compliance pressure"
    },
    { value: "Cost reduction mandate", label: "Cost reduction mandate" },
    {
        value: "New product or market launch",
        label: "New product or market launch"
    }
];

export const PROOF_WINDOW_OPTIONS: ReadonlyArray<SelectOption> = [
    { value: "7 days", label: "7 days" },
    { value: "14 days", label: "14 days" },
    { value: "30 days", label: "30 days" }
];
