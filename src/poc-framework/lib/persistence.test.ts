import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    STORAGE_KEY,
    freezeDraftIntoProof,
    loadProofs,
    saveProofs
} from "./persistence";
import type { Proof, ProofDraft } from "./types";
import { EMPTY_DRAFT, MAX_PROOF_HISTORY } from "./types";

const NOW = new Date("2026-04-27T00:00:00Z").getTime();

function draft(partial: Partial<ProofDraft> = {}): ProofDraft {
    return { ...EMPTY_DRAFT, ...partial } as ProofDraft;
}

function makeProof(partial: Partial<Proof> = {}): Proof {
    return {
        id: partial.id ?? "p-1",
        account: partial.account ?? "Acme",
        vendor: partial.vendor ?? "VendorCo",
        readoutOwner: partial.readoutOwner ?? "Sarah",
        linkedDealId: partial.linkedDealId ?? "",
        linkedDealName: partial.linkedDealName ?? "",
        durationDays: partial.durationDays ?? 7,
        outcome: partial.outcome ?? "not_started",
        successCriteria: partial.successCriteria ?? "",
        boundaries: partial.boundaries ?? "",
        qualityScore: partial.qualityScore ?? 50,
        qualityBand: partial.qualityBand ?? "workable",
        docs: partial.docs ?? { scope: "", kickoff: "", readout: "", email: "" },
        updatedAt: partial.updatedAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

describe("loadProofs", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadProofs()).toEqual([]);
    });

    it("returns empty array on malformed JSON", () => {
        localStorage.setItem(STORAGE_KEY, "{not json");
        expect(loadProofs()).toEqual([]);
    });

    it("returns empty array when shape is wrong", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify("string"));
        expect(loadProofs()).toEqual([]);
    });

    it("parses canonical { pocs: [] } shape", () => {
        const proof = makeProof({ id: "p-1", account: "Acme" });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ pocs: [proof] }));
        const out = loadProofs();
        expect(out).toHaveLength(1);
        expect(out[0]?.account).toBe("Acme");
    });

    it("filters out proofs missing required fields", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                pocs: [
                    { id: "ok", account: "Real" },
                    { id: "no-account" },
                    { account: "no-id" },
                    null,
                    "string"
                ]
            })
        );
        const out = loadProofs();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });

    it("normalizes invalid duration / band / outcome", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                pocs: [
                    {
                        id: "p",
                        account: "Acme",
                        durationDays: 99,
                        qualityBand: "garbage",
                        outcome: "garbage"
                    }
                ]
            })
        );
        const out = loadProofs();
        expect(out[0]?.durationDays).toBe(7);
        expect(out[0]?.qualityBand).toBe("thin");
        expect(out[0]?.outcome).toBe("not_started");
    });
});

describe("saveProofs", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("writes canonical shape under the key", () => {
        saveProofs([makeProof({ id: "a" }), makeProof({ id: "b" })]);
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw ?? "{}");
        expect(parsed.pocs).toHaveLength(2);
    });

    it(`caps stored history at MAX_PROOF_HISTORY (${MAX_PROOF_HISTORY})`, () => {
        const many = Array.from({ length: 30 }, (_, i) =>
            makeProof({ id: `p-${i}` })
        );
        saveProofs(many);
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
        expect(parsed.pocs).toHaveLength(MAX_PROOF_HISTORY);
    });

    it("does not throw on hostile storage", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => saveProofs([makeProof({})])).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });

    it("round-trips: load(save(x)) preserves the proof shape", () => {
        const before = makeProof({ id: "x", account: "Acme" });
        saveProofs([before]);
        const after = loadProofs();
        expect(after).toHaveLength(1);
        expect(after[0]?.id).toBe("x");
        expect(after[0]?.account).toBe("Acme");
    });
});

describe("freezeDraftIntoProof", () => {
    it("computes quality + docs snapshot from the draft", () => {
        const proof = freezeDraftIntoProof(
            draft({ account: "Acme", vendor: "VendorCo", readoutOwner: "Sarah" }),
            null,
            { now: NOW }
        );
        expect(proof.account).toBe("Acme");
        expect(proof.qualityScore).toBeGreaterThan(0);
        expect(proof.docs.scope).toContain("Acme");
        expect(proof.docs.email).toContain("VendorCo");
    });

    it("uses an existing id when provided (dedupe path)", () => {
        const proof = freezeDraftIntoProof(
            draft({ account: "Acme" }),
            null,
            { now: NOW, id: "existing-id" }
        );
        expect(proof.id).toBe("existing-id");
    });

    it("generates a slug-based id when no override", () => {
        const proof = freezeDraftIntoProof(
            draft({ account: "Acme Industries" }),
            null,
            { now: NOW }
        );
        expect(proof.id).toMatch(/^acme-industries-/);
    });
});
