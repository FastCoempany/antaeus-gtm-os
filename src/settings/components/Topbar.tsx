import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { backup, demo } from "../state";

/**
 * Topbar — kicker + thesis + 3-stat anchor (keys captured / last
 * export / demo mode). Per canon §4.20: calm, plainspoken utility.
 */
export function Topbar(): JSX.Element {
    const b = backup.value;
    const d = demo.value;
    const lastExport = b.capturedAt
        ? new Date(b.capturedAt).toLocaleString()
        : "Never exported";
    return (
        <header class="st-topbar">
            <BackButton />
            <p class="st-topbar__kicker">Trust + recovery</p>
            <h1 class="st-topbar__title">Settings</h1>
            <p class="st-topbar__subtitle">
                Manage workspace trust, recovery, category framing, and
                browser-specific controls without breaking durable GTM truth.
            </p>
            <div class="st-topbar__stats">
                <Stat label="Keys on this device" value={String(b.keyCount)} />
                <Stat label="Last backup" value={lastExport} muted />
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
