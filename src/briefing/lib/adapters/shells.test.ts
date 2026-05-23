import { describe, expect, it } from "vitest";
import {
    getActiveDealsState,
    getAssetBuilderState,
    getBehavioralFeedbackState,
    getCallPlannerState,
    getDiscoveryStudioState,
    getIcpStudioState,
    getOutboundStudioState,
    getVoiceDocumentState,
    getWatchlistTriggersState
} from "./index";
import type { ModuleStateContract } from "../contracts";

/**
 * The nine adapter shells should all conform to the same contract:
 * synchronous, side-effect-free, always return a valid
 * ModuleStateContract — never throw, never return undefined.
 *
 * B.0c ships them as uninitialized stubs. Real data translation
 * lands as each room migrates. This suite locks the structural
 * invariants so a real-translation PR can't accidentally regress
 * the shape.
 */

interface AdapterCase {
    readonly name: string;
    readonly call: () => ModuleStateContract<unknown>;
}

const ADAPTERS: ReadonlyArray<AdapterCase> = [
    { name: "icp_studio", call: getIcpStudioState },
    { name: "discovery_studio", call: getDiscoveryStudioState },
    { name: "call_planner", call: getCallPlannerState },
    { name: "outbound_studio", call: getOutboundStudioState },
    { name: "asset_builder", call: getAssetBuilderState },
    { name: "active_deals", call: getActiveDealsState },
    { name: "watchlist_triggers", call: getWatchlistTriggersState },
    { name: "voice_document", call: getVoiceDocumentState },
    { name: "behavioral_feedback", call: getBehavioralFeedbackState }
];

describe("adapter shells — structural invariants", () => {
    for (const { name, call } of ADAPTERS) {
        describe(name, () => {
            it("returns a contract with schema_version 1.0", () => {
                expect(call().schema_version).toBe("1.0");
            });

            it("returns health=uninitialized (B.0c stub)", () => {
                expect(call().health).toBe("uninitialized");
            });

            it("includes a non-empty health_reason explaining the stub", () => {
                const c = call();
                expect(c.health_reason).toBeTruthy();
                expect((c.health_reason ?? "").length).toBeGreaterThan(0);
            });

            it("returns null state for uninitialized health", () => {
                expect(call().state).toBeNull();
            });

            it("returns null last_modified_at when uninitialized", () => {
                expect(call().last_modified_at).toBeNull();
            });

            it("never throws when called from empty environment", () => {
                expect(() => call()).not.toThrow();
            });

            it("is idempotent — calling twice returns equivalent shapes", () => {
                expect(call()).toEqual(call());
            });
        });
    }

    it("all nine adapters are wired up", () => {
        expect(ADAPTERS).toHaveLength(9);
    });
});
