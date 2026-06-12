import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    discoveryBusy,
    discoveryError,
    latestRun,
    runDiscoveryNow
} from "../state";

/**
 * DiscoveryConsole — the working console at the top of the room
 * (ADR-016). "Run discovery now" + the latest-run summary (status,
 * events written, cost). This is the Live Instrument's action
 * surface: the operator triggers a category-anchored search and the
 * room repopulates.
 */

function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const then = Date.parse(iso);
    if (!Number.isFinite(then)) return "";
    const mins = Math.round((Date.now() - then) / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

function statusLabel(status: string): string {
    if (status === "completed") return "Last run";
    if (status === "throttled") return "Last run (budget-limited)";
    if (status === "failed") return "Last run failed";
    if (status === "paused") return "Paused — weekly budget reached";
    if (status === "running") return "Running…";
    return "Last run";
}

export function DiscoveryConsole(): JSX.Element {
    const run = latestRun.value;
    const busy = discoveryBusy.value;
    const err = discoveryError.value;
    return (
        <section class="oe-console" aria-label={t("Discovery console")}>
            <div class="oe-console__main">
                <button
                    type="button"
                    class="oe-console__run-btn"
                    onClick={() => void runDiscoveryNow()}
                    disabled={busy}
                >
                    {busy ? "Searching the world…" : "Run discovery now"}
                </button>
                <p class="oe-console__hint">
                    Reads your product category and finds gatherings —
                    direct, adjacent, and indirect — with real source links.
                </p>
            </div>
            {run ? (
                <div class="oe-console__run">
                    <span class="oe-console__run-status">
                        {statusLabel(run.status)}
                    </span>
                    <span class="oe-console__run-meta">
                        {run.eventsWritten} event
                        {run.eventsWritten === 1 ? "" : "s"} ·{" "}
                        ${run.totalCostUsd.toFixed(2)} ·{" "}
                        {relativeTime(run.completedAt ?? run.startedAt)}
                    </span>
                    {run.errorSummary ? (
                        <span class="oe-console__run-error">
                            {run.errorSummary}
                        </span>
                    ) : null}
                </div>
            ) : null}
            {err ? (
                <p class="oe-console__error" role="alert">
                    {err}
                </p>
            ) : null}
        </section>
    );
}
