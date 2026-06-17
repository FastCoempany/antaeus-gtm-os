import type { JSX } from "preact";
import { Button, Kicker, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import {
    discoveryBusy,
    discoveryError,
    latestRun,
    runDiscoveryNow
} from "../../state";
import { relativeTime, runStatusLabel, runStatusTone } from "../lib/adapters";

/**
 * DiscoveryConsoleDS — the working console at the top of the Live
 * Instrument (canon §4.22, ADR-016). The "Run discovery now" action is
 * the one dominant move (accent); the last-run summary reports status,
 * events written, cost, and when. Orange left-rule marks the action
 * surface. The discovery client + cost ledger are the unchanged engine.
 */
export function DiscoveryConsoleDS(): JSX.Element {
    const run = latestRun.value;
    const busy = discoveryBusy.value;
    const err = discoveryError.value;

    return (
        <section class="oed-console" aria-label={t("Discovery console")}>
            <div class="oed-console__main">
                <Kicker>{t("DISCOVERY")}</Kicker>
                <p class="oed-console__hint">
                    {t(
                        "Reads your product category and finds gatherings — direct, adjacent, and indirect — with real source links.",
                        { class: "body" }
                    )}
                </p>
                <Button
                    variant="accent"
                    onClick={() => void runDiscoveryNow()}
                    disabled={busy}
                >
                    {busy ? t("Searching the world…") : t("Run discovery now")}
                </Button>
            </div>
            {run ? (
                <div class="oed-console__run">
                    <StatusChip
                        label={runStatusLabel(run.status)}
                        tone={runStatusTone(run.status)}
                    />
                    <span class="oed-console__run-meta">
                        {run.eventsWritten} event
                        {run.eventsWritten === 1 ? "" : "s"} · $
                        {run.totalCostUsd.toFixed(2)} ·{" "}
                        {relativeTime(run.completedAt ?? run.startedAt)}
                    </span>
                    {run.errorSummary ? (
                        <span class="oed-console__run-error">{run.errorSummary}</span>
                    ) : null}
                </div>
            ) : null}
            {err ? (
                <p class="oed-console__error" role="alert">
                    {err}
                </p>
            ) : null}
        </section>
    );
}
