import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAccountOptionsForTests,
    __setAllAnglesForTests,
    __setAllTouchesForTests,
    accountOptions,
    allAngles,
    allTouches,
    appendAngle,
    appendTouch,
    canGenerate,
    patchRack,
    rack,
    resetRack,
    resetSession,
    setAccount,
    setAllAngles,
    setAllTouches,
    setContact,
    setNextQuestion,
    setPersona,
    setTemperature,
    setTouchOutcome,
    setTrigger,
    toggleNoAsk,
    touchesForRack
} from "./state";
import type { Angle, Touch } from "./lib/types";
import { EMPTY_RACK } from "./lib/types";

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
        assetUsed: partial.assetUsed ?? "none",
        content: partial.content ?? "",
        outcome: partial.outcome ?? null,
        outcomeDate: partial.outcomeDate ?? null,
        dealId: partial.dealId ?? null,
        qualityScore: partial.qualityScore ?? 50,
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
        email: partial.email ?? "Hi Sarah,...",
        temperature: partial.temperature ?? "cool",
        channel: partial.channel ?? "email",
        ctaType: partial.ctaType ?? "give_to_get",
        assetUsed: partial.assetUsed ?? "none",
        qualityScore: partial.qualityScore ?? 50,
        motionBand: partial.motionBand ?? "workable",
        nextMove: partial.nextMove ?? "",
        savedAt: partial.savedAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

describe("rack mutations", () => {
    beforeEach(() => resetSession());

    it("starts at EMPTY_RACK", () => {
        expect(rack.value).toEqual(EMPTY_RACK);
    });

    it("patchRack merges partial updates", () => {
        patchRack({ accountName: "Acme", contactName: "Sarah" });
        expect(rack.value.accountName).toBe("Acme");
        expect(rack.value.contactName).toBe("Sarah");
        expect(rack.value.persona).toBe("vp");
    });

    it("setAccount / setContact / setPersona / setTemperature / setTrigger", () => {
        setAccount("Acme");
        setContact("Sarah");
        setPersona("csuite");
        setTemperature("hot");
        setTrigger("vendor");
        expect(rack.value).toMatchObject({
            accountName: "Acme",
            contactName: "Sarah",
            persona: "csuite",
            temperature: "hot",
            trigger: "vendor"
        });
    });

    it("setNextQuestion + toggleNoAsk", () => {
        setNextQuestion("What does success look like?");
        expect(rack.value.nextQuestion).toContain("success");
        expect(rack.value.noAsk).toBe(false);
        toggleNoAsk();
        expect(rack.value.noAsk).toBe(true);
        toggleNoAsk();
        expect(rack.value.noAsk).toBe(false);
    });

    it("resetRack clears all fields", () => {
        setAccount("Acme");
        setContact("Sarah");
        toggleNoAsk();
        resetRack();
        expect(rack.value).toEqual(EMPTY_RACK);
    });
});

describe("canGenerate", () => {
    beforeEach(() => resetSession());

    it("is false until both account + contact are set", () => {
        expect(canGenerate.value).toBe(false);
        setAccount("Acme");
        expect(canGenerate.value).toBe(false);
        setContact("Sarah");
        expect(canGenerate.value).toBe(true);
    });

    it("treats whitespace-only as empty", () => {
        setAccount("   ");
        setContact("   ");
        expect(canGenerate.value).toBe(false);
    });
});

describe("touches + angles", () => {
    beforeEach(() => resetSession());

    it("setAllTouches replaces the list", () => {
        setAllTouches([makeTouch({ id: "a" }), makeTouch({ id: "b" })]);
        expect(allTouches.value).toHaveLength(2);
    });

    it("appendTouch prepends most-recent first", () => {
        appendTouch(makeTouch({ id: "first" }));
        appendTouch(makeTouch({ id: "second" }));
        expect(allTouches.value.map((t) => t.id)).toEqual(["second", "first"]);
    });

    it("setTouchOutcome updates only the matching id + sets outcomeDate", () => {
        __setAllTouchesForTests([
            makeTouch({ id: "a", outcome: null }),
            makeTouch({ id: "b", outcome: null })
        ]);
        setTouchOutcome("a", "replied");
        expect(allTouches.value[0]?.outcome).toBe("replied");
        expect(allTouches.value[0]?.outcomeDate).toBeTruthy();
        expect(allTouches.value[1]?.outcome).toBeNull();
    });

    it("setTouchOutcome with null clears outcomeDate", () => {
        __setAllTouchesForTests([
            makeTouch({ id: "a", outcome: "replied", outcomeDate: "2026-04-27" })
        ]);
        setTouchOutcome("a", null);
        expect(allTouches.value[0]?.outcome).toBeNull();
        expect(allTouches.value[0]?.outcomeDate).toBeNull();
    });

    it("appendAngle prepends + setAllAngles replaces", () => {
        setAllAngles([makeAngle({ id: "old" })]);
        appendAngle(makeAngle({ id: "new" }));
        expect(allAngles.value.map((a) => a.id)).toEqual(["new", "old"]);
    });
});

describe("touchesForRack computed", () => {
    beforeEach(() => resetSession());

    it("returns empty when no account is set", () => {
        __setAllTouchesForTests([makeTouch({ account: "acme" })]);
        expect(touchesForRack.value).toHaveLength(0);
    });

    it("filters by account (case-insensitive)", () => {
        __setAllTouchesForTests([
            makeTouch({ id: "1", account: "acme" }),
            makeTouch({ id: "2", account: "beta" }),
            makeTouch({ id: "3", account: "acme" })
        ]);
        setAccount("ACME");
        // touches store account lowercase; filter compares lowercase.
        expect(touchesForRack.value.map((t) => t.id)).toEqual(["1", "3"]);
    });
});

describe("accountOptions", () => {
    it("seeds + clears", () => {
        __setAccountOptionsForTests([
            { id: "1", name: "Acme", heat: 80, band: "Active" }
        ]);
        expect(accountOptions.value).toHaveLength(1);
        resetSession();
        expect(accountOptions.value).toHaveLength(0);
    });
});
