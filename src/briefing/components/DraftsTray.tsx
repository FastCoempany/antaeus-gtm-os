import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { signal, type Signal } from "@preact/signals";
import {
    clearAllBriefingDrafts,
    clearBriefingDraft,
    loadBriefingDrafts,
    roomLabelForPath,
    type BriefingDraftBreadcrumb
} from "@/lib/briefing-drafts";

/**
 * DraftsTray — surfaces the pending Briefing drafts the operator has
 * saved across destination rooms.
 *
 * When the operator clicks "Save to refresh list" on a BriefingDraftBanner
 * in a destination room, the banner persists a breadcrumb to
 * gtmos_briefing_drafts_pending. Per ADR-013 the per-room "save into the
 * destination's data store" mechanics are deferred; this tray gives the
 * operator a way to find what they acknowledged in the meantime.
 *
 * Surfaces only when N > 0. Renders inside the Briefing room (NOT global
 * chrome) — the Briefing is where these drafts originate, so showing
 * them here keeps the operator's mental model coherent.
 *
 * Hook-free per canon Phase 4 / Room 9. Module-level signals carry the
 * list + collapsed state. Re-reads storage when collapsed-toggle fires.
 */

const draftsSignal: Signal<ReadonlyArray<BriefingDraftBreadcrumb>> = signal([]);
const expandedSignal: Signal<boolean> = signal(false);
const loadedSignal: Signal<boolean> = signal(false);

function refresh(): void {
    draftsSignal.value = loadBriefingDrafts();
    loadedSignal.value = true;
}

function toggleExpanded(): void {
    if (!expandedSignal.value) refresh();
    expandedSignal.value = !expandedSignal.value;
}

function onClear(draft: BriefingDraftBreadcrumb): void {
    clearBriefingDraft(draft.roomPath, draft.label, draft.acknowledgedAt);
    refresh();
}

function onClearAll(): void {
    clearAllBriefingDrafts();
    refresh();
}

function formatTimestamp(iso: string): string {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    } catch {
        return iso;
    }
}

export function DraftsTray(): JSX.Element | null {
    // Initial read — module-level effect not used so the tray's render
    // path also stays test-friendly. Read the list on first render.
    if (!loadedSignal.value) refresh();
    const drafts = draftsSignal.value;
    if (drafts.length === 0) return null;
    const expanded = expandedSignal.value;
    return (
        <aside class="bf-drafts" aria-label={t("Pending Briefing drafts")}>
            <button
                type="button"
                class="bf-drafts__head"
                onClick={toggleExpanded}
                aria-expanded={expanded}
            >
                <span class="bf-drafts__kicker">
                    PENDING DRAFTS
                </span>
                <span class="bf-drafts__count">
                    {drafts.length}{" "}
                    {drafts.length === 1 ? "draft" : "drafts"} acknowledged
                </span>
                <span class="bf-drafts__chev" aria-hidden="true">
                    {expanded ? "−" : "+"}
                </span>
            </button>
            {expanded ? (
                <div class="bf-drafts__body">
                    <ul class="bf-drafts__list">
                        {drafts.map((d) => (
                            <li
                                class="bf-drafts__row"
                                key={`${d.roomPath}|${d.acknowledgedAt}|${d.label}`}
                            >
                                <div class="bf-drafts__row-main">
                                    <p class="bf-drafts__row-label">{d.label}</p>
                                    {d.rationale ? (
                                        <p class="bf-drafts__row-why">{d.rationale}</p>
                                    ) : null}
                                    <p class="bf-drafts__row-meta">
                                        {roomLabelForPath(d.roomPath)}
                                        {d.section ? ` · ${d.section}` : ""}{" "}
                                        · {formatTimestamp(d.acknowledgedAt)}
                                    </p>
                                </div>
                                <div class="bf-drafts__row-actions">
                                    <a
                                        class="bf-drafts__row-link"
                                        href={d.roomPath}
                                        aria-label={`Open ${roomLabelForPath(d.roomPath)}`}
                                    >
                                        Open →
                                    </a>
                                    <button
                                        type="button"
                                        class="bf-drafts__row-clear"
                                        onClick={() => onClear(d)}
                                        aria-label={t("Clear this draft")}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {drafts.length > 1 ? (
                        <div class="bf-drafts__foot">
                            <button
                                type="button"
                                class="bf-drafts__clear-all"
                                onClick={onClearAll}
                            >
                                Clear all
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </aside>
    );
}

/** @internal — reset module state between tests. */
export function __resetDraftsTrayForTests(): void {
    draftsSignal.value = [];
    expandedSignal.value = false;
    loadedSignal.value = false;
}
