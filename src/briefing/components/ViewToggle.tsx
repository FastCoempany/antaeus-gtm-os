import type { JSX } from "preact";
import { signal, type Signal } from "@preact/signals";
import { loadView, saveView, type BriefingView } from "../lib/view-state";

/**
 * ViewToggle — the Workspace / World switcher (ADR-014).
 *
 * Two buttons below the topbar, above the lead. Default Workspace per
 * ADR-014 §3. State persists per device.
 *
 * Hook-free per canon Phase 4 / Room 9 — module-level signal.
 */

const viewSignal: Signal<BriefingView | null> = signal(null);

function currentView(): BriefingView {
    if (viewSignal.value === null) viewSignal.value = loadView();
    return viewSignal.value;
}

export function activeBriefingView(): BriefingView {
    return currentView();
}

export function setBriefingView(next: BriefingView): void {
    viewSignal.value = next;
    saveView(next);
}

/** @internal — reset module state between tests. */
export function __resetBriefingViewForTests(): void {
    viewSignal.value = null;
}

export function ViewToggle(): JSX.Element {
    const view = currentView();
    return (
        <nav
            class="bf-view-toggle"
            aria-label="Briefing view"
            role="tablist"
        >
            <button
                type="button"
                class={`bf-view-toggle__btn${
                    view === "workspace" ? " bf-view-toggle__btn--active" : ""
                }`}
                role="tab"
                aria-selected={view === "workspace"}
                onClick={() => setBriefingView("workspace")}
            >
                <span class="bf-view-toggle__kicker">YOUR WORK</span>
                <span class="bf-view-toggle__label">Workspace</span>
            </button>
            <button
                type="button"
                class={`bf-view-toggle__btn${
                    view === "world" ? " bf-view-toggle__btn--active" : ""
                }`}
                role="tab"
                aria-selected={view === "world"}
                onClick={() => setBriefingView("world")}
            >
                <span class="bf-view-toggle__kicker">YOUR MARKET</span>
                <span class="bf-view-toggle__label">World</span>
            </button>
        </nav>
    );
}
