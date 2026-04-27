import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAdvisorsForTests,
    __setDealOptionsForTests,
    __setDeploymentsForTests,
    activeDeals,
    advisorDraft,
    advisors,
    appendAdvisor,
    dealOptions,
    deployments,
    desk,
    patchAdvisorDraft,
    patchDesk,
    prependDeployment,
    recentDeployments,
    removeAdvisor,
    resetAdvisorDraft,
    resetDesk,
    resetSession,
    selectedAdvisor,
    selectedDeal,
    setAdvisorId,
    setAdvisors,
    setCustomAsk,
    setDealId,
    setDealOptions,
    setDeployments,
    setMomentId
} from "./state";
import {
    EMPTY_ADVISOR_DRAFT,
    EMPTY_DESK_STATE,
    type Advisor,
    type AdvisorDeal,
    type Deployment
} from "./lib/types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "adv-1",
        name: p.name ?? "Sarah Chen",
        title: p.title ?? "Operator",
        tier: p.tier ?? "t2",
        expertise: p.expertise ?? "",
        equity: p.equity ?? "",
        companies: p.companies ?? [],
        notes: p.notes ?? "",
        relationship: p.relationship ?? "active",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

function makeDeal(p: Partial<AdvisorDeal>): AdvisorDeal {
    return {
        id: p.id ?? "deal-1",
        accountName: p.accountName ?? "Meridian Logistics",
        stage: p.stage ?? "discovery",
        value: p.value ?? 50000,
        nextStep: p.nextStep ?? "",
        nextStepDate: p.nextStepDate ?? null,
        champion: p.champion ?? "",
        economicBuyer: p.economicBuyer ?? "",
        primaryContact: p.primaryContact ?? "",
        buyer: p.buyer ?? "",
        decisionProcess: p.decisionProcess ?? "",
        advisorHistory: p.advisorHistory ?? []
    };
}

function makeDeployment(p: Partial<Deployment>): Deployment {
    return {
        id: p.id ?? "dep-1",
        dealId: p.dealId ?? "deal-1",
        dealName: p.dealName ?? "Meridian Logistics",
        dealStage: p.dealStage ?? "discovery",
        advisorId: p.advisorId ?? "adv-1",
        advisorName: p.advisorName ?? "Sarah Chen",
        momentId: p.momentId ?? "intro",
        momentName: p.momentName ?? "Warm introduction",
        ask: p.ask ?? "",
        forwardableNote: p.forwardableNote ?? "",
        outcome: p.outcome ?? "pending",
        notes: p.notes ?? "",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z",
        outcomeDate: p.outcomeDate ?? null
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts empty", () => {
        expect(advisors.value).toHaveLength(0);
        expect(deployments.value).toHaveLength(0);
        expect(dealOptions.value).toHaveLength(0);
        expect(desk.value).toEqual(EMPTY_DESK_STATE);
        expect(advisorDraft.value).toEqual(EMPTY_ADVISOR_DRAFT);
    });
});

describe("advisor mutations", () => {
    beforeEach(() => resetSession());

    it("setAdvisors replaces; appendAdvisor grows", () => {
        setAdvisors([makeAdvisor({ id: "a" })]);
        appendAdvisor(makeAdvisor({ id: "b" }));
        expect(advisors.value.map((a) => a.id)).toEqual(["a", "b"]);
    });

    it("removeAdvisor drops by id", () => {
        setAdvisors([makeAdvisor({ id: "a" }), makeAdvisor({ id: "b" })]);
        removeAdvisor("a");
        expect(advisors.value.map((a) => a.id)).toEqual(["b"]);
    });

    it("removing the selected advisor clears desk.advisorId", () => {
        setAdvisors([makeAdvisor({ id: "a" })]);
        setAdvisorId("a");
        expect(desk.value.advisorId).toBe("a");
        removeAdvisor("a");
        expect(desk.value.advisorId).toBe("");
    });

    it("removing a non-selected advisor leaves desk.advisorId alone", () => {
        setAdvisors([makeAdvisor({ id: "a" }), makeAdvisor({ id: "b" })]);
        setAdvisorId("b");
        removeAdvisor("a");
        expect(desk.value.advisorId).toBe("b");
    });
});

