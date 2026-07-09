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
import {
    MOTION_ROOMS,
    MOTION_STAGES,
    currentRoomId,
    filterMotionRooms,
    groundHref,
    roomIdForUrl
} from "./motion";
import "./ground.css";

/**
 * The Ground (founder-locked 2026-07-08) — the app's ONE jump-to-any-
 * room summon, supersedes the Ctrl+K palette. Every room quietly stands
 * on a near-invisible ground line at the foot of the viewport (the brand
 * mark's signature stroke). Touch it — click, or press G — and the
 * motion map RISES FROM BENEATH the room: the 22 rooms as the actual GTM
 * motion, you-are-here lit, the system's suggested-next glowing (from
 * the birdseye ranker), type-to-filter once risen. Esc (or clicking the
 * scrim, or jumping) sinks it back. Summoned-then-gone — never a rail
 * (canon §6, the hallway); mouse-first with the keyboard as accelerator.
 *
 * The myth is the mechanism: Antaeus gets his strength back by touching
 * the ground.
 */

const groundOpen = signal(false);
const groundQuery = signal("");
const suggested = signal<NextMove | null>(null);

let keysBound = false;
let suggestionLoaded = false;

async function loadSuggestion(): Promise<void> {
    if (suggestionLoaded) return;
    suggestionLoaded = true;
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
            closeGround();
            return;
        }
        // G summons the ground — but never while typing somewhere, and
        // never with a modifier held (don't fight browser shortcuts).
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
    suggestionLoaded = false;
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

    return (
        <div class="gnd">
            {/* The ground line — the brand mark's signature stroke, at the
                foot of every room. Whisper-quiet until wanted. */}
            <button
                type="button"
                class="gnd-line"
                onClick={openGround}
                title={t("Touch the ground — see the whole motion (G)", { class: "body" })}
                aria-label={t("Open the motion map", { class: "body" })}
            >
                <span class="gnd-mark" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 48 48" fill="none">
                        <path d="M14 38L24 10l10 28" stroke="currentColor" stroke-width="4" />
                        <path d="M18.2 28h11.6" stroke="currentColor" stroke-width="4" />
                    </svg>
                </span>
                <span class="gnd-stroke" />
                <span class="gnd-whisper">
                    {t("touch the ground · see the whole motion · G", { class: "body" })}
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
                aria-label={t("The motion map", { class: "body" })}
            >
                <div class="gnd-body">
                    <div class="gnd-k">{t("The ground — your whole motion")}</div>
                    <div class="gnd-t">{t("Where do you want to stand?")}</div>
                    <div class="gnd-s">
                        {hereRoom ? (
                            <>
                                {t("You're in")} <b>{hereRoom.label}</b>
                            </>
                        ) : (
                            t("The whole workspace, laid out as your motion", { class: "body" })
                        )}
                        {sug && sugRoomId ? (
                            <>
                                {" · "}
                                {t("the system suggests")}{" "}
                                <b class="gnd-sug">{MOTION_ROOMS.find((r) => r.id === sugRoomId)?.label}</b>
                                {" — "}
                                {sug.reason}
                            </>
                        ) : null}
                    </div>
                    <input
                        class="gnd-filter"
                        placeholder={t("…or just start typing a room", { class: "body" })}
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
                                    return (
                                        <a
                                            class={`gnd-rm${isHere ? " is-here" : ""}${isSug ? " is-next" : ""}${dim ? " is-dim" : ""}`}
                                            key={r.id}
                                            href={
                                                isSug && sug
                                                    ? sug.targetUrl
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
