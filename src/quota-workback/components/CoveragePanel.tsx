import type { JSX } from "preact";
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
            <section class="qw-cov" aria-label="Pipeline coverage">
                <header class="qw-cov__head">
                    <span class="qw-cov__title">Pipeline coverage</span>
                    <span class="qw-cov__ratio is-muted">
                        Set quota to see live coverage
                    </span>
                </header>
                <p class="qw-cov__empty">
                    Coverage compares your weighted open pipeline against the
                    quota target the room is running.
                </p>
            </section>
        );
    }

    if (!c.hasDeals || c.ratio <= 0) {
        return (
            <section class="qw-cov" aria-label="Pipeline coverage">
                <header class="qw-cov__head">
                    <span class="qw-cov__title">Pipeline coverage</span>
                    <span class="qw-cov__ratio is-muted">
                        No open deals in workspace yet
                    </span>
                </header>
                <p class="qw-cov__empty">
                    Add open opportunities in Deal Workspace and the coverage
                    bar wakes up automatically.
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
        <section class="qw-cov" aria-label="Pipeline coverage">
            <header class="qw-cov__head">
                <span class="qw-cov__title">Pipeline coverage</span>
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
                        : "On target"}
                </span>
            </div>
        </section>
    );
}
