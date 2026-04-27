import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    TASK_LOG_KEY,
    isTaskDone,
    loadTaskLog,
    saveTaskLog,
    toggleTask
} from "./task-log";

describe("loadTaskLog / saveTaskLog", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty object when key is missing", () => {
        expect(loadTaskLog()).toEqual({});
    });

    it("returns empty object on malformed JSON", () => {
        localStorage.setItem(TASK_LOG_KEY, "{not json");
        expect(loadTaskLog()).toEqual({});
    });

    it("round-trips: save then load preserves the log", () => {
        const log = {
            "deal-1": {
                lastRunAt: "2026-04-26T12:00:00Z",
                tasks: {
                    "task-a": { done: true, doneAt: "2026-04-26T12:00:00Z" },
                    "task-b": { done: false }
                }
            }
        };
        saveTaskLog(log);
        const out = loadTaskLog();
        expect(out["deal-1"]?.lastRunAt).toBe("2026-04-26T12:00:00Z");
        expect(out["deal-1"]?.tasks["task-a"]?.done).toBe(true);
        expect(out["deal-1"]?.tasks["task-a"]?.doneAt).toBe(
            "2026-04-26T12:00:00Z"
        );
        expect(out["deal-1"]?.tasks["task-b"]?.done).toBe(false);
    });

    it("filters out malformed per-deal / per-task entries", () => {
        localStorage.setItem(
            TASK_LOG_KEY,
            JSON.stringify({
                ok: { tasks: { real: { done: true } } },
                garbage: "string",
                "non-object-tasks": { tasks: "string" },
                "no-tasks": { lastRunAt: "now" }
            })
        );
        const out = loadTaskLog();
        expect(out.ok?.tasks.real?.done).toBe(true);
        expect(out.garbage).toBeUndefined();
        expect(out["non-object-tasks"]?.tasks).toEqual({});
    });

    it("saveTaskLog does not throw on hostile storage", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => saveTaskLog({})).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });
});

describe("isTaskDone + toggleTask", () => {
    it("isTaskDone returns false on missing entries", () => {
        expect(isTaskDone({}, "deal", "task")).toBe(false);
    });

    it("toggleTask flips false → true with doneAt timestamp", () => {
        const now = "2026-04-26T12:00:00Z";
        const next = toggleTask({}, "deal-1", "task-a", now);
        expect(next["deal-1"]?.tasks["task-a"]?.done).toBe(true);
        expect(next["deal-1"]?.tasks["task-a"]?.doneAt).toBe(now);
        expect(next["deal-1"]?.lastRunAt).toBe(now);
    });

    it("toggleTask flips true → false (drops doneAt)", () => {
        const start = {
            "deal-1": { tasks: { "task-a": { done: true, doneAt: "earlier" } } }
        };
        const next = toggleTask(start, "deal-1", "task-a", "later");
        expect(next["deal-1"]?.tasks["task-a"]?.done).toBe(false);
        expect(next["deal-1"]?.tasks["task-a"]?.doneAt).toBeUndefined();
    });

    it("toggleTask does not mutate the input", () => {
        const start = {};
        toggleTask(start, "deal-1", "task-a", "now");
        expect(start).toEqual({});
    });

    it("preserves existing tasks for the same deal", () => {
        const start = {
            "deal-1": {
                tasks: { "task-a": { done: true, doneAt: "earlier" } }
            }
        };
        const next = toggleTask(start, "deal-1", "task-b", "now");
        expect(next["deal-1"]?.tasks["task-a"]?.done).toBe(true);
        expect(next["deal-1"]?.tasks["task-b"]?.done).toBe(true);
    });
});
