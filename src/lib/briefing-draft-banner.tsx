import type { JSX } from "preact";
import { signal, effect, type Signal } from "@preact/signals";
import { readContinuity } from "./continuity";
import "./briefing-draft-banner.css";

/**
 * BriefingDraftBanner — surfaces the "drafted from a Briefing" payload
 * when the operator arrives at a destination room via a Briefing
 * recommended-move click.
 *
 * Mounts globally via RoomChrome. Reads inbound continuity params
 * (`fromMode=briefing-draft` + the `briefingDraft*` payload) and renders
 * a top-of-room band carrying the drafted move, with Acknowledge +
 * Dismiss affordances.
 *
 * Acknowledge: persists a breadcrumb to localStorage under
 * `gtmos_briefing_drafts_pending` so a later per-room "Drafts" tray
 * (deferred) can surface unsaved drafts. The banner dismisses on click.
 *
 * Dismiss: clears the banner without persisting. Operator can browse
 * back to the Briefing for a fresh routing pass.
 *
 * Per ADR-013 + canon §4.21 — the Briefing "produces drafts the
 * operator reviews and saves to the destination room. The Briefing
 * never writes directly." This banner is the operator-side review
 * surface; per-room save mechanics land separately.
 */

const DRAFTS_STORAGE_KEY = "gtmos_briefing_drafts_pending";

interface DraftPayload {
    readonly label: string;
    readonly rationale: string | null;
    readonly section: string | null;
    readonly action: string | null;
    readonly targetId: string | null;
    readonly patternId: string | null;
}

const dismissedSignal: Signal<boolean> = signal(false);

function readDraftPayload(): DraftPayload | null {
    if (typeof window === "undefined") return null;
    const ctx = readContinuity();
    if (ctx.fromMode !== "briefing-draft") return null;
    try {
        const params = new URLSearchParams(window.location.search);
        const label = (params.get("briefingDraftLabel") ?? "").trim();
        if (label.length === 0) return null;
        return {
            label,
            rationale: trimOrNull(params.get("briefingDraftRationale")),
            section: trimOrNull(params.get("briefingDraftSection")),
            action: trimOrNull(params.get("briefingDraftAction")),
            targetId: trimOrNull(params.get("briefingDraftTargetId")),
            patternId: trimOrNull(params.get("briefingDraftPatternId"))
        };
    } catch {
        return null;
    }
}

function trimOrNull(v: string | null): string | null {
    if (!v) return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function actionLabel(action: string | null): string {
    if (action === "new") return "Draft new";
    if (action === "refresh") return "Refresh";
    if (action === "alert") return "Alert";
    return "Draft";
}

function persistAcknowledgement(payload: DraftPayload): void {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
        const list = raw ? (JSON.parse(raw) as unknown) : [];
        const arr = Array.isArray(list) ? list : [];
        arr.push({
            ...payload,
            roomPath: window.location.pathname,
            acknowledgedAt: new Date().toISOString()
        });
        window.localStorage.setItem(
            DRAFTS_STORAGE_KEY,
            JSON.stringify(arr.slice(-50))
        );
    } catch {
        // Storage quota / disabled — non-blocking.
    }
}

function clearQueryParams(): void {
    if (typeof window === "undefined") return;
    try {
        const url = new URL(window.location.href);
        const KEYS = [
            "fromMode",
            "fromSurface",
            "focusRoom",
            "returnTo",
            "returnLabel",
            "briefingDraftLabel",
            "briefingDraftRationale",
            "briefingDraftSection",
            "briefingDraftAction",
            "briefingDraftTargetId",
            "briefingDraftPatternId"
        ];
        for (const k of KEYS) url.searchParams.delete(k);
        window.history.replaceState(
            {},
            "",
            `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`
        );
    } catch {
        // history API issues — non-blocking.
    }
}

function onAcknowledge(payload: DraftPayload): void {
    persistAcknowledgement(payload);
    dismissedSignal.value = true;
    clearQueryParams();
}

function onDismiss(): void {
    dismissedSignal.value = true;
    clearQueryParams();
}

export function BriefingDraftBanner(): JSX.Element | null {
    if (dismissedSignal.value) return null;
    const payload = readDraftPayload();
    if (!payload) return null;
    return (
        <aside
            class="bf-draft-banner"
            role="status"
            aria-label="Drafted from the Briefing"
        >
            <div class="bf-draft-banner__head">
                <span class="bf-draft-banner__kicker">
                    FROM BRIEFING · {actionLabel(payload.action).toUpperCase()}
                </span>
                {payload.section ? (
                    <span class="bf-draft-banner__section">
                        {payload.section}
                    </span>
                ) : null}
            </div>
            <p class="bf-draft-banner__label">{payload.label}</p>
            {payload.rationale ? (
                <p class="bf-draft-banner__rationale">{payload.rationale}</p>
            ) : null}
            <div class="bf-draft-banner__actions">
                <button
                    type="button"
                    class="bf-draft-banner__btn bf-draft-banner__btn--primary"
                    onClick={() => onAcknowledge(payload)}
                >
                    Save to {actionLabel(payload.action).toLowerCase()} list
                </button>
                <button
                    type="button"
                    class="bf-draft-banner__btn bf-draft-banner__btn--ghost"
                    onClick={onDismiss}
                >
                    Dismiss
                </button>
            </div>
        </aside>
    );
}

/** @internal — reset module signals between tests. */
export function __resetBriefingDraftBannerForTests(): void {
    dismissedSignal.value = false;
}

// Reset the dismissal flag when the URL changes — covers SPA-style
// in-room navigation to a different briefing draft.
effect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
        dismissedSignal.value = false;
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
});
