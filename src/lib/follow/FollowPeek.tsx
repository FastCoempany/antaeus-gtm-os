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

/**
 * Compatibility boundary for legacy follow-data field names and sentences.
 * The underlying storage/read contract remains stable, while every rendered
 * sentence uses the same explicit account-priority and deal-risk vocabulary
 * as the rooms that own those calculations.
 */
function displayText(value: string): string {
    return value
        .replace(/\bheat\s+(\d+)/gi, "priority score $1")
        .replace(/\s*\((hot|warm|cool|cold)\)/gi, "")
        .replace(/Turn the heat into a first conversation\.?/gi, "Start a first conversation.")
        .replace(/while the account is warm/gi, "while the account signal is recent")
        .replace(/Reach out while the signal is fresh — heat fades week by week\.?/gi, "Reach out while the signal is recent; signal age is part of account prioritization.")
        .replace(/Nothing is decaying today — acting keeps it that way\.?/gi, "No additional deal-risk factors are currently increasing.")
        .replace(/Act and .*? comes off the slipping list — the close date holds\.?/gi, "Complete the recommended action, then reassess the deal risk and close-date evidence.")
        .replace(/Act and this deal is back at a healthy pace\.?/gi, "Complete the recommended action, then reassess the deal risk.")
        .replace(/Terms are live — run it from Getting to Signed\.?/gi, "Contract terms are active. Continue in Getting to Signed.")
        .replace(/The smallest thing that changes the read\.?/gi, "This action addresses the highest-priority recorded gap.")
        .replace(/Not watched yet — add the account to start building heat\.?/gi, "Not monitored yet. Add the account to begin tracking signals.")
        .replace(/Terms are live — the run to signature happens here\.?/gi, "Contract terms are active. Continue the signature process here.")
        .replace(/Everything logged so far rides along — nothing needs restating\.?/gi, "Recorded context remains available across related workspaces.")
        .replace(/Nothing pulling right now\.?/gi, "No current prioritization factor is recorded.");
}

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
                <span>{displayText(read.stands)}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("Why this is prioritized", { class: "label" })}</span>
                <span>{displayText(read.pulling)}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("What changes if you act", { class: "label" })}</span>
                <span>{displayText(read.changes)}</span>
            </div>
            <div class="fo-row">
                <span class="fo-k">{t("Recorded context", { class: "label" })}</span>
                <span>{displayText(read.remembered)}</span>
            </div>
            {read.move ? (
                <a class="fo-move" href={read.move.href}>
                    {displayText(read.move.label)}
                    <span>{displayText(read.move.detail)}</span>
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
                            <div class="fo-wt">{displayText(s.what)}</div>
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
