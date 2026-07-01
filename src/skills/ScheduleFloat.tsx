import type { JSX } from "preact";
import { signal, effect, computed, type Signal } from "@preact/signals";
import { dispatchSkill } from "./lib/dispatcher";
import {
    checkAndAutoNavigate,
    consumeJustFiredSkillId
} from "./lib/auto-navigate";
import { findSkillById } from "./lib/registry";
import {
    listSchedules,
    markFireViewed,
    readNextPendingFire,
    type ScheduledSkillRow
} from "./lib/schedule-storage";
import {
    DEFAULT_PREFS,
    isSnoozed,
    loadPrefs,
    savePrefs,
    snoozeForHours,
    type FloatPrefs
} from "./lib/float-prefs";
import { openScheduleModal } from "./ScheduleModal";
import "./schedule-float.css";

/**
 * ScheduleFloat — ADR-013 persistent schedule-control surface.
 *
 * Replaces ScheduledFireToast. Always-mounted bottom-left chrome
 * that surfaces queued schedules + just-fired skills, with operator
 * controls to expand/minimize/hide + an inline settings panel.
 *
 * Hook-free per canon Phase 4 / Room 9 note. Module-level signals
 * carry the state.
 */

interface PendingFireState {
    readonly fireId: string;
    readonly skillId: string;
    readonly label: string;
}

interface ScheduleRowView {
    readonly id: string;
    readonly skillId: string;
    readonly label: string;
    readonly cadenceText: string;
    readonly nextFireAtIso: string;
}

const prefsSignal: Signal<FloatPrefs> = signal(loadPrefs());
const settingsOpenSignal: Signal<boolean> = signal(false);
const pendingFireSignal: Signal<PendingFireState | null> = signal(null);
const schedulesSignal: Signal<ReadonlyArray<ScheduleRowView>> = signal([]);

let bootstrapped = false;
let pollHandle: ReturnType<typeof setInterval> | null = null;
let lastSurfacedFireId: string | null = null;

const POLL_INTERVAL_MS = 30_000;
const VISIBLE_ROW_LIMIT = 4;

const visibleSchedules = computed(() =>
    schedulesSignal.value.slice(0, VISIBLE_ROW_LIMIT)
);

const overflowCount = computed(() =>
    Math.max(0, schedulesSignal.value.length - VISIBLE_ROW_LIMIT)
);

// ─── Public actions ────────────────────────────────────────────────

function setMode(mode: FloatPrefs["mode"]): void {
    const next = { ...prefsSignal.value, mode };
    prefsSignal.value = next;
    savePrefs(next);
}

function toggleSettings(): void {
    settingsOpenSignal.value = !settingsOpenSignal.value;
}

function showSurface(): void {
    // Recovery from the hidden nub. Bring the surface back; never a
    // trap — "Surface visible: off" collapses to the nub, the nub
    // brings it back.
    patchPrefs({ surfaceVisible: true });
}

function patchPrefs(patch: Partial<FloatPrefs>): void {
    const next = { ...prefsSignal.value, ...patch };
    prefsSignal.value = next;
    savePrefs(next);
}

function applySnoozeHours(hours: number | null): void {
    if (hours === null) {
        patchPrefs({ snoozeUntilIso: null });
        return;
    }
    patchPrefs({ snoozeUntilIso: snoozeForHours(hours) });
}

async function actOnPendingFire(state: PendingFireState): Promise<void> {
    const skill = findSkillById(state.skillId);
    pendingFireSignal.value = null;
    if (!skill) return;
    void dispatchSkill(skill);
}

function openScheduleEditor(skillId: string): void {
    const skill = findSkillById(skillId);
    if (!skill) return;
    openScheduleModal(skill.id, skill.label);
}

// ─── Bootstrap + polling ───────────────────────────────────────────

