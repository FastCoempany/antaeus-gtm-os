/**
 * Phase A orchestration layer (ADR-004) — session helpers.
 *
 * The public API rooms call to read + mutate the workspace session.
 * Wraps the data-client + the signal layer in `state.ts`.
 *
 * Phase A surface (no rooms wired yet):
 *   - `bootSession(opts)` — load or create the session for the current
 *     workspace. Called once on app boot.
 *   - `setFocusedObject(focus)` — update the focused object across
 *     every room + every tab (via Realtime).
 *   - `clearFocus()` — clear the focused object (e.g. on Dashboard
 *     entry).
 *   - `pushRecentAction(action)` — append to the rolling action log.
 *   - `subscribeToSession()` — auto-mount the Realtime subscription
 *     for cross-tab updates.
 *
 * Pattern note: this layer does NOT auto-create the session row on
 * boot. The first mutation (setFocusedObject / pushRecentAction)
 * upserts. This avoids writing junk rows when an operator opens
 * Antaeus and immediately closes it without touching anything.
 */

import { reportError, trackEvent } from "@/lib/observability";
import { createDataClient, type DataClient } from "@/lib/data-client";
import {
    isSessionLoaded,
    session
} from "./state";
import {
    RECENT_ACTIONS_LIMIT,
    rowToSession,
    serializeRecentActions,
    type FocusedObject,
    type SessionAction,
    type WorkspaceSessionView
} from "./types";

export interface BootSessionOptions {
    readonly data?: DataClient;
    /** Skip the Realtime subscription (used in tests). */
    readonly skipRealtime?: boolean;
}

export interface BootSessionResult {
    readonly session: WorkspaceSessionView | null;
    readonly subscription: { unsubscribe: () => void } | null;
}

/**
 * Load the current workspace's session (if it exists). Wires up the
 * Realtime subscription unless `skipRealtime` is set. Returns the
 * session view + the subscription handle.
 *
 * Idempotent — calling twice replaces the prior subscription.
 *
 * Notes:
 * - Returns `{ session: null }` (not an error) if no workspace is
 *   currently selected. The signal layer also stays null.
 * - Returns `{ session: null }` if no row exists yet for this
 *   workspace. The first mutation will upsert.
 */
export async function bootSession(
    opts: BootSessionOptions = {}
): Promise<BootSessionResult> {
    const data = opts.data ?? createDataClient();
    let subscription: { unsubscribe: () => void } | null = null;

    try {
        const workspace = await data.currentWorkspace();
        if (!workspace) {
            isSessionLoaded.value = true;
            return { session: null, subscription: null };
        }

        // Load the existing session row, if any.
        const rows = await data.workspaceSessions.list({
            where: { workspace_id: workspace.id },
            limit: 1
        });
        const row = rows[0] ?? null;
        const view = row ? rowToSession(row) : null;
        session.value = view;
        isSessionLoaded.value = true;

        if (!opts.skipRealtime) {
            subscription = data.workspaceSessions.subscribe((payload) => {
                applyRealtimeUpdate(payload, workspace.id);
            });
        }

        return { session: view, subscription };
    } catch (err) {
        reportError(err, { op: "session.bootSession" });
        isSessionLoaded.value = true;
        return { session: null, subscription: null };
    }
}

/**
 * Apply a Realtime payload to the session signal. Defensive — drops
 * payloads for the wrong workspace or with malformed rows.
 *
 * Exported for tests; rooms shouldn't call this.
 */
export function applyRealtimeUpdate(
    payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        new: Record<string, unknown> | null;
        old: Record<string, unknown> | null;
    },
    workspaceId: string
): void {
    if (payload.eventType === "DELETE") {
        if (payload.old?.["workspace_id"] === workspaceId) {
            session.value = null;
        }
        return;
    }
    const row = payload.new;
    if (!row || row["workspace_id"] !== workspaceId) return;
    try {
        const view = rowToSession(row as Parameters<typeof rowToSession>[0]);
        session.value = view;
    } catch (err) {
        reportError(err, { op: "session.applyRealtimeUpdate" });
    }
}

/**
 * Set the focused object. Upserts the session row for the current
 * workspace. Other tabs see the change via Realtime within ~1 second.
 *
 * Returns the updated view (or null if the workspace couldn't be
 * resolved — e.g. unauthenticated).
 */
