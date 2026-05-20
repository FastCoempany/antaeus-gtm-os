import { describe, expect, it, beforeEach } from "vitest";
import {
    focusedObject,
    isSessionLoaded,
    session,
    __resetSessionForTests,
    __setSessionForTests
} from "./state";
import type { WorkspaceSessionView } from "./types";

const SAMPLE: WorkspaceSessionView = {
    id: "sess-1",
    workspaceId: "ws-1",
    focusedObjectType: "account",
    focusedObjectId: "acct-meridian",
    focusedObjectName: "Meridian Logistics",
    focusedObjectRoom: "signal-console",
    recentActions: [],
    createdAt: "2026-05-19T00:00:00Z",
    updatedAt: "2026-05-19T00:00:00Z"
};

describe("session state", () => {
    beforeEach(() => {
        __resetSessionForTests();
    });

    it("starts null + not-loaded", () => {
        expect(session.value).toBeNull();
        expect(isSessionLoaded.value).toBe(false);
        expect(focusedObject.value).toBeNull();
    });

    it("__setSessionForTests sets session + flips loaded", () => {
        __setSessionForTests(SAMPLE);
        expect(session.value).toEqual(SAMPLE);
        expect(isSessionLoaded.value).toBe(true);
    });

    it("focusedObject projects from session when fully populated", () => {
        __setSessionForTests(SAMPLE);
        expect(focusedObject.value).toEqual({
            type: "account",
            id: "acct-meridian",
            name: "Meridian Logistics",
            room: "signal-console"
        });
    });

    it("focusedObject is null when any focus field is missing", () => {
        __setSessionForTests({ ...SAMPLE, focusedObjectName: null });
        expect(focusedObject.value).toBeNull();
    });

    it("focusedObject is null when session is null", () => {
        __setSessionForTests(null);
        expect(focusedObject.value).toBeNull();
    });

    it("__resetSessionForTests returns to initial state", () => {
        __setSessionForTests(SAMPLE);
        __resetSessionForTests();
        expect(session.value).toBeNull();
        expect(isSessionLoaded.value).toBe(false);
    });
});
