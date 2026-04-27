import { reportError } from "@/lib/observability";

/**
 * Phase 4 / Room 7 Wave 5 — cross-room handoff helpers.
 *
 * Faithful port of the legacy `buildRoomHref(href, focusObject,
 * roomLabel)` from `app/cold-call-studio/index.html` lines 138-150.
 * Carries the canonical continuity params per CLAUDE.md §2 ("the
 * continuity plumbing — do not break them") plus an `?account=`
 * pass-through so destination rooms can pre-select.
 *
 * `createDealFromCall` is the live cross-room write that fires when
 * a meeting_booked outcome lands. Faithful port of legacy lines
 * 212-220 — appends to `gtmos_deal_workspaces` (Phase 4 / Room 1's
 * Deal Workspace mirror) so the Deal becomes available in the
 * recovery queue + ranked-pressure rail with no other plumbing.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    /** Optional `?account=` for the destination room's auto-select. */
    readonly account?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildColdCallHref({
    href,
    focusObject,
    roomLabel,
    account,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/app/cold-call-studio/");
    params.set("returnLabel", "Back to Cold Call Studio");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "cold-call-studio");
    if (account) params.set("account", account);
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToSignalConsole(account: string): string {
    return buildColdCallHref({
        href: "/app/signal-console/",
        focusObject: account || "Cold call prep",
        roomLabel: "Signal Console",
        account
    });
}

export function hrefToCallPlanner(account: string): string {
    return buildColdCallHref({
        href: "/app/discovery-agenda/",
        focusObject: account || "Cold call",
        roomLabel: "Call Planner",
        account
    });
}

export function hrefToDealWorkspace(account: string): string {
    return buildColdCallHref({
        href: "/app/deal-workspace/",
        focusObject: account || "Cold call",
        roomLabel: "Deal Workspace",
        account
    });
}

// ─── URL inbound ──────────────────────────────────────────────────────

/**
 * Read the inbound URL params (`?account=`, falling back to
 * `?focusObject=`) and return the account name to auto-select.
 * Returns null when neither is present. Per legacy lines 282-294.
 */
export function readInboundAccount(
    search: string = typeof window !== "undefined"
        ? window.location.search
        : ""
): string | null {
    try {
        const p = new URLSearchParams(search);
        const account = p.get("account");
        if (account && account.length > 0) return account;
        const focus = p.get("focusObject");
        if (focus && focus.length > 0) return focus;
        return null;
    } catch {
        return null;
    }
}

// ─── Deal write (cross-room mirror) ────────────────────────────────────

interface StorageReadWrite {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const DEAL_WORKSPACE_KEY = "gtmos_deal_workspaces";

/**
 * Append a fresh Deal record to `gtmos_deal_workspaces`. Faithful
 * port of legacy lines 212-220. The Deal lands at stage `prospect`
 * with a single nextStep ("First meeting from cold call"); the
 * operator promotes it through the funnel from inside Deal
 * Workspace.
 *
 * Returns the new deal's id, or null if the storage is unavailable
 * or an error fires (handled defensively — the call has already
 * been logged to gtmos_cold_call_log; failing the Deal write must
 * not lose the call).
 */
export function createDealFromCall(
    accountName: string,
    now: number = Date.now(),
    storage: StorageReadWrite | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): string | null {
    if (!accountName) return null;
    if (!storage) return null;
    try {
        const dealId = `deal_${now}_${Math.random().toString(36).slice(2, 8)}`;
        const iso = new Date(now).toISOString();
        const deal = {
            id: dealId,
            accountName,
            value: 0,
            stage: "prospect",
            nextStep: "First meeting from cold call",
            nextStepDate: null,
            created_at: iso,
            updated_at: iso
        };
        const raw = storage.getItem(DEAL_WORKSPACE_KEY);
        let deals: unknown[] = [];
        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw);
                if (Array.isArray(parsed)) deals = parsed.slice();
            } catch {
                // Hostile JSON — start fresh.
                deals = [];
            }
        }
        deals.push(deal);
        storage.setItem(DEAL_WORKSPACE_KEY, JSON.stringify(deals));
        return dealId;
    } catch (err) {
        reportError(err, { op: "cold-call-studio.createDealFromCall" });
        return null;
    }
}
