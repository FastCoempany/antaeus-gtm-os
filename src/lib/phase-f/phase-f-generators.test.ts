/**
 * Pure-function tests for Phase F detection generators
 * (ADR-017 PR 2). The Deno generators themselves aren't
 * importable from Node; the pure helpers + detection logic are.
 *
 * Same pattern as src/outdoors-events/lib/discovery-shared.test.ts.
 */

import { describe, it, expect } from "vitest";
import {
    buildRecurringFocusTitle,
    buildRecurringFocusWhatChanges,
    buildRecurringFocusWhatNoticed,
    buildSkillDefaultTitle,
    buildSkillDefaultWhatChanges,
    buildSkillDefaultWhatNoticed,
    detectRecurringFocusCandidates,
    detectSkillDefaultCandidates,
    RECURRING_FOCUS_THRESHOLD,
    RECURRING_FOCUS_WINDOW_DAYS,
    SKILL_FIRES_THRESHOLD,
    stableHash
} from "../../../supabase/functions/heartbeat/phase-f-generators";

describe("Phase F generators / pure helpers", () => {
    // ─── stableHash ────────────────────────────────────────────

    it("stableHash is order-independent on object keys", () => {
        const a = stableHash({ a: 1, b: 2, c: 3 });
        const b = stableHash({ c: 3, b: 2, a: 1 });
        expect(a).toBe(b);
    });

    it("stableHash differs when values differ", () => {
        expect(stableHash({ a: 1 })).not.toBe(stableHash({ a: 2 }));
    });

    it("stableHash handles arrays + nesting", () => {
        const a = stableHash({ list: [1, { x: "y" }] });
        const b = stableHash({ list: [1, { x: "y" }] });
        expect(a).toBe(b);
    });

    // ─── G1 detection ──────────────────────────────────────────

    it("G1 skips skills below the fires threshold", () => {
        const out = detectSkillDefaultCandidates([
            { skill_id: "whats-at-risk", params: {}, successful_fires: 2 }
        ]);
        expect(out).toEqual([]);
    });

    it("G1 surfaces skills past the fires threshold", () => {
        const out = detectSkillDefaultCandidates([
            {
                skill_id: "whats-at-risk",
                params: { stage: "negotiation" },
                successful_fires: SKILL_FIRES_THRESHOLD
            }
        ]);
        expect(out.length).toBe(1);
        expect(out[0]!.skill_id).toBe("whats-at-risk");
        expect(out[0]!.params).toEqual({ stage: "negotiation" });
        expect(out[0]!.based_on_fires).toBe(SKILL_FIRES_THRESHOLD);
        expect(out[0]!.dedupe_hash.length).toBeGreaterThan(0);
    });

    it("G1 dedupe hash is stable for the same skill + params", () => {
        const out1 = detectSkillDefaultCandidates([
            {
                skill_id: "whats-at-risk",
                params: { stage: "negotiation", priority: "high" },
                successful_fires: 5
            }
        ]);
        const out2 = detectSkillDefaultCandidates([
            {
                skill_id: "whats-at-risk",
                params: { priority: "high", stage: "negotiation" },
                successful_fires: 5
            }
        ]);
        expect(out1[0]!.dedupe_hash).toBe(out2[0]!.dedupe_hash);
    });

    // ─── G2 detection ──────────────────────────────────────────

    it("G2 skips rooms below the focus threshold", () => {
        const out = detectRecurringFocusCandidates([
            { room: "deal-workspace", focus_count: 1 }
        ]);
        expect(out).toEqual([]);
    });

    it("G2 surfaces rooms past the focus threshold", () => {
        const out = detectRecurringFocusCandidates([
            { room: "deal-workspace", focus_count: RECURRING_FOCUS_THRESHOLD }
        ]);
        expect(out.length).toBe(1);
        expect(out[0]!.generator_id).toBe("deal_decay");
        expect(out[0]!.filter).toEqual({
            room: "deal-workspace",
            source: "phase_f_recurring_focus"
        });
    });

    it("G2 maps signal-console to signal_decay base generator", () => {
        const out = detectRecurringFocusCandidates([
            { room: "signal-console", focus_count: 6 }
        ]);
        expect(out[0]!.generator_id).toBe("signal_decay");
    });

    it("G2 maps poc-framework to proof_staleness base generator", () => {
        const out = detectRecurringFocusCandidates([
            { room: "poc-framework", focus_count: 6 }
        ]);
        expect(out[0]!.generator_id).toBe("proof_staleness");
    });

    it("G2 maps discovery-studio to discovery_rhythm base generator", () => {
        const out = detectRecurringFocusCandidates([
            { room: "discovery-studio", focus_count: 6 }
        ]);
        expect(out[0]!.generator_id).toBe("discovery_rhythm");
    });

    // ─── Voice-shape sanity on the message builders ───────────

    it("buildSkillDefaultTitle reads as a peer question (not jargon)", () => {
        const t = buildSkillDefaultTitle("whats-at-risk");
        expect(t).toContain("Whats At Risk");
        expect(t).toMatch(/\?$/);
        // No banned vocab.
        expect(t.toLowerCase()).not.toContain("wedge");
        expect(t.toLowerCase()).not.toContain("decision-grade");
    });

    it("buildSkillDefaultWhatNoticed names a concrete fire count", () => {
        const t = buildSkillDefaultWhatNoticed("whats-at-risk", 7);
        expect(t).toContain("7 times");
        expect(t).toContain("30 days");
    });

    it("buildSkillDefaultWhatChanges describes the destination state", () => {
        const t = buildSkillDefaultWhatChanges("whats-at-risk");
        expect(t).toContain("recipe default");
    });

    it("buildRecurringFocusTitle humanizes the room name", () => {
        expect(buildRecurringFocusTitle("deal-workspace")).toContain(
            "Deal Workspace"
        );
    });

    it("buildRecurringFocusWhatNoticed cites window + count", () => {
        const t = buildRecurringFocusWhatNoticed(
            "deal-workspace",
            6,
            RECURRING_FOCUS_WINDOW_DAYS
        );
        expect(t).toContain("Deal Workspace");
        expect(t).toContain("6 times");
        expect(t).toContain(`${RECURRING_FOCUS_WINDOW_DAYS} days`);
    });

    it("buildRecurringFocusWhatChanges names the destination effect", () => {
        const t = buildRecurringFocusWhatChanges("deal-workspace");
        expect(t).toContain("Deal Workspace");
        expect(t).toContain("weekly brief");
    });
});
