/**
 * Briefing adapter barrel.
 *
 * Every adapter exposes a single `get*State()` function returning a
 * valid `ModuleStateContract<TBody>`. The aggregator at
 * `../hydrate.ts` calls each in turn, catches per-adapter errors, and
 * produces a `HydratedContext` consumable by the B.1+ pipeline.
 *
 * Adding a future adapter: write the file, export it here, register
 * it in `../hydrate.ts`'s `ADAPTERS` table. The HydratedContext type
 * narrows to the canonical nine — adding a tenth would require a
 * contract change.
 */

export { getIcpStudioState } from "./icp-studio";
export { getDiscoveryStudioState } from "./discovery-studio";
export { getCallPlannerState } from "./call-planner";
export { getOutboundStudioState } from "./outbound-studio";
export { getAssetBuilderState } from "./asset-builder";
export { getActiveDealsState } from "./active-deals";
export { getWatchlistTriggersState } from "./watchlist-triggers";
export { getVoiceDocumentState } from "./voice-document";
export { getBehavioralFeedbackState } from "./behavioral-feedback";
