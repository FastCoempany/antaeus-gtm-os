import type { JSX } from "preact";
import { backup, demo } from "../state";

/**
 * Topbar — kicker + thesis + 3-stat anchor (keys captured / last
 * backup / demo mode). Per canon §4.20: calm, plainspoken utility.
 */
export function Topbar(): JSX.Element {
    const b = backup.value;
    const d = demo.value;
    const lastBackup = b.capturedAt
        ? new Date(b.capturedAt).toLocaleString()
        : "Never";
    return (
        <header class="st-topbar">
            <p class="st-topbar__kicker">SETTINGS</p>
            <h1 class="st-topbar__title">Settings</h1>
            <p class="st-topbar__subtitle">
                Backup, restore, category, demo mode, and cloud sync —
                the controls that keep the workspace safe.
            </p>
            <div class="st-topbar__stats">
                <Stat label="Keys on this device" value={String(b.keyCount)} />
                <Stat label="Last backup" value={lastBackup} muted />
                <Stat
                    label="Mode"
                    value={d.active ? "Demo workspace" : "Real workspace"}
                    accent={!d.active}
                    warn={d.active}
                />
            </div>
        </header>
    );
}

function Stat({
    label,
    value,
    accent,
    warn,
    muted
}: {
    readonly label: string;
    readonly value: string;
    readonly accent?: boolean;
    readonly warn?: boolean;
    readonly muted?: boolean;
}): JSX.Element {
    const cls = `st-stat${accent ? " is-accent" : ""}${warn ? " is-warn" : ""}${muted ? " is-muted" : ""}`;
    return (
        <div class={cls}>
            <span class="st-stat__label">{label}</span>
            <span class="st-stat__value">{value}</span>
        </div>
    );
}
