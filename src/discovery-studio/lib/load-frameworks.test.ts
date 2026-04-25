import { describe, expect, it } from "vitest";
import { loadFrameworks } from "./load-frameworks";

/**
 * Wave 2 framework-loader tests.
 *
 * Cover projection from the legacy global shape into typed Framework[].
 * The defensive defaults are tested explicitly — malformed legacy data
 * should produce a partial-but-usable registry, not a thrown exception.
 */

function makeMockGlobal(runtime: unknown): unknown {
    return { DISCOVERY_SEGMENT_RUNTIME: runtime };
}

const LEGAL_LEGACY = {
    id: "legal",
    label: "Legal / Legal Ops / Law Workflow",
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
                    note: "Listen for compliance triggers.",
                    branches: [
                        {
                            tag: "audit-finding",
                            cls: "grn",
                            quote: "We just had an audit finding...",
                            move: "Walk me through what triggered it.",
                            actions: [
                                {
                                    label: "Jump to proof",
                                    target: "node:proof-threshold--audit-trail",
                                    tone: "blu"
                                }
                            ],
                            clear: "Compliance event is the trigger.",
                            missing: "Specific scope unknown."
                        }
                    ]
                }
            ]
        }
    ],
    supportDossier: [
        {
            title: "Matter burden",
            items: [
                "Which matter type carries the most pressure",
                { heading: "Audit pressure", body: "..." }
            ]
        }
    ],
    objectionLibrary: [
        { trigger: "AI cannot be trusted", reply: "Understood..." }
    ],
    inboundQuestionHandlers: [
        { question: "How is this different from Harvey?", bridge: "Depends..." }
    ],
    skipAheadHandlers: [
        { trigger: "asks for pricing too early", reply: "Pricing makes sense..." }
    ],
    interrupts: [
        { id: "demo", label: "Demo request", tone: "blu", recover: "..." }
    ]
};

describe("loadFrameworks", () => {
    it("returns empty array when global is missing", () => {
        expect(loadFrameworks({})).toEqual([]);
    });

    it("returns empty array when DISCOVERY_SEGMENT_RUNTIME is missing", () => {
        expect(loadFrameworks({ DISCOVERY_SEGMENT_RUNTIME: undefined })).toEqual(
            []
        );
    });

    it("returns empty array when frameworks key is missing", () => {
        expect(loadFrameworks(makeMockGlobal({ version: "x" }))).toEqual([]);
    });

    it("projects a single legacy framework into typed shape", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        expect(result).toHaveLength(1);
        const fw = result[0]!;
        expect(fw.id).toBe("legal");
        expect(fw.label).toBe("Legal / Legal Ops / Law Workflow");
        expect(fw.short).toBe("Legal");
        expect(fw.segments).toHaveLength(1);
        expect(fw.segments[0]?.key).toBe("opening-frame");
        expect(fw.segments[0]?.num).toBe(1);
        expect(fw.segments[0]?.title).toBe("Opening frame");
        expect(fw.segments[0]?.essential).toBe(true);
    });

    it("projects nodes with all legacy fields preserved", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        const node = result[0]!.segments[0]!.nodes[0]!;
        expect(node.id).toBe("of-1");
        expect(node.essential).toBe(true);
        expect(node.tone).toBe("blu");
        expect(node.badge).toBe("Why now");
        expect(node.text).toBe("What changed in the last 90 days?");
        expect(node.note).toBe("Listen for compliance triggers.");
        expect(node.branches).toHaveLength(1);
    });

    it("projects branches with quote/move/clear/missing/actions", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        const branch = result[0]!.segments[0]!.nodes[0]!.branches[0]!;
        expect(branch.tag).toBe("audit-finding");
        expect(branch.cls).toBe("grn");
        expect(branch.quote).toBe("We just had an audit finding...");
        expect(branch.move).toBe("Walk me through what triggered it.");
        expect(branch.clear).toBe("Compliance event is the trigger.");
        expect(branch.missing).toBe("Specific scope unknown.");
        expect(branch.actions).toHaveLength(1);
        expect(branch.actions?.[0]?.label).toBe("Jump to proof");
        expect(branch.actions?.[0]?.target).toBe(
            "node:proof-threshold--audit-trail"
        );
    });

    it("projects dossier items as either strings or {heading,body}", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        const dossier = result[0]!.supportDossier[0]!;
        expect(dossier.title).toBe("Matter burden");
        expect(dossier.items).toHaveLength(2);
        expect(typeof dossier.items[0]).toBe("string");
        expect(typeof dossier.items[1]).toBe("object");
    });

    it("projects objection / inbound / skip-ahead libraries", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        const fw = result[0]!;
        expect(fw.objectionLibrary).toHaveLength(1);
        expect(fw.inboundQuestionHandlers).toHaveLength(1);
        expect(fw.skipAheadHandlers).toHaveLength(1);
    });

    it("projects interrupts (recover-the-call rail)", () => {
        const result = loadFrameworks(
            makeMockGlobal({ frameworks: { legal: LEGAL_LEGACY } })
        );
        const interrupts = result[0]!.interrupts;
        expect(interrupts).toHaveLength(1);
        expect(interrupts[0]?.id).toBe("demo");
        expect(interrupts[0]?.tone).toBe("blu");
    });

    it("only loads frameworks whose id is in FRAMEWORK_IDS", () => {
        const result = loadFrameworks(
            makeMockGlobal({
                frameworks: {
                    legal: LEGAL_LEGACY,
                    "not-a-real-framework": LEGAL_LEGACY
                }
            })
        );
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("legal");
    });

    it("filters out malformed segments / nodes / branches gracefully", () => {
        const result = loadFrameworks(
            makeMockGlobal({
                frameworks: {
                    legal: {
                        ...LEGAL_LEGACY,
                        segments: [
                            { /* missing key */ num: 99, title: "broken" },
                            LEGAL_LEGACY.segments[0]
                        ]
                    }
                }
            })
        );
        expect(result[0]!.segments).toHaveLength(1);
        expect(result[0]!.segments[0]?.key).toBe("opening-frame");
    });

    it("defaults invalid tone strings to 'blu'", () => {
        const result = loadFrameworks(
            makeMockGlobal({
                frameworks: {
                    legal: {
                        ...LEGAL_LEGACY,
                        segments: [
                            {
                                ...LEGAL_LEGACY.segments[0],
                                nodes: [
                                    {
                                        ...LEGAL_LEGACY.segments[0]!.nodes[0],
                                        tone: "not-a-tone"
                                    }
                                ]
                            }
                        ]
                    }
                }
            })
        );
        const node = result[0]!.segments[0]!.nodes[0]!;
        expect(node.tone).toBe("blu");
    });
});
