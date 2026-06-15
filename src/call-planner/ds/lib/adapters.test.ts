import { describe, expect, it, beforeEach } from "vitest";
import {
    __setAccountOptionsForTests,
    __setDealOptionsForTests,
    resetSession,
    setContactName,
    setLinkedDealId
} from "../../state";
import { agendaQuality, agendaStops, bandTone, toPulling } from "./adapters";

beforeEach(() => {
    resetSession();
});

describe("bandTone", () => {
    it("maps the quality bands to semantic tones", () => {
        expect(bandTone("credible")).toBe("green");
        expect(bandTone("workable")).toBe("blue");
        expect(bandTone("thin")).toBe("red");
    });
});

describe("agendaQuality", () => {
    it("is thin with an empty draft", () => {
        const q = agendaQuality();
        expect(q.band).toBe("thin");
        expect(q.gates.length).toBe(5);
    });
    it("climbs as the witness fills in", () => {
        __setAccountOptionsForTests([
            {
                id: "a1",
                name: "Acme Industries",
                heat: 90,
                topSignal: { headline: "New CFO hired", publishedDate: "" }
            }
        ]);
        __setDealOptionsForTests([
            { id: "d1", accountName: "Acme Industries", value: 50000, stage: "proposal" }
        ]);
        setContactName("Acme Industries");
        setLinkedDealId("d1");
        const q = agendaQuality();
        expect(q.score).toBeGreaterThan(agendaQuality().score - 1); // stable
        expect(q.band === "credible" || q.band === "workable").toBe(true);
    });
});

describe("agendaStops", () => {
    it("returns the four stops, the probes tuned to the persona", () => {
        const stops = agendaStops();
        expect(typeof stops.opener).toBe("string");
        expect(typeof stops.reasonNow).toBe("string");
        expect(stops.probes.length).toBe(3);
        expect(stops.advanceAsk.length).toBeGreaterThan(0);
        // probes are unquoted
        for (const p of stops.probes) {
            expect(p.startsWith('"')).toBe(false);
        }
    });
    it("surfaces the live signal as the reason-now when an account matches", () => {
        __setAccountOptionsForTests([
            {
                id: "a1",
                name: "Acme Industries",
                heat: 90,
                topSignal: { headline: "New CFO hired", publishedDate: "" }
            }
        ]);
        setContactName("Acme Industries");
        expect(agendaStops().reasonNow).toBe("New CFO hired");
    });
});

describe("toPulling", () => {
    it("is absent until a contact is named", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to Discovery Studio once a contact is named", () => {
        setContactName("Sarah Chen");
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Run discovery");
        expect(p!.object).toBe("Sarah Chen");
        expect(p!.href).toContain("/discovery-studio/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
