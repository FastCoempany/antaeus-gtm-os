import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import type { NextMove } from "@/birdseye/lib/types";
import { rankNextMove } from "@/birdseye/lib/ranker";
import {
    loadDealsForRanking,
    loadHotAccountsForRanking,
    loadObservationsForRanking
} from "@/birdseye/lib/context";
import { reportError } from "@/lib/observability";
import { isPreviewLane } from "@/lib/preview-lane";
import {
    MOTION_ROOMS,
    MOTION_STAGES,
    currentRoomId,
    filterMotionRooms,
    groundHref,
    roomIdForUrl,
    withContinuity
} from "./motion";
import "./ground.css";

/**
 * Workspace map — the shared jump-to-any-room surface.
 *
 * Internal names such as GroundLine/openGround and `fromSurface=ground`
 * remain stable to avoid unnecessary routing/telemetry churn. The
 * customer-facing concept is simply a workspace map: open it from the
 * footer handle or with G, see the current room, see the recommended
 * next workspace, filter, and navigate.
 */

const groundOpen = signal(false);
const groundQuery = signal("");
const suggested = signal<NextMove | null>(null);

let keysBound = false;

async function loadSuggestion(): Promise<void> {
    // Re-rank on every open because the workspace may change mid-session.
    try {
        const observations = await loadObservationsForRanking().catch(() => []);
        const result = rankNextMove({
            observations,
            deals: loadDealsForRanking(),
            hotAccounts: loadHotAccountsForRanking(),
            currentRoomHref:
                typeof location !== "undefined" ? location.pathname : "/"
        });
        suggested.value = result.ok ? result.move : null;
    } catch (err) {
        reportError(err, { where: "ground.loadSuggestion" });
    }
}

export function openGround(): void {
    groundOpen.value = true;
    groundQuery.value = "";
    void loadSuggestion();
    setTimeout(() => {
        try {
            document
                .querySelector<HTMLInputElement>(".gnd-filter")
                ?.focus();
        } catch {
            // non-fatal
        }
    }, 320);
}

export function closeGround(): void {
    groundOpen.value = false;
    groundQuery.value = "";
}

function isTypingContext(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).isContentEditable
    );
}

function bindKeys(): void {
    if (keysBound || typeof document === "undefined") return;
    keysBound = true;
    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape" && groundOpen.value) {
            // The workspace map sits above whatever is open beneath it.
            e.stopPropagation();
            closeGround();
            return;
        }
        // G opens the workspace map, except while typing or using a modifier.
        if (
            (e.key === "g" || e.key === "G") &&
            !groundOpen.value &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            !isTypingContext()
        ) {
            e.preventDefault();
            openGround();
        }
    });
}

/** @internal test reset. */
export function __resetGroundForTests(): void {
    groundOpen.value = false;
    groundQuery.value = "";
    suggested.value = null;
}

export function GroundLine(): JSX.Element {
    bindKeys();
    const open = groundOpen.value;
    const here =
        typeof location !== "undefined" ? currentRoomId(location.pathname) : null;
    const hereRoom = MOTION_ROOMS.find((r) => r.id === here) ?? null;
    const fromPath =
        typeof location !== "undefined" ? location.pathname : "/";
    const fromLabel = hereRoom?.label ?? "Back";
    const sug = suggested.value;
    const sugRoomId = sug ? roomIdForUrl(sug.targetUrl) : null;
    const q = groundQuery.value;
    const visible = new Set(filterMotionRooms(q).map((r) => r.id));
    const preview = isPreviewLane();

    return (
        <div class="gnd">
            <button
                type="button"
                class="gnd-line"
                onClick={openGround}
                title={t("Open workspace map (G)", { class: "body" })}
                aria-label={t("Open workspace map", { class: "body" })}
            >
                <span class="gnd-stroke" />
                <span class="gnd-tab" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
                        <path d="M14 38L24 10l10 28" stroke="currentColor" stroke-width="4" />
                        <path d="M18.2 28h11.6" stroke="currentColor" stroke-width="4" />
                    </svg>
                    <span class="gnd-grip">
                        <i />
                        <i />
                        <i />
                    </span>
                </span>
                <span class="gnd-whisper">
                    {t("open workspace map · G", { class: "body" })}
                </span>
            </button>

            {open ? (
                <div
                    class="gnd-scrim"
                    onClick={closeGround}
                    aria-hidden="true"
                />
            ) : null}

            <div
                class={`gnd-panel${open ? " is-up" : ""}`}
                role="dialog"
                aria-label={t("Workspace map", { class: "body" })}
            >
                <div class="gnd-body">
                    <div class="gnd-k">{t("Workspace map")}</div>
                    <div class="gnd-t">{t("Where do you want to go?")}</div>
                    <div class="gnd-s">
                        {hereRoom ? (
                            <>
                                {t("You're in")} <b>{hereRoom.label}</b>
                            </>
                        ) : (
                            t("All workspaces in sales-process order", { class: "body" })
                        )}
                        {sug && sugRoomId ? (
                            <>
                                {" · "}
                                {t("Recommended next workspace:")}{" "}
                                <b class="gnd-sug">{MOTION_ROOMS.find((r) => r.id === sugRoomId)?.label}</b>
                                {" · "}
                                {sug.reason}
                            </>
                        ) : null}
                    </div>
                    <input
                        class="gnd-filter"
                        placeholder={t("…or start typing a workspace", { class: "body" })}
                        value={q}
                        onInput={(e) =>
                            (groundQuery.value = (e.currentTarget as HTMLInputElement).value)
                        }
                    />
                    <div class="gnd-flow">
                        {MOTION_STAGES.map((stageLabel, si) => (
                            <div class="gnd-scol" key={stageLabel}>
                                <div class="gnd-slab">{stageLabel}</div>
                                {MOTION_ROOMS.filter((r) => r.stage === si).map((r) => {
                                    const isHere = r.id === here;
                                    const isSug = r.id === sugRoomId && !isHere;
                                    const dim = !visible.has(r.id);
                                    if (preview && r.id === "onboarding") {
                                        return (
                                            <span
                                                class={`gnd-rm is-locked${dim ? " is-dim" : ""}`}
                                                key={r.id}
                                                tabIndex={0}
                                                aria-disabled="true"
                                                aria-describedby="gnd-onb-why"
                                            >
                                                <span class="gnd-rn">{r.label}</span>
                                                <span class="gnd-rd">{t("not open in the preview")}</span>
                                                <span class="gnd-lock-why" id="gnd-onb-why" role="tooltip">
                                                    {t(
                                                        "Onboarding is where a new seller sets up the workspace. They define who they sell to, add target accounts, and record the judgment Antaeus cannot reliably infer about active deals, such as the champion, final approver, current blocker, and real next step. Antaeus enriches the account and company data around those inputs. This preview starts after onboarding with a workspace that is already set up.",
                                                        { class: "body" }
                                                    )}
                                                </span>
                                            </span>
                                        );
                                    }
                                    return (
                                        <a
                                            class={`gnd-rm${isHere ? " is-here" : ""}${isSug ? " is-next" : ""}${dim ? " is-dim" : ""}`}
                                            key={r.id}
                                            href={
                                                isSug && sug
                                                    ? withContinuity(sug.targetUrl, fromPath, fromLabel)
                                                    : groundHref(r, fromPath, fromLabel)
                                            }
                                            onClick={closeGround}
                                        >
                                            <span class="gnd-rn">{r.label}</span>
                                            <span class="gnd-rd">{r.desc}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