async function refreshSchedules(): Promise<void> {
    try {
        const rows = await listSchedules();
        const views: ScheduleRowView[] = [];
        for (const row of rows) {
            const skill = findSkillById(row.skillId);
            if (!skill) continue;
            views.push({
                id: row.id,
                skillId: row.skillId,
                label: skill.label,
                cadenceText: formatCadence(row),
                nextFireAtIso: row.nextFireAtIso
            });
        }
        views.sort((a, b) =>
            a.nextFireAtIso.localeCompare(b.nextFireAtIso)
        );
        schedulesSignal.value = views;
    } catch {
        // Non-blocking — the surface stays usable with the existing
        // list. Errors flow through schedule-storage.
    }
}

function surfacePendingFire(fireId: string, skillId: string): void {
    if (!prefsSignal.value.showInSessionNotifications) return;
    if (isSnoozed(prefsSignal.value)) return;
    const skill = findSkillById(skillId);
    if (!skill) return;
    pendingFireSignal.value = { fireId, skillId, label: skill.label };
}

async function bootstrap(): Promise<void> {
    if (bootstrapped) return;
    bootstrapped = true;

    void refreshSchedules();

    // Arrival path — operator was just auto-navigated from a fired
    // skill. We don't have the fire id (it was consumed on the
    // previous page), but surfacing the skill name is enough.
    const arrivedFrom = consumeJustFiredSkillId();
    if (arrivedFrom) {
        surfacePendingFire("(arrival)", arrivedFrom);
        startInSessionPoll();
        return;
    }

    // Toast-in-place path: pending fire exists but the skill has no
    // destination (or operator is already on the target room).
    const result = await checkAndAutoNavigate();
    if (result.kind === "toast-in-place") {
        surfacePendingFire("(in-place)", result.skillId);
    }

    startInSessionPoll();
}

function startInSessionPoll(): void {
    if (pollHandle !== null) return;
    if (typeof window === "undefined") return;
    pollHandle = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        void pollOnce();
    }, POLL_INTERVAL_MS);
}

async function pollOnce(): Promise<void> {
    try {
        await refreshSchedules();
        const pending = await readNextPendingFire();
        if (!pending) return;
        if (pending.id === lastSurfacedFireId) return;
        await markFireViewed(pending.id);
        lastSurfacedFireId = pending.id;
        surfacePendingFire(pending.id, pending.skillId);
    } catch {
        // Polling failures are non-blocking — next tick retries.
    }
}

effect(() => {
    if (typeof window === "undefined") return;
    void bootstrap();
});

// ─── Helpers ───────────────────────────────────────────────────────

const DAY_LABELS: Record<string, string> = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday"
};

function formatCadence(row: ScheduledSkillRow): string {
    const c = row.cadence;
    if (!c) return "scheduled";
    const time = formatTime(c.hour, c.minute);
    if (c.kind === "daily") return `daily · ${time}`;
    if (c.kind === "weekly") {
        const day = DAY_LABELS[c.dayOfWeek] ?? c.dayOfWeek;
        return `${day} · ${time}`;
    }
    return `day ${formatMonthlyDay(c.dayOfMonth)} · ${time}`;
}

