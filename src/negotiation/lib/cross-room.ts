import type { LinkedDealSummary } from "./types";

/**
 * Cross-room reader for the Deal Workspace mirror + URL inbound for
 * `?deal=` per Phase 4 (the 2026-05 navigation-intelligence roadmap).
 *
 * The handoff writers (buildNegotiationHref + hrefToDealWorkspace +
 * hrefToFutureAutopsy + hrefToAdvisorDeploy + hrefToPocFramework)
 * moved to `lib/handoff.ts` per Phase 4 to match the canonical
 * Phase 2 pattern + adopt Invariant 8 (no placeholder strings for
 * focusObject). This file is now the read-side only.
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
