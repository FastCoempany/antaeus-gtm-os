import type { Account } from "./types";

/**
 * Phase 4 / Room 3 Wave 5 — execution context lookup.
 *
 * Faithful port of the legacy `getAccountExecutionContext` function
 * (lines 1335-1347 of app/signal-console/index.html). Reads the
 * cross-room state from localStorage (`gtmos_deal_workspaces` +
 * `gtmos_outbound_touches`) and returns a temperature label per
 * account so the card UI can show the right CTA + the right
 * post-click route.
 *
 * Temperature mapping (preserves legacy logic):
 *   - hot      = active deal, stage past prospect (real motion)
 *   - warm     = replied to outbound, OR a deal exists at all
 *   - cool     = touches sent but no replies yet
 *   - ice_cold = no touches, no deal
 *
 * Phase 4 / Room 1 (Deal Workspace) writes `gtmos_deal_workspaces` as
 * its mirror; the legacy outbound rooms still own `gtmos_outbound_touches`.
 *
 * Pure helper — accepts a storage object so tests can drive it
 * deterministically.
 */

export type Temperature = "ice_cold" | "cool" | "warm" | "hot";

export interface ExecutionContext {
    readonly hasActiveDeal: boolean;
    readonly hasReplies: boolean;
    readonly touchCount: number;
    readonly temperature: Temperature;
    readonly temperatureLabel: string;
}

interface StorageLike {
    getItem(key: string): string | null;
}

function parseJson(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

interface DealRow {
    readonly accountName?: string;
    readonly account_name?: string;
    readonly stage?: string;
}

interface TouchRow {
    readonly account?: string;
    readonly outcome?: string;
}

function readDeals(storage: StorageLike): ReadonlyArray<DealRow> {
    const raw = parseJson(storage.getItem("gtmos_deal_workspaces"));
    if (!Array.isArray(raw)) return [];
    return raw.filter((r): r is DealRow => !!r && typeof r === "object");
}

function readTouches(storage: StorageLike): ReadonlyArray<TouchRow> {
    const raw = parseJson(storage.getItem("gtmos_outbound_touches"));
    if (!raw || typeof raw !== "object") return [];
    const touches = (raw as { touches?: unknown }).touches;
    if (!Array.isArray(touches)) return [];
    return touches.filter((t): t is TouchRow => !!t && typeof t === "object");
}

function dealAccountName(d: DealRow): string {
    return String(d.accountName ?? d.account_name ?? "").toLowerCase();
}

function isClosed(stage: string | undefined): boolean {
    return stage === "closed-won" || stage === "closed-lost";
}

// Signal Console audit (2026-05): renamed from temperature-ish labels
// (Ice Cold / Cool / Warm / Hot) which read as visual contradictions
// next to the actual heat badge. New labels name the engagement state
// in operator vocabulary — has touch happened, has the buyer replied,
// is there an active deal. Internal Temperature keys stay the same so
// no callers break.
const TEMP_LABEL: Record<Temperature, string> = {
    ice_cold: "Untouched",
    cool: "Touched",
    warm: "Replied",
    hot: "In deal"
};

export function getAccountExecutionContext(
    account: Account,
    storage: StorageLike | null = typeof localStorage !== "undefined" ? localStorage : null
): ExecutionContext {
    if (!storage) {
        return {
            hasActiveDeal: false,
            hasReplies: false,
            touchCount: 0,
            temperature: "ice_cold",
            temperatureLabel: TEMP_LABEL.ice_cold
        };
    }
    const name = account.name.toLowerCase();
    const deals = readDeals(storage);
    const touches = readTouches(storage);
    const activeDeal = deals.find(
        (d) => dealAccountName(d) === name && !isClosed(d.stage)
    );
    const acctTouches = touches.filter((t) => String(t.account ?? "").toLowerCase() === name);
    const hasReplies = acctTouches.some(
        (t) => t.outcome === "replied" || t.outcome === "meeting_booked"
    );

    let temperature: Temperature = "ice_cold";
    if (activeDeal && activeDeal.stage && activeDeal.stage !== "prospect") {
        temperature = "hot";
    } else if (hasReplies || activeDeal) {
        temperature = "warm";
    } else if (acctTouches.length > 0) {
        temperature = "cool";
    }

    return {
        hasActiveDeal: !!activeDeal,
        hasReplies,
        touchCount: acctTouches.length,
        temperature,
        temperatureLabel: TEMP_LABEL[temperature]
    };
}
