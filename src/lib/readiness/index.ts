/**
 * Readiness engine — public surface.
 *
 * Wave 1 (this PR): pure library. No UI, no wiring.
 * Wave 2: Anchor + Drawer components.
 * Wave 3: Wire into Dashboard + verdict-history persistence.
 * Wave 4: Legacy /app/readiness/ redirect stub.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6 Phase 5
 */

export * from "./types";
export {
    scoreIcp,
    scoreOutreach,
    scoreDiscovery,
    scoreDeals,
    scoreProof,
    scoreAllDimensions
} from "./dimensions";
export { evaluateReadiness, detectTransition } from "./verdict";
