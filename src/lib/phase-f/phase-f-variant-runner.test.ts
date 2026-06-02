/**
 * Tests for the Phase F Lane 2 variant runner (ADR-017 PR closing the
 * Lane 2 gap). Same pattern as the Phase F generator tests — pure
 * functions vitest-importable from the Deno-pragma'd module.
 *
 * The runner reads active_observation_variants for a workspace, looks
 * up the matching Phase B base generator, invokes it, voice-gates the
 * resulting candidates, and writes via the injected writer function
 * tagged with the variant attribution.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    runPhaseFVariantsForWorkspace,
    type BaseGenerator,
    type VoiceValidator
} from "../../../supabase/functions/heartbeat/phase-f-variant-runner";

// Test voice validators.
const passAllVoice: VoiceValidator = () => ({ valid: true });
const dropBannedVoice: VoiceValidator = (text) => {
    const banned = [
        "wedge",
        "decision-grade",
        "thought-leaders",
        "synergy"
    ];
    const lower = text.toLowerCase();
    for (const word of banned) {
        if (lower.includes(word)) {
            return { valid: false, reason: `banned: ${word}` };
        }
    }
    return { valid: true };
};

// ── Fixtures ────────────────────────────────────────────────────

function mkCandidate(text: string) {
    return {
        observationText: text,
        relatedObjectType: null,
        relatedObjectId: null,
        confidence: null,
        supersedesPrior: false
    };
}

function mkSb(opts: {
    variants?: Array<{ base_generator_id: string; variant_name: string }>;
    listError?: { message: string };
}): any {
    return {
        from: vi.fn((table: string) => {
            if (table !== "active_observation_variants") {
                throw new Error(`unexpected table: ${table}`);
            }
            return {
                select: vi.fn(() => ({
                    eq: vi.fn(() => {
                        if (opts.listError) {
                            return Promise.resolve({
                                data: null,
                                error: opts.listError
                            });
                        }
                        return Promise.resolve({
                            data: opts.variants ?? [],
                            error: null
                        });
                    })
                }))
            };
        })
    };
}

const CTX = {
    workspaceId: "ws-1",
    now: "2026-06-02T20:00:00.000Z",
    session: { focusedObjectType: null, focusedObjectId: null }
};

describe("runPhaseFVariantsForWorkspace", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function mkBase(
        id: string,
        run: BaseGenerator["run"]
    ): BaseGenerator {
        return { id, run };
    }

    it("returns empty outcome on list error (defensive)", async () => {
        const sb = mkSb({ listError: { message: "rls denied" } });
        const writeFn = vi.fn(async () => ({
            inserted: false,
            deduped: false,
            errored: false
        }));
        const outcome = await runPhaseFVariantsForWorkspace(
            sb,
            CTX,
            writeFn,
            [],
            passAllVoice
        );
        expect(outcome.variants_seen).toBe(0);
        expect(outcome.variants_run).toBe(0);
        expect(writeFn).not.toHaveBeenCalled();
    });

    it("returns empty outcome when no variants exist", async () => {
        const sb = mkSb({ variants: [] });
        const writeFn = vi.fn(async () => ({
            inserted: false,
            deduped: false,
            errored: false
        }));
        const outcome = await runPhaseFVariantsForWorkspace(
            sb,
            CTX,
            writeFn,
            [],
            passAllVoice
        );
        expect(outcome.variants_seen).toBe(0);
        expect(writeFn).not.toHaveBeenCalled();
    });

    it("counts unknown base generators + skips them", async () => {
        const sb = mkSb({
            variants: [
                {
                    base_generator_id: "exotic_generator",
                    variant_name: "weekly"
                }
            ]
        });
        const writeFn = vi.fn(async () => ({
            inserted: false,
            deduped: false,
            errored: false
        }));
        const outcome = await runPhaseFVariantsForWorkspace(
            sb,
            CTX,
            writeFn,
            [mkBase("deal_decay", async () => [])],
            passAllVoice
        );
        expect(outcome.variants_seen).toBe(1);
        expect(outcome.variants_run).toBe(0);
        expect(outcome.variants_unknown_base).toBe(1);
        expect(writeFn).not.toHaveBeenCalled();
    });

    it("invokes the base generator + tags writes with source:variant", async () => {
        const baseRun = vi.fn(async () => [
            mkCandidate(
                "You opened Deal Workspace 6 times in the last 14 days."
            )
        ]);
        const sb = mkSb({
            variants: [
                {
                    base_generator_id: "deal_decay",
                    variant_name: "weekly_focus_deal_workspace"
                }
            ]
        });
        const writeFn = vi.fn(async () => ({
            inserted: true,
            deduped: false,
            errored: false
        }));
        const outcome = await runPhaseFVariantsForWorkspace(sb, CTX, writeFn, [
            mkBase("deal_decay", baseRun)
        ], passAllVoice);
        expect(outcome.variants_seen).toBe(1);
        expect(outcome.variants_run).toBe(1);
        expect(outcome.candidates_produced).toBe(1);
        expect(outcome.candidates_written).toBe(1);
        expect(writeFn).toHaveBeenCalledWith(
            "deal_decay:weekly_focus_deal_workspace",
            expect.objectContaining({
                observationText: expect.stringContaining("Deal Workspace")
            })
        );
    });

    it("voice-gates candidates + counts voice-dropped", async () => {
        const baseRun = vi.fn(async () => [
            mkCandidate(
                "Decision-grade event for thought-leaders — your wedge."
            )
        ]);
        const sb = mkSb({
            variants: [
                {
                    base_generator_id: "deal_decay",
                    variant_name: "weekly_focus_deal_workspace"
                }
            ]
        });
        const writeFn = vi.fn();
        const outcome = await runPhaseFVariantsForWorkspace(sb, CTX, writeFn, [
            mkBase("deal_decay", baseRun)
        ], dropBannedVoice);
        expect(outcome.candidates_produced).toBe(1);
        expect(outcome.candidates_voice_dropped).toBe(1);
        expect(outcome.candidates_written).toBe(0);
        expect(writeFn).not.toHaveBeenCalled();
    });

    it("captures per-variant errors without aborting the lap", async () => {
        const failingRun = vi.fn(async () => {
            throw new Error("source-table-missing");
        });
        const sb = mkSb({
            variants: [
                {
                    base_generator_id: "deal_decay",
                    variant_name: "monday_brief"
                }
            ]
        });
        const writeFn = vi.fn();
        const outcome = await runPhaseFVariantsForWorkspace(sb, CTX, writeFn, [
            mkBase("deal_decay", failingRun)
        ], passAllVoice);
        expect(outcome.errors.length).toBe(1);
        expect(outcome.errors[0]).toContain("source-table-missing");
        expect(outcome.candidates_produced).toBe(0);
        expect(outcome.candidates_written).toBe(0);
    });
});