describe("deployment mutations", () => {
    beforeEach(() => resetSession());

    it("setDeployments replaces; prependDeployment grows newest-first", () => {
        setDeployments([makeDeployment({ id: "old" })]);
        prependDeployment(makeDeployment({ id: "new" }));
        expect(deployments.value.map((d) => d.id)).toEqual(["new", "old"]);
    });

    it("recentDeployments sorts by createdAt desc", () => {
        __setDeploymentsForTests([
            makeDeployment({
                id: "old",
                createdAt: "2026-04-01T00:00:00Z"
            }),
            makeDeployment({
                id: "newest",
                createdAt: "2026-04-27T00:00:00Z"
            }),
            makeDeployment({
                id: "mid",
                createdAt: "2026-04-15T00:00:00Z"
            })
        ]);
        expect(recentDeployments.value.map((d) => d.id)).toEqual([
            "newest",
            "mid",
            "old"
        ]);
    });
});

describe("deal options + activeDeals", () => {
    beforeEach(() => resetSession());

    it("setDealOptions replaces the list", () => {
        setDealOptions([makeDeal({ id: "a" })]);
        expect(dealOptions.value).toHaveLength(1);
    });

    it("activeDeals filters out closed-won + closed-lost", () => {
        __setDealOptionsForTests([
            makeDeal({ id: "live", stage: "discovery" }),
            makeDeal({ id: "won", stage: "closed-won" }),
            makeDeal({ id: "lost", stage: "closed-lost" }),
            makeDeal({ id: "negotiation", stage: "negotiation" })
        ]);
        expect(activeDeals.value.map((d) => d.id)).toEqual([
            "live",
            "negotiation"
        ]);
    });
});

describe("desk routing", () => {
    beforeEach(() => resetSession());

    it("setDealId / setAdvisorId / setMomentId / setCustomAsk patch the desk", () => {
        setDealId("deal-1");
        setAdvisorId("adv-1");
        setMomentId("eb_bridge");
        setCustomAsk("hello");
        expect(desk.value).toEqual({
            dealId: "deal-1",
            advisorId: "adv-1",
            momentId: "eb_bridge",
            customAsk: "hello"
        });
    });

    it("resetDesk restores EMPTY_DESK_STATE", () => {
        patchDesk({ dealId: "x", momentId: "renewal" });
        resetDesk();
        expect(desk.value).toEqual(EMPTY_DESK_STATE);
    });

    it("selectedDeal computed resolves the id", () => {
        __setDealOptionsForTests([makeDeal({ id: "deal-1" })]);
        setDealId("deal-1");
        expect(selectedDeal.value?.id).toBe("deal-1");
    });

    it("selectedDeal is null when no deal id is set", () => {
        __setDealOptionsForTests([makeDeal({ id: "deal-1" })]);
        expect(selectedDeal.value).toBeNull();
    });

    it("selectedAdvisor computed resolves the id", () => {
        __setAdvisorsForTests([makeAdvisor({ id: "adv-1" })]);
        setAdvisorId("adv-1");
        expect(selectedAdvisor.value?.id).toBe("adv-1");
    });
});

describe("advisor draft", () => {
    beforeEach(() => resetSession());

    it("patchAdvisorDraft merges partial fields", () => {
        patchAdvisorDraft({ name: "Sarah", tier: "t1" });
        expect(advisorDraft.value).toMatchObject({
            name: "Sarah",
            tier: "t1",
            title: ""
        });
    });

    it("resetAdvisorDraft restores EMPTY_ADVISOR_DRAFT", () => {
        patchAdvisorDraft({ name: "Sarah" });
        resetAdvisorDraft();
        expect(advisorDraft.value).toEqual(EMPTY_ADVISOR_DRAFT);
    });
});
