import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootReadinessHistory } from "./readiness-history";
import {
    __resetForTests,
    setReadinessInput
} from "../state";
import { EMPTY_READINESS_INPUT, type ReadinessInput } from "@/lib/readiness";
import type { DataClient } from "@/lib/data-client";

class MemStorage {
    map: Record<string, string> = {};
    getItem(k: string): string | null {
        return this.map[k] ?? null;
    }
    setItem(k: string, v: string): void {
        this.map[k] = v;
    }
}

interface InsertedRow {
    overall_score: unknown;
    verdict: unknown;
    dimension_scores: unknown;
    data: unknown;
}

function makeFakeClient(): { inserts: InsertedRow[]; client: DataClient } {
    const inserts: InsertedRow[] = [];
    const client = {
        readinessSnapshots: {
            insert: async (row: InsertedRow) => {
                inserts.push(row);
                return {} as never;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    return { inserts, client };
}

/** Inputs that just clear the "Inheritable with guardrails" gate. */
function inheritableInput(): ReadinessInput {
    return {
        ...EMPTY_READINESS_INPUT,
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
    };
}

describe("bootReadinessHistory", () => {
    beforeEach(() => {
        __resetForTests();
    });

    afterEach(() => {
        __resetForTests();
    });

    it("does NOT insert on first run when cached verdict matches current", async () => {
        const storage = new MemStorage();
        storage.setItem("gtmos_readiness_last_verdict", "you_are_the_system");
        const { inserts, client } = makeFakeClient();

        const stop = bootReadinessHistory({ client, storage });
        // First run with empty input → verdict is "you_are_the_system",
        // matches cache → no insert.
        await Promise.resolve();
        expect(inserts.length).toBe(0);
        stop();
    });

    it("inserts a row when verdict transitions", async () => {
        const storage = new MemStorage();
        storage.setItem("gtmos_readiness_last_verdict", "you_are_the_system");
        const { inserts, client } = makeFakeClient();

        const stop = bootReadinessHistory({ client, storage });
        // Drive a transition: empty → inheritable.
        setReadinessInput(inheritableInput());
        await Promise.resolve();
        await Promise.resolve(); // microtask flush for the async insert

        expect(inserts.length).toBe(1);
        expect(inserts[0].verdict).toBe("partial");
        // `partial` is the legacy column-enum approximation;
        // the full new verdict is in `data`.
        const data = inserts[0].data as Record<string, unknown>;
        expect(data.verdict).toBe("inheritable_with_guardrails");
        const transition = data.transition as Record<string, unknown>;
        expect(transition.direction).toBe("up");
        expect(transition.from).toBe("you_are_the_system");
        expect(transition.to).toBe("inheritable_with_guardrails");
        stop();
    });

    it("inserts only ONE row per transition, even if input churns", async () => {
        const storage = new MemStorage();
        storage.setItem("gtmos_readiness_last_verdict", "you_are_the_system");
        const { inserts, client } = makeFakeClient();

        const stop = bootReadinessHistory({ client, storage });
        const input = inheritableInput();

        setReadinessInput(input);
        await Promise.resolve();
        await Promise.resolve();

        // Re-set the same input — verdict is unchanged → no new row.
        setReadinessInput(input);
        await Promise.resolve();
        await Promise.resolve();

        // A trivially-different input that doesn't move the verdict.
        setReadinessInput({ ...input, outboundTouches: 31 });
        await Promise.resolve();
        await Promise.resolve();

        expect(inserts.length).toBe(1);
        stop();
    });

    it("fires onTransition with direction 'up' for upward moves", async () => {
        const storage = new MemStorage();
        storage.setItem("gtmos_readiness_last_verdict", "you_are_the_system");
        const { client } = makeFakeClient();
        const onTransition = vi.fn();

        const stop = bootReadinessHistory({ client, storage, onTransition });
        setReadinessInput(inheritableInput());
        await Promise.resolve();
        await Promise.resolve();

        expect(onTransition).toHaveBeenCalledTimes(1);
        const [transition] = onTransition.mock.calls[0];
        expect(transition.direction).toBe("up");
        stop();
    });

    it("writes the new verdict to the local cache", async () => {
        const storage = new MemStorage();
        storage.setItem("gtmos_readiness_last_verdict", "you_are_the_system");
        const { client } = makeFakeClient();

        const stop = bootReadinessHistory({ client, storage });
        setReadinessInput(inheritableInput());
        await Promise.resolve();
        await Promise.resolve();

        expect(storage.getItem("gtmos_readiness_last_verdict")).toBe(
            "inheritable_with_guardrails"
        );
        stop();
    });

    it("ignores unknown cached verdicts (treats as null)", async () => {
        const storage = new MemStorage();
        storage.setItem(
            "gtmos_readiness_last_verdict",
            "from_a_previous_universe"
        );
        const { inserts, client } = makeFakeClient();

        const stop = bootReadinessHistory({ client, storage });
        // First run with empty input. Cache is invalid → previous=null →
        // we record an initial baseline row.
        await Promise.resolve();
        await Promise.resolve();

        expect(inserts.length).toBe(1);
        const data = inserts[0].data as Record<string, unknown>;
        expect(data.verdict).toBe("you_are_the_system");
        // No transition object on baseline row (previous was null).
        expect(data.transition).toBeUndefined();
        stop();
    });
});