export async function setFocusedObject(
    focus: FocusedObject,
    opts: { data?: DataClient } = {}
): Promise<WorkspaceSessionView | null> {
    const data = opts.data ?? createDataClient();
    try {
        const workspace = await data.currentWorkspace();
        if (!workspace) return null;

        // Read the existing row (if any) so we preserve recent_actions
        // and don't blow away cross-room context.
        const existing = await data.workspaceSessions.list({
            where: { workspace_id: workspace.id },
            limit: 1
        });
        const existingRow = existing[0] ?? null;

        const recentActions = existingRow
            ? rowToSession(existingRow).recentActions
            : [];

        // Append a synthetic 'focus' action so the rolling log
        // captures every focus change without rooms having to call
        // pushRecentAction explicitly.
        const action: SessionAction = {
            at: new Date().toISOString(),
            room: focus.room,
            verb: "focus",
            objectType: focus.type,
            objectId: focus.id,
            summary: `Focused on ${focus.name}.`
        };
        const nextActions = [action, ...recentActions].slice(
            0,
            RECENT_ACTIONS_LIMIT
        );

        let row;
        if (existingRow) {
            row = await data.workspaceSessions.update(existingRow.id, {
                focused_object_type: focus.type,
                focused_object_id: focus.id,
                focused_object_name: focus.name,
                focused_object_room: focus.room,
                recent_actions: serializeRecentActions(nextActions)
            });
        } else {
            row = await data.workspaceSessions.insert({
                workspace_id: workspace.id,
                focused_object_type: focus.type,
                focused_object_id: focus.id,
                focused_object_name: focus.name,
                focused_object_room: focus.room,
                recent_actions: serializeRecentActions(nextActions)
            });
        }

        const view = rowToSession(row);
        session.value = view;
        trackEvent("session_focus_changed", {
            object_type: focus.type,
            room: focus.room
        });
        return view;
    } catch (err) {
        reportError(err, { op: "session.setFocusedObject" });
        return null;
    }
}

/**
 * Clear the focused object. The session row stays (recent_actions
 * preserved) but all focus fields go null.
 */
export async function clearFocus(
    opts: { data?: DataClient } = {}
): Promise<WorkspaceSessionView | null> {
    const data = opts.data ?? createDataClient();
    try {
        const workspace = await data.currentWorkspace();
        if (!workspace) return null;

        const existing = await data.workspaceSessions.list({
            where: { workspace_id: workspace.id },
            limit: 1
        });
        const existingRow = existing[0];
        if (!existingRow) {
            // Nothing to clear.
            return null;
        }

        const row = await data.workspaceSessions.update(existingRow.id, {
            focused_object_type: null,
            focused_object_id: null,
            focused_object_name: null,
            focused_object_room: null
        });
        const view = rowToSession(row);
        session.value = view;
        return view;
    } catch (err) {
        reportError(err, { op: "session.clearFocus" });
        return null;
    }
}

/**
 * Append a recent action to the rolling log. Used by rooms when an
 * operator saves, advances, logs a call, etc. Caps at
 * RECENT_ACTIONS_LIMIT (oldest dropped).
 *
 * Does NOT change the focused object — callers should call
 * `setFocusedObject` for that.
 */
export async function pushRecentAction(
    action: Omit<SessionAction, "at">,
    opts: { data?: DataClient; now?: number } = {}
): Promise<WorkspaceSessionView | null> {
    const data = opts.data ?? createDataClient();
    const now = opts.now ?? Date.now();
    try {
        const workspace = await data.currentWorkspace();
        if (!workspace) return null;

        const existing = await data.workspaceSessions.list({
            where: { workspace_id: workspace.id },
            limit: 1
        });
        const existingRow = existing[0] ?? null;

        const recentActions = existingRow
            ? rowToSession(existingRow).recentActions
            : [];
        const fullAction: SessionAction = {
            at: new Date(now).toISOString(),
            ...action
        };
        const nextActions = [fullAction, ...recentActions].slice(
            0,
            RECENT_ACTIONS_LIMIT
        );

        let row;
        if (existingRow) {
            row = await data.workspaceSessions.update(existingRow.id, {
                recent_actions: serializeRecentActions(nextActions)
            });
        } else {
            row = await data.workspaceSessions.insert({
                workspace_id: workspace.id,
                recent_actions: serializeRecentActions(nextActions)
            });
        }

        const view = rowToSession(row);
        session.value = view;
        return view;
    } catch (err) {
        reportError(err, { op: "session.pushRecentAction" });
        return null;
    }
}
