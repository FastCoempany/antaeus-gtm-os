import { afterEach, describe, expect, it } from "vitest";
import {
    __setFrameworkRegistryForTests,
    activeFramework,
    activeNode,
    callClock,
    callDisposition,
    compressionMode,
    essentialNodeSet,
    expandResponse,
    expandedResponse,
    frameworkRegistry,
    inboundQuestionHandlers,
    learnedFacts,
    nextStepLock,
    objectionLibrary,
    recordLearnedFact,
    resetSession,
    responseSet,
    selectFramework,
    setActiveNode,
    setCompressionMode,
    setNextStepField,
    skipAheadHandlers,
    startCallClock,
    stopCallClock,
    supportDossier,
    type Framework,
    type SegmentId
} from "./state";

/**
 * Phase 3 Wave 1 state-model tests.
 *
 * Cover the action helpers + computed signal correctness against a
 * minimal framework fixture. Wave 2 adds tests for the per-noun rail
 * components.
 */

const FIXTURE: Framework = {
    id: "legal",
    label: "Legal",
    category: "legal",
    segments: [
        {
            id: "opening-frame" as SegmentId,
            label: "Opening frame",
            nodes: [
                {
                    id: "of-1",
                    label: "Why now",
                    essential: true,
                    branches: [
                        {
                            id: "of-1-b1",
                            tone: "grn",
                            label: "Buyer cites a recent compliance event",
                            quote: "We just had an audit finding...",
                            sayNext: "Walk me through what triggered the audit.",
                            facts: [],
                            recover: [],
                            leave: []
                        }
                    ]
                },
                {
                    id: "of-2",
                    label: "Background",
                    essential: false,
                    branches: []
                }
            ]
        },
        {
            id: "current-state-truth" as SegmentId,
            label: "Current state truth",
            nodes: [
                {
                    id: "cst-1",
                    label: "Existing tooling",
                    essential: true,
                    branches: []
                }
            ]
        }
    ],
    supportDossier: [
        {
            title: "Proof anchors",
            items: [{ heading: "Harvey vs. in-house", body: "..." }]
        }
    ],
    objectionLibrary: [{ trigger: "Pricing", reply: "..." }],
    inboundQuestionHandlers: [
        { question: "Will it integrate with iManage?", bridge: "..." }
    ],
    skipAheadHandlers: [{ trigger: "...", reply: "..." }],
    interrupts: [
        {
            id: "demo",
            label: "Demo request",
            tone: "blu",
            recover: "..."
        }
    ]
};

afterEach(() => {
    resetSession();
    __setFrameworkRegistryForTests([]);
});

describe("state — action helpers", () => {
    it("selectFramework sets activeFramework + clears node + expansion", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        activeNode.value = { segmentId: "opening-frame", nodeId: "of-1" };
        expandedResponse.value = 0;

        selectFramework("legal");

        expect(activeFramework.value).toBe("legal");
        expect(activeNode.value).toBeNull();
        expect(expandedResponse.value).toBeNull();
    });

    it("setActiveNode sets the node + clears expansion", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expandedResponse.value = 2;

        setActiveNode("opening-frame", "of-1");

        expect(activeNode.value).toEqual({
            segmentId: "opening-frame",
            nodeId: "of-1"
        });
        expect(expandedResponse.value).toBeNull();
    });

    it("expandResponse sets the index", () => {
        expandResponse(3);
        expect(expandedResponse.value).toBe(3);
    });

    it("recordLearnedFact appends with timestamp", () => {
        recordLearnedFact("of-1", 0, "buyer mentioned an audit finding");
        const facts = learnedFacts.value;
        expect(facts).toHaveLength(1);
        expect(facts[0]?.fact).toBe("buyer mentioned an audit finding");
        expect(facts[0]?.recordedAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
    });

    it("setNextStepField updates the named field only", () => {
        setNextStepField("date", "2026-05-01");
        setNextStepField("owner", "Jane CFO");
        expect(nextStepLock.value.date).toBe("2026-05-01");
        expect(nextStepLock.value.owner).toBe("Jane CFO");
        expect(nextStepLock.value.purpose).toBe("");
    });

    it("setCompressionMode flips the mode", () => {
        setCompressionMode("essentials");
        expect(compressionMode.value).toBe("essentials");
    });

    it("call clock start/stop", () => {
        startCallClock();
        expect(callClock.value).not.toBeNull();
        stopCallClock();
        expect(callClock.value).toBeNull();
    });

    it("resetSession clears per-session state but preserves registry", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        setActiveNode("opening-frame", "of-1");
        recordLearnedFact("of-1", 0, "fact");
        callDisposition.value = "advanced";

        resetSession();

        expect(activeFramework.value).toBeNull();
        expect(activeNode.value).toBeNull();
        expect(learnedFacts.value).toHaveLength(0);
        expect(callDisposition.value).toBe("in-progress");
        // registry preserved
        expect(frameworkRegistry.value.some((f) => f.id === "legal")).toBe(
            true
        );
    });
});

describe("state — computed signals", () => {
    it("essentialNodeSet projects only essential nodes", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        const ids = essentialNodeSet.value;
        expect(ids).toContain("of-1");
        expect(ids).toContain("cst-1");
        expect(ids).not.toContain("of-2");
    });

    it("essentialNodeSet is empty when no framework selected", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        expect(essentialNodeSet.value).toEqual([]);
    });

    it("responseSet returns the active node's branches", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        setActiveNode("opening-frame", "of-1");
        const branches = responseSet.value;
        expect(branches).toHaveLength(1);
        expect(branches[0]?.quote).toMatch(/audit/i);
    });

    it("responseSet is empty when no node active", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(responseSet.value).toEqual([]);
    });

    it("supportDossier projects active framework's dossier", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(supportDossier.value).toHaveLength(1);
        expect(supportDossier.value[0]?.title).toBe("Proof anchors");
    });

    it("objectionLibrary projects active framework's objections", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(objectionLibrary.value).toHaveLength(1);
        expect(objectionLibrary.value[0]?.trigger).toBe("Pricing");
    });

    it("inboundQuestionHandlers projects active framework's bridges", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(inboundQuestionHandlers.value).toHaveLength(1);
    });

    it("skipAheadHandlers projects active framework's handlers", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(skipAheadHandlers.value).toHaveLength(1);
    });

    it("computed signals fall back to empty when framework not in registry", () => {
        __setFrameworkRegistryForTests([]);
        // Force an active framework that isn't loaded
        activeFramework.value = "legal";
        expect(supportDossier.value).toEqual([]);
        expect(objectionLibrary.value).toEqual([]);
    });
});

