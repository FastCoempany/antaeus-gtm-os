import { describe, it, expect } from "vitest";
import { buildObservationHref } from "./observation-routing";
import type { ObservationView } from "@/lib/observations/types";

function mkObs(over: Partial<ObservationView> = {}): ObservationView {
    return {
        id: "obs_x",
        workspaceId: "ws_x",
        writtenAt: "2026-06-01T12:00:00Z",
        observationText: "test",
        // Use `in` so explicit null in `over` wins over the default.
        relatedObjectType:
            "relatedObjectType" in over ? over.relatedObjectType! : "deal",
        relatedObjectId:
            "relatedObjectId" in over ? over.relatedObjectId! : "deal_acme",
        sourceGenerator: over.sourceGenerator ?? "deal_decay",
        confidence: "high",
        status: "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null
    };
}

describe("buildObservationHref", () => {
    it("returns null when relatedObjectType is null", () => {
        expect(
            buildObservationHref(mkObs({ relatedObjectType: null }))
        ).toBeNull();
    });

    it("returns null when relatedObjectId is null", () => {
        expect(
            buildObservationHref(mkObs({ relatedObjectId: null }))
        ).toBeNull();
    });

    it("routes deals to Deal Workspace", () => {
        const r = buildObservationHref(
            mkObs({ relatedObjectType: "deal", relatedObjectId: "deal_acme" })
        );
        expect(r).not.toBeNull();
        expect(r!.roomLabel).toBe("Deal Workspace");
        const url = new URL(r!.href, "https://antaeus.app");
        expect(url.pathname).toBe("/deal-workspace/");
        expect(url.searchParams.get("focusObject")).toBe("deal_acme");
        expect(url.searchParams.get("fromMode")).toBe("workspace-read");
        expect(url.searchParams.get("fromSurface")).toBe("briefing-workspace");
        expect(url.searchParams.get("focusRoom")).toBe("Briefing");
        expect(url.searchParams.get("returnTo")).toBe("/briefing/");
        expect(url.searchParams.get("returnLabel")).toBe("Back to Briefing");
    });

    it("routes accounts to Signal Console", () => {
        const r = buildObservationHref(
            mkObs({ relatedObjectType: "account", relatedObjectId: "acct_a" })
        );
        expect(r!.roomLabel).toBe("Signal Console");
        const url = new URL(r!.href, "https://antaeus.app");
        expect(url.pathname).toBe("/signal-console/");
    });

    it("routes proofs to PoC Framework", () => {
        const r = buildObservationHref(
            mkObs({ relatedObjectType: "proof", relatedObjectId: "p_001" })
        );
        expect(r!.roomLabel).toBe("PoC Framework");
        const url = new URL(r!.href, "https://antaeus.app");
        expect(url.pathname).toBe("/poc-framework/");
    });

    it("routes calls to Call Planner", () => {
        const r = buildObservationHref(
            mkObs({ relatedObjectType: "call", relatedObjectId: "c_001" })
        );
        expect(r!.roomLabel).toBe("Call Planner");
    });

    it("routes advisors to Advisor Deploy", () => {
        const r = buildObservationHref(
            mkObs({ relatedObjectType: "advisor", relatedObjectId: "adv_a" })
        );
        expect(r!.roomLabel).toBe("Advisor Deploy");
    });

    it("encodes special characters in the object id safely", () => {
        const r = buildObservationHref(
            mkObs({
                relatedObjectType: "account",
                relatedObjectId: "Acme & Co"
            })
        );
        const url = new URL(r!.href, "https://antaeus.app");
        expect(url.searchParams.get("focusObject")).toBe("Acme & Co");
    });
});
