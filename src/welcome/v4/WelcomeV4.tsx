import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { landing, initWelcomeV4 } from "./state";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./welcome-v4.css";

/**
 * WelcomeV4 (canon §4.1) — the seeding flow's landing, wired to
 * production. The workspace is already deep, so this is never an empty
 * threshold: one commanding statement, the system's one overnight pick
 * (from the same command-intelligence engine the Dashboard uses), the
 * payback made visible as a quiet "what the system saw" read, and a
 * recessive operating line. Day-one and re-entry reuse the exact same
 * shape; only the headline changes. Never gamified, no finish line.
 */
export function WelcomeV4(): JSX.Element {
    initWelcomeV4();
    const l = landing.value;
    if (!l) return <div class="wl4" />;

    const rightRead =
        l.lifecycle === "re_entry"
            ? t("welcome back", { class: "body" })
            : t("the workspace is awake", { class: "body" });

    return (
        <div class="wl4">
            <div class="wl4-wrap">
                <div class="wl4-top">
                    <span class="wl4-bname">{t("Welcome")}</span>
                    <span class="wl4-r">{rightRead}</span>
                </div>

                <div class="wl4-state">
                    <div class="wl4-k">{l.kicker}</div>
                    <div class="wl4-h">{l.headline}</div>
                    <div class="wl4-sub">{l.sub}</div>
                </div>

                {l.move ? (
                    <div class="wl4-move">
                        <div class="wl4-mk">
                            {t("Start here · the system's pick", { class: "body" })}
                        </div>
                        <div class="wl4-mt">{l.move.title}</div>
                        <div class="wl4-mb">{l.move.reason}</div>
                        <div class="wl4-go">
                            <a class="wl4-btn" href={l.move.href}>
                                {l.move.cta}
                            </a>
                            <a class="wl4-ghost" href={l.dashboardHref}>
                                {t("or see the full Dashboard", { class: "body" })}
                            </a>
                        </div>
                    </div>
                ) : (
                    <div class="wl4-move wl4-move--calm">
                        <div class="wl4-mk">{t("Where to start", { class: "body" })}</div>
                        <div class="wl4-mt">
                            {t("Open the Dashboard — it ranks what needs you first.", {
                                class: "body"
                            })}
                        </div>
                        <div class="wl4-go">
                            <a class="wl4-btn" href={l.dashboardHref}>
                                {t("Open the Dashboard →", { class: "body" })}
                            </a>
                        </div>
                    </div>
                )}

                {l.saw.length > 0 ? (
                    <div class="wl4-saw">
                        <div class="wl4-sl">
                            {l.lifecycle === "re_entry"
                                ? t("What moved since you left", { class: "body" })
                                : t("What the system saw while you were away", {
                                      class: "body"
                                  })}
                        </div>
                        {l.saw.map((row, i) => (
                            <div class="wl4-row" key={i}>
                                <span class={`wl4-dt wl4-dt--${row.tone}`} />
                                <span class="wl4-cx">
                                    <b>{row.lead}</b>{" "}
                                    <span class="wl4-q">{row.rest}</span>
                                </span>
                                <span class="wl4-tm">{row.time}</span>
                            </div>
                        ))}
                        <a class="wl4-more" href={l.dashboardHref}>
                            {t("See all of it on the Dashboard →", { class: "body" })}
                        </a>
                    </div>
                ) : null}

                <div class="wl4-oper">
                    <span class="wl4-st">
                        <b>{l.operating.accounts}</b> {t("accounts watched", { class: "body" })}
                    </span>
                    <span class="wl4-sep">·</span>
                    <span class="wl4-st">
                        <b>{l.operating.deals}</b> {t("live deals", { class: "body" })}
                    </span>
                    {l.operating.inFlight ? (
                        <>
                            <span class="wl4-sep">·</span>
                            <span class="wl4-st">
                                <b>{l.operating.inFlight}</b> {t("in flight", { class: "body" })}
                            </span>
                        </>
                    ) : null}
                    <span class="wl4-sep">·</span>
                    <span class="wl4-tail">
                        {t("the workspace is running — this is just the morning door into it.", {
                            class: "body"
                        })}
                    </span>
                </div>
            </div>
            {/* The Ground — the app's one jump summon (2026-07-08):
                touch the ground line (or press G) and the motion map
                rises from beneath the room. */}
            <GroundLine />
            <LiveEdge />

        </div>
    );
}
