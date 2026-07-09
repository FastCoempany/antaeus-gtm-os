import { describe, expect, it } from "vitest";
import {
    MOTION_ROOMS,
    MOTION_STAGES,
    currentRoomId,
    filterMotionRooms,
    groundHref,
    roomIdForUrl
} from "./motion";

describe("the motion map registry", () => {
    it("has all 22 rooms across 6 stages, current names only", () => {
        expect(MOTION_ROOMS).toHaveLength(22);
        expect(MOTION_STAGES).toHaveLength(6);
        const labels = MOTION_ROOMS.map((r) => r.label);
        // renamed/retired sweep: no Call Planner, current names in
        expect(labels).not.toContain("Call Planner");
        expect(labels).toContain("Prospecting Desk");
        expect(labels).toContain("Pilot Desk");
        expect(labels).toContain("Getting to Signed");
        expect(labels).toContain("Call in a Favor");
        // unique ids + hrefs
        expect(new Set(MOTION_ROOMS.map((r) => r.id)).size).toBe(22);
    });

    it("detects the current room from a pathname", () => {
        expect(currentRoomId("/deal-workspace/")).toBe("deal-workspace");
        expect(currentRoomId("/signal-console/")).toBe("signal-console");
        expect(currentRoomId("/nowhere/")).toBeNull();
    });

    it("filters by label, desc, and keywords", () => {
        expect(filterMotionRooms("sign").some((r) => r.id === "getting-to-signed")).toBe(true);
        expect(filterMotionRooms("poc").some((r) => r.id === "pilot-desk")).toBe(true);
        expect(filterMotionRooms("")).toHaveLength(22);
    });

    it("builds jump hrefs with continuity params", () => {
        const room = MOTION_ROOMS.find((r) => r.id === "signal-console")!;
        const href = groundHref(room, "/deal-workspace/", "Deal Workspace");
        expect(href).toContain("/signal-console/?");
        expect(href).toContain("returnTo=%2Fdeal-workspace%2F");
        expect(href).toContain("fromSurface=ground");
    });

    it("maps a targetUrl back to its room for the suggested glow", () => {
        expect(roomIdForUrl("/negotiation/?deal=d1&returnTo=x")).toBe("getting-to-signed");
        expect(roomIdForUrl("/dashboard/")).toBe("dashboard");
    });
});
