import type { JSX } from "preact";
import {
    BandStack,
    PageFrame,
    SegmentedControl,
    StatusChip,
    WayfinderBar
} from "@/components";
import { t } from "@/lib/voice/t";
import {
    closeReadinessDrawer,
    commandMode,
    commandSummary,
    openReadinessDrawer,
    readinessDrawerOpen,
    readinessSummary,
    setCommandMode
} from "../state";
import { COMMAND_MODE_LABELS, COMMAND_MODES, type CommandMode } from "../lib/types";
import { ReadinessDrawer } from "../components/ReadinessDrawer";
import { WeekReadsCard } from "../components/WeekReadsCard";
import { toPulling } from "./lib/adapters";
import { BriefRead } from "./components/BriefRead";
import { SpotlightRead } from "./components/SpotlightRead";
import { QueueRead } from "./components/QueueRead";

/**
 * The today surface (spec 04) — the Dashboard's mind composed from the
 * design-system library. The Wayfinder bar carries the system's one
 * pull; the PageFrame holds the centered column; the Brief is the
 * resting body with the week's-reads band beneath it; the Segmented
 * control switches the three reads (Brief / Spotlight / Queue). The
 * command-intelligence engine + the readiness drawer are unchanged —
 * this is presentation, composed on the foundation.
 *
 * Flag-gated (room_dashboard_today_v3); the existing Dashboard renders
 * when the flag is off. Mind preserved (canon §4.2): three reads, the
 * ranking + its reasoning, one dominant move, readiness anchored, the
 * empty state directional, never "all done".
 */
export function TodaySurface(): JSX.Element {
    const mode = commandMode.value;
    const summary = commandSummary.value;
    const isEmpty = summary.ranked.length === 0;
    const pulling = toPulling(summary);
    const verdict = readinessSummary.value;
    const showVerdict = verdict.dimensions.some((d) => d.score > 0);

    return (
        <div class="dbt">
            <WayfinderBar
                room={t("DASHBOARD")}
                tail={summary.spotlight ? summary.spotlight.title : undefined}
                pulling={
                    pulling
                        ? {
                              verb: pulling.verb,
                              object: pulling.object,
                              href: pulling.href,
                              why:
                                  pulling.reasons.length > 0 ? (
                                      <ul class="dbt-why">
                                          {pulling.reasons.map((r) => (
                                              <li key={r}>{r}</li>
                                          ))}
                                      </ul>
                                  ) : undefined
                          }
                        : undefined
                }
            />
            <PageFrame>
                <BandStack>
                    <header class="dbt-head">
                        <div class="dbt-head__lead">
                            {showVerdict ? (
                                <button
                                    type="button"
                                    class="dbt-verdict"
                                    onClick={openReadinessDrawer}
                                >
                                    <StatusChip
                                        label={verdict.verdictLabel}
                                        tone={verdictTone(verdict.verdict)}
                                    />
                                </button>
                            ) : null}
                        </div>
                        {!isEmpty ? (
                            <SegmentedControl<CommandMode>
                                label={t("Command mode")}
                                active={mode}
                                onChange={setCommandMode}
                                options={COMMAND_MODES.map((m) => ({
                                    key: m,
                                    label: COMMAND_MODE_LABELS[m]
                                }))}
                            />
                        ) : null}
                    </header>

                    {isEmpty ? <EmptyToday /> : <ActiveRead mode={mode} />}

                    {!isEmpty ? <WeekReadsCard /> : null}
                </BandStack>
            </PageFrame>

            {readinessDrawerOpen.value ? (
                <ReadinessDrawer
                    summary={verdict}
                    onClose={closeReadinessDrawer}
                />
            ) : null}
        </div>
    );
}

function ActiveRead(props: { readonly mode: CommandMode }): JSX.Element {
    if (props.mode === "spotlight") return <SpotlightRead />;
    if (props.mode === "queue") return <QueueRead />;
    return <BriefRead />;
}

/**
 * The empty state (spec 04 §3.1): never blank, never a demand. Names
 * why the surface matters + the three inputs that fill it, in the
 * Threshold-calm register, with one move each.
 */
function EmptyToday(): JSX.Element {
    return (
        <section class="dbt-empty">
            <p class="ds-kicker">{t("THE BOARD IS QUIET")}</p>
            <h2 class="dbt-empty__title">
                {t(
                    "Nothing's under pressure yet because nothing's in the workspace yet.",
                    { class: "body" }
                )}
            </h2>
            <p class="dbt-empty__sub">
                {t(
                    "The ranking waits on three kinds of input — targets, signals, and deals. Start with whichever you have a few minutes for.",
                    { class: "body" }
                )}
            </p>
            <div class="dbt-empty__moves">
                <a class="ds-btn ds-btn--accent" href="/signal-console/">
                    {t("Add an account to the radar")}
                </a>
                <a class="ds-btn ds-btn--secondary" href="/deal-workspace/">
                    {t("Load a live deal")}
                </a>
                <a class="ds-btn ds-btn--secondary" href="/sourcing-workbench/">
                    {t("Push prospects into the funnel")}
                </a>
            </div>
        </section>
    );
}

function verdictTone(
    verdict: string
): "green" | "blue" | "amber" | "red" | undefined {
    switch (verdict) {
        case "hire_ready_repeatable":
        case "hire_ready":
            return "green";
        case "inheritable_with_guardrails":
            return "blue";
        case "building":
            return "amber";
        default:
            return undefined;
    }
}
