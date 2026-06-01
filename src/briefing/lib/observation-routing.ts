/**
 * Workspace-observation routing (ADR-014 follow-up polish).
 *
 * Each workspace observation surfaced in the Briefing room may reference
 * a sacred-noun object (deal, account, proof, …). This module maps an
 * observation's `relatedObjectType` + `relatedObjectId` to a destination
 * room URL with the canonical continuity params attached.
 *
 * The Briefing's WorkspaceReads component uses the href to render
 * observations as clickable routes. Observations with no related object
 * (e.g. `discovery_rhythm`, which is workspace-wide) render as plain
 * text — `buildObservationHref` returns null for those.
 *
 * Destination rooms already read the continuity params via the shared
 * `readContinuity()` reader (src/lib/continuity.ts), so no per-room
 * handler is needed for the inbound payload.
 */

import type { ObservationView } from "@/lib/observations/types";
import type { FocusedObjectType } from "@/lib/session/types";

interface RoomTarget {
    readonly path: string;
    readonly label: string;
}

const ROOM_FOR_TYPE: Partial<Record<FocusedObjectType, RoomTarget>> = {
    deal: { path: "/deal-workspace/", label: "Deal Workspace" },
    account: { path: "/signal-console/", label: "Signal Console" },
    signal: { path: "/signal-console/", label: "Signal Console" },
    proof: { path: "/poc-framework/", label: "PoC Framework" },
    call: { path: "/call-planner/", label: "Call Planner" },
    advisor: { path: "/advisor-deploy/", label: "Advisor Deploy" },
    focus: { path: "/territory-architect/", label: "Territory Architect" },
    approach: { path: "/territory-architect/", label: "Territory Architect" }
};

export interface ObservationRoute {
    readonly href: string;
    readonly roomLabel: string;
}

/**
 * Build a destination URL with continuity params for a workspace
 * observation. Returns null when the observation has no related
 * object id (or maps to an unrecognized type).
 */
export function buildObservationHref(
    observation: ObservationView
): ObservationRoute | null {
    if (!observation.relatedObjectType) return null;
    if (!observation.relatedObjectId) return null;
    const target = ROOM_FOR_TYPE[observation.relatedObjectType];
    if (!target) return null;
    const params = new URLSearchParams();
    params.set("focusObject", observation.relatedObjectId);
    params.set("focusRoom", "Briefing");
    params.set("fromMode", "workspace-read");
    params.set("fromSurface", "briefing-workspace");
    params.set("returnTo", "/briefing/");
    params.set("returnLabel", "Back to Briefing");
    return {
        href: `${target.path}?${params.toString()}`,
        roomLabel: target.label
    };
}
