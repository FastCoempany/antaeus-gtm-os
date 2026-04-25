import { afterEach, describe, expect, it } from "vitest";
import {
    __setFrameworkRegistryForTests,
    activeFramework,
    activeInterrupt,
    activeNode,
    callClock,
    callDisposition,
    clearInterrupt,
    compressionMode,
    essentialNodeSet,
    expandResponse,
    expandedResponse,
    frameworkRegistry,
    getSegmentKeyForNode,
    inboundQuestionHandlers,
    learnedFacts,
    nextStepLock,
    objectionLibrary,
    recordBranchInteraction,
    recordLearnedFact,
    recordSignal,
    resetSession,
    responseSet,
    selectFramework,
    setActiveNode,
    setCompressionMode,
    setNextStepField,
    signalLedger,
    skipAheadHandlers,
    startCallClock,
    stopCallClock,
    supportDossier,
    triggerInterrupt,
    workedNodeIds,
    type Framework
} from "./state";

/**
 * State-model tests using a minimal Legal-framework fixture matching
 * the legacy runtime shape exactly (see js/discovery-segment-runtime-
 * legal.js).
 */

const FIXTURE: Framework = {
    id: "legal",
    label: "Legal",
    short: "Legal",
    storageKey: "legal",
    segments: [
        {
            key: "opening-frame",
            num: 1,
            title: "Opening frame",
            cue: "Set the call.",
            essential: true,
            nodes: [
                {
                    id: "of-1",
                    essential: true,
                    tone: "blu",
                    badge: "Why now",
                    text: "What changed in the last 90 days?",
                    branches: [
                        {
                            tag: "audit-finding",
                            cls: "grn",
                            quote: "We just had an audit finding...",
                            move: "Walk me through what triggered the audit.",
                            clear: "Compliance event is the trigger.",
                            missing: "Specific scope still unknown."
                        }
                    ]
                },
                {
                    id: "of-2",
                    essential: false,
                    tone: "blu",
                    badge: "Background",
                    text: "Set baseline context.",
                    branches: []
                }
            ]
        },
        {
            key: "current-state-truth",
            num: 2,
            title: "Current state truth",
            cue: "Surface the workflow as it is.",
            essential: true,
            nodes: [
                {
                    id: "cst-1",
                    essential: true,
                    tone: "org",
                    badge: "Tooling",
                    text: "What's stitching the workflow together today?",
                    branches: []
                }
            ]
        }
    ],
    supportDossier: [
        {
            title: "Proof anchors",
            items: ["Harvey vs. in-house", "Privilege story", "Hallucination ceiling"]
        }
    ],
    objectionLibrary: [{ trigger: "Pricing", reply: "Frame around workflow cost." }],
    inboundQuestionHandlers: [
        { question: "Will it integrate with iManage?", bridge: "Depends — what's the pain?" }
    ],
    skipAheadHandlers: [{ trigger: "asks for pricing", reply: "Pricing follows fit." }],
    interrupts: [
        { id: "demo", label: "Demo request", tone: "blu", recover: "..." }
    ]
};

afterEach(() => {
    resetSession();
    __setFrameworkRegistryForTests([]);
});

describe("state — action helpers", () => {
    it("selectFramework sets activeFramework + clears node + expansion", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        activeNode.value = { segmentKey: "opening-frame", nodeId: "of-1" };
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
            segmentKey: "opening-frame",
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
        activeFramework.value = "legal";
        expect(supportDossier.value).toEqual([]);
        expect(objectionLibrary.value).toEqual([]);
    });
});

// ─── Wave 3 — interaction recording + lookups ───────────────────────────

