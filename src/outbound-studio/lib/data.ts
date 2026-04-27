import type {
    Asset,
    Channel,
    CtaKey,
    Persona,
    Temperature,
    TriggerKey
} from "./types";

/**
 * Phase 4 / Room 6 Wave 2 — domain data tables.
 *
 * Faithful TypeScript port of the legacy `TRIGGERS` / `PERSONAS` /
 * `CHANNEL_ORDER` / `ASSET_MATRIX` / `CTA_BY_TEMP` / `ASSET_LABELS` /
 * `CTA_LABELS` (lines 585-682 of `app/outbound-studio/index.html`).
 *
 * No behavioral changes — same lookups produce identical outputs.
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
        label: "Funding / Board Mandate",
        meaning: "Capital deployed under board pressure.",
        angles: ["ROI acceleration", "Time-to-value"]
    },
    expansion: {
        key: "expansion",
        label: "Expansion / Acquisition",
        meaning: "Complexity growth, integration needs.",
        angles: ["Scalability", "Integration"]
    },
    hiring: {
        key: "hiring",
        label: "Hiring Spike / Reorg",
        meaning: "Scaling fast, process gaps emerging.",
        angles: ["Efficiency", "Onboarding"]
    },
    vendor: {
        key: "vendor",
        label: "Vendor Consolidation",
        meaning: "Evaluating alternatives, open to change.",
        angles: ["Consolidation", "TCO"]
    },
    cost: {
        key: "cost",
        label: "Cost Reduction",
        meaning: "CFO pressure, receptive to ROI stories.",
        angles: ["Savings", "Efficiency"]
    },
    product: {
        key: "product",
        label: "New Product Launch",
        meaning: "New revenue line needs support.",
        angles: ["Speed", "Market capture"]
    },
    churn: {
        key: "churn",
        label: "Customer Churn",
        meaning: "Trust damaged, need control.",
        angles: ["Retention", "Visibility"]
    },
    leadership: {
        key: "leadership",
        label: "Leadership Change",
        meaning: "New leader, new priorities, 90-day window.",
        angles: ["Fresh perspective", "Quick wins"]
    },
    tech: {
        key: "tech",
        label: "Tech Stack Change",
        meaning: "Migration underway, integration opportunity.",
        angles: ["Integration", "Migration support"]
    },
    compliance: {
        key: "compliance",
        label: "Compliance / Audit",
        meaning: "Deadline-driven urgency.",
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
            "3 sentences max. No attachments. Connect to their strategic priorities. Ask for their perspective, not a meeting."
    },
    vp: {
        key: "vp",
        label: "VP / Director",
        sentenceRange: [4, 6],
        guidance:
            "4-6 sentences. Can include proof point. Reference comparable company. Design assets for forwarding."
    },
    ic: {
        key: "ic",
        label: "Manager / IC",
        sentenceRange: [6, 10],
        guidance:
            "6-10 sentences. Technical detail welcome. Describe specific workflows. They forward to managers."
    },
    procurement: {
        key: "procurement",
        label: "Procurement / Legal",
        sentenceRange: [3, 5],
        guidance:
            "Process-driven. Documentation over storytelling. Preemptive answers to their checklist."
    }
};

// ─── Channel order [temp][persona] ───────────────────────────────────

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

// ─── Asset matrix [temp][persona] ─────────────────────────────────────

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

// ─── CTA by temperature ───────────────────────────────────────────────

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
    no_ask: "No ask (value only)",
    micro_ask: "Micro-ask",
    give_to_get: "Give-to-get",
    meeting_request: "Meeting request",
    champion_arm: "Champion arming",
    process_facilitation: "Process facilitation"
};
