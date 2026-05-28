/**
 * Curated sub-processor vendors for the Trust Center source (Family 3).
 *
 * These are B2B vendors whose presence on a target company's Trust
 * Center / sub-processor disclosure page is itself a signal — multiple
 * watched companies disclosing the same vendor implies shared tech
 * stack, shared buying patterns, or shared ICP. The vendor name itself
 * isn't the payoff; the *overlap across watched entities* is.
 *
 * Curation principles:
 *   - Skip the cloud giants (AWS / GCP / Azure). Everyone uses one, so
 *     their presence is noise rather than signal.
 *   - Keep vendors with sharp category alignment — what they're used
 *     for says something about the disclosing company.
 *   - Include the operator's own adjacents (Rippling, Deel, Gusto)
 *     even though some may be on their watchlist; enrich + the
 *     operator's verdict handle that downstream.
 *   - Aliases catch common surface variants ("Auth Zero" for Auth0,
 *     "Hugging Face" vs "HuggingFace").
 *
 * The Deno mirror at supabase/functions/briefing-pipeline/sources/
 * trust-center-vendors.config.ts keeps a verbatim copy.
 */

export type SubprocessorCategory =
    | "compliance"
    | "auth"
    | "data_infra"
    | "comms"
    | "payments"
    | "ai_ml"
    | "analytics"
    | "crm_sales"
    | "hr_payroll"
    | "marketing"
    | "support";

export interface SubprocessorVendor {
    readonly id: string;
    readonly name: string;
    readonly aliases: ReadonlyArray<string>;
    readonly category: SubprocessorCategory;
}

export const KNOWN_SUBPROCESSORS: ReadonlyArray<SubprocessorVendor> = [
    // Compliance / security
    { id: "vanta", name: "Vanta", aliases: [], category: "compliance" },
    { id: "drata", name: "Drata", aliases: [], category: "compliance" },
    { id: "secureframe", name: "Secureframe", aliases: ["SecureFrame"], category: "compliance" },
    { id: "tugboat_logic", name: "Tugboat Logic", aliases: ["TugboatLogic"], category: "compliance" },

    // Auth
    { id: "auth0", name: "Auth0", aliases: ["Auth Zero"], category: "auth" },
    { id: "okta", name: "Okta", aliases: [], category: "auth" },
    { id: "workos", name: "WorkOS", aliases: ["Work OS"], category: "auth" },

    // Data infra
    { id: "snowflake", name: "Snowflake", aliases: [], category: "data_infra" },
    { id: "databricks", name: "Databricks", aliases: [], category: "data_infra" },
    { id: "fivetran", name: "Fivetran", aliases: [], category: "data_infra" },
    { id: "dbt_labs", name: "dbt Labs", aliases: ["dbt"], category: "data_infra" },

    // Comms / collab
    { id: "slack", name: "Slack", aliases: [], category: "comms" },
    { id: "notion", name: "Notion", aliases: [], category: "comms" },
    { id: "linear", name: "Linear", aliases: [], category: "comms" },
    { id: "asana", name: "Asana", aliases: [], category: "comms" },
    { id: "loom", name: "Loom", aliases: [], category: "comms" },

    // Payments / finance
    { id: "stripe", name: "Stripe", aliases: [], category: "payments" },
    { id: "brex", name: "Brex", aliases: [], category: "payments" },
    { id: "ramp", name: "Ramp", aliases: [], category: "payments" },

    // AI / ML
    { id: "openai", name: "OpenAI", aliases: ["Open AI"], category: "ai_ml" },
    { id: "anthropic", name: "Anthropic", aliases: [], category: "ai_ml" },
    { id: "hugging_face", name: "Hugging Face", aliases: ["HuggingFace"], category: "ai_ml" },
    { id: "pinecone", name: "Pinecone", aliases: [], category: "ai_ml" },

    // Analytics
    { id: "segment", name: "Segment", aliases: ["Twilio Segment"], category: "analytics" },
    { id: "amplitude", name: "Amplitude", aliases: [], category: "analytics" },
    { id: "mixpanel", name: "Mixpanel", aliases: [], category: "analytics" },
    { id: "posthog", name: "PostHog", aliases: ["Posthog"], category: "analytics" },

    // CRM / sales tech
    { id: "salesforce", name: "Salesforce", aliases: [], category: "crm_sales" },
    { id: "hubspot", name: "HubSpot", aliases: [], category: "crm_sales" },
    { id: "outreach", name: "Outreach", aliases: [], category: "crm_sales" },
    { id: "apollo", name: "Apollo", aliases: ["Apollo.io"], category: "crm_sales" },
    { id: "gong", name: "Gong", aliases: [], category: "crm_sales" },

    // HR / payroll (adjacents to the operator's space)
    { id: "greenhouse", name: "Greenhouse", aliases: [], category: "hr_payroll" },
    { id: "lever", name: "Lever", aliases: [], category: "hr_payroll" },
    { id: "bamboohr", name: "BambooHR", aliases: ["Bamboo HR"], category: "hr_payroll" },
    { id: "workday", name: "Workday", aliases: [], category: "hr_payroll" },
    { id: "gusto", name: "Gusto", aliases: [], category: "hr_payroll" },
    { id: "rippling", name: "Rippling", aliases: [], category: "hr_payroll" },
    { id: "deel", name: "Deel", aliases: [], category: "hr_payroll" },

    // Support
    { id: "intercom", name: "Intercom", aliases: [], category: "support" },
    { id: "zendesk", name: "Zendesk", aliases: [], category: "support" }
] as const;
