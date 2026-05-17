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

/**
 * Read + parse a JSON value from storage. Returns null on absent or
 * malformed values. Used so we can MERGE seeded items into pre-
 * existing collections instead of overwriting them — re-running
 * onboarding should not silently erase ICPs or accounts the operator
 * already has.
 */
function readJson<T = unknown>(
    store: StorageLike,
    key: string
): T | null {
    try {
        const raw = store.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch (err) {
        reportError(err, { op: "onboarding.readJson", key });
        return null;
    }
}

function asArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
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
        // Legacy readers (`app/settings/index.html`, `js/data-manager.js`,
        // `js/discovery-studio-segment-jump-room.js`) all use `JSON.parse`
        // on this key. Writing a bare string causes JSON.parse to throw
        // and they fall back to "cxai", masking the seeded category. The
        // canonical legacy convention (set by `app/settings/index.html`
        // line 514 and `js/demo-seed-runtime.js`) is JSON.stringify.
        trySet(
            store,
            "gtmos_product_category",
            JSON.stringify(draft.category)
        );
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
        // Merge into the existing ICP collection so re-running
        // onboarding does not silently erase prior workspace truth.
        // Codex P1 — the original implementation replaced the entire
        // gtmos_icp_analytics payload with a single-item array.
        const existing = readJson<Record<string, unknown>>(
            store,
            "gtmos_icp_analytics"
        );
        const existingIcps = asArray<Record<string, unknown>>(
            existing?.["icps"]
        );
        const merged = [
            ...existingIcps.filter(
                (x) => typeof x === "object" && x !== null && x["id"] !== id
            ),
            icp
        ];
        trySet(
            store,
            "gtmos_icp_analytics",
            JSON.stringify({
                ...(existing ?? {}),
                icps: merged,
                updatedAt: iso
            })
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
        // Same merge pattern as ICPs — preserve existing accounts so
        // a re-run doesn't wipe out the operator's signal-console
        // history. Match by case-insensitive name to dedupe re-entries
        // of the same company.
        const existing = readJson<Record<string, unknown>>(
            store,
            "gtmos_sc_v4"
        );
        const existingAccounts = asArray<Record<string, unknown>>(
            existing?.["accounts"]
        );
        const lowerName = acc.name.toLowerCase();
        const merged = [
            ...existingAccounts.filter((x) => {
                const n = typeof x?.["name"] === "string" ? (x["name"] as string) : "";
                return n.toLowerCase() !== lowerName;
            }),
            acc
        ];
        trySet(
            store,
            "gtmos_sc_v4",
            JSON.stringify({
                ...(existing ?? {}),
                accounts: merged,
                updatedAt: iso
            })
        );
        items.push("First account in Signal Console");

        // Phase 2.1 — also publish a Signal Console health snapshot
        // matching the schema Dashboard's snapshot aggregator reads
        // (`gtmos_signal_room_health`, with `hot_accounts[]`).
        //
        // Without this, the seeded account doesn't surface as a
        // ranked move card on Dashboard until Sarah visits Signal
        // Console for the first time — which contradicts Onboarding's
        // promise that "the Dashboard is no longer empty." Onboarding
        // is the only flow that seeds SC data without booting the
        // Signal Console room, so the snapshot publish has to happen
        // here too.
        //
        // Schema kept minimal — Dashboard's `signalSnapshotToMoveCards`
        // reader needs `hot_accounts[]` entries with `name` + `heat`.
        // Other fields (recentSignals, highConfidenceSignals, cause)
        // are absent — Dashboard handles the absences cleanly.
        const signalCount = acc.signals.length;
        const heat = acc.heat;
        const snapshot = {
            capturedAt: iso,
            accountCount: merged.length,
            signalCount,
            readyCount: heat >= 75 ? 1 : 0,
            topName: acc.name,
            topHeat: heat,
            topSignalCount: signalCount,
            topHighConfidenceCount: 0,
            topRecentCount: signalCount,
            hot_accounts: [
                {
                    id: acc.id,
                    name: acc.name,
                    heat,
                    recentSignals: signalCount,
                    highConfidenceSignals: 0
                }
            ]
        };
        trySet(
            store,
            "gtmos_signal_room_health",
            JSON.stringify(snapshot)
        );
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

    // Codex P1 — `js/workspace-guard.js` and `js/supabase-config.js`
    // both gate routes on `gtmos_onboarding.completed === true`.
    // Without writing the canonical shape, a user who finishes the
    // new flow could still be redirected back to /app/onboarding/
    // by the legacy guard on the very next page load. Mirror the
    // shape `js/demo-seed-runtime.js` lines 819-820 use so all
    // downstream readers detect the user as activated.
    trySet(
        store,
        "gtmos_onboarding",
        JSON.stringify({
            completed: true,
            completedAt: iso,
            answers: {
                companyName: draft.companyName.trim() || null,
                role: draft.role,
                productCategory: draft.category,
                quota: draft.annualQuota || null,
                acv: draft.avgDealSize || null,
                icpStatement: draft.icpStatement.trim() || null,
                firstAccount: draft.firstAccountName.trim() || null
            },
            source: "onboarding-v2"
        })
    );
    trySet(store, "gtmos_onboarding_completed_at", iso);

    return { seeded: items.length > 0, items };
}

/**
 * Best-effort completeness probe. Used by the Welcome + Dashboard
 * smoke test bootstrap to decide whether to send a returning user
 * back through onboarding. Checks both the new marker and the
 * canonical legacy `gtmos_onboarding.completed` shape so an operator
 * who finished onboarding via the legacy flow doesn't get sent back
 * through the new one.
 */
export function isOnboardingComplete(s?: StorageLike | null): boolean {
    const store = getStorage(s);
    if (!store) return false;
    try {
        if (store.getItem("gtmos_onboarding_completed_at")) return true;
        const legacy = readJson<Record<string, unknown>>(
            store,
            "gtmos_onboarding"
        );
        return legacy?.["completed"] === true;
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
