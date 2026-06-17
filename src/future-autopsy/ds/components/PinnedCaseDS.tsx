import type { JSX } from "preact";
import {
    Alert,
    Card,
    HandoffStrip,
    Heading,
    Kicker,
    SegmentedControl,
    StatusChip
} from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { pickByDensity, showsAnnotations } from "@/lib/density";
import {
    currentAutopsy,
    currentVerdictMode,
    selectedVitals,
    setVerdictMode,
    taskLog,
    toggleTaskDone
} from "../../state";
import type { VerdictMode } from "../../lib/types";
import { buildActionPlan } from "../../lib/action-plan";
import { isTaskDone } from "../../lib/task-log";
import { saveTaskLogToCloud } from "../../lib/cloud-persistence";
import { fmtMoney, riskTone, sentenceTitlesFor } from "../lib/adapters";

const VERDICT_OPTIONS: ReadonlyArray<{ readonly key: VerdictMode; readonly label: string }> = [
    { key: "left", label: t("If left alone") },
    { key: "corrected", label: t("If corrected") }
];

/**
 * PinnedCaseDS — the focal forensic light-table (canon §4.14). The
 * pinned case at depth: the vitals, the left-alone/corrected verdict
 * toggle, the three evidence sheets (symptom / what sits underneath /
 * failure pattern), the countermeasure docket, the kill switch, and the
 * corrective route. Composed on the library; the autopsy engine + the
 * task-log are the unchanged legacy lib.
 */
