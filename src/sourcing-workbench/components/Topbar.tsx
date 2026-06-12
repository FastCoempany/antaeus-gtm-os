import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { inboundFocus, stats } from "../state";

/**
 * Topbar — kicker + focus title + workbench stats.
 *
 * Per canon §4.6 the room turns focuses into named, pushable prospects.
 * The topbar carries one ranked numeric line (the workbench count) so
 * the operator lands knowing whether the territory is full or hollow.
 */
export function Topbar(): JSX.Element {
    const s = stats.value;
    const focus = inboundFocus.value;
    // Phase 2.3 — inbound focus from ICP Studio / Territory Architect
    // appended as kicker tail so the operator sees which ICP the
    // workbench is sourcing against.
    const baseKicker =
        s.total > 0
            ? `SOURCING WORKBENCH · ${s.total} ${s.total === 1 ? "prospect" : "prospects"} · ${s.ready} ready`
            : "SOURCING WORKBENCH";
    const kicker = focus
        ? `${baseKicker} · sourcing against: ${focus}`
        : baseKicker;
    return (
        <header class="sw-topbar" aria-label={t("Sourcing Workbench header")}>
            <p class="sw-topbar__kicker">{kicker}</p>
            <h1 class="sw-topbar__title">
                Push only the names the territory will respect.
            </h1>
            <div class="sw-topbar__stats" role="group" aria-label={t("Workbench stats")}>
                <Stat label={t("Captured")} value={s.captured} />
                <Stat label={t("Researched")} value={s.researched} />
                <Stat label={t("Ready to push")} value={s.ready} accent />
                <Stat label={t("Pushed")} value={s.pushed} />
                <Stat label={t("Total")} value={s.total} muted />
            </div>
        </header>
    );
}

function Stat({
    label,
    value,
    accent,
    muted
}: {
    readonly label: string;
    readonly value: number;
    readonly accent?: boolean;
    readonly muted?: boolean;
}): JSX.Element {
    const cls = `sw-stat${accent ? " is-accent" : ""}${muted ? " is-muted" : ""}`;
    return (
        <div class={cls}>
            <span class="sw-stat__label">{label}</span>
            <span class="sw-stat__value">{value}</span>
        </div>
    );
}
