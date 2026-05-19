import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { TaskLog } from "./types";
import {
    KIND_TASK_LOG,
    looksLikePersistedId,
    rowKind,
    rowToTaskLog,
    taskLogToInsert,
    taskLogToUpdate
} from "./autopsy-bridge";

const FULL_LOG: TaskLog = {
    deal_1: {
        lastRunAt: "2026-04-02T12:00:00Z",
        tasks: {
            t_a: { done: true, doneAt: "2026-04-02T11:00:00Z" },
            t_b: { done: false }
        }
    },
    deal_2: {
        tasks: {
            t_c: { done: true, doneAt: "2026-04-02T13:00:00Z" }
        }
    }
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("legacy_id")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "future-autopsy.taskLog" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowKind(row)).toBe("future-autopsy.taskLog");
    });
});

describe("rowToTaskLog", () => {
    it("hydrates a populated row", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "future-autopsy.taskLog",
                log: FULL_LOG
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const log = rowToTaskLog(row);
        expect(log).not.toBeNull();
        expect(log!["deal_1"]?.lastRunAt).toBe("2026-04-02T12:00:00Z");
        expect(log!["deal_1"]?.tasks["t_a"]?.done).toBe(true);
        expect(log!["deal_1"]?.tasks["t_a"]?.doneAt).toBe(
            "2026-04-02T11:00:00Z"
        );
        expect(log!["deal_2"]?.tasks["t_c"]?.done).toBe(true);
    });

    it("returns null for wrong kind", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.focus" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToTaskLog(row)).toBeNull();
    });

    it("returns null for null row", () => {
        expect(rowToTaskLog(null)).toBeNull();
    });

    it("returns empty {} when log blob missing", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "future-autopsy.taskLog" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToTaskLog(row)).toEqual({});
    });

    it("filters malformed task entries", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "future-autopsy.taskLog",
                log: {
                    deal_1: {
                        tasks: {
                            t_good: { done: true },
                            t_bad: null,
                            t_string: "garbage"
                        }
                    }
                }
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const log = rowToTaskLog(row)!;
        expect(Object.keys(log["deal_1"]?.tasks ?? {})).toEqual(["t_good"]);
    });
});

describe("taskLogToInsert / taskLogToUpdate", () => {
    it("packs kind + log", () => {
        const insert = taskLogToInsert(FULL_LOG);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_TASK_LOG
        );
        const update = taskLogToUpdate(FULL_LOG);
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_TASK_LOG
        );
    });
});
