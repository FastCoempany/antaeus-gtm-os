import type { JSX } from "preact";
import { Button, Drawer, Meter, ReadinessReadout } from "@/components";
import type { AccentRole } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { commandMode, commandSummary } from "../../state";
import { exportCommandCenterJson } from "../../lib/command-export";
import { exportReadinessJson } from "../../lib/readiness-export";

/**
 * ReadinessPanel — the verdict surface (canon §4.17), composed from the
 * design-system Drawer + ReadinessReadout + Meter. The today-surface
 * counterpart to the legacy `db-readiness-drawer`: the verdict is the
 * value (ReadinessReadout, a plain sentence — never a score bar as the
 * headline); the per-dimension Meters are the supporting evidence; the
 * gate blockers are "what would move this next"; the footer carries the
 * two exports. Overlay, no route change — it composes onto the surface
 * the operator was already reading.
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

/** Dimension score (0–20) → the Meter's tone. */
function dimensionTone(score: number): AccentRole {
    if (score >= 16) return "green";
    if (score >= 10) return "blue";
    if (score >= 6) return "amber";
    return "red";
}

export interface ReadinessPanelProps {
    readonly open: boolean;
    readonly summary: ReadinessSummary;
    readonly onClose: () => void;
}

export function ReadinessPanel(props: ReadinessPanelProps): JSX.Element | null {
    const { summary } = props;
    const rankedCount = commandSummary.value.ranked.length;

    function handleExportReadiness(): void {
        void exportReadinessJson(summary);
    }
    function handleExportSnapshot(): void {
        exportCommandCenterJson(commandSummary.value, commandMode.value);
    }

    return (
        <Drawer open={props.open} onClose={props.onClose} label={t("Readiness")}>
            <div class="dbt-readiness">
                <header class="dbt-readiness__hero">
                    <Icon name="readiness" size={24} />
                    <ReadinessReadout
                        state={summary.verdictLabel}
                        read={VERDICT_SUBTITLE[summary.verdict]}
                    />
                </header>

                <section class="dbt-readiness__dims">
                    <h3 class="dbt-readiness__section">
                        {t("Where the motion stands")}
                    </h3>
                    {summary.dimensions.map((d) => (
                        <div class="dbt-readiness__dim" key={d.id}>
                            <Meter
                                ratio={d.score / 20}
                                tone={dimensionTone(d.score)}
                                label={d.label}
                                read={`${d.label} — ${d.score}/20`}
                            />
                            {d.evidence.length > 0 ? (
                                <ul class="dbt-readiness__evidence">
                                    {d.evidence.map((e) => (
                                        <li key={e}>{e}</li>
                                    ))}
                                </ul>
                            ) : null}
                            {d.gaps.length > 0 ? (
                                <ul class="dbt-readiness__gaps">
                                    {d.gaps.map((g) => (
                                        <li key={g}>{g}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ))}
                </section>

                {summary.nextVerdict ? (
                    <section class="dbt-readiness__next">
                        <h3 class="dbt-readiness__section">
                            {t("What would move this next")}
                        </h3>
                        {summary.gateBlockers.length === 0 ? (
                            <p class="dbt-readiness__none">
                                {t(
                                    "Everything the next gate needs is in place. This will refresh the next time you save a change in any room.",
                                    { class: "body" }
                                )}
                            </p>
                        ) : (
                            <ul class="dbt-readiness__blockers">
                                {summary.gateBlockers.map((b) => (
                                    <li key={b}>{b}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ) : null}

                <footer class="dbt-readiness__foot">
                    <Button
                        variant="secondary"
                        onClick={handleExportSnapshot}
                        disabled={rankedCount === 0}
                        disabledWhy={
                            rankedCount === 0
                                ? t("Nothing ranked to export yet", {
                                      class: "body"
                                  })
                                : undefined
                        }
                    >
                        {t("Export today's snapshot")}
                    </Button>
                    <Button variant="ghost" onClick={handleExportReadiness}>
                        {t("Export readiness + history")}
                    </Button>
                </footer>
            </div>
        </Drawer>
    );
}
