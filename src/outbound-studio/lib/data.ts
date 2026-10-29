import type {
    Asset,
    Channel,
    CtaKey,
    Persona,
    Temperature,
    TriggerKey
} from "./types";

/**
 * Outbound Studio domain tables.
 *
 * Trigger descriptions name the observed event or business condition. They
 * do not infer buyer intent, urgency, internal pressure, or willingness to
 * change unless that information is supplied elsewhere as evidence.
 */

// ─── Triggers ─────────────────────────────────────────────────────────

export interface TriggerSpec {
    readonly key: TriggerKey;
    readonly label: string;
    readonly meaning: string;
    readonly angles: ReadonlyArray<string>;
}

export const TRIGGERS: Readonly<Record<TriggerKey, TriggerSpec>> = {
    funding: {
        key: "funding",
        label: "Funding / Board Initiative",
        meaning: "The company announced new funding or a board-level initiative.",
        angles: ["Return on investment", "Time to value"]
    },
    expansion: {
        key: "expansion",
        label: "Expansion / Acquisition",
        meaning: "The company announced expansion, an acquisition, or another increase in operating scope.",
        angles: ["Scale", "Integration"]
    },
    hiring: {
        key: "hiring",
        label: "Hiring Increase / Reorganization",
        meaning: "The company is increasing hiring or reorganizing part of the business.",
        angles: ["Efficiency", "Onboarding"]
    },
    vendor: {
        key: "vendor",
        label: "Vendor Review / Consolidation",
        meaning: "The company is reviewing vendors or consolidating tools or providers.",
        angles: ["Consolidation", "Total cost"]
    },
    cost: {
        key: "cost",
        label: "Cost Reduction",
        meaning: "The company has announced or documented a cost-reduction initiative.",
        angles: ["Savings", "Efficiency"]
    },
    product: {
        key: "product",
        label: "New Product Launch",
        meaning: "The company launched or announced a new product or revenue line.",
        angles: ["Launch speed", "Market adoption"]
    },
    churn: {
        key: "churn",
        label: "Customer Churn / Retention",
        meaning: "Customer churn or retention has become a visible business issue.",
        angles: ["Retention", "Visibility"]
    },
    leadership: {
        key: "leadership",
        label: "Leadership Change",
        meaning: "A new leader has joined or an executive role has changed.",
        angles: ["Current priorities", "Early initiatives"]
    },
    tech: {
        key: "tech",
        label: "Technology Change",
        meaning: "The company announced or began a technology migration or platform change.",
        angles: ["Integration", "Migration support"]
    },
    compliance: {
        key: "compliance",
        label: "Compliance / Audit",
        meaning: "The company is addressing a compliance, audit, or regulatory requirement.",
        angles: ["Compliance", "Risk reduction"]
    }
};

// ─── Personas ─────────────────────────────────────────────────────────

export interface PersonaSpec {
    readonly key: Persona;
    readonly label: string;
    readonly sentenceRange: readonly [number, number];
    readonly guidance: string;
}

export const PERSONA_DATA: Readonly<Record<Persona, PersonaSpec>> = {
    csuite: {
        key: "csuite",
        label: "C-Suite",
        sentenceRange: [2, 3],
        guidance:
            "Keep the message brief. Connect the observed event to a relevant business question and ask for the executive's perspective before asking for a meeting."
    },
    vp: {
        key: "vp",
        label: "VP / Director",
        sentenceRange: [4, 6],
        guidance:
            "Keep the message specific to the account and role. Include supporting evidence only when it is actually available and make any attachment easy to forward."
    },
    ic: {
        key: "ic",
        label: "Manager / IC",
        sentenceRange: [6, 10],
        guidance:
            "Use concrete workflow detail when the account context supports it. Avoid claiming a problem the contact has not confirmed."
    },
    procurement: {
        key: "procurement",
        label: "Procurement / Legal",
        sentenceRange: [3, 5],
        guidance:
            "Use process-specific language and provide documentation that is actually available. Avoid speculative business-value claims."
    }
};

// ─── Channel order [stage][persona] ───────────────────────────────────

export const CHANNEL_ORDER: Readonly<
    Record<Temperature, Readonly<Record<Persona, ReadonlyArray<Channel>>>>
> = {
    ice_cold: {
        csuite: ["email", "linkedin"],
        vp: ["email", "linkedin", "call"],
        ic: ["linkedin", "email"],
        procurement: ["email"]
    },
    cool: {
        csuite: ["email", "call"],
        vp: ["email", "call", "linkedin"],
        ic: ["linkedin", "email", "call"],
        procurement: ["email"]
    },
    warm: {
        csuite: ["email", "call"],
        vp: ["email", "call", "linkedin"],
        ic: ["email", "linkedin", "call"],
        procurement: ["email"]
    },
    hot: {
        csuite: ["call", "email"],
        vp: ["email", "call"],
        ic: ["email", "call"],
        procurement: ["email"]
    },
    closing: {
        csuite: ["call", "email"],
        vp: ["email", "call"],
        ic: ["email", "call"],
        procurement: ["email"]
    }
};

// ─── Suggested attachment by stage/persona ────────────────────────────

export const ASSET_MATRIX: Readonly<Record<Temperature, Readonly<Record<Persona, Asset>>>> = {
    ice_cold: { csuite: "none", vp: "none", ic: "none", procurement: "none" },
    cool: {
        csuite: "article",
        vp: "one_pager",
        ic: "framework",
        procurement: "none"
    },
    warm: {
        csuite: "one_pager",
        vp: "case_study",
        ic: "case_study",
        procurement: "none"
    },
    hot: {
        csuite: "roi_model",
        vp: "case_study",
        ic: "framework",
        procurement: "security_docs"
    },
    closing: {
        csuite: "implementation_plan",
        vp: "mutual_action_plan",
        ic: "onboarding_doc",
        procurement: "security_docs"
    }
};

export const ASSET_LABELS: Readonly<Record<Asset, string>> = {
    none: "No attachment",
    article: "Relevant article",
    one_pager: "One-pager",
    case_study: "Case study",
    framework: "Framework / template",
    roi_model: "ROI model",
    security_docs: "Security package",
    mutual_action_plan: "Mutual action plan",
    implementation_plan: "Implementation plan",
    onboarding_doc: "Onboarding document"
};

// ─── Call to action by outreach stage ─────────────────────────────────

export const CTA_BY_TEMP: Readonly<
    Record<Temperature, { readonly normal: CtaKey; readonly noask: CtaKey }>
> = {
    ice_cold: { normal: "micro_ask", noask: "no_ask" },
    cool: { normal: "give_to_get", noask: "no_ask" },
    warm: { normal: "meeting_request", noask: "no_ask" },
    hot: { normal: "champion_arm", noask: "no_ask" },
    closing: { normal: "process_facilitation", noask: "no_ask" }
};

export const CTA_LABELS: Readonly<Record<CtaKey, string>> = {
    no_ask: "No meeting request",
    micro_ask: "Request a response",
    give_to_get: "Offer value before a meeting request",
    meeting_request: "Meeting request",
    champion_arm: "Support the internal buyer",
    process_facilitation: "Advance the approval process"
};
