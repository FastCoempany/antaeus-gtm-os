import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import { DEFAULT_DENSITY_STATE, type DensityState } from "./types";

/**
 * The live density state (spec 02 §2.5). A single signal the whole
 * product reads; density-responsive components recompose once per
 * state change rather than thrashing on every paint. The state changes
 * infrequently (operator action or accepted Phase F proposal), so a
 * single signal re-render is exactly the right granularity.
 *
 * Boot (persistence.ts) seeds this from `workspace_profile.density_state`
 * and keeps it synced via Supabase Realtime; until boot runs it holds
 * the walked-through default so a cold first paint never under-explains.
 */
export const densityState: Signal<DensityState> = signal(DEFAULT_DENSITY_STATE);

/** True when the surface should render its fluent (terse) form. */
export const isStepBack: ReadonlySignal<boolean> = computed(
    () => densityState.value === "step_back"
);

export function setDensityState(next: DensityState): void {
    densityState.value = next;
}
