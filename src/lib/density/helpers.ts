import { DEFAULT_AFFORDANCE_SLICE_INDEX } from "@/components/contract";
import { densityState } from "./signal";
import type { DensityState } from "./types";

/**
 * Density rendering helpers (spec 02 §4.2). The renderer picks which
 * strings to show and how much of a surface to reveal; the voice
 * validator (orthogonal, spec 01 §4.3) validates BOTH variants at
 * build time, so whichever the renderer returns has already passed.
 */

/**
 * Sentence count (spec 02 §3.1). A component paired with verbose /
 * terse content declares both; the renderer returns the one for the
 * current state. Both strings pass `validateString` independently —
 * the gate walks every t() call regardless of which renders.
 */
export function pickByDensity<T>(
    variants: { readonly verbose: T; readonly terse: T },
    state: DensityState = densityState.value
): T {
    return state === "step_back" ? variants.terse : variants.verbose;
}

/**
 * Affordance count (spec 02 §3.2 + spec 03 §4.7). Show me how reveals
 * every action; Step back reveals the primary + `sliceIndex` (default
 * two) and collapses the rest behind "More". The slice point is a
 * property of the component's action set — the component passes its
 * `affordanceSliceIndex` (the contract field that was dead until now).
 */
export function sliceAffordances<T>(
    affordances: ReadonlyArray<T>,
    options: {
        readonly state?: DensityState;
        readonly sliceIndex?: number;
    } = {}
): { readonly visible: ReadonlyArray<T>; readonly collapsed: ReadonlyArray<T> } {
    const state = options.state ?? densityState.value;
    const sliceIndex = options.sliceIndex ?? DEFAULT_AFFORDANCE_SLICE_INDEX;
    if (state === "show_me_how") {
        return { visible: affordances, collapsed: [] };
    }
    const cut = Math.max(0, sliceIndex);
    return {
        visible: affordances.slice(0, cut),
        collapsed: affordances.slice(cut)
    };
}

/**
 * Annotation density (spec 02 §3.4). Microcopy + tooltips render in
 * Show me how and vanish in Step back — the fluent operator knows the
 * data shape and what the controls do.
 */
export function showsAnnotations(state: DensityState = densityState.value): boolean {
    return state === "show_me_how";
}
