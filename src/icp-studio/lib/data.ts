import type { IcpTemplate } from "./types";

/**
 * Phase 4 / Room 11 Wave 2 — ICP data tables.
 *
 * Faithful TypeScript port of the legacy data tables from
 * `app/icp-studio/index.html` lines 980-1090. Pure data — no signals,
 * no DOM. Wave 3 reads these to render the form selectors and the
 * build outputs.
 */

// ─── Buying group ──────────────────────────────────────────────────────

/** Buyer → 5-row buying group minimum (legacy lines 980-988). */
export const BUYING_GROUP_MAP: Readonly<Record<string, ReadonlyArray<string>>> =
    {
        CFO: [
            "CFO (economic buyer)",
            "Procurement",
            "Controller/FP&A",
            "Security/IT (if applicable)",
            "Business owner (Ops or function lead)"
        ],
        COO: [
            "COO (economic/owner)",
            "VP/Director Operations",
            "Procurement",
            "Security/IT",
            "Finance"
        ],
        "VP Operations": [
            "VP Operations (owner)",
            "COO (economic cover)",
            "Procurement",
            "Security/IT",
            "Finance"
        ],
        "Head of Procurement": [
            "Head of Procurement (process owner)",
            "Economic sponsor (CFO/COO)",
            "Business owner (function lead)",
            "Security/IT",
            "Legal"
        ],
        "CHRO / Head of People": [
            "CHRO (owner)",
            "CFO (economic cover)",
            "Procurement",
            "Security/IT",
            "Legal"
        ],
        "VP Revenue Operations": [
            "RevOps (owner)",
            "CFO (economic cover)",
            "Sales leadership",
            "Procurement",
            "Security/IT"
        ],
        "CISO / Security": [
            "CISO (owner)",
            "CIO/IT",
            "Procurement",
            "Economic sponsor (CFO/COO)",
            "Legal"
        ]
    };

/** Default 6-row buying group when buyer doesn't match the map (legacy line 990). */
export const DEFAULT_BUYING_GROUP: ReadonlyArray<string> = [
    "Economic buyer (budget owner)",
    "Primary owner (your selected buyer)",
    "Champion (day-to-day operator)",
    "Procurement (vendor process)",
    "Security/IT (risk review)",
    "Finance (pricing + terms)"
];

// ─── Evidence maps ─────────────────────────────────────────────────────

/** Trigger → 4 evidence signals (legacy lines 993-1001). */
export const TRIGGER_EVIDENCE_MAP: Readonly<
    Record<string, ReadonlyArray<string>>
> = {
    "Recent expansion (new regions, entities, acquisitions)": [
        "Press release: expansion/acquisition",
        "New entities in filings",
        "New offices/regions on site",
        "Integration job postings"
    ],
    "Hiring spike / org change": [
        "10+ relevant job posts",
        "New leader announced",
        "Reorg signals in LinkedIn changes",
        "Hiring manager chatter"
    ],
    "Vendor consolidation initiative": [
        "RFP language",
        "Procurement posts about consolidation",
        "Public vendor ecosystem changes",
        "Tech stack cleanup signals"
    ],
    "Audit / compliance pressure": [
        "Compliance job posts",
        "SOC2/ISO mentions",
        "Regulatory deadlines",
        "Security questionnaire requirements"
    ],
    "Cost reduction mandate": [
        "Earnings call language",
        "Layoffs/reductions",
        "Budget freeze chatter",
        "Spend optimization initiatives"
    ],
    "New product or market launch": [
        "Launch page",
        "Partner announcements",
        "New SKU/product lines",
        "GTM hiring (marketing/ops)"
    ]
};

/** Pain → 4 evidence signals (legacy lines 1003-1010). */
export const PAIN_EVIDENCE_MAP: Readonly<
    Record<string, ReadonlyArray<string>>
> = {
    "Cost control / spend leakage": [
        "Duplicate tools/vendors",
        "Manual processes in job posts",
        "Procurement backlog",
        "Margin pressure language"
    ],
    "Risk & compliance exposure": [
        "Audit mentions",
        "Vendor risk language",
        "Security review bottlenecks",
        "Regulatory compliance requirements"
    ],
    "Time-to-launch / slow ops": [
        "Long cycle time complaints",
        "Operational hiring",
        "Migration projects",
        "Backlogs or implementation delays"
    ],
    "Revenue leakage / billing ops": [
        "Billing ops job posts",
        "Pricing changes",
        "Subscription complexity",
        "RevRec compliance language"
    ],
    "Fragmented vendors / consolidation": [
        "Too many vendors list",
        "Standardization initiatives",
        "RFP activity",
        "Platform consolidation language"
    ],
    "Visibility / reporting gaps": [
        "BI/reporting rebuild posts",
        "Data quality issues",
        "Spreadsheet-based workflows",
        "Lack of single source of truth language"
    ]
};

// ─── ICP templates ─────────────────────────────────────────────────────

/** Templates that prefill the form (legacy lines 1012-1090). */
export const ICP_TEMPLATES: ReadonlyArray<IcpTemplate> = [
    {
        id: "mid-market-saas",
        name: "Mid-Market SaaS (B2B)",
        industry: "SaaS / Software",
        size: "200-2000 employees",
        geo: "North America",
        buyer: "VP Engineering",
        pain: "Integration complexity across tools",
        trigger: "Hiring spike / org change",
        proofWindow: "60-90 days",
        activeAccounts: 80
    },
    {
        id: "enterprise-finserv",
        name: "Enterprise Financial Services",
        industry: "Financial Services",
        size: "5000+ employees",
        geo: "North America + EMEA",
        buyer: "CTO / CISO",
        pain: "Compliance and security exposure",
        trigger: "Audit / compliance pressure",
        proofWindow: "90-120 days",
        activeAccounts: 40
    },
    {
        id: "smb-ecommerce",
        name: "SMB E-Commerce",
        industry: "E-Commerce / Retail",
        size: "10-100 employees",
        geo: "US",
        buyer: "Founder / CEO",
        pain: "Growth ops bottlenecks",
        trigger: "New product or market launch",
        proofWindow: "30-60 days",
        activeAccounts: 120
    },
    {
        id: "healthtech",
        name: "Healthcare / HealthTech",
        industry: "Healthcare / HealthTech",
        size: "250-5000 employees",
        geo: "US",
        buyer: "Director of IT",
        pain: "Interoperability and data fragmentation",
        trigger: "Vendor consolidation initiative",
        proofWindow: "60-120 days",
        activeAccounts: 55
    },
    {
        id: "startup-pre-rev",
        name: "Startup / Pre-Revenue",
        industry: "Startup / SaaS",
        size: "<50 employees",
        geo: "US + remote",
        buyer: "Founder / CEO",
        pain: "Need speed-to-market with lean team",
        trigger: "Recent expansion (new regions, entities, acquisitions)",
        proofWindow: "14-45 days",
        activeAccounts: 140
    }
];

/** Find a template by id, returns null when missing. */
export function findTemplate(id: string): IcpTemplate | null {
    return ICP_TEMPLATES.find((t) => t.id === id) ?? null;
}
