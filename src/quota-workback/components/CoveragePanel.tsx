import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { benchmark, coverage, inputs } from "../state";

/**
 * CoveragePanel — live pipeline coverage drawn from
 * `gtmos_deal_workspaces` (Phase 4 / Room 1's mirror). Tone is green
 * when at-or-over benchmark, amber when ≥60% of benchmark, red when
 * below.
 */
export function CoveragePanel(): JSX.Element {
    const c = coverage.value;
    const b = benchmark.value;
    const q = inputs.value.quota;
    const target = b.coverage;

    if (!q || q <= 0) {
        return (
            <section class="qw-cov" aria-label={t("Pipeline coverage")}>
                <header class="qw-cov__head">
                    <span class="qw-cov__title">{t("PIPELINE COVERAGE")}</span>
                    <span class="qw-cov__ratio is-muted">
                        {t("Set quota to see live coverage", { class: "body" })}
                    </span>
                </header>
                <p class="qw-cov__empty">
                    {t(
                        "Coverage compares weighted open pipeline against the quota target.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    if (!c.hasDeals || c.ratio <= 0) {
        return (
            <section class="qw-cov" aria-label={t("Pipeline coverage")}>
                <header class="qw-cov__head">
                    <span class="qw-cov__title">{t("PIPELINE COVERAGE")}</span>
                    <span class="qw-cov__ratio is-muted">
                        {t("No open deals yet")}
                    </span>
                </header>
                <p class="qw-cov__empty">
                    {t(
                        "Add open opportunities in Deal Workspace and coverage lights up automatically.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    const tone =
        c.ratio >= target
            ? "good"
            : c.ratio >= target * 0.6
              ? "warn"
              : "bad";
    const pct = Math.min(100, Math.round((c.ratio / target) * 100));

    return (
        <section class="qw-cov" aria-label={t("Pipeline coverage")}>
            <header class="qw-cov__head">
                <span class="qw-cov__title">{t("PIPELINE COVERAGE")}</span>
                <span class={`qw-cov__ratio is-${tone}`}>
                    {c.ratio}x / {target}x needed
                </span>
            </header>
            <div class="qw-cov__bar">
                <div class={`qw-cov__fill is-${tone}`} style={`width:${pct}%`} />
            </div>
            <div class="qw-cov__meta">
                <span>${c.weighted.toLocaleString()} weighted</span>
                <span>${c.raw.toLocaleString()} raw</span>
                <span class={c.needed > 0 ? "is-bad" : "is-good"}>
                    {c.needed > 0
                        ? `Gap: $${c.needed.toLocaleString()}`
                        : t("On target")}
                </span>
            </div>
        </section>
    );
}
