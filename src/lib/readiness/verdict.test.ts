import { describe, expect, it } from "vitest";
import {
    EMPTY_READINESS_INPUT,
    type ReadinessInput,
    type Verdict
} from "./types";
import { detectTransition, evaluateReadiness } from "./verdict";

function input(over: Partial<ReadinessInput> = {}): ReadinessInput {
    return { ...EMPTY_READINESS_INPUT, ...over };
}

/**
 * Inputs that just clear the "Inheritable with guardrails" gate.
 * Gate requires: every dimension ≥ 10, at least one ≥ 16, first proof
 * exists. The proof dimension hits 10 only with a mix of artifacts —
 * one cast proof alone is far short, so the fixture needs autopsy +
 * handoff + advisor activity too.
 */
function inheritableInput(): ReadinessInput {
    return input({
        icpCount: 1,
        bestIcpQualityScore: 90,
        territoryAccountCount: 30,
        sourcingProspectsReady: 10,
        outboundTouches: 30,
        coldCallsLogged: 15,
        linkedinCues: 12,
        distinctAccountsTouched: 12,
        callPlannerSessions: 8,
        discoveryAdvancedCalls: 4,
        discoveryStudioSessions: 5,
        activeDeals: 6,
        dealsWithNextStep: 5,
        castProofs: 2,
        futureAutopsiesRun: 2,
        advisorDeployments: 1,
        handoffSectionsReady: 3
    });
}

/** Inputs that just clear "Hire-ready" — adds wins + more proof. */
function hireReadyInput(): ReadinessInput {
    return input({
        ...inheritableInput(),
        discoveryAdvancedCalls: 6,
        closedWonDeals: 3,
        closedLostDealsAnalyzed: 1,
        castProofs: 3,
        futureAutopsiesRun: 3,
        advisorDeployments: 2,
        handoffSectionsReady: 4
    });
}

/** Inputs that just clear "Hire-ready, repeatable" — adds advisor + 5/7 sections. */
function repeatableInput(): ReadinessInput {
    return input({
        ...hireReadyInput(),
        closedLostDealsAnalyzed: 3,
        advisorDeployments: 3,
        handoffSectionsReady: 5
    });
}

describe("evaluateReadiness — gate-based verdicts", () => {
    it("returns 'you_are_the_system' on empty input", () => {
        const r = evaluateReadiness(EMPTY_READINESS_INPUT);
        expect(r.verdict).toBe<Verdict>("you_are_the_system");
        expect(r.totalScore).toBe(0);
        expect(r.gateBlockers.length).toBeGreaterThan(0);
    });

    it("rises to 'building' once two dimensions clear 8/20", () => {
        const r = evaluateReadiness(
            input({
                icpCount: 1,
                bestIcpQualityScore: 90,
                territoryAccountCount: 30,
                outboundTouches: 30,
                distinctAccountsTouched: 12
            })
        );
        expect(r.verdict).toBe<Verdict>("building");
    });

    it("rises to 'inheritable_with_guardrails' on the canon gate", () => {
        const r = evaluateReadiness(inheritableInput());
        expect(r.verdict).toBe<Verdict>("inheritable_with_guardrails");
        expect(r.dimensions.every((d) => d.score >= 10)).toBe(true);
        expect(r.dimensions.some((d) => d.score >= 16)).toBe(true);
    });

    it("does NOT reach 'hire_ready' without closed-won deals", () => {
        const base = inheritableInput();
        const r = evaluateReadiness({
            ...base,
            castProofs: 3,
            futureAutopsiesRun: 3,
            discoveryAdvancedCalls: 6
        });
        expect(r.verdict).not.toBe<Verdict>("hire_ready");
        // Phase 2.8 audit — blocker copy rewritten in behavior-shape.
        // Was "No closed-won deals yet"; now "Close-won a deal" (no
        // hyphen) phrasing. Match the verb to avoid coupling to exact
        // wording.
        expect(
            r.gateBlockers.some((b) =>
                /close.{0,2}won/i.test(b)
            )
        ).toBe(true);
    });

    it("rises to 'hire_ready' with the canon gate met", () => {
        const r = evaluateReadiness(hireReadyInput());
        expect(r.verdict).toBe<Verdict>("hire_ready");
    });

    it("rises to 'hire_ready_repeatable' only with advisor + handoff", () => {
        const r = evaluateReadiness(repeatableInput());
        expect(r.verdict).toBe<Verdict>("hire_ready_repeatable");
        expect(r.nextVerdict).toBeNull();
        expect(r.gateBlockers).toEqual([]);
    });

    it("blocks 'hire_ready_repeatable' on win/loss imbalance", () => {
        const base = repeatableInput();
        const r = evaluateReadiness({
            ...base,
            closedWonDeals: 1,
            closedLostDealsAnalyzed: 5
        });
        expect(r.verdict).not.toBe<Verdict>("hire_ready_repeatable");
        expect(
            r.gateBlockers.some((b) =>
                /win\/loss|win.loss balance/i.test(b)
            )
        ).toBe(true);
    });

    it("blockers describe the NEXT unmet gate, not the current one", () => {
        const r = evaluateReadiness(inheritableInput());
        // Verdict is inheritable; blockers should describe what's
        // missing for hire_ready (close-won, autopsies, etc.).
        // Phase 2.8 — blocker copy is behavior-shape ("Close-won a
        // deal." etc.), no longer the older "No closed-won deals yet"
        // descriptor. Match via verb pattern.
        expect(r.gateBlockers.length).toBeGreaterThan(0);
        expect(
            r.gateBlockers.some((b) =>
                /close.{0,2}won/i.test(b)
            )
        ).toBe(true);
    });

    it("nextVerdict is null at the top, otherwise the rank+1 verdict", () => {
        const top = evaluateReadiness(repeatableInput());
        expect(top.nextVerdict).toBeNull();

        const mid = evaluateReadiness(inheritableInput());
        expect(mid.nextVerdict).toBe<Verdict>("hire_ready");

        const empty = evaluateReadiness(EMPTY_READINESS_INPUT);
        expect(empty.nextVerdict).toBe<Verdict>("building");
    });

    it("totalScore is the sum of dimension scores", () => {
        const r = evaluateReadiness(repeatableInput());
        const sum = r.dimensions.reduce((s, d) => s + d.score, 0);
        expect(r.totalScore).toBe(sum);
        expect(r.totalScore).toBeGreaterThanOrEqual(70);
    });
});

describe("detectTransition", () => {
    it("returns null when from === to", () => {
        const t = detectTransition(
            "building",
            "building",
            "2026-05-01T00:00:00Z",
            "t1"
        );
        expect(t).toBeNull();
    });

    it("flags upward transitions as 'up'", () => {
        const t = detectTransition(
            "building",
            "inheritable_with_guardrails",
            "2026-05-01T00:00:00Z",
            "t1"
        );
        expect(t).not.toBeNull();
        expect(t?.direction).toBe("up");
    });

    it("flags downward transitions as 'down'", () => {
        const t = detectTransition(
            "hire_ready",
            "building",
            "2026-05-01T00:00:00Z",
            "t2"
        );
        expect(t?.direction).toBe("down");
    });

    it("preserves the id and atIso fields", () => {
        const t = detectTransition(
            "you_are_the_system",
            "building",
            "2026-05-01T12:00:00Z",
            "tx"
        );
        expect(t?.id).toBe("tx");
        expect(t?.atIso).toBe("2026-05-01T12:00:00Z");
        expect(t?.from).toBe("you_are_the_system");
        expect(t?.to).toBe("building");
    });
});
