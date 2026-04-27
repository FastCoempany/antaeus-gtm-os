import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    ANGLES_KEY,
    TOUCHES_KEY,
    loadAngles,
    loadTouches,
    saveAngles,
    saveTouches
} from "./persistence";
import type { Angle, Touch } from "./types";
import { MAX_ANGLE_HISTORY, MAX_TOUCH_HISTORY } from "./types";

function makeTouch(partial: Partial<Touch>): Touch {
    return {
        id: partial.id ?? "t-1",
        account: partial.account ?? "acme",
        accountName: partial.accountName ?? "Acme",
        contactName: partial.contactName ?? "Sarah",
        contactTitle: partial.contactTitle ?? "",
        persona: partial.persona ?? "vp",
        temperature: partial.temperature ?? "cool",
        channel: partial.channel ?? "email",
        trigger: partial.trigger ?? "funding",
        ctaType: partial.ctaType ?? "give_to_get",
        assetUsed: partial.assetUsed ?? "one_pager",
        content: partial.content ?? "Hi Sarah,",
        outcome: partial.outcome ?? null,
        outcomeDate: partial.outcomeDate ?? null,
        dealId: partial.dealId ?? null,
        qualityScore: partial.qualityScore ?? 70,
        motionBand: partial.motionBand ?? "workable",
        createdAt: partial.createdAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

function makeAngle(partial: Partial<Angle>): Angle {
    return {
        id: partial.id ?? "a-1",
        company: partial.company ?? "Acme",
        trigger: partial.trigger ?? "funding",
        persona: partial.persona ?? "vp",
        email: partial.email ?? "Hi Sarah,",
        temperature: partial.temperature ?? "cool",
        channel: partial.channel ?? "email",
        ctaType: partial.ctaType ?? "give_to_get",
        assetUsed: partial.assetUsed ?? "one_pager",
        qualityScore: partial.qualityScore ?? 70,
        motionBand: partial.motionBand ?? "workable",
        nextMove: partial.nextMove ?? "",
        savedAt: partial.savedAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

describe("loadTouches / saveTouches", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadTouches()).toEqual([]);
    });

    it("returns empty array on malformed JSON", () => {
        localStorage.setItem(TOUCHES_KEY, "{not json");
        expect(loadTouches()).toEqual([]);
    });

    it("parses canonical {touches: []} shape", () => {
        const t = makeTouch({ id: "t-1" });
        localStorage.setItem(TOUCHES_KEY, JSON.stringify({ touches: [t] }));
        const out = loadTouches();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("t-1");
    });

    it("filters touches missing id or account", () => {
        localStorage.setItem(
            TOUCHES_KEY,
            JSON.stringify({
                touches: [
                    { id: "ok", account: "acme" },
                    { id: "no-account" },
                    { account: "no-id" },
                    null
                ]
            })
        );
        const out = loadTouches();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });

    it("normalizes invalid persona / temperature / outcome", () => {
        localStorage.setItem(
            TOUCHES_KEY,
            JSON.stringify({
                touches: [
                    {
                        id: "t",
                        account: "acme",
                        persona: "garbage",
                        temperature: "garbage",
                        outcome: "garbage"
                    }
                ]
            })
        );
        const out = loadTouches();
        expect(out[0]?.persona).toBe("vp");
        expect(out[0]?.temperature).toBe("cool");
        expect(out[0]?.outcome).toBeNull();
    });

    it(`saveTouches caps at MAX_TOUCH_HISTORY (${MAX_TOUCH_HISTORY})`, () => {
        const many = Array.from({ length: 250 }, (_, i) =>
            makeTouch({ id: `t-${i}` })
        );
        saveTouches(many);
        const parsed = JSON.parse(localStorage.getItem(TOUCHES_KEY) ?? "{}");
        expect(parsed.touches).toHaveLength(MAX_TOUCH_HISTORY);
    });

    it("does not throw on hostile storage", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => saveTouches([makeTouch({})])).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });

    it("round-trips: load(save(x))", () => {
        const before = makeTouch({ id: "x", account: "acme" });
        saveTouches([before]);
        const after = loadTouches();
        expect(after).toHaveLength(1);
        expect(after[0]?.id).toBe("x");
    });
});

describe("loadAngles / saveAngles", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadAngles()).toEqual([]);
    });

    it("parses canonical Angle[] array shape", () => {
        const a = makeAngle({ id: "a-1" });
        localStorage.setItem(ANGLES_KEY, JSON.stringify([a]));
        const out = loadAngles();
        expect(out).toHaveLength(1);
        expect(out[0]?.company).toBe("Acme");
    });

    it("filters angles missing id or company", () => {
        localStorage.setItem(
            ANGLES_KEY,
            JSON.stringify([
                { id: "ok", company: "Real" },
                { id: "no-company" },
                { company: "no-id" }
            ])
        );
        const out = loadAngles();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });

    it(`saveAngles caps at MAX_ANGLE_HISTORY (${MAX_ANGLE_HISTORY})`, () => {
        const many = Array.from({ length: 200 }, (_, i) =>
            makeAngle({ id: `a-${i}` })
        );
        saveAngles(many);
        const parsed = JSON.parse(localStorage.getItem(ANGLES_KEY) ?? "[]");
        expect(parsed).toHaveLength(MAX_ANGLE_HISTORY);
    });

    it("round-trips: load(save(x))", () => {
        saveAngles([makeAngle({ id: "x" })]);
        const out = loadAngles();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("x");
    });
});
