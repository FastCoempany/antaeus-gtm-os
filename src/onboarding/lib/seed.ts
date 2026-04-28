import { reportError } from "@/lib/observability";
import {
    CATEGORY_OPTIONS,
    type CategoryKey,
    type OnboardingDraft
} from "./types";

interface StorageLike {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function trySet(store: StorageLike, key: string, value: string): void {
    try {
        store.setItem(key, value);
    } catch (err) {
        reportError(err, { op: "onboarding.seed", key });
    }
}

function uid(prefix: string, now: number): string {
    return `${prefix}_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

function categoryLabel(key: CategoryKey): string {
    const opt = CATEGORY_OPTIONS.find((c) => c.key === key);
    return opt ? opt.label : "";
}

export interface SeedResult {
    /** True if any keys were written. */
    readonly seeded: boolean;
    /** Specific items that landed (for the completion screen). */
    readonly items: ReadonlyArray<string>;
}

/**
 * Persists every non-empty field of the draft into the corresponding
 * sacred-noun store, then writes the activation context that Welcome
 * + Dashboard read on boot. Each persisted item is reported back so
 * the completion screen can show "what landed in the workspace."
 *
 * Safe to call repeatedly: re-seeding overwrites the previous run's
 * artifacts (the operator may iterate on Onboarding before locking in).
 */
export function seedFromDraft(
    draft: OnboardingDraft,
    options: {
        readonly now?: number;
        readonly storage?: StorageLike | null;
    } = {}
): SeedResult {
    const store = getStorage(options.storage);
    if (!store) return { seeded: false, items: [] };
    const now = options.now ?? Date.now();
    const iso = new Date(now).toISOString();
    const items: string[] = [];

    if (draft.companyName.trim() || draft.role || draft.category) {
        trySet(
            store,
            "gtmos_activation_context",
            JSON.stringify({
                company: draft.companyName.trim() || null,
                role: draft.role,
                category: draft.category,
                categoryLabel: draft.category ? categoryLabel(draft.category) : null,
                stageLabel: "Activating the workspace",
                buyerLabel: null,
                acvBandLabel: null,
                seededAt: iso,
                source: "onboarding-v2"
            })
        );
        items.push("Activation context");
    }

    if (draft.category) {
        trySet(store, "gtmos_product_category", draft.category);
        items.push("Product category");
    }

    if (draft.icpStatement.trim()) {
        const id = uid("icp", now);
        const icp = {
            id,
            name: draft.icpStatement.trim(),
            statement: draft.icpStatement.trim(),
            pain: draft.icpPain.trim() || "",
            qualityScore: 60,
            qualityBand: "workable",
            createdAt: iso,
            updatedAt: iso,
            source: "onboarding-v2"
        };
        trySet(
            store,
            "gtmos_icp_analytics",
            JSON.stringify({ icps: [icp], updatedAt: iso })
        );
        items.push("First ICP");
    }

    if (draft.firstAccountName.trim()) {
        const id = uid("acc", now);
        const acc = {
            id,
            name: draft.firstAccountName.trim(),
            ticker: "",
            industry: "",
            tier: "tier-2",
            heat: 60,
            employees: null,
            hq: "",
            signals: draft.firstAccountSignal.trim()
                ? [
                      {
                          id: uid("sig", now),
                          headline: draft.firstAccountSignal.trim(),
                          confidence: 0.7,
                          published_date: iso,
                          fetched_at: iso,
                          ai: false,
                          status: "active"
                      }
                  ]
                : [],
            source: "onboarding-v2",
            capturedAt: iso
        };
        trySet(
            store,
            "gtmos_sc_v4",
            JSON.stringify({ accounts: [acc], updatedAt: iso })
        );
        items.push("First account in Signal Console");
    }

    if (draft.annualQuota > 0) {
        const acv = draft.avgDealSize > 0 ? draft.avgDealSize : 50_000;
        trySet(
            store,
            "gtmos_qw_inputs",
            JSON.stringify({
                quota: draft.annualQuota,
                acv,
                win: 20,
                m2o: 35,
                t2m: 0.7,
                show: 80,
                days: 20,
                tpa: 8,
                cycle: 90
            })
        );
        trySet(
            store,
            "gtmos_outbound_seed",
            JSON.stringify({
                annual_quota: draft.annualQuota,
                avg_deal_size: acv,
                win_rate: 20,
                touch_to_meeting: 0.7,
                show_rate: 80,
                cycle_days: 90,
                coverage_target: 3.5,
                acv_band:
                    acv >= 200_000
                        ? "strategic"
                        : acv >= 75_000
                          ? "enterprise"
                          : acv >= 30_000
                            ? "mid"
                            : "small"
            })
        );
        items.push("Quota target seeded");
    }

    trySet(
        store,
        "gtmos_onboarding_completed_at",
        iso
    );

    return { seeded: items.length > 0, items };
}

/**
 * Best-effort completeness probe. Used by the Welcome + Dashboard
 * smoke test bootstrap to decide whether to send a returning user
 * back through onboarding.
 */
export function isOnboardingComplete(s?: StorageLike | null): boolean {
    const store = getStorage(s);
    if (!store) return false;
    try {
        return store.getItem("gtmos_onboarding_completed_at") !== null;
    } catch (err) {
        reportError(err, { op: "onboarding.isComplete" });
        return false;
    }
}

export interface DraftValidation {
    readonly canFinish: boolean;
    readonly canSeedAnything: boolean;
    readonly missingRequired: ReadonlyArray<string>;
}

/**
 * Soft validation: nothing is technically required, but we coach
 * the operator to give us at least a role + ICP statement before
 * "finish onboarding" lights up.
 */
export function validate(draft: OnboardingDraft): DraftValidation {
    const missing: string[] = [];
    if (!draft.role) missing.push("Pick a role");
    if (!draft.icpStatement.trim()) missing.push("Write a one-line ICP");

    const canSeedAnything =
        draft.companyName.trim().length > 0 ||
        draft.role !== null ||
        draft.category !== null ||
        draft.icpStatement.trim().length > 0 ||
        draft.firstAccountName.trim().length > 0 ||
        draft.annualQuota > 0;

    return {
        canFinish: missing.length === 0,
        canSeedAnything,
        missingRequired: missing
    };
}
