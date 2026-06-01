import type { JSX } from "preact";
import { signal, type Signal } from "@preact/signals";
import { upsertSchedule } from "./lib/schedule-storage";
import type { Cadence, DayOfWeek } from "./lib/scheduling";
import "./schedule-modal.css";

/**
 * ScheduleModal — Phase E operator-side scheduling UI (ADR-012).
 *
 * Mounts once per app (via RoomChrome → ScheduledFireToast wrapping)
 * and opens when the Cmd+K palette's ⏰ schedule button is clicked.
 * Form picks a cadence (daily / weekly / monthly) + time; on submit,
 * upserts the schedule and closes.
 *
 * Hook-free per the canon Phase 4 / Room 9 note. Module-level signals
 * hold the open/closed state + the form values.
 */

interface ModalState {
    readonly skillId: string;
    readonly skillLabel: string;
}

const modalSignal: Signal<ModalState | null> = signal(null);
const cadenceKindSignal: Signal<"daily" | "weekly" | "monthly"> = signal("weekly");
const hourSignal: Signal<number> = signal(9);
const minuteSignal: Signal<number> = signal(0);
const dayOfWeekSignal: Signal<DayOfWeek> = signal("fri");
const dayOfMonthSignal: Signal<number> = signal(1);
const busySignal: Signal<boolean> = signal(false);
const errorSignal: Signal<string | null> = signal(null);

export function openScheduleModal(skillId: string, skillLabel: string): void {
    modalSignal.value = { skillId, skillLabel };
    errorSignal.value = null;
}

export function closeScheduleModal(): void {
    modalSignal.value = null;
    busySignal.value = false;
    errorSignal.value = null;
}

async function handleSubmit(): Promise<void> {
    const state = modalSignal.value;
    if (!state) return;
    busySignal.value = true;
    errorSignal.value = null;
    try {
        const kind = cadenceKindSignal.value;
        const hour = hourSignal.value;
        const minute = minuteSignal.value;
        let cadence: Cadence;
        if (kind === "daily") {
            cadence = { kind, hour, minute };
        } else if (kind === "weekly") {
            cadence = {
                kind,
                hour,
                minute,
                dayOfWeek: dayOfWeekSignal.value
            };
        } else {
            cadence = {
                kind,
                hour,
                minute,
                dayOfMonth: dayOfMonthSignal.value
            };
        }
        const ok = await upsertSchedule(state.skillId, cadence);
        if (ok) {
            closeScheduleModal();
        } else {
            errorSignal.value =
                "Couldn't save the schedule. Check the connection and try again.";
        }
    } finally {
        busySignal.value = false;
    }
}

const DAYS: ReadonlyArray<[DayOfWeek, string]> = [
    ["mon", "Mon"],
    ["tue", "Tue"],
    ["wed", "Wed"],
    ["thu", "Thu"],
    ["fri", "Fri"],
    ["sat", "Sat"],
    ["sun", "Sun"]
];

export function ScheduleModal(): JSX.Element | null {
    const state = modalSignal.value;
    if (!state) return null;
    const kind = cadenceKindSignal.value;
    const busy = busySignal.value;
    const error = errorSignal.value;

    return (
        <div
            class="ant-schedule__backdrop"
            onClick={closeScheduleModal}
            role="dialog"
            aria-modal="true"
            aria-label="Schedule skill"
        >
            <div class="ant-schedule" onClick={(e) => e.stopPropagation()}>
                <header class="ant-schedule__head">
                    <p class="ant-schedule__kicker">SCHEDULE SKILL</p>
                    <h2 class="ant-schedule__title">{state.skillLabel}</h2>
                </header>

                {error ? (
                    <p class="ant-schedule__error" role="alert">
                        {error}
                    </p>
                ) : null}

                <label class="ant-schedule__field">
                    <span class="ant-schedule__field-tag">Cadence</span>
                    <div class="ant-schedule__cadence-buttons">
                        {(["daily", "weekly", "monthly"] as const).map((c) => (
                            <button
                                key={c}
                                type="button"
                                class={`ant-schedule__cadence-btn${
                                    kind === c ? " is-active" : ""
                                }`}
                                onClick={() => (cadenceKindSignal.value = c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </label>

                {kind === "weekly" ? (
                    <label class="ant-schedule__field">
                        <span class="ant-schedule__field-tag">Day of week</span>
                        <div class="ant-schedule__day-buttons">
                            {DAYS.map(([d, label]) => (
                                <button
                                    key={d}
                                    type="button"
                                    class={`ant-schedule__day-btn${
                                        dayOfWeekSignal.value === d
                                            ? " is-active"
                                            : ""
                                    }`}
                                    onClick={() => (dayOfWeekSignal.value = d)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </label>
                ) : null}

                {kind === "monthly" ? (
                    <label class="ant-schedule__field">
                        <span class="ant-schedule__field-tag">Day of month</span>
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={dayOfMonthSignal.value}
                            onInput={(e) => {
                                const v = Number(
                                    (e.target as HTMLInputElement).value
                                );
                                if (Number.isFinite(v) && v >= 1 && v <= 31) {
                                    dayOfMonthSignal.value = v;
                                }
                            }}
                        />
                    </label>
                ) : null}

                <label class="ant-schedule__field ant-schedule__time">
                    <span class="ant-schedule__field-tag">Time (Central · CT)</span>
                    <div class="ant-schedule__time-row">
                        <input
                            type="number"
                            min={0}
                            max={23}
                            value={hourSignal.value}
                            onInput={(e) => {
                                const v = Number(
                                    (e.target as HTMLInputElement).value
                                );
                                if (Number.isFinite(v) && v >= 0 && v <= 23) {
                                    hourSignal.value = v;
                                }
                            }}
                        />
                        <span>:</span>
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={minuteSignal.value}
                            onInput={(e) => {
                                const v = Number(
                                    (e.target as HTMLInputElement).value
                                );
                                if (Number.isFinite(v) && v >= 0 && v <= 59) {
                                    minuteSignal.value = v;
                                }
                            }}
                        />
                    </div>
                </label>

                <div class="ant-schedule__actions">
                    <button
                        type="button"
                        class="ant-schedule__btn ant-schedule__btn--ghost"
                        onClick={closeScheduleModal}
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="ant-schedule__btn ant-schedule__btn--primary"
                        onClick={() => void handleSubmit()}
                        disabled={busy}
                    >
                        {busy ? "Saving…" : "Save schedule"}
                    </button>
                </div>
            </div>
        </div>
    );
}
