import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import { DEFAULT_INPUTS, type PlanInputs } from "./types";
import {
    inputsToInsert,
    inputsToUpdate,
    KIND_QUOTA_INPUTS,
    looksLikePersistedId,
    rowKind,
    rowToInputs
} from "./quota-bridge";

const FULL_INPUTS: PlanInputs = {
    quota: 1_500_000,
    acv: 75_000,
    win: 18,
    m2o: 32,
    t2m: 0.6,
    show: 75,
    days: 22,
    tpa: 12,
    cycle: 90
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("legacy")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "quota.inputs" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowKind(row)).toBe("quota.inputs");
    });
});

describe("rowToInputs", () => {
    it("hydrates a populated row", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "quota.inputs",
                inputs: FULL_INPUTS
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const i = rowToInputs(row);
        expect(i).not.toBeNull();
        expect(i!.quota).toBe(FULL_INPUTS.quota);
        expect(i!.win).toBe(18);
    });

    it("returns null for wrong kind", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToInputs(row)).toBeNull();
    });

    it("returns null for null row", () => {
        expect(rowToInputs(null)).toBeNull();
    });

    it("returns DEFAULT_INPUTS when inputs blob missing", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "quota.inputs" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToInputs(row)).toEqual(DEFAULT_INPUTS);
    });

    it("falls back per-field when partial", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "quota.inputs",
                inputs: { quota: 800_000 }
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const i = rowToInputs(row)!;
        expect(i.quota).toBe(800_000);
        expect(i.acv).toBe(DEFAULT_INPUTS.acv);
        expect(i.win).toBe(DEFAULT_INPUTS.win);
    });

    it("normalizes string-typed numbers", () => {
        const row: Row<"pipeline_settings"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "quota.inputs",
                inputs: { quota: "1000000", win: "20" }
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const i = rowToInputs(row)!;
        expect(i.quota).toBe(1_000_000);
        expect(i.win).toBe(20);
    });
});

describe("inputsToInsert / inputsToUpdate", () => {
    it("packs kind + inputs", () => {
        const insert = inputsToInsert(FULL_INPUTS);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_QUOTA_INPUTS
        );
        const update = inputsToUpdate(FULL_INPUTS);
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_QUOTA_INPUTS
        );
    });
});
