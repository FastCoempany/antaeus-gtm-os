import { describe, expect, it, beforeEach } from "vitest";
import type { AccountSummary, CallLogEntry } from "../../lib/types";
import {
    __setAccountOptionsForTests,
    __setCallLogForTests,
    resetSession,
    setSelectedAccount
} from "../../state";
import { callRead, outcomeTone, scoreTone, threadTone, toPulling } from "./adapters";

function account(over: Partial<AccountSummary> = {}): AccountSummary {
    return { id: "a1", name: "Acme Industries", topSignal: "Funding", heat: 80, ...over };
}
function call(over: Partial<CallLogEntry> = {}): CallLogEntry {
    return {
        id: "c1",
        accountName: "Acme Industries",
        contactName: "",
        contactTitle: "",
        threadId: "ask",
        threadTitle: "Ask thread",
        buyerResponse: "",
        recommendedResponse: "",
        outcome: "meeting_booked",
        notes: "",
        source: "cold-call-studio-talk-loom",
        createdAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("tones the threads (pressure red, proof green)", () => {
        expect(threadTone("prep")).toBeUndefined();
        expect(threadTone("opener")).toBe("blue");
        expect(threadTone("pressure")).toBe("red");
        expect(threadTone("proof")).toBe("green");
        expect(threadTone("ask")).toBe("amber");
    });
    it("tones the outcomes", () => {
        expect(outcomeTone("meeting_booked")).toBe("green");
        expect(outcomeTone("callback_scheduled")).toBe("blue");
        expect(outcomeTone("rejected")).toBe("red");
        expect(outcomeTone("voicemail")).toBeUndefined();
    });
});

describe("callRead", () => {
    it("reads low + 'no account' when nothing is selected", () => {
        const r = callRead();
        expect(r.diagnosis.toLowerCase()).toContain("no account");
        expect(scoreTone(r.score)).toBeDefined();
    });
    it("scores up with a hot account in a late thread", () => {
        __setAccountOptionsForTests([account()]);
        setSelectedAccount("Acme Industries"); // moves to opener
        const r = callRead();
        // hasAccount + heat>65 boost
        expect(r.score).toBeGreaterThan(44);
        expect(r.correction.length).toBeGreaterThan(0);
    });
});

describe("toPulling", () => {
    it("is absent until a meeting is booked", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to Deal Workspace once a meeting is on the board", () => {
        __setAccountOptionsForTests([account()]);
        setSelectedAccount("Acme Industries");
        __setCallLogForTests([call()]);
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Work the deal");
        expect(p!.object).toBe("Acme Industries");
        expect(p!.href).toContain("/deal-workspace/");
    });
});
