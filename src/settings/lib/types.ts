/**
 * Phase 4 / Room 15 — Settings types.
 *
 * Per canon §4.20 (Trust Annex family): keep the user safe, make
 * trust + recovery real. No drama, no internal architecture language.
 */

export type ProductCategory =
    | "cxai"
    | "cdp"
    | "legal"
    | "revenue"
    | "ai-native"
    | "manufacturing"
    | "data-intelligence"
    | "govtech"
    | "support"
    | "gcm";

export const PRODUCT_CATEGORIES: ReadonlyArray<{
    readonly key: ProductCategory;
    readonly label: string;
}> = [
    { key: "cxai", label: "CX AI — Customer Experience & Support" },
    { key: "cdp", label: "Customer Data Platform" },
    { key: "legal", label: "Legal AI" },
    { key: "revenue", label: "Revenue Intelligence AI" },
    { key: "ai-native", label: "AI-Native Buyer" },
    { key: "manufacturing", label: "Manufacturing / Supply Chain" },
    { key: "data-intelligence", label: "Data Intelligence Infrastructure" },
    { key: "govtech", label: "GovTech / Compliance" },
    { key: "gcm", label: "Global Contractor Management / EOR" }
    // "support" kept in the type for backward-compat with stored values,
    // but dropped from the displayed list — the cxai category ("CX AI —
    // Customer Experience & Support") now covers it (2026-06-16).
];

export interface BackupSnapshot {
    /** ISO timestamp the export was generated. */
    readonly capturedAt: string;
    /** Source app version (best-effort; "unknown" when not embedded). */
    readonly source: string;
    /** Map of every gtmos_* localStorage key → its raw string value. */
    readonly data: Readonly<Record<string, string>>;
}

export interface BackupReadout {
    readonly keyCount: number;
    readonly capturedAt: string | null;
    readonly source: string;
}

export interface DemoState {
    /** True when `gtmos_demo_active` is truthy. */
    readonly active: boolean;
    /** ISO when demo was last seeded; null if never. */
    readonly seededAt: string | null;
    /** Demo scenario tag (e.g., "mm", "ent"). */
    readonly scenario: string | null;
}

export const DEMO_INACTIVE: DemoState = {
    active: false,
    seededAt: null,
    scenario: null
};
