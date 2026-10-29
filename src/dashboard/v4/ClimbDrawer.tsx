import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import type { ReadinessSummary, Verdict } from "@/lib/readiness";
import { VERDICT_RANK } from "@/lib/readiness";
import { t } from "@/lib/voice/t";
import { commandMode, commandSummary } from "../state";
import { exportCommandCenterJson } from "../lib/command-export";
import { exportReadinessJson } from "../lib/readiness-export";
import "./climb-drawer.css";

/**
 * Readiness drawer. Internal component and CSS names remain stable, but
 * the user-facing surface describes operating independence directly:
 * what another seller could run today, what still depends on the
 * founder, and what would improve readiness next.
 */

const LADDER: ReadonlyArray<{ v: Verdict; name: string; read: string }> = [
    {
        v: "you_are_the_system",
        name: t("Founder-dependent"),
        read: t("The sales process is not yet documented for another seller.", { class: "body" })
    },
    {
        v: "building",
        name: t("Partially documented"),
        read: t("Sales activity is recorded, but another seller would still need to improvise parts of the process.", { class: "body" })
    },
    {
        v: "inheritable_with_guardrails",
        name: t("Runnable with founder support"),
        read: t("Another seller could run the process with you available to answer questions.", { class: "body" })
    },
    {
        v: "hire_ready",
        name: t("Runnable independently"),
        read: t("Another seller can run the documented process for two weeks without routine help from you.", { class: "body" })
    },
    {
        v: "hire_ready_repeatable",
        name: t("Documented and repeatable"),
        read: t("Win and loss patterns are documented, and the sales handoff documentation is complete.", { class: "body" })
    }
];

const HERO_READ: Record<Verdict, string> = {
    you_are_the_system: t(
        "Another seller would still depend on you to understand and run the sales process.",
        { class: "body" }
    ),
    building: t(
        "Another seller could run parts of the process, but several routine decisions still depend on your judgment.",
        { class: "body" }
    ),
    inheritable_with_guardrails: t(
        "Another seller could run the process with you available to answer questions and resolve gaps.",
        { class: "body" }
    ),
    hire_ready: t(
        "Another seller can run the documented process independently for routine work.",
        { class: "body" }
    ),
    hire_ready_repeatable: t(
        "The sales process, win and loss patterns, and handoff documentation are complete enough to repeat with another seller.",
        { class: "body" }
    )
};

/** Quiet chip state per assessed part — words, never surfaced scores. */
function chipFor(score: number): { cls: string; word: string } {
    if (score >= 14) return { cls: "ok", word: t("solid") };
    if (score >= 8) return { cls: "ok", word: t("workable") };
    if (score > 0) return { cls: "thin", word: t("limited") };
    return { cls: "thin", word: t("none yet") };
}

export interface ClimbDrawerProps {
    readonly summary: ReadinessSummary;
    readonly onClose: () => void;
}

export function ClimbDrawer(props: ClimbDrawerProps): JSX.Element {
    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            if (e.key === "Escape") props.onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [props.onClose]);

    const rank = VERDICT_RANK[props.summary.verdict] ?? 1;
    const nextName = LADDER[rank]?.name ?? null;
    const rankedCount = commandSummary.value.ranked.length;

    return (
        <div class="clmb" role="dialog" aria-modal="true" aria-label={t("Readiness")}>
            <div class="clmb-scrim" onClick={props.onClose} aria-hidden="true" />
            <aside class="clmb-panel">
                <header class="clmb-hero">
                    <div class="clmb-k">{t("Readiness · could another seller run this process?", { class: "body" })}</div>
                    <div class="clmb-v">{props.summary.verdictLabel}</div>
                    <div class="clmb-s">{HERO_READ[props.summary.verdict]}</div>
                    <button type="button" class="clmb-x" onClick={props.onClose} aria-label={t("Close")}>
                        ×
                    </button>
                </header>

                <section class="clmb-sec">
                    <div class="clmb-sl">
                        {t("Readiness progression", { class: "body" })}
                    </div>
                    <div class="clmb-climb">
                        {LADDER.map((step, i) => {
                            const pos = i + 1;
                            const state = pos < rank ? "done" : pos === rank ? "here" : "future";
                            return (
                                <div class={`clmb-rung is-${state}`} key={step.v}>
                                    <span class="clmb-node" />
                                    <div class="clmb-rn">{step.name}</div>
                                    <div class="clmb-rm">{step.read}</div>
                                    <span class="clmb-rt">
                                        {state === "done"
                                            ? t("Previous state")
                                            : state === "here"
                                              ? t("Current state")
                                              : pos === rank + 1
                                                ? t("Next state")
                                                : pos === 5
                                                  ? t("Highest readiness state")
                                                  : t("Later state")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {nextName && props.summary.gateBlockers.length > 0 ? (
                    <div class="clmb-next">
                        <div class="clmb-nt">{t("To become")} {nextName}</div>
                        <ul>
                            {props.summary.gateBlockers.map((b) => (
                                <li key={b}>{b}</li>
                            ))}
                        </ul>
                    </div>
                ) : nextName ? (
                    <div class="clmb-next">
                        <div class="clmb-nt">{t("To become")} {nextName}</div>
                        <ul>
                            <li>{t("The evidence required for the next state is present. The readiness assessment will update after the next saved workspace change.", { class: "body" })}</li>
                        </ul>
                    </div>
                ) : null}

                <section class="clmb-sec">
                    <div class="clmb-sl">{t("Current readiness by area")}</div>
                    <div class="clmb-holding">
                        {props.summary.dimensions.map((d) => {
                            const chip = chipFor(d.score);
                            return (
                                <span class={`clmb-hp is-${chip.cls}`} key={d.id}>
                                    {d.label} — {chip.word}
                                </span>
                            );
                        })}
                    </div>
                </section>

                <footer class="clmb-foot">
                    <button
                        type="button"
                        class="clmb-fb"
                        onClick={() => void exportReadinessJson(props.summary)}
                    >
                        {t("Export readiness + history")}
                    </button>
                    <button
                        type="button"
                        class="clmb-fb"
                        disabled={rankedCount === 0}
                        onClick={() =>
                            exportCommandCenterJson(commandSummary.value, commandMode.value)
                        }
                    >
                        {t("Export today's snapshot")}
                    </button>
                </footer>
            </aside>
        </div>
    );
}
