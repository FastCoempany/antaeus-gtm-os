import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { explainCommandObject } from "../lib/command-intelligence";
import {
    commandSummary,
    focusedCommandId,
    setFocusedCommand,
    readinessSummary,
    readinessDrawerOpen,
    openReadinessDrawer,
    closeReadinessDrawer
} from "../state";
import { ClimbDrawer } from "./ClimbDrawer";
import { buildMasthead, buildStanding } from "./lib/cockpit";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import { FollowPeek, openFollow } from "@/lib/follow/FollowPeek";
import { buildFollowRead } from "@/lib/follow/follow-data";
import "./dashboard-v4.css";

/**
 * DashboardV4 (canon §4.2) — the command + standing cockpit, wired to
 * production. Leads with where the whole motion stands (the readiness
 * verdict + gate ladder), the one most-valuable move underneath (the
 * ranked command board, skip cycles it), and a standing row where each
 * part is a door. "See the whole thing" opens the readiness drawer.
 *
 * Every engine (command-intelligence ranking, readiness verdict, the
 * cross-room snapshot aggregator) is reused unchanged — this surface is
 * presentation only. The ranking keeps showing its reasoning; nothing
 * re-does Signal Console, Briefing, or Future Autopsy.
 */
export function DashboardV4(): JSX.Element {
    const summary = commandSummary.value;
    const ranked = summary.ranked;
    const readiness = readinessSummary.value;
    const mast = buildMasthead(readiness);
    const standing = buildStanding();

    // The move under the masthead: the focused ranked object, or the
    // spotlight (top of the board). Skip cycles the board without leaving.
    const focusId = focusedCommandId.value;
    const idx = Math.max(
        0,
        focusId ? ranked.findIndex((o) => o.id === focusId) : 0
    );
    const move = ranked[idx] ?? summary.spotlight ?? null;
    const total = ranked.length;

    function skip(): void {
        if (total === 0) return;
        const next = ranked[(idx + 1) % total];
        if (next) setFocusedCommand(next.id);
    }

    const nextTwo =
        total > 1
            ? [ranked[(idx + 1) % total], ranked[(idx + 2) % total]]
                  .filter(Boolean)
                  .map((o) => o!.title.replace(/\.$/, ""))
                  .join(" · ")
            : "";

    const primary = move
        ? move.actions.find((a) => a.variant !== "ghost") ?? move.actions[0]
        : null;
    const why = move ? explainCommandObject(move, "spotlight") : null;
    // The move's title is a door into the object's whole thread — but
    // only when the focusObject resolves to something the system has
    // actually seen (placeholder focusObjects stay plain text).
    const moveFollowable =
        move && move.focusObject ? buildFollowRead(move.focusObject) !== null : false;

    return (
        <div class="db4">
            <div class="db4-wrap">
                <div class="db4-top">
                    <span class="db4-bname">{t("Dashboard")}</span>
                    <span class="db4-r">{t("where your motion stands · all day", { class: "body" })}</span>
                </div>

                {/* MASTHEAD — where your whole motion stands */}
                <div class="db4-mast">
                    <div class="db4-mk">{t("Where your whole motion stands", { class: "body" })}</div>
                    <div class="db4-gate">
                        {mast.gates.map((g) => (
                            <div class={`db4-g is-${g.state}`} key={g.label}>
                                <div class="db4-bar" />
                                {g.label}
                            </div>
                        ))}
                    </div>
                    <h1 class="db4-h1">
                        {mast.headlinePre} <em>{mast.headlineEm}.</em>
                    </h1>
                    <div class="db4-sub">
                        <div class="db4-next">
                            <span class="db4-nl">{t("What gets you to the next stage", { class: "body" })}</span>
                            {mast.nextStage}
                        </div>
                        <button type="button" class="db4-open" onClick={() => openReadinessDrawer()}>
                            {t("See the whole thing →", { class: "body" })}
                        </button>
                    </div>
                </div>

                {/* THE ONE MOVE — the ranked board */}
                <div class="db4-move">
                    {move ? (
                        <>
                            <div class="db4-movek">
                                {t("The most valuable move on your board", { class: "body" })}
                                <span class="db4-n">· #{idx + 1} {t("of", { class: "body" })} {total}</span>
                            </div>
                            <div class="db4-mrow">
                                <h2
                                class={`db4-mt${moveFollowable ? " fo-obj" : ""}`}
                                onClick={
                                    moveFollowable
                                        ? (e) => {
                                              e.stopPropagation();
                                              openFollow(
                                                  e.currentTarget as HTMLElement,
                                                  move.focusObject as string
                                              );
                                          }
                                        : undefined
                                }
                            >
                                {move.title}
                            </h2>
                                {primary ? (
                                    <a class="db4-go" href={primary.href}>
                                        {primary.label} →
                                    </a>
                                ) : null}
                            </div>
                            {why ? <div class="db4-why">{why.copy}</div> : null}
                            <div class="db4-conf">
                                <span class="db4-cd" />
                                {move.rankingConfidenceLabel}
                                {total > 1 ? (
                                    <button type="button" class="db4-skip" onClick={skip}>
                                        {t("not now — show me the next", { class: "body" })}
                                    </button>
                                ) : null}
                                {nextTwo ? <span class="db4-q">· {t("then:", { class: "body" })} {nextTwo}</span> : null}
                            </div>
                        </>
                    ) : (
                        <div class="db4-movek">
                            {t("Nothing is pulling harder than the rest right now. Work the standing row below.", { class: "body" })}
                        </div>
                    )}
                </div>

                {/* STANDING ROW — each part is a door */}
                <div class="db4-standhd">{t("Where each part stands right now", { class: "body" })}</div>
                <div class="db4-stand">
                    {standing.map((v) => (
                        <a class={`db4-vit is-${v.tone || "plain"}`} href={v.href} key={v.key}>
                            <div class="db4-vk">{v.key}</div>
                            <div class="db4-vn">{v.value}</div>
                            <div class="db4-vs">{v.sub}</div>
                            <div class="db4-door">{v.key} ↗</div>
                        </a>
                    ))}
                </div>
            </div>

            {readinessDrawerOpen.value ? (
                <ClimbDrawer summary={readiness} onClose={closeReadinessDrawer} />
            ) : null}
            {/* The Ground — the app's one jump summon (2026-07-08):
                touch the ground line (or press G) and the motion map
                rises from beneath the room. */}
            <GroundLine />
            <LiveEdge />
            {/* Follow the Object — any name is a door (2026-07-13). */}
            <FollowPeek />

        </div>
    );
}
