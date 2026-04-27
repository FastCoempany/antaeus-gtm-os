import { describe, expect, it } from "vitest";
import { buildAgendaBrief, type BriefInputs } from "./brief";
import {
    EMPTY_DRAFT,
    type Draft,
    type LinkedDeal,
    type MatchedAccount
} from "./types";

function makeDraft(p: Partial<Draft> = {}): Draft {
    return { ...EMPTY_DRAFT, ...p };
}

function makeAccount(p: Partial<MatchedAccount> = {}): MatchedAccount {
    return {
        id: p.id ?? "acct-1",
        name: p.name ?? "Acme Robotics",
        heat: p.heat ?? 60,
        topSignal:
            "topSignal" in p
                ? (p.topSignal ?? null)
                : { headline: "Series B announced", publishedDate: "2026-04-25" }
    };
}

function makeDeal(p: Partial<LinkedDeal> = {}): LinkedDeal {
    return {
        id: p.id ?? "deal-1",
        accountName: p.accountName ?? "Acme Robotics",
        value: p.value ?? 50000,
        stage: p.stage ?? "prospect"
    };
}

function inputs(p: Partial<BriefInputs> = {}): BriefInputs {
    return {
        draft: p.draft ?? makeDraft(),
        matchedAccount:
            "matchedAccount" in p ? (p.matchedAccount ?? null) : null,
        linkedDeal: "linkedDeal" in p ? (p.linkedDeal ?? null) : null
    };
}

describe("buildAgendaBrief — header lines", () => {
    it("starts with 'Call Planner Brief'", () => {
        expect(buildAgendaBrief(inputs())).toMatch(/^Call Planner Brief\n/);
    });

    it("renders 'No person selected' when contact is empty", () => {
        expect(buildAgendaBrief(inputs())).toContain(
            "Contact: No person selected"
        );
    });

    it("renders the persona's full label", () => {
        expect(
            buildAgendaBrief(inputs({ draft: makeDraft({ persona: "vp" }) }))
        ).toContain("Persona: VP / Director");
    });

    it("renders matched account name as Company when present", () => {
        const out = buildAgendaBrief(
            inputs({ matchedAccount: makeAccount({ name: "Acme Robotics" }) })
        );
        expect(out).toContain("Company: Acme Robotics");
    });

    it("falls back to linked deal accountName as Company", () => {
        const out = buildAgendaBrief(
            inputs({ linkedDeal: makeDeal({ accountName: "Beta Logistics" }) })
        );
        expect(out).toContain("Company: Beta Logistics");
    });

    it("renders 'No account context yet' when neither", () => {
        expect(buildAgendaBrief(inputs())).toContain(
            "Company: No account context yet"
        );
    });

    it("renders 'Linked deal: none' when no deal is linked", () => {
        expect(buildAgendaBrief(inputs())).toContain("Linked deal: none");
    });

    it("renders the linked deal accountName when present", () => {
        const out = buildAgendaBrief(
            inputs({ linkedDeal: makeDeal({ accountName: "Acme Co" }) })
        );
        expect(out).toContain("Linked deal: Acme Co");
    });
});

describe("buildAgendaBrief — opener", () => {
    it("uses signal-driven opener when top signal exists", () => {
        const out = buildAgendaBrief(
            inputs({ matchedAccount: makeAccount() })
        );
        expect(out).toContain("I noticed series b announced");
    });

    it("falls back to generic opener when no top signal", () => {
        const out = buildAgendaBrief(inputs());
        expect(out).toContain(
            "Thanks for making time. I wanted to start with how your team"
        );
    });
});

describe("buildAgendaBrief — reason now", () => {
    it("uses top signal headline as reason-now when present", () => {
        const out = buildAgendaBrief(
            inputs({ matchedAccount: makeAccount() })
        );
        expect(out).toContain("Reason now:\nSeries B announced");
    });

    it("falls back to custom notes when no signal", () => {
        const out = buildAgendaBrief(
            inputs({
                draft: makeDraft({
                    customNotes: "They keep slipping on RevOps reporting."
                })
            })
        );
        expect(out).toContain(
            "Reason now:\nThey keep slipping on RevOps reporting."
        );
    });

    it("renders 'No durable why-now angle yet.' when both are absent", () => {
        const out = buildAgendaBrief(inputs());
        expect(out).toContain("Reason now:\nNo durable why-now angle yet.");
    });
});

describe("buildAgendaBrief — probe questions", () => {
    it("renders 3 probe questions for the persona, numbered 1-3", () => {
        const out = buildAgendaBrief(
            inputs({ draft: makeDraft({ persona: "ops" }) })
        );
        expect(out).toContain("1. What does a typical day look like for your team?");
        expect(out).toContain("2. How much manual work is involved in [process]?");
        expect(out).toContain("3. What have you tried before to fix this?");
    });

    it("strips literal wrapping double quotes from each question", () => {
        const out = buildAgendaBrief(inputs());
        // The cxo bank's first question is: "From where you sit, what's the biggest..."
        // After numbering + unquote, it should not start with a literal quote.
        const lines = out.split("\n");
        const probe1 = lines.find((l) => l.startsWith("1. "));
        expect(probe1).toBeDefined();
        expect(probe1?.startsWith('1. "')).toBe(false);
    });
});

describe("buildAgendaBrief — advance ask", () => {
    it("renders the 'Advance ask:' header followed by ask + note", () => {
        const out = buildAgendaBrief(
            inputs({
                draft: makeDraft({ contactName: "Sarah" }),
                matchedAccount: makeAccount(),
                linkedDeal: makeDeal({ accountName: "Acme Robotics" })
            })
        );
        expect(out).toContain("Advance ask:");
        expect(out).toContain("Acme Robotics");
        // hasSignal=true → live-pressure note line
        expect(out).toContain("live pressure");
    });
});
