import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { t } from "@/lib/voice/t";
import { commandMode, commandSummary } from "../state";
import { exportCommandCenterJson } from "../lib/command-export";
import { exportReadinessJson } from "../lib/readiness-export";

/**
 * Readiness Drawer — single-fold overlay (canon §4.17).
 *
 * Layout (top → bottom):
 *   1. Verdict hero — large serif verdict label + 1-line subtitle.
 *      The verdict is the value; the score below is decorative.
 *   2. Dimension strip — 5 horizontal cells, score + label, optional
 *      tap-to-expand for evidence + gaps. Bars are decoration.
 *   3. Gate blockers — "What would change the verdict next" — the
 *      prescriptive content the spec calls out.
 *
 * Closing paths: explicit close button, Escape key, backdrop click.
 * The drawer is an overlay — no route change — so it composes onto
 * whatever the user was looking at on the Dashboard.
 */

const VERDICT_SUBTITLE: Record<Verdict, string> = {
    you_are_the_system: t(
        "Right now the system only lives in your head. A new hire would have nothing to inherit on day one.",
        { class: "body" }
    ),
    building: t(
        "Activity is real, but a hire would still be improvising the system on day one.",
        { class: "body" }
    ),
    inheritable_with_guardrails: t(
        "A hire could run this if you're around for sanity-checks.",
        { class: "body" }
    ),
    hire_ready: t("The motion would survive a 2-week founder vacation.", {
        class: "body"
    }),
    hire_ready_repeatable: t(
        "This system holds up to repetition — multiple wins on the board, multiple losses worth learning from, advisors lit up, and the handoff kit is composed.",
        { class: "body" }
    )
};

const VERDICT_TONE: Record<Verdict, string> = {
    you_are_the_system: "ink",
    building: "amber",
    inheritable_with_guardrails: "blue",
    hire_ready: "green",
    hire_ready_repeatable: "gold"
};

export interface ReadinessDrawerProps {
    readonly summary: ReadinessSummary;
    readonly onClose: () => void;
}

export function ReadinessDrawer(props: ReadinessDrawerProps): JSX.Element {
    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            if (e.key === "Escape") props.onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [props.onClose]);

    const tone = VERDICT_TONE[props.summary.verdict];
    const subtitle = VERDICT_SUBTITLE[props.summary.verdict];

    function handleExportReadiness(): void {
        // Fire-and-forget. Multiple rapid clicks would only queue
        // duplicate downloads; the typical use is one click.
        void exportReadinessJson(props.summary);
    }

    function handleExportSnapshot(): void {
        // Dashboard audit moved this off the topbar rail into the
        // drawer footer. Verdict + ranked-objects snapshot are
        // conceptually paired — both are "what was the state of the
        // motion on day X."
        exportCommandCenterJson(commandSummary.value, commandMode.value);
    }
    const rankedCount = commandSummary.value.ranked.length;

    return (
        <div
            class="db-readiness-drawer"
            role="dialog"
            aria-label={t("Readiness")}
            aria-modal="true"
        >
            <div
                class="db-readiness-drawer__backdrop"
                onClick={props.onClose}
                aria-hidden="true"
            />
            <aside class="db-readiness-drawer__panel">
                <header
                    class={`db-readiness-drawer__hero db-readiness-drawer__hero--${tone}`}
                >
                    {/*
                     * Phase 2.8 audit — kicker no longer shows the
                     * raw totalScore. Per canon §4.17 the verdict is
                     * the value; the score is internal math. The
                     * per-dimension scores below remain (with their
                     * /20 caps) since they're operator-readable
                     * progress markers, not the headline.
                     */}
                    <p class="db-readiness-drawer__kicker">{t("READINESS")}</p>
                    <h2 class="db-readiness-drawer__verdict">
                        {props.summary.verdictLabel}
                    </h2>
                    <p class="db-readiness-drawer__sub">{subtitle}</p>
                    <button
                        type="button"
                        class="db-readiness-drawer__close"
                        onClick={props.onClose}
                        aria-label={t("Close readiness panel")}
                    >
                        ×
                    </button>
                </header>

                <section class="db-readiness-drawer__dimensions">
                    <h3 class="db-readiness-drawer__section-title">
                        {t("Where the motion stands")}
                    </h3>
                    <ul class="db-readiness-dim-list">
                        {props.summary.dimensions.map((d) => (
                            <li class="db-readiness-dim" key={d.id}>
                                <div class="db-readiness-dim__row">
                                    <span class="db-readiness-dim__label">
                                        {d.label}
                                    </span>
                                    <span class="db-readiness-dim__score">
                                        {d.score}
                                        <span class="db-readiness-dim__score-cap">
                                            /20
                                        </span>
                                    </span>
                                </div>
                                <div
                                    class="db-readiness-dim__bar"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={20}
                                    aria-valuenow={d.score}
                                >
                                    <div
                                        class="db-readiness-dim__bar-fill"
                                        style={{
                                            width: `${(d.score / 20) * 100}%`
                                        }}
                                    />
                                </div>
                                {d.evidence.length > 0 && (
                                    <ul class="db-readiness-dim__evidence">
                                        {d.evidence.map((e) => (
                                            <li key={e}>{e}</li>
                                        ))}
                                    </ul>
                                )}
                                {d.gaps.length > 0 && (
                                    <ul class="db-readiness-dim__gaps">
                                        {d.gaps.map((g) => (
                                            <li key={g}>{g}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                {props.summary.nextVerdict && (
                    <section class="db-readiness-drawer__next">
                        <h3 class="db-readiness-drawer__section-title">
                            {t("What would move this next")}
                        </h3>
                        {props.summary.gateBlockers.length === 0 ? (
                            <p class="db-readiness-drawer__no-blockers">
                                {t(
                                    "Everything the next gate needs is in place. This will refresh the next time you save a change in any room.",
                                    { class: "body" }
                                )}
                            </p>
                        ) : (
                            <ul class="db-readiness-blockers">
                                {props.summary.gateBlockers.map((b) => (
                                    <li
                                        class="db-readiness-blocker"
                                        key={b}
                                    >
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <footer class="db-readiness-drawer__footer">
                    <button
                        type="button"
                        class="db-readiness-drawer__export"
                        onClick={handleExportSnapshot}
                        disabled={rankedCount === 0}
                        title={
                            rankedCount === 0
                                ? t("No ranked objects to export yet", {
                                      class: "body"
                                  })
                                : `Export ${rankedCount} ranked object${
                                      rankedCount === 1 ? "" : "s"
                                  } as JSON`
                        }
                    >
                        {t("Export today's snapshot")}
                    </button>
                    <button
                        type="button"
                        class="db-readiness-drawer__export"
                        onClick={handleExportReadiness}
                        title={t("Download the readiness state, dimensions, and history as JSON", { class: "body" })}
                    >
                        {t("Export readiness + history")}
                    </button>
                </footer>
            </aside>
        </div>
    );
}
