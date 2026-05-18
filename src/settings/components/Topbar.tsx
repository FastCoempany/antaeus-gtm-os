import type { JSX } from "preact";
import { backup, demo } from "../state";

/**
 * Topbar — kicker + thesis + 3-stat anchor (keys captured / last
 * backup / demo mode). Per canon §4.20: calm, plainspoken utility.
 *
 * Phase 2.9 audit:
 *   - Kicker carries contextual workspace-state tail (parity with
 *     audited rooms) — "SETTINGS · demo workspace" / "SETTINGS · N
 *     keys captured" — was just "SETTINGS".
 *
 * Program 6 / PR 1: the inboundReturn back-pill that lived here was
 * hoisted into the canonical RoomChrome (top-of-room, right side)
 * so back-affordance renders consistently across all 20 rooms. The
 * inboundReturn signal in state.ts is retired in favor of the
 * shared BackButton component (which reads continuity params via
 * readContinuity() the same way inboundReturn used to).
 */
export function Topbar(): JSX.Element {
    const b = backup.value;
    const d = demo.value;
    const lastBackup = b.capturedAt
        ? new Date(b.capturedAt).toLocaleString()
        : "Never";

    const kickerTail = d.active
        ? "demo workspace"
        : b.keyCount > 0
          ? `${b.keyCount} ${b.keyCount === 1 ? "key" : "keys"} captured`
          : null;
    const kicker = kickerTail ? `SETTINGS · ${kickerTail}` : "SETTINGS";

    return (
        <header class="st-topbar">
            <p class="st-topbar__kicker">{kicker}</p>
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
