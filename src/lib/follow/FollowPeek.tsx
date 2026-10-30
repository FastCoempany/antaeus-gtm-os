import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { reportError } from "@/lib/observability";
import { currentRoomId, MOTION_ROOMS } from "@/lib/ground/motion";
import { buildFollowRead, type FollowRead } from "./follow-data";
import "./follow.css";

/**
 * Cross-workspace object history.
 *
 * Clicking a tagged account or deal opens a compact card with its current
 * status, prioritization evidence, recommended action, expected downstream
 * change, and recorded context. The expanded view shows related activity in
 * other workspaces without navigating away from the current room.
 */

const followRead = signal<FollowRead | null>(null);
const followPos = signal<{ left: number; top: number }>({ left: 0, top: 0 });
const followOpen = signal(false);
const followUnfolded = signal(false);

let listenersBound = false;

export function openFollow(anchor: HTMLElement, name: string): void {
    try {
        const herePath = typeof location !== "undefined" ? location.pathname : "/";
        const hereId = currentRoomId(herePath);
        const hereLabel = MOTION_ROOMS.find((r) => r.id === hereId)?.label ?? "Back";
        const read = buildFollowRead(name, { herePath, hereLabel });
        if (!read) return;
        const rect = anchor.getBoundingClientRect();
        const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
        followRead.value = read;
        followPos.value = {
            left: Math.max(12, Math.min(rect.left, vw - 590)),
            top: Math.max(12, rect.bottom + 10)
        };
        followUnfolded.value = false;
        followOpen.value = true;
    } catch (err) {
        reportError(err, { where: "follow.open" });
    }
}

export function closeFollow(): void {
    followOpen.value = false;
    followUnfolded.value = false;
}

/** @internal test reset. */
export function __resetFollowForTests(): void {
    closeFollow();
    followRead.value = null;
}

function bindListeners(): void {
    if (listenersBound || typeof document === "undefined") return;
    listenersBound = true;

    document.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const door = target.closest<HTMLElement>("[data-follow]");
        if (door) {
            const name = door.getAttribute("data-follow") ?? "";
            if (name.trim() !== "") openFollow(door, name);
            return;
        }
        if (
            followOpen.value &&
            document.contains(target) &&
            !target.closest(".fo-card")
        ) {
            closeFollow();
        }
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key !== "Escape" || !followOpen.value) return;
        e.stopPropagation();
        if (followUnfolded.value) followUnfolded.value = false;
        else closeFollow();
    });
}

export function FollowPeek(): JSX.Element | null {
    bindListeners();
    const read = followRead.value;
    if (!followOpen.value || !read) return null;
    const pos = followPos.value;
    const unfolded = followUnfolded.value;

    return (
        <div
            class={`fo-card${unfolded ? " is-unfolded" : ""}`}
            style={`left:${pos.left}px;top:${pos.top}px;max-height:calc(100vh - ${pos.top + 16}px)`}
            role="dialog"
            aria-label={read.name}
        >
            <div class="fo-nm">{read.name}</div>
            <div class="fo-row">
                <span class="fo-k">{t("Current status", { class: "label" })}</span>
                <span>{read.stands}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("Why this is prioritized", { class: "label" })}</span>
                <span>{read.pulling}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("What changes if you act", { class: "label" })}</span>
                <span>{read.changes}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("Recorded context", { class: "label" })}</span>
                <span>{read.remembered}</span>
            </div>
            {read.move ? (
                <a class="fo-move" href={read.move.href}>
                    {read.move.label}
                    <span>{read.move.detail}</span>
                </a>
            ) : null}
            {!unfolded ? (
                <button
                    type="button"
                    class="fo-thread"
                    onClick={() => (followUnfolded.value = true)}
                >
                    {t("See related activity across the workspace", { class: "body" })}
                </button>
            ) : null}

            {unfolded ? (
                <div class="fo-fold">
                    <div class="fo-foldk">
                        {t("Related activity across the workspace", { class: "body" })}
                    </div>
                    {read.stops.map((s) => (
                        <div class={`fo-stop is-${s.state}`} key={s.key}>
                            <div class="fo-rl">
                                <span class="fo-rn">{s.label}</span>
                                {s.state === "here" ? (
                                    <span class="fo-tag fo-tag--here">{t("You are here", { class: "label" })}</span>
                                ) : null}
                                {s.state === "next" ? (
                                    <span class="fo-tag fo-tag--next">{t("Next", { class: "label" })}</span>
                                ) : null}
                                {s.state !== "here" ? (
                                    <a class="fo-go" href={s.href}>
                                        {t("Go", { class: "label" })} →
                                    </a>
                                ) : null}
                            </div>
                            <div class="fo-wt">{s.what}</div>
                        </div>
                    ))}
                    <p class="fo-remember">
                        {t("Recorded context remains available in each related workspace.", { class: "body" })}
                    </p>
                    <button
                        type="button"
                        class="fo-back"
                        onClick={() => (followUnfolded.value = false)}
                    >
                        {t("Close activity history", { class: "label" })} ↑
                    </button>
                </div>
            ) : null}
        </div>
    );
}
