import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { landing, initWelcomeV4 } from "./state";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./welcome-v4.css";

/**
 * Welcome summarizes the current workspace after onboarding and on later
 * visits: highest-priority recommended action, recent changes, and basic
 * workspace totals. The ranking comes from the same engine as Dashboard.
 */
export function WelcomeV4(): JSX.Element {
    initWelcomeV4();
    const l = landing.value;
    if (!l) return <div class="wl4" />;

    const rightRead =
        l.lifecycle === "re_entry"
            ? t("welcome back", { class: "body" })
            : t("workspace setup complete", { class: "body" });

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
                            {t("Highest-priority action", { class: "body" })}
                        </div>
                        <div class="wl4-mt">{l.move.title}</div>
                        <div class="wl4-mb">{l.move.reason}</div>
                        <div class="wl4-go">
                            <a class="wl4-btn" href={l.move.href}>
                                {l.move.cta}
                            </a>
                            <a class="wl4-ghost" href={l.dashboardHref}>
                                {t("See current sales status", { class: "body" })}
                            </a>
                        </div>
                    </div>
                ) : (
                    <div class="wl4-move wl4-move--calm">
                        <div class="wl4-mk">{t("Current sales status", { class: "body" })}</div>
                        <div class="wl4-mt">
                            {t("Open the Dashboard to review pipeline, account priorities, activity, and deal risk.", {
                                class: "body"
                            })}
                        </div>
                        <div class="wl4-go">
                            <a class="wl4-btn" href={l.dashboardHref}>
                                {t("Open Dashboard →", { class: "body" })}
                            </a>
                        </div>
                    </div>
                )}

                {l.saw.length > 0 ? (
                    <div class="wl4-saw">
                        <div class="wl4-sl">
                            {t("Changes since your last visit", { class: "body" })}
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
                            {t("Review all current status →", { class: "body" })}
                        </a>
                    </div>
                ) : null}

                <div class="wl4-oper">
                    <span class="wl4-st">
                        <b>{l.operating.accounts}</b> {t("accounts watched", { class: "body" })}
                    </span>
                    <span class="wl4-sep">·</span>
                    <span class="wl4-st">
                        <b>{l.operating.deals}</b> {t("active deals", { class: "body" })}
                    </span>
                    {l.operating.inFlight ? (
                        <>
                            <span class="wl4-sep">·</span>
                            <span class="wl4-st">
                                <b>{l.operating.inFlight}</b> {t("open pipeline", { class: "body" })}
                            </span>
                        </>
                    ) : null}
                    <span class="wl4-sep">·</span>
                    <span class="wl4-tail">
                        {t("Your accounts, active deals, and pipeline are available on the Dashboard.", {
                            class: "body"
                        })}
                    </span>
                </div>
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
