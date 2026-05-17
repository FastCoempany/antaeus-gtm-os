import type { JSX } from "preact";
import type { ActionPlan, ActionRoute } from "../lib/types";

interface Props {
    readonly plan: ActionPlan;
}

/**
 * RouteRack — bottom of the pinned-case panel. Three CTAs (primary,
 * secondary, tertiary) routing into the right next room with the
 * canonical continuity params attached.
 *
 * Per canon §4.14 flows-out: Deal Workspace, Call Planner, Discovery
 * Studio, PoC Framework. The action-plan logic picks which room is
 * primary based on top cause + stage.
 */
export function RouteRack({ plan }: Props): JSX.Element {
    const slots: Array<ActionRoute | null> = [plan.primary, plan.secondary, plan.tertiary];
    const visible = slots.filter((s): s is ActionRoute => s !== null);
    if (visible.length === 0) return <></>;
    return (
        <nav class="fa-route-rack" aria-label="Action plan">
            <span class="fa-route-rack__kicker">INTERVENE</span>
            <div class="fa-route-rack__list">
                {visible.map((route) => (
                    <a
                        key={route.href}
                        class={`fa-route-rack__cta fa-route-rack__cta--${route.tone ?? "secondary"}`}
                        href={route.href}
                    >
                        <span class="fa-route-rack__label">{route.label}</span>
                        {route.reason ? (
                            <span class="fa-route-rack__reason">{route.reason}</span>
                        ) : null}
                    </a>
                ))}
            </div>
        </nav>
    );
}