function formatTime(hour: number, minute: number): string {
    const m = minute.toString().padStart(2, "0");
    const isPm = hour >= 12;
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${m}${isPm ? "pm" : "am"}`;
}

function formatMonthlyDay(day: number): string {
    if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
    const rem = day % 10;
    if (rem === 1) return `${day}st`;
    if (rem === 2) return `${day}nd`;
    if (rem === 3) return `${day}rd`;
    return `${day}th`;
}

function snoozeStatusText(prefs: FloatPrefs, now: Date = new Date()): string | null {
    if (!prefs.snoozeUntilIso) return null;
    if (!isSnoozed(prefs, now)) return null;
    const until = new Date(prefs.snoozeUntilIso);
    const mins = Math.max(1, Math.round((until.getTime() - now.getTime()) / 60_000));
    if (mins < 60) return `snoozed · ${mins}m left`;
    const hours = Math.round(mins / 60);
    return `snoozed · ${hours}h left`;
}

// ─── Component ─────────────────────────────────────────────────────

export function ScheduleFloat(): JSX.Element | null {
    const prefs = prefsSignal.value;
    if (prefs.mode === "hidden") return null;
    // "Surface visible: off" collapses to a tiny restore nub instead of
    // vanishing entirely — turning it off from the settings panel used
    // to remove the only control that could turn it back on (a trap).
    if (!prefs.surfaceVisible) return renderHiddenNub();
    const minimized = prefs.mode === "minimized";
    return (
        <div
            class={`ant-schedule-float ant-schedule-float--${
                minimized ? "minimized" : "expanded"
            }`}
            role="region"
            aria-label="Scheduled skills"
        >
            {minimized
                ? renderMinimized(prefs)
                : renderExpanded(prefs)}
        </div>
    );
}

function renderExpanded(prefs: FloatPrefs): JSX.Element {
    const pending = pendingFireSignal.value;
    const schedules = visibleSchedules.value;
    const overflow = overflowCount.value;
    const showSettings = settingsOpenSignal.value;
    return (
        <>
            <div class="ant-schedule-float__head">
                <span class="ant-schedule-float__kicker">
                    SCHEDULED SKILLS
                </span>
                <div class="ant-schedule-float__head-actions">
                    <button
                        type="button"
                        class="ant-schedule-float__icon-btn"
                        onClick={toggleSettings}
                        aria-label={
                            showSettings
                                ? "Close settings"
                                : "Open settings"
                        }
                        aria-expanded={showSettings}
                        title="Settings"
                    >
                        ⚙
                    </button>
                    <button
                        type="button"
                        class="ant-schedule-float__icon-btn"
                        onClick={() => setMode("minimized")}
                        aria-label="Minimize"
                        title="Minimize"
                    >
                        −
                    </button>
                </div>
            </div>

            {pending ? (
                <button
                    type="button"
                    class="ant-schedule-float__fired"
                    onClick={() => void actOnPendingFire(pending)}
                    aria-label={`Open ${pending.label}`}
                >
                    <span class="ant-schedule-float__fired-tag">
                        JUST FIRED
                    </span>
                    <span class="ant-schedule-float__fired-label">
                        {pending.label}
                    </span>
                    <span class="ant-schedule-float__fired-arrow" aria-hidden="true">
                        →
                    </span>
                </button>
            ) : null}

            <div class="ant-schedule-float__queue">
                <div class="ant-schedule-float__queue-head">QUEUED</div>
                {schedules.length === 0 ? (
                    <p class="ant-schedule-float__empty">
                        Nothing scheduled yet.
                    </p>
                ) : (
                    <>
                        {schedules.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                class="ant-schedule-float__row"
                                onClick={() => openScheduleEditor(s.skillId)}
                                aria-label={`Edit schedule for ${s.label}`}
                            >
                                <span class="ant-schedule-float__row-label">
                                    {s.label}
                                </span>
                                <span class="ant-schedule-float__row-time">
                                    {s.cadenceText}
                                </span>
                            </button>
                        ))}
                        {overflow > 0 ? (
                            <p class="ant-schedule-float__overflow">
                                + {overflow} more
                            </p>
                        ) : null}
                    </>
                )}
            </div>

            {showSettings ? renderSettingsPanel(prefs) : null}
        </>
    );
}

function renderHiddenNub(): JSX.Element {
    return (
        <div
            class="ant-schedule-float ant-schedule-float--nub"
            role="region"
            aria-label="Scheduled skills (hidden)"
        >
            <button
                type="button"
                class="ant-schedule-float__nub"
                onClick={showSurface}
                aria-label="Show scheduled skills"
                title="Show scheduled skills"
            >
                ⌃
            </button>
        </div>
    );
}

function renderMinimized(prefs: FloatPrefs): JSX.Element {
    const showSettings = settingsOpenSignal.value;
    if (showSettings) {
        return (
            <div class="ant-schedule-float__settings">
                <div class="ant-schedule-float__settings-head">
                    <span>SCHEDULE SETTINGS</span>
                    <button
                        type="button"
                        class="ant-schedule-float__icon-btn"
                        onClick={toggleSettings}
                        aria-label="Close settings"
                    >
                        ×
                    </button>
                </div>
                {renderSettingsBody(prefs)}
            </div>
        );
    }
    const pending = pendingFireSignal.value;
    const count = schedulesSignal.value.length;
    return (
        <div class="ant-schedule-float__pill">
            <button
                type="button"
                class="ant-schedule-float__pill-btn"
                onClick={() => setMode("expanded")}
                aria-label={
                    pending
                        ? `Expand schedules · ${pending.label} just fired`
                        : `Expand schedules · ${count} queued`
                }
            >
                {pending ? (
                    <span
                        class="ant-schedule-float__pill-dot"
                        aria-hidden="true"
                    />
                ) : (
                    <span
                        class="ant-schedule-float__pill-dot-empty"
                        aria-hidden="true"
                    />
                )}
                <span class="ant-schedule-float__pill-label">
                    {pending
                        ? "Just fired"
                        : count === 0
                        ? "No schedules"
                        : `${count} scheduled`}
                </span>
            </button>
            <button
                type="button"
                class="ant-schedule-float__wheel"
                onClick={toggleSettings}
                aria-label="Open settings"
                title="Settings"
            >
                ⚙
            </button>
            {prefs.showTooltipHints ? (
                <span
                    class="ant-schedule-float__tooltip"
                    data-visible="true"
                    role="tooltip"
                >
                    Click to expand. Gear to manage.
                </span>
            ) : null}
        </div>
    );
}

function renderSettingsPanel(prefs: FloatPrefs): JSX.Element {
    return (
        <div class="ant-schedule-float__settings">
            <div class="ant-schedule-float__settings-head">SETTINGS</div>
            {renderSettingsBody(prefs)}
        </div>
    );
}

function renderSettingsBody(prefs: FloatPrefs): JSX.Element {
    const snoozeStatus = snoozeStatusText(prefs);
    return (
        <>
            <ToggleRow
                label="Show in-session notifications"
                checked={prefs.showInSessionNotifications}
                onChange={(v) =>
                    patchPrefs({ showInSessionNotifications: v })
                }
            />
            <ToggleRow
                label="Show tooltip hints"
                checked={prefs.showTooltipHints}
                onChange={(v) => patchPrefs({ showTooltipHints: v })}
            />
            <ToggleRow
                label="Surface visible"
                checked={prefs.surfaceVisible}
                onChange={(v) => patchPrefs({ surfaceVisible: v })}
            />
            <div class="ant-schedule-float__snooze">
                <span class="ant-schedule-float__snooze-label">
                    Snooze fires
                </span>
                <div class="ant-schedule-float__snooze-buttons">
                    <button
                        type="button"
                        class={`ant-schedule-float__snooze-btn${
                            prefs.snoozeUntilIso === null
                                ? " ant-schedule-float__snooze-btn--active"
                                : ""
                        }`}
                        onClick={() => applySnoozeHours(null)}
                    >
                        OFF
                    </button>
                    <button
                        type="button"
                        class="ant-schedule-float__snooze-btn"
                        onClick={() => applySnoozeHours(1)}
                    >
                        1H
                    </button>
                    <button
                        type="button"
                        class="ant-schedule-float__snooze-btn"
                        onClick={() => applySnoozeHours(4)}
                    >
                        4H
                    </button>
                </div>
            </div>
            {snoozeStatus ? (
                <p class="ant-schedule-float__snooze-status">{snoozeStatus}</p>
            ) : null}
        </>
    );
}

function ToggleRow(props: {
    readonly label: string;
    readonly checked: boolean;
    readonly onChange: (v: boolean) => void;
}): JSX.Element {
    return (
        <label class="ant-schedule-float__setting">
            <span>{props.label}</span>
            <button
                type="button"
                class="ant-schedule-float__toggle"
                role="switch"
                aria-checked={props.checked}
                aria-label={props.label}
                onClick={() => props.onChange(!props.checked)}
            />
        </label>
    );
}

// ─── Test escape hatch ─────────────────────────────────────────────

/** @internal — reset module signals between tests. */
export function __resetScheduleFloatForTests(): void {
    prefsSignal.value = DEFAULT_PREFS;
    settingsOpenSignal.value = false;
    pendingFireSignal.value = null;
    schedulesSignal.value = [];
    bootstrapped = false;
    lastSurfacedFireId = null;
    if (pollHandle !== null) {
        clearInterval(pollHandle);
        pollHandle = null;
    }
}