describe("state — Wave 3 interaction recording", () => {
    it("recordSignal appends a tone-tagged ledger entry", () => {
        recordSignal("of-1", 0, "grn");
        expect(signalLedger.value).toHaveLength(1);
        expect(signalLedger.value[0]?.nodeId).toBe("of-1");
        expect(signalLedger.value[0]?.branchIndex).toBe(0);
        expect(signalLedger.value[0]?.tone).toBe("grn");
        expect(signalLedger.value[0]?.recordedAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T/
        );
    });

    it("recordBranchInteraction records both signal and learned fact when branch has clear", () => {
        const branch = {
            tag: "audit",
            cls: "grn" as const,
            quote: "...",
            move: "...",
            clear: "Compliance event is the trigger."
        };
        recordBranchInteraction("of-1", 0, branch);

        expect(signalLedger.value).toHaveLength(1);
        expect(learnedFacts.value).toHaveLength(1);
        expect(learnedFacts.value[0]?.fact).toBe(
            "Compliance event is the trigger."
        );
    });

    it("recordBranchInteraction records signal but NO learned fact when clear is empty", () => {
        const branch = {
            tag: "ambiguous",
            cls: "blu" as const,
            quote: "...",
            move: "..."
        };
        recordBranchInteraction("of-1", 0, branch);

        expect(signalLedger.value).toHaveLength(1);
        expect(learnedFacts.value).toHaveLength(0);
    });

    it("recordBranchInteraction is idempotent — re-clicking same branch doesn't duplicate", () => {
        const branch = {
            tag: "audit",
            cls: "grn" as const,
            quote: "...",
            move: "...",
            clear: "Fact A"
        };
        recordBranchInteraction("of-1", 0, branch);
        recordBranchInteraction("of-1", 0, branch);
        recordBranchInteraction("of-1", 0, branch);

        expect(signalLedger.value).toHaveLength(1);
        expect(learnedFacts.value).toHaveLength(1);
    });
});

describe("state — Wave 3 computed workedNodeIds", () => {
    it("returns distinct node IDs from signalLedger", () => {
        recordSignal("of-1", 0, "grn");
        recordSignal("of-1", 1, "org"); // same node, different branch
        recordSignal("cst-1", 0, "blu");

        const ids = workedNodeIds.value;
        expect(ids).toHaveLength(2);
        expect(ids).toContain("of-1");
        expect(ids).toContain("cst-1");
    });

    it("is empty when no signal entries exist", () => {
        expect(workedNodeIds.value).toEqual([]);
    });
});

describe("state — Wave 3 interrupt handling", () => {
    it("triggerInterrupt sets activeInterrupt", () => {
        const it = {
            id: "demo",
            label: "Demo request",
            tone: "blu" as const,
            recover: "Walk through how a demo would land..."
        };
        triggerInterrupt(it);
        expect(activeInterrupt.value).toEqual(it);
    });

    it("clearInterrupt unsets activeInterrupt", () => {
        triggerInterrupt({
            id: "x",
            label: "x",
            tone: "blu",
            recover: "x"
        });
        clearInterrupt();
        expect(activeInterrupt.value).toBeNull();
    });

    it("resetSession clears activeInterrupt", () => {
        triggerInterrupt({
            id: "x",
            label: "x",
            tone: "blu",
            recover: "x"
        });
        resetSession();
        expect(activeInterrupt.value).toBeNull();
    });
});

describe("state — Wave 3 getSegmentKeyForNode lookup", () => {
    it("returns the segment key for a known node", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(getSegmentKeyForNode("of-1")).toBe("opening-frame");
        expect(getSegmentKeyForNode("cst-1")).toBe("current-state-truth");
    });

    it("returns null for an unknown node", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        selectFramework("legal");
        expect(getSegmentKeyForNode("not-a-node")).toBeNull();
    });

    it("returns null when no framework is active", () => {
        __setFrameworkRegistryForTests([FIXTURE]);
        expect(getSegmentKeyForNode("of-1")).toBeNull();
    });

    it("returns null when active framework isn't in registry", () => {
        __setFrameworkRegistryForTests([]);
        activeFramework.value = "legal";
        expect(getSegmentKeyForNode("of-1")).toBeNull();
    });
});