export function PinnedCaseDS(): JSX.Element {
    const v = selectedVitals.value;
    const doc = currentAutopsy.value;
    const mode = currentVerdictMode.value;

    if (!v || !doc) {
        return (
            <section class="fad-pinned fad-pinned--empty" aria-label={t("Pinned case")}>
                <div class="fad-pinned__empty-head">
                    <Icon name="at-risk" size={24} />
                    <Kicker>{t("NO CASE PINNED")}</Kicker>
                </div>
                <h2 class="fad-empty__title">
                    {t("Pick a deal from the ledger to start the pre-mortem.", {
                        class: "body"
                    })}
                </h2>
                <p class="fad-empty__body">
                    {t(
                        "The room pins a deal as evidence, then shows what kills it in 45 days — and the smallest move that turns it around.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    const titles = sentenceTitlesFor(doc);
    const plan = buildActionPlan(doc);
    const routes = [plan.primary, plan.secondary, plan.tertiary]
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => ({
            label: r.label,
            href: r.href,
            primary: r.tone === "primary"
        }));
    const story = mode === "corrected" ? doc.winStory : doc.loseStory;
    // The horizon is the doc's, not a hardcoded 45 (it's prefs-driven).
    const horizon = String(doc.horizonDays ?? 45);
    const subLine = (
        mode === "corrected"
            ? t("What wins this in {days} days.")
            : t("What kills this in {days} days.")
    ).replace("{days}", horizon);

    return (
        <section class="fad-pinned" aria-label={`Pinned case: ${v.name}`}>
            <header class="fad-pinned__head">
                <Kicker>{t("PINNED CASE")}</Kicker>
                <Heading level="display">{v.name}</Heading>
                <div class="fad-pinned__vitals">
                    <StatusChip label={v.stage} />
                    <StatusChip label={fmtMoney(v.value)} />
                    <StatusChip label={`Risk ${v.riskScore}/100`} tone={riskTone(v.riskScore)} />
                    <StatusChip label={`Qual ${v.qualScore}/18`} />
                    <StatusChip label={`${v.staleDays}d quiet`} />
                    <StatusChip label={`${horizon}d horizon`} tone="blue" />
                </div>
            </header>

            <div class="fad-verdict">
                <SegmentedControl<VerdictMode>
                    label={t("Left alone or corrected")}
                    active={mode}
                    onChange={setVerdictMode}
                    options={VERDICT_OPTIONS}
                />
                <p class="fad-verdict__sub">{subLine}</p>
            </div>

            <div class="fad-sheets">
                <Card kicker={t("VISIBLE SYMPTOM")} icon="at-risk" title={titles.symptom} tone="amber">
                    {doc.chapters.length > 0 ? (
                        <ul class="fad-sheet__list">
                            {doc.chapters.map((c, i) => (
                                <li key={c.cause}>
                                    <span class="fad-sheet__label">
                                        {doc.causes[i]?.label ?? c.cause}
                                    </span>
                                    <span class="fad-sheet__text">{c.story}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p class="ds-card__copy">
                            {t("No failure pattern at this horizon yet — confirm before forecasting.", {
                                class: "body"
                            })}
                        </p>
                    )}
                </Card>

                <Card kicker={t("WHAT SITS UNDERNEATH")} icon="observation" title={titles.underneath} tone="blue">
                    <p class="ds-card__copy">{story}</p>
                    {/* The win-condition detail is annotation — present in
                        Show me how, dropped in Step back. */}
                    {showsAnnotations() && doc.winConditions.length > 0 ? (
                        <ul class="fad-sheet__list">
                            {doc.winConditions.slice(0, 3).map((w) => (
                                <li key={w.id}>
                                    <span class="fad-sheet__label">
                                        {w.id.replace(/_/g, " ")}
                                    </span>
                                    <span class="fad-sheet__text">{w.story}</span>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </Card>

                <Card kicker={t("FAILURE PATTERN")} icon="deal" title={titles.pattern} tone="red">
                    {/* Evidence-row count is a density dimension: the full
                        eight in Show me how, the four that matter in Step
                        back. */}
                    <ul class="fad-sheet__list fad-sheet__list--evidence">
                        {pickByDensity({
                            verbose: evidenceRows(v),
                            terse: evidenceRows(v).slice(0, 4)
                        }).map((r) => (
                            <li key={r.label}>
                                <span class="fad-sheet__label">{r.label}</span>
                                <span class="fad-sheet__text">{r.value}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {doc.countermeasures.length > 0 ? (
                <Card
                    kicker={t("COUNTERMEASURES")}
                    icon="tighten"
                    title={`${doc.countermeasures.length} ${doc.countermeasures.length === 1 ? t("task") : t("tasks")}`}
                >
                    <ul class="fad-docket">
                        {doc.countermeasures.map((task) => {
                            const done = isTaskDone(taskLog.value, v.id, task.taskId);
                            return (
                                <li key={task.taskId} class={`fad-docket__row${done ? " is-done" : ""}`}>
                                    <label class="fad-docket__check">
                                        <input
                                            type="checkbox"
                                            checked={done}
                                            onChange={() => {
                                                toggleTaskDone(v.id, task.taskId);
                                                void saveTaskLogToCloud(taskLog.value);
                                            }}
                                        />
                                        <span class="fad-docket__label">{task.label}</span>
                                    </label>
                                    <span class="fad-docket__why">{task.why}</span>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            ) : null}

            {doc.killSwitch ? (
                <Alert tone="red">
                    <strong>{t("Kill switch.")}</strong> {doc.killSwitch}
                </Alert>
            ) : null}

            {routes.length > 0 ? (
                <HandoffStrip
                    label={t("Intervene")}
                    kicker={t("INTERVENE")}
                    title={t("Take the correction into the room that fixes it", {
                        class: "body"
                    })}
                    routes={routes}
                />
            ) : null}
        </section>
    );
}

function evidenceRows(v: {
    readonly stage: string;
    readonly staleDays: number;
    readonly riskScore: number;
    readonly qualScore: number;
    readonly champion?: string;
    readonly economicBuyer?: string;
    readonly hasNextStep: boolean;
    readonly closeDate?: string;
}): ReadonlyArray<{ readonly label: string; readonly value: string }> {
    return [
        { label: t("Stage"), value: v.stage },
        {
            label: t("Days quiet"),
            value: v.staleDays === 0 ? t("today") : `${v.staleDays}d`
        },
        { label: t("Risk"), value: `${v.riskScore} / 100` },
        { label: t("Qualification"), value: `${v.qualScore} / 18` },
        { label: t("Champion"), value: v.champion ?? t("missing") },
        { label: t("Economic buyer"), value: v.economicBuyer ?? t("missing") },
        { label: t("Next step"), value: v.hasNextStep ? t("set") : t("missing") },
        { label: t("Close date"), value: v.closeDate ?? t("unset") }
    ];
}
