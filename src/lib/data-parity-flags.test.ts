import { describe, expect, it } from "vitest";
import {
    DATA_LAYER_PARITY_COMPLETE,
    DATA_PARITY_FLAGS,
    isDataLayerParityComplete,
    isRoomParityReadEnabled,
    isRoomParityWriteEnabled
} from "./data-parity-flags";

describe("DATA_LAYER_PARITY_COMPLETE constant", () => {
    it("exposes the master umbrella flag key", () => {
        expect(DATA_LAYER_PARITY_COMPLETE).toBe("data_layer_parity_complete");
    });
});

describe("DATA_PARITY_FLAGS registry", () => {
    it("includes every Phase 4 room", () => {
        const rooms = Object.keys(DATA_PARITY_FLAGS);
        // 17 rooms per ADR-005 §"Room priority order"
        expect(rooms).toHaveLength(17);
    });

    it("each room exposes write + read flag keys with the data_parity suffix", () => {
        for (const flags of Object.values(DATA_PARITY_FLAGS)) {
            expect(flags.write).toMatch(/_data_parity_write$/);
            expect(flags.read).toMatch(/_data_parity_read$/);
        }
    });

    it("flag keys are unique across the registry", () => {
        const allKeys = Object.values(DATA_PARITY_FLAGS).flatMap((f) => [
            f.write,
            f.read
        ]);
        const unique = new Set(allKeys);
        expect(unique.size).toBe(allKeys.length);
    });

    it("Tier 1 trio (Signal Console + Deal Workspace + Outbound Studio) is present", () => {
        expect(DATA_PARITY_FLAGS.signalConsole).toBeDefined();
        expect(DATA_PARITY_FLAGS.dealWorkspace).toBeDefined();
        expect(DATA_PARITY_FLAGS.outboundStudio).toBeDefined();
    });
});

describe("flag-check helpers return false by default", () => {
    // Posthog is not initialized in the test runner; every flag check should
    // return false (see observability.ts isFeatureEnabled). This is the
    // behavior the data-parity retrofit relies on — until a room's flag is
    // explicitly flipped on in Posthog, the legacy localStorage path stays
    // active.

    it("isDataLayerParityComplete() returns false", () => {
        expect(isDataLayerParityComplete()).toBe(false);
    });

    it("isRoomParityWriteEnabled() returns false for every room", () => {
        for (const room of Object.keys(DATA_PARITY_FLAGS) as Array<
            keyof typeof DATA_PARITY_FLAGS
        >) {
            expect(isRoomParityWriteEnabled(room)).toBe(false);
        }
    });

    it("isRoomParityReadEnabled() returns false for every room", () => {
        for (const room of Object.keys(DATA_PARITY_FLAGS) as Array<
            keyof typeof DATA_PARITY_FLAGS
        >) {
            expect(isRoomParityReadEnabled(room)).toBe(false);
        }
    });
});
