import type { LinkedDealSummary } from "./types";

/**
 * Cross-room readers + handoff helpers — Negotiation ↔ Deal Workspace
 * ↔ Advisor Deploy triangle per canon §4.16b.
 */

interface StorageLike {
    getItem(k: string): string | null;
}

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function parse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

interface RawDeal {
    readonly id?: string;
    readonly accountName?: string;
    readonly name?: string;
    readonly stage?: string;
    readonly value?: number;
}

/**
 * Read deals from the cloud-mirrored Deal Workspace localStorage key.
 * Returns post-evaluation, pre-close deals (negotiation territory).
 */
export function loadDealsForLinking(
    storage: StorageLike | null = safeStorage()
): ReadonlyArray<LinkedDealSummary> {
    if (!storage) return [];
    const raw = storage.getItem("gtmos_deal_workspaces");
    const arr = parse<ReadonlyArray<RawDeal>>(raw, []);
    if (!Array.isArray(arr)) return [];
    return arr
        .map((d): LinkedDealSummary | null => {
            const id = d.id;
            if (typeof id !== "string" || !id) return null;
            const stage = (d.stage ?? "").toLowerCase();
            // Negotiation lives in the post-eval / pre-close window.
            if (
                stage !== "evaluation" &&
                stage !== "negotiation" &&
                stage !== "proposal" &&
                stage !== "verbal-yes"
            ) {
                return null;
            }
            return {
                id,
                accountName: d.accountName ?? d.name ?? "(unnamed)",
                stage,
                value: typeof d.value === "number" ? d.value : 0
            };
        })
        .filter((d): d is LinkedDealSummary => d !== null);
}

interface ContinuityParams {
    readonly returnTo?: string;
    readonly returnLabel?: string;
    readonly focusObject?: string;
    readonly focusRoom?: string;
    readonly fromMode?: string;
    readonly fromSurface?: string;
    readonly extra?: Record<string, string>;
}

/**
 * Build a cross-room href with the canonical continuity params per
 * canon §2 ("the continuity plumbing — do not break them").
 */
export function buildNegotiationHref(
    href: string,
    params: ContinuityParams = {}
): string {
    try {
        const url = new URL(href, "https://antaeus.app");
        if (params.returnTo) url.searchParams.set("returnTo", params.returnTo);
        if (params.returnLabel)
            url.searchParams.set("returnLabel", params.returnLabel);
        if (params.focusObject)
            url.searchParams.set("focusObject", params.focusObject);
        if (params.focusRoom)
            url.searchParams.set("focusRoom", params.focusRoom);
        if (params.fromMode) url.searchParams.set("fromMode", params.fromMode);
        if (params.fromSurface)
            url.searchParams.set("fromSurface", params.fromSurface);
        if (params.extra) {
            for (const [k, v] of Object.entries(params.extra)) {
                url.searchParams.set(k, v);
            }
        }
        return url.pathname + url.search + url.hash;
    } catch {
        return href;
    }
}

export function hrefToDealWorkspace(dealId: string): string {
    return buildNegotiationHref("/deal-workspace/", {
        returnTo: "/negotiation/",
        returnLabel: "Back to Negotiation",
        focusObject: dealId,
        focusRoom: "deal-workspace",
        fromSurface: "negotiation",
        extra: { deal: dealId }
    });
}

export function hrefToAdvisorDeploy(dealId: string): string {
    return buildNegotiationHref("/advisor-deploy/", {
        returnTo: "/negotiation/",
        returnLabel: "Back to Negotiation",
        focusObject: dealId,
        focusRoom: "advisor-deploy",
        fromSurface: "negotiation",
        extra: { deal: dealId }
    });
}

/** Read inbound `?deal=` URL param so a Deal-Workspace-initiated handoff lands on the right deal. */
export function readInboundDealId(search: string): string | null {
    try {
        const params = new URLSearchParams(search);
        const id = params.get("deal");
        return id && id.length > 0 ? id : null;
    } catch {
        return null;
    }
}
