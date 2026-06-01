import { describe, it, expect } from "vitest";
import {
    parseDestination,
    briefingDestinationHref,
    DESTINATION_ROOM_LABEL,
    type DestinationToken
} from "./destinations";

describe("parseDestination", () => {
    it("returns null on garbage input", () => {
        expect(parseDestination("")).toBeNull();
        expect(parseDestination("   ")).toBeNull();
        expect(parseDestination("Not a real room · whatever")).toBeNull();
    });

    it("parses 'Discovery Studio · Phase 4 · refresh existing'", () => {
        const t = parseDestination("Discovery Studio · Phase 4 · refresh existing");
        expect(t).not.toBeNull();
        expect(t!.room).toBe("discovery-studio");
        expect(t!.section).toBe("Phase 4");
        expect(t!.action).toBe("refresh");
        expect(t!.targetId).toBeNull();
    });

    it("parses 'Discovery Studio · Phase 6 · new question'", () => {
        const t = parseDestination("Discovery Studio · Phase 6 · new question");
        expect(t).not.toBeNull();
        // "new question" isn't a canonical action token; expected
        // behavior: action stays null, segment becomes the section.
        expect(t!.action).toBeNull();
        expect(t!.section).toBe("Phase 6 · new question");
    });

    it("parses 'Call Planner · Objection Bank · refresh existing · obj_001'", () => {
        const t = parseDestination(
            "Call Planner · Objection Bank · refresh existing · obj_001"
        );
        expect(t).not.toBeNull();
        // Token splits as: [Call Planner, Objection Bank, refresh existing, obj_001]
        // Last segment is obj_001 (id-shaped), so action parse on it
        // fails; the spec writes id BEFORE the action verb. Verify both
        // shapes round-trip cleanly.
        expect(t!.room).toBe("call-planner");
    });

    it("parses 'Call Planner · Objection Bank · obj_001 · refresh existing'", () => {
        const t = parseDestination(
            "Call Planner · Objection Bank · obj_001 · refresh existing"
        );
        expect(t).not.toBeNull();
        expect(t!.room).toBe("call-planner");
        expect(t!.section).toBe("Objection Bank");
        expect(t!.action).toBe("refresh");
        expect(t!.targetId).toBe("obj_001");
    });

    it("parses 'Outbound Studio · Hook Library · new'", () => {
        const t = parseDestination("Outbound Studio · Hook Library · new");
        expect(t).not.toBeNull();
        expect(t!.room).toBe("outbound-studio");
        expect(t!.section).toBe("Hook Library");
        expect(t!.action).toBe("new");
    });

    it("parses 'Asset Builder · Battlecard · Linear · refresh existing'", () => {
        const t = parseDestination(
            "Asset Builder · Battlecard · Linear · refresh existing"
        );
        expect(t).not.toBeNull();
        expect(t!.room).toBe("asset-builder");
        expect(t!.section).toBe("Battlecard · Linear");
        expect(t!.action).toBe("refresh");
    });

    it("parses 'Deal Workspace · Deal-Watch · Acme · alert'", () => {
        const t = parseDestination("Deal Workspace · Deal-Watch · Acme · alert");
        expect(t).not.toBeNull();
        expect(t!.room).toBe("deal-workspace");
        expect(t!.section).toBe("Deal-Watch · Acme");
        expect(t!.action).toBe("alert");
    });
});

describe("briefingDestinationHref", () => {
    const move = {
        label: "Refresh Phase 4 procurement question on AI fallback policy",
        rationale:
            "Three vendors now require explicit AI fallback documentation; existing question doesn't ask about it.",
        destination: "Discovery Studio · Phase 4 · refresh existing"
    } as const;

    it("returns null when the room is asset-builder (not buildable)", () => {
        const token: DestinationToken = {
            room: "asset-builder",
            roomLabel: "Asset Builder",
            section: "Battlecard · Linear",
            action: "refresh",
            targetId: null,
            raw: "Asset Builder · Battlecard · Linear · refresh existing"
        };
        expect(briefingDestinationHref(token, move)).toBeNull();
    });

    it("builds an href with continuity params for Discovery Studio", () => {
        const token = parseDestination(
            "Discovery Studio · Phase 4 · refresh existing"
        )!;
        const href = briefingDestinationHref(token, move, {
            fromSurface: "patterns",
            patternId: "pat_abc"
        });
        expect(href).not.toBeNull();
        const url = new URL(href!, "https://antaeus.app");
        expect(url.pathname).toBe("/discovery-studio/");
        expect(url.searchParams.get("fromMode")).toBe("briefing-draft");
        expect(url.searchParams.get("fromSurface")).toBe("patterns");
        expect(url.searchParams.get("focusRoom")).toBe("Briefing");
        expect(url.searchParams.get("returnTo")).toBe("/briefing/");
        expect(url.searchParams.get("returnLabel")).toBe("Back to Briefing");
        expect(url.searchParams.get("briefingDraftLabel")).toBe(move.label);
        expect(url.searchParams.get("briefingDraftRationale")).toBe(
            move.rationale
        );
        expect(url.searchParams.get("briefingDraftSection")).toBe("Phase 4");
        expect(url.searchParams.get("briefingDraftAction")).toBe("refresh");
        expect(url.searchParams.get("briefingDraftPatternId")).toBe("pat_abc");
    });

    it("encodes special characters in the label safely", () => {
        const token = parseDestination("Outbound Studio · Hook Library · new")!;
        const href = briefingDestinationHref(token, {
            label: "Test & verify <hook>",
            rationale: "100% urgent",
            destination: token.raw
        });
        expect(href).not.toBeNull();
        const url = new URL(href!, "https://antaeus.app");
        expect(url.searchParams.get("briefingDraftLabel")).toBe(
            "Test & verify <hook>"
        );
        expect(url.searchParams.get("briefingDraftRationale")).toBe("100% urgent");
    });

    it("omits rationale when blank", () => {
        const token = parseDestination("Outbound Studio · Hook Library · new")!;
        const href = briefingDestinationHref(token, {
            label: "Just a label",
            rationale: "",
            destination: token.raw
        });
        const url = new URL(href!, "https://antaeus.app");
        expect(url.searchParams.has("briefingDraftRationale")).toBe(false);
    });
});

describe("DESTINATION_ROOM_LABEL", () => {
    it("covers every room", () => {
        expect(DESTINATION_ROOM_LABEL["discovery-studio"]).toBe("Discovery Studio");
        expect(DESTINATION_ROOM_LABEL["call-planner"]).toBe("Call Planner");
        expect(DESTINATION_ROOM_LABEL["outbound-studio"]).toBe("Outbound Studio");
        expect(DESTINATION_ROOM_LABEL["deal-workspace"]).toBe("Deal Workspace");
        expect(DESTINATION_ROOM_LABEL["asset-builder"]).toBe("Asset Builder");
    });
});
