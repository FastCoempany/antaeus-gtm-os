/**
 * Briefing drafts — reader + clear helpers for the breadcrumbs the
 * BriefingDraftBanner persists when an operator acknowledges a drafted
 * move.
 *
 * The banner writes to localStorage under `gtmos_briefing_drafts_pending`
 * (each Save persists one row). This module provides the read + clear
 * API the Briefing room's drafts-tray uses to surface "you have N
 * pending drafts that haven't been acted on yet."
 *
 * Per ADR-013 follow-up: the breadcrumb path is the operator-facing
 * acknowledgement that the draft was received — actually saving the
 * draft INTO the destination room remains per-room work, but at least
 * the operator can find what they saved.
 */

export const BRIEFING_DRAFTS_KEY = "gtmos_briefing_drafts_pending";

export interface BriefingDraftBreadcrumb {
    readonly label: string;
    readonly rationale: string | null;
    readonly section: string | null;
    readonly action: string | null;
    readonly targetId: string | null;
    readonly patternId: string | null;
    readonly roomPath: string;
    readonly acknowledgedAt: string;
}

function asString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function parseBreadcrumb(raw: unknown): BriefingDraftBreadcrumb | null {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    const label = asString(o.label);
    const roomPath = asString(o.roomPath);
    const acknowledgedAt = asString(o.acknowledgedAt);
    if (!label || !roomPath || !acknowledgedAt) return null;
    return {
        label,
        rationale: asString(o.rationale),
        section: asString(o.section),
        action: asString(o.action),
        targetId: asString(o.targetId),
        patternId: asString(o.patternId),
        roomPath,
        acknowledgedAt
    };
}

/**
 * Read the pending-drafts list, newest first. Defensive against any
 * shape — corrupt rows are skipped; missing storage returns [].
 */
export function loadBriefingDrafts(): BriefingDraftBreadcrumb[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(BRIEFING_DRAFTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        const list = parsed
            .map(parseBreadcrumb)
            .filter((r): r is BriefingDraftBreadcrumb => r !== null);
        // Newest first by acknowledgedAt.
        list.sort((a, b) => b.acknowledgedAt.localeCompare(a.acknowledgedAt));
        return list;
    } catch {
        return [];
    }
}

/**
 * Remove a single breadcrumb. Matched by the tuple
 * (roomPath, label, acknowledgedAt) — sufficient for v1 since the
 * banner persists one breadcrumb per operator click.
 */
export function clearBriefingDraft(
    roomPath: string,
    label: string,
    acknowledgedAt: string
): void {
    if (typeof window === "undefined") return;
    try {
        const list = loadBriefingDrafts().filter(
            (d) =>
                !(
                    d.roomPath === roomPath &&
                    d.label === label &&
                    d.acknowledgedAt === acknowledgedAt
                )
        );
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify(list)
        );
    } catch {
        // Quota / disabled — non-blocking.
    }
}

/** Remove every breadcrumb. */
export function clearAllBriefingDrafts(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(BRIEFING_DRAFTS_KEY);
    } catch {
        // Non-blocking.
    }
}

/**
 * Pretty path → room label mapping. Mirrors DESTINATION_ROOM_LABEL in
 * the briefing destinations module but accepts any path — used for
 * displaying which room a breadcrumb belongs to.
 */
export function roomLabelForPath(path: string): string {
    if (path.startsWith("/discovery-studio")) return "Discovery Studio";
    if (path.startsWith("/call-planner")) return "Call Planner";
    if (path.startsWith("/outbound-studio")) return "Outbound Studio";
    if (path.startsWith("/deal-workspace")) return "Deal Workspace";
    if (path.startsWith("/founding-gtm")) return "Founding GTM";
    if (path.startsWith("/poc-framework")) return "PoC Framework";
    if (path.startsWith("/advisor-deploy")) return "Advisor Deploy";
    if (path.startsWith("/signal-console")) return "Signal Console";
    if (path.startsWith("/icp-studio")) return "ICP Studio";
    if (path.startsWith("/territory-architect")) return "Territory Architect";
    if (path.startsWith("/quota-workback")) return "Quota Workback";
    return path.replace(/^\//, "").replace(/-/g, " ");
}
