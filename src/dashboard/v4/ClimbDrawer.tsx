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
 * The Climb — the Readiness drawer (canon §4.17), settled 2026-07-07 and
 * wired to production. Verdict-dominant serif state + a plain one-line
 * read; the five levels as a vertical ladder OVER TIME (passed rungs
 * forest/durable, you-are-here highlighted, the next rung is the goal);
 * the plain what-moves-it-next moves; the five parts of the motion as
 * quiet ready/thin chips — never bars, never a "/20", never a naked
 * score. The readiness engine (already §13-scrubbed) is reused
 * unchanged. Overlay off the Dashboard topbar anchor — no route change.
 */

const LADDER: ReadonlyArray<{ v: Verdict; name: string; read: string }> = [
    {
        v: "you_are_the_system",
        name: t("You are the system"),
        read: t("It all lived in your head — nothing to inherit.", { class: "body" })
    },
    {
        v: "building",
        name: t("Building"),
        read: t("Real activity is on the board, but a hire would still be improvising the motion.", { class: "body" })
    },
    {
        v: "inheritable_with_guardrails",
        name: t("Inheritable with guardrails"),
        read: t("A hire could run it with you there to answer questions.", { class: "body" })
    },
    {
        v: "hire_ready",
        name: t("Hire-ready"),
        read: t("The motion survives you taking two weeks off.", { class: "body" })
    },
    {
        v: "hire_ready_repeatable",
        name: t("Hire-ready, repeatable"),
        read: t("Wins and losses both feed the machine; the handoff kit is written.", { class: "body" })
    }
];

const HERO_READ: Record<Verdict, string> = {
    you_are_the_system: t(
        "Right now the system only lives in your head. A new hire would have nothing to inherit on day one.",
        { class: "body" }
    ),
    building: t(
        "A hire could pick up parts of this, but they'd still be improvising the system on day one.",
        { class: "body" }
    ),
    inheritable_with_guardrails: t(
        "A hire could run this with you there to answer questions.",
        { class: "body" }
    ),
    hire_ready: t("The motion would survive you taking two weeks off.", { class: "body" }),
    hire_ready_repeatable: t(
        "Multiple wins on the board, losses worth learning from, and the handoff kit is written. This holds up.",
        { class: "body" }
    )
};

/** Quiet chip state per part — words, never numbers. */
function chipFor(score: number): { cls: string; word: string } {
    if (score >= 14) return { cls: "ok", word: t("solid") };
    if (score >= 8) return { cls: "ok", word: t("workable") };
    if (score > 0) return { cls: "thin", word: t("thin") };
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
                    <div class="clmb-k">{t("Readiness · could a hire run this yet?")}</div>
                    <div class="clmb-v">{props.summary.verdictLabel}</div>
                    <div class="clmb-s">{HERO_READ[props.summary.verdict]}</div>
                    <button type="button" class="clmb-x" onClick={props.onClose} aria-label={t("Close")}>
                        ×
                    </button>
                </header>

                <section class="clmb-sec">
                    <div class="clmb-sl">
                        {t("The climb — where the workspace has been, and where it goes next")}
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
                                            ? t("Left behind")
                                            : state === "here"
                                              ? t("You are here")
                                              : pos === rank + 1
                                                ? t("Next")
                                                : pos === 5
                                                  ? t("The summit")
                                                  : t("Later")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {nextName && props.summary.gateBlockers.length > 0 ? (
                    <div class="clmb-next">
                        <div class="clmb-nt">{t("To reach")} {nextName}</div>
                        <ul>
                            {props.summary.gateBlockers.map((b) => (
                                <li key={b}>{b}</li>
                            ))}
                        </ul>
                    </div>
                ) : nextName ? (
                    <div class="clmb-next">
                        <div class="clmb-nt">{t("To reach")} {nextName}</div>
                        <ul>
                            <li>{t("Everything the next level needs is in place — it settles the next time you save a change in any room.", { class: "body" })}</li>
                        </ul>
                    </div>
                ) : null}

                <section class="clmb-sec">
                    <div class="clmb-sl">{t("What's carrying this right now")}</div>
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
