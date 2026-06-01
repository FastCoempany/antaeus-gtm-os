import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkAndAutoNavigate, consumeJustFiredSkillId } from "./auto-navigate";

vi.mock("./schedule-storage", () => ({
    readNextPendingFire: vi.fn(),
    markFireViewed: vi.fn(async () => true)
}));

vi.mock("./registry", () => ({
    findSkillById: vi.fn()
}));

vi.mock("./dispatcher", () => ({
    dispatchSkill: vi.fn(async () => ({ kind: "navigated", url: "/x/" }))
}));

import * as storage from "./schedule-storage";
import * as registry from "./registry";
import * as dispatcher from "./dispatcher";

beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
});

afterEach(() => {
    sessionStorage.clear();
});

describe("checkAndAutoNavigate", () => {
    it("no-op when no pending fire", async () => {
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const r = await checkAndAutoNavigate({ waitForAuthReady: async () => {} });
        expect(r.kind).toBe("no-pending-fire");
    });

    it("marks viewed + skips when skill id no longer exists", async () => {
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: "fire-1",
            skillId: "ghost",
            firedAtIso: "x"
        });
        (registry.findSkillById as ReturnType<typeof vi.fn>).mockReturnValue(null);

        const r = await checkAndAutoNavigate({ waitForAuthReady: async () => {} });
        expect(r.kind).toBe("skill-not-found");
        expect(storage.markFireViewed).toHaveBeenCalledWith("fire-1");
    });

    it("marks viewed but doesn't navigate when already on target path", async () => {
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: "fire-1",
            skillId: "skill-1",
            firedAtIso: "x"
        });
        (registry.findSkillById as ReturnType<typeof vi.fn>).mockReturnValue({
            id: "skill-1",
            label: "Skill 1",
            description: "ok",
            keywords: [],
            body: "",
            action: { kind: "route", target: "/dashboard/" }
        });

        const navigate = vi.fn();
        const r = await checkAndAutoNavigate({
            waitForAuthReady: async () => {},
            currentPath: "/dashboard/",
            navigate
        });
        // Already on the target room: no navigation, but the fire is
        // consumed AND the toast surfaces in-place (never silent).
        expect(r.kind).toBe("toast-in-place");
        if (r.kind === "toast-in-place") expect(r.skillId).toBe("skill-1");
        expect(navigate).not.toHaveBeenCalled();
        expect(storage.markFireViewed).toHaveBeenCalledWith("fire-1");
    });

    it("dispatches the skill + marks viewed + sets session-storage marker", async () => {
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: "fire-1",
            skillId: "skill-x",
            firedAtIso: "x"
        });
        const skill = {
            id: "skill-x",
            label: "X",
            description: "ok",
            keywords: [],
            body: "",
            action: { kind: "route", target: "/outbound-studio/" }
        };
        (registry.findSkillById as ReturnType<typeof vi.fn>).mockReturnValue(skill);

        const navigate = vi.fn();
        const r = await checkAndAutoNavigate({
            waitForAuthReady: async () => {},
            currentPath: "/dashboard/",
            navigate
        });
        expect(r.kind).toBe("navigated");
        expect(dispatcher.dispatchSkill).toHaveBeenCalled();
        expect(sessionStorage.getItem("gtmos_scheduled_skill_just_fired")).toBe(
            "skill-x"
        );
    });

    it("shows toast-in-place (no silent consumption) when dispatch finds no destination", async () => {
        // Regression: whats-at-risk → top-stalled-deals with an empty
        // source returns no-data. The fire must still be consumed AND a
        // toast surfaced — not silently swallowed.
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: "fire-nd",
            skillId: "whats-at-risk",
            firedAtIso: "x"
        });
        (registry.findSkillById as ReturnType<typeof vi.fn>).mockReturnValue({
            id: "whats-at-risk",
            label: "What's at risk this week",
            description: "ok",
            keywords: [],
            body: "",
            action: {
                kind: "filter-and-route",
                target: "/deal-workspace/",
                source: "top-stalled-deals",
                filter: { kind: "passthrough" },
                paramName: "ids"
            }
        });
        (dispatcher.dispatchSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
            kind: "no-data",
            message: "Source returned no data."
        });

        const navigate = vi.fn();
        const r = await checkAndAutoNavigate({
            waitForAuthReady: async () => {},
            currentPath: "/dashboard/",
            navigate
        });
        expect(r.kind).toBe("toast-in-place");
        if (r.kind === "toast-in-place") {
            expect(r.skillId).toBe("whats-at-risk");
        }
        expect(storage.markFireViewed).toHaveBeenCalledWith("fire-nd");
        // The arrival marker must be cleared since we did NOT navigate.
        expect(
            sessionStorage.getItem("gtmos_scheduled_skill_just_fired")
        ).toBeNull();
    });

    it("recovers gracefully when storage layer throws", async () => {
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error("network")
        );
        const r = await checkAndAutoNavigate({ waitForAuthReady: async () => {} });
        expect(r.kind).toBe("error");
        if (r.kind !== "error") return;
        expect(r.error).toBe("network");
    });

    it("awaits the auth-ready gate BEFORE reading pending fires", async () => {
        // Regression for the Phase E auth-race: the RLS-gated read must
        // not run until auth is ready. Assert ordering by recording when
        // each step runs.
        const order: string[] = [];
        (storage.readNextPendingFire as ReturnType<typeof vi.fn>).mockImplementation(
            async () => {
                order.push("read");
                return null;
            }
        );
        await checkAndAutoNavigate({
            waitForAuthReady: async () => {
                await new Promise((r) => setTimeout(r, 10));
                order.push("auth-ready");
            }
        });
        expect(order).toEqual(["auth-ready", "read"]);
    });
});

describe("consumeJustFiredSkillId", () => {
    it("reads and clears the marker", () => {
        sessionStorage.setItem("gtmos_scheduled_skill_just_fired", "skill-y");
        expect(consumeJustFiredSkillId()).toBe("skill-y");
        expect(consumeJustFiredSkillId()).toBeNull();
    });

    it("returns null when no marker is set", () => {
        expect(consumeJustFiredSkillId()).toBeNull();
    });
});
