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
    logDeployment,
    patchAdvisorDraft,
    patchDesk,
    prependDeployment,
    recentDeployments,
    removeAdvisor,
    resetAdvisorDraft,
    resetDesk,
    resetSession,
    saveAdvisorFromDraft,
    selectedAdvisor,
    selectedDeal,
    setAdvisorId,
    setAdvisors,
    setCustomAsk,
    setDealId,
    setDealOptions,
    setDeployments,
    setMomentId,
    updateDeploymentOutcome
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

describe("saveAdvisorFromDraft", () => {
    beforeEach(() => {
        resetSession();
        if (typeof localStorage !== "undefined") localStorage.clear();
    });

    it("returns null when name is blank", () => {
        patchAdvisorDraft({ name: "   " });
        expect(saveAdvisorFromDraft()).toBeNull();
        expect(advisors.value).toHaveLength(0);
    });

    it("appends new advisor + points desk at it + resets draft", () => {
        patchAdvisorDraft({
            name: "Sarah Chen",
            title: "Operator",
            tier: "t1",
            companies: "Acme, Beta",
            notes: "Strategic"
        });
        const advisor = saveAdvisorFromDraft();
        expect(advisor).not.toBeNull();
        expect(advisors.value).toHaveLength(1);
        expect(advisors.value[0]?.name).toBe("Sarah Chen");
        expect(advisors.value[0]?.tier).toBe("t1");
        expect(advisors.value[0]?.companies).toEqual(["Acme", "Beta"]);
        expect(desk.value.advisorId).toBe(advisor!.id);
        expect(advisorDraft.value).toEqual(EMPTY_ADVISOR_DRAFT);
    });

    it("trims whitespace from companies + filters empty entries", () => {
        patchAdvisorDraft({
            name: "Sarah",
            companies: "  Acme , , Beta  ,"
        });
        const advisor = saveAdvisorFromDraft();
        expect(advisor?.companies).toEqual(["Acme", "Beta"]);
    });
});

describe("logDeployment + updateDeploymentOutcome", () => {
    beforeEach(() => {
        resetSession();
        if (typeof localStorage !== "undefined") localStorage.clear();
    });

    function setupContext(): void {
        __setDealOptionsForTests([
            {
                id: "deal-1",
                accountName: "Meridian Logistics",
                stage: "discovery",
                value: 100000,
                nextStep: "",
                nextStepDate: null,
                champion: "",
                economicBuyer: "Pat Buyer",
                primaryContact: "",
                buyer: "",
                decisionProcess: "",
                advisorHistory: []
            }
        ]);
        __setAdvisorsForTests([
            {
                id: "adv-1",
                name: "Sarah Chen",
                title: "Operator",
                tier: "t2",
                expertise: "",
                equity: "",
                companies: ["Meridian Logistics"],
                notes: "",
                relationship: "active",
                createdAt: "2026-01-01T00:00:00Z"
            }
        ]);
        setDealId("deal-1");
        setAdvisorId("adv-1");
        setMomentId("eb_bridge");
    }

    it("returns null when no deal is selected", () => {
        expect(logDeployment("pending")).toBeNull();
    });

    it("freezes the live ctx into the deployment when both deal + advisor selected", () => {
        setupContext();
        const dep = logDeployment("pending");
        expect(dep).not.toBeNull();
        expect(dep?.dealId).toBe("deal-1");
        expect(dep?.dealName).toBe("Meridian Logistics");
        expect(dep?.advisorId).toBe("adv-1");
        expect(dep?.advisorName).toBe("Sarah Chen");
        expect(dep?.momentId).toBe("eb_bridge");
        expect(dep?.outcome).toBe("pending");
        expect(dep?.ask).toContain("Meridian Logistics");
        expect(deployments.value).toHaveLength(1);
    });

    it("pending outcome leaves outcomeDate null; non-pending sets it", () => {
        setupContext();
        const pending = logDeployment("pending");
        expect(pending?.outcomeDate).toBeNull();
        const hold = logDeployment("hold");
        expect(hold?.outcomeDate).toBeTruthy();
    });

    it("notes vary by outcome", () => {
        setupContext();
        expect(logDeployment("pending")?.notes).toContain("Ask sent");
        expect(logDeployment("hold")?.notes).toContain("Held");
        expect(logDeployment("reroute")?.notes).toContain("Rerouted");
    });

    it("updateDeploymentOutcome flips outcome + stamps outcomeDate", () => {
        setupContext();
        const dep = logDeployment("pending");
        const updated = updateDeploymentOutcome(dep!.id, "successful");
        expect(updated?.outcome).toBe("successful");
        expect(updated?.outcomeDate).toBeTruthy();
    });

    it("updateDeploymentOutcome returns null on missing id", () => {
        expect(updateDeploymentOutcome("ghost", "successful")).toBeNull();
    });
});
