import type { JSX } from "preact";
import {
    activeCueIndex,
    bestIcp,
    hottestAccount,
    latestTouch,
    setActiveCue,
    stats
} from "../state";
import { CUES, findCue, resolveCueIndex } from "../lib/cues";
import { deriveMotion } from "../lib/motion";
import { cueScript } from "../lib/scripts";
import {
    hrefToOutboundStudio,
    hrefToSignalConsole
} from "../lib/handoff";
import type { CueIndex } from "../lib/types";

/**
 * CueBooth — Wave 3 implementation.
 *
 * The live cue console per canon §4.10. Three columns:
 *   - LEFT: 5-cue clickable strip (active row highlighted, each row
 *     uses --lp-cue-color via Cue.color for the bulb + label tint)
 *   - CENTER: dark stage panel with the personalized cue script + a
 *     3-cell cue-console (Say first / If they engage / If silent)
 *   - RIGHT: booth-read aside (motion label + context + acceptRate
 *     score meter + current cue + one-session win + channel standard)
 *
 * The active cue is `activeCueIndex.value` if pinned, else the motion
 * engine's recommended cueIndex. Clicking a cue row pins it; clicking
 * the same row unpins (sets back to null). Wave 5 will wire the
 * command row CTAs (Open Signal / Open Outbound).
 */
export function CueBooth(): JSX.Element {
    const ctx = {
        icp: bestIcp.value,
        hottestAccount: hottestAccount.value,
        latestTouch: latestTouch.value,
        stats: stats.value
    };
    const motion = deriveMotion(ctx);
    const idx = resolveCueIndex(activeCueIndex.value, motion.cueIndex);
    const cue = findCue(idx);
    const script = cueScript(cue, motion);
    const focusLabel = motion.accountName || "No account selected";
    const splitFirstWord = cue.title.split(" ");
    const titleHead = splitFirstWord[0] ?? "";
    const titleTail = splitFirstWord.slice(1).join(" ");
    // Score posture mirrors legacy line 112 — accept rate (default 0)
    // plus a 40-point baseline, clamped 28-86.
    const score = Math.max(
        28,
        Math.min(86, (ctx.stats.acceptRate || 0) + 40)
    );

    function pin(i: CueIndex): void {
        if (activeCueIndex.value === i) {
            setActiveCue(null);
        } else {
            setActiveCue(i);
        }
    }

    return (
        <section class="lp-booth" aria-label="LinkedIn cue booth">
            {/*
              LinkedIn Playbook audit (2026-05):
                - Duplicate H2 ("Enter only when the room gives a cue.")
                  retired — the room's H1 already carries this headline.
                - "Room law" philosophy block ("The inbox is not the
                  opening scene…") retired. The 5-cue ladder below renders
                  the discipline visually.
            */}
            <div class="lp-booth__head">
                <p class="lp-booth__kicker">CUE BOOTH · {motion.label}</p>
                <p class="lp-booth__intro">{motion.whyNow}</p>
            </div>

            <div class="lp-booth__layout">
                <aside class="lp-booth__strip" aria-label="Cue ladder">
                    {CUES.map((c) => {
                        const state =
                            c.index < idx
                                ? "is-done"
                                : c.index === idx
                                  ? "is-active"
                                  : "";
                        return (
                            <button
                                key={c.label}
                                type="button"
                                class={`lp-cue ${state}`}
                                style={{ "--lp-cue-color": c.color }}
                                onClick={() => pin(c.index)}
                                data-lp-cue={c.index}
                                aria-pressed={c.index === idx}
                            >
                                <span class="lp-cue__bulb" aria-hidden="true" />
                                <span class="lp-cue__body">
                                    <span class="lp-cue__label">
                                        {c.label}
                                    </span>
                                    <span class="lp-cue__name">{c.name}</span>
                                    <span class="lp-cue__copy">{c.copy}</span>
                                </span>
                            </button>
                        );
                    })}
                </aside>

                <section class="lp-stage" aria-label="Live cue stage">
                    <div class="lp-stage__script">
                        <p class="lp-stage__scene">
                            Live cue / {focusLabel}
                        </p>
                        <h3 class="lp-stage__title">
                            <span>{titleHead}</span>{" "}
                            {titleTail.length > 0 ? titleTail : null}
                        </h3>
                        <p class="lp-stage__line">{script}</p>
                    </div>
                    <div class="lp-stage__console">
                        <div>
                            <p class="lp-stage__console-label">Say first</p>
                            <strong>{cue.console}</strong>
                        </div>
                        <div>
                            <p class="lp-stage__console-label">
                                If they engage
                            </p>
                            <strong>{motion.nextMove}</strong>
                        </div>
                        <div>
                            <p class="lp-stage__console-label">If silent</p>
                            <strong>
                                Do not chase. Let Outbound carry the next
                                move while LinkedIn stays visible.
                            </strong>
                        </div>
                    </div>
                </section>

                <aside class="lp-read" aria-label="Booth read">
                    <p class="lp-read__kicker">BOOTH READ</p>
                    <h3 class="lp-read__title">{motion.label}</h3>
                    <p class="lp-read__copy">{motion.context}</p>
                    <div
                        class="lp-read__meter"
                        style={{ "--lp-score-pos": `${score}%` }}
                        aria-label={`Channel posture score ${score}`}
                    />
                    <div class="lp-read__rule">
                        <p class="lp-read__rule-kicker">Current cue</p>
                        <strong>{cue.name}</strong>
                    </div>
                    {/*
                      Program 6 / PR 11 — what to do if they push back.
                      Per the picked-winner Variant 02 / Cue Booth
                      wireframe (line 713) the rep needs a recovery
                      line alongside the current-cue rule. Maps to
                      canon §4.8 recovery principle.
                    */}
                    <div class="lp-read__rule lp-read__rule--recovery">
                        <p class="lp-read__rule-kicker">If they push back</p>
                        <strong>{motion.recovery}</strong>
                    </div>
                    <div class="lp-read__rule">
                        <p class="lp-read__rule-kicker">One-session win</p>
                        <strong>{motion.oneSession}</strong>
                    </div>
                    <div class="lp-read__rule">
                        <p class="lp-read__rule-kicker">Channel standard</p>
                        <strong>{motion.thresholds}</strong>
                    </div>
                    <nav class="lp-read__cta" aria-label="Cross-room handoff">
                        <a
                            class="lp-handoff lp-handoff--ghost"
                            href={hrefToSignalConsole(motion.accountName)}
                            data-lp-handoff="signal-console"
                        >
                            Check the signals
                        </a>
                        <a
                            class="lp-handoff lp-handoff--primary"
                            href={hrefToOutboundStudio(motion.accountName)}
                            data-lp-handoff="outbound-studio"
                        >
                            Compose outbound
                        </a>
                    </nav>
                </aside>
            </div>
        </section>
    );
}
