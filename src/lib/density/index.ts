/**
 * The density gradient module (spec 02). The same primitives serve the
 * day-one operator and the fluent operator without forking into two
 * products: two states, four dimensions, one per-workspace setting,
 * Phase F-style proposals at named milestones, voice unchanged across
 * both. This module is the runtime form of §4.2's rendering helpers
 * and §2.5's persistence.
 */
export * from "./types";
export { densityState, isStepBack, setDensityState } from "./signal";
export { pickByDensity, sliceAffordances, showsAnnotations } from "./helpers";
export { bootDensity, saveDensityState } from "./persistence";
