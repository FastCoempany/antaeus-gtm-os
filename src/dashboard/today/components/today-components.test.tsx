import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import { setDensityState } from "@/lib/density";
import type { CommandObject } from "../../lib/types";
import type { ReadinessSummary } from "@/lib/readiness";

// The observations reader hits the data client (Supabase); mock it so
// WeekReads renders deterministically without a session.
vi.mock("@/lib/observations/reader", () => ({
    listObservations: vi.fn(async () => [
        {
            id: "obs-1",
            observationText: "Acme has gone quiet — no reply in 12 days.",
            sourceGenerator: "deal_decay",
            createdAt: new Date().toISOString(),
            objectType: "deal",
            objectId: "d1"
        }
    ]),
    dismissObservation: vi.fn(async () => undefined)
}));

import { RankedCard } from "./RankedCard";
import { ReadinessPanel } from "./ReadinessPanel";
import { WeekReads } from "./WeekReads";

function obj(over: Partial<CommandObject> = {}): CommandObject {
    return {
        id: "o1",
        title: "Acme Industries",
        objectType: "deal",
        commandFamily: "risk",
        badge: "84",
        badgeTone: "red",
        metricLabel: "risk",
        metricValue: "84",
        meta: [],
        actions: [
            { label: "Open the deal", href: "/deal-workspace/", variant: "primary" },
            { label: "Plan the call", href: "/call-planner/", variant: "secondary" },
            { label: "Cast a proof", href: "/poc-framework/", variant: "secondary" }
        ],
        sheetKey: "",
        focusObject: "Acme Industries",
        focusRoom: "deal-workspace",
        stateKey: "",
        rankingSignals: null,
        score: 84,
        baseScore: 80,
        stabilityBonus: 0,
        rankingConfidence: 70,
        rankingConfidenceLabel: "lead",
        roomFamilyLabel: "DEAL · RECOVERY",
        scoreReasons: ["Champion quiet for twelve days"],
        truthDebtCount: 0,
        nextStepOverdue: false,
        copy: "Champion quiet for twelve days.",
        ...over
    } as CommandObject;
}

const summary: ReadinessSummary = {
    verdict: "building",
    verdictLabel: "Building",
    totalScore: 42,
    dimensions: [
        { id: "icp", label: "ICP & targeting", score: 12, evidence: ["One sharp ICP"], gaps: ["No buying group"] },
        { id: "motion", label: "Motion", score: 6, evidence: [], gaps: ["Few logged touches"] }
    ] as ReadinessSummary["dimensions"],
    gateBlockers: ["Tighten ICP & targeting — it's the weakest dimension."],
    nextVerdict: "inheritable_with_guardrails"
};

beforeEach(() => {
    cleanup();
    setDensityState("show_me_how");
});

describe("RankedCard", () => {
    it("renders a risk object as a RiskCard with its glyph + score", () => {
        const { container } = render(<RankedCard object={obj()} />);
        expect(container.querySelector(".ds-riskcard__cause")).not.toBeNull();
        expect(container.querySelector(".ds-riskcard__score")?.textContent).toBe("84");
        // The sacred-noun glyph rides in the kicker row.
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
    });

    it("renders a non-risk object as a toned Card carrying its glyph", () => {
        const { container, getByText } = render(
            <RankedCard object={obj({ commandFamily: "move", title: "Send to Sarah" })} />
        );
        expect(getByText("Send to Sarah")).not.toBeNull();
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
    });

    it("reveals every action in Show me how, slices to two in Step back", () => {
        setDensityState("show_me_how");
        const all = render(<RankedCard object={obj()} />);
        expect(all.container.querySelectorAll(".ds-card__foot a.ds-btn").length).toBe(3);
        cleanup();

        setDensityState("step_back");
        const stepped = render(<RankedCard object={obj()} />);
        expect(stepped.container.querySelectorAll(".ds-card__foot a.ds-btn").length).toBe(2);
    });
});

describe("ReadinessPanel", () => {
    it("renders the verdict + a Meter per dimension when open", () => {
        const { getByText, container } = render(
            <ReadinessPanel open summary={summary} onClose={() => {}} />
        );
        expect(getByText("Building")).not.toBeNull();
        // One Meter per dimension (the library data-viz primitive).
        expect(container.querySelectorAll(".ds-meter").length).toBe(2);
        // The gate blocker (what would move it next) renders.
        expect(
            getByText("Tighten ICP & targeting — it's the weakest dimension.")
        ).not.toBeNull();
    });

    it("renders nothing when closed", () => {
        const { container } = render(
            <ReadinessPanel open={false} summary={summary} onClose={() => {}} />
        );
        expect(container.querySelector(".ds-drawer")).toBeNull();
    });
});

describe("WeekReads", () => {
    it("renders observations from the ledger inside a library Card", async () => {
        const { findByText, container } = render(<WeekReads />);
        expect(await findByText("Acme has gone quiet — no reply in 12 days.")).not.toBeNull();
        // Composed from the library Card (not the legacy db-week-reads shell).
        expect(container.querySelector(".ds-card")).not.toBeNull();
        expect(container.querySelector(".db-week-reads")).toBeNull();
        // Dismiss is a library IconButton.
        expect(container.querySelector(".ds-iconbtn")).not.toBeNull();
    });
});
