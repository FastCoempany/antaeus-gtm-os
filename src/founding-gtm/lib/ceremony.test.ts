import { describe, expect, it, vi } from "vitest";
import {
    bootCeremonyMoment,
    hasCeremonyFired,
    loadLatestTransition,
    markCeremonyFired,
    shouldFireCeremony
} from "./ceremony";
import type { DataClient } from "@/lib/data-client";
import type { VerdictTransition } from "@/lib/readiness";

class MemStorage {
    map: Record<string, string> = {};
    getItem(k: string): string | null {
        return this.map[k] ?? null;
    }
    setItem(k: string, v: string): void {
        this.map[k] = v;
    }
}

function makeClient(rows: ReadonlyArray<unknown>): DataClient {
    return {
        readinessSnapshots: {
            list: async () => rows
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

const upTransition: VerdictTransition = {
    id: "vt_1",
    from: "building",
    to: "inheritable_with_guardrails",
    direction: "up",
    atIso: "2026-05-01T00:00:00Z"
};

describe("shouldFireCeremony", () => {
    it("fires on upward → inheritable_with_guardrails", () => {
        expect(shouldFireCeremony(upTransition)).toBe(true);
    });

    it("does not fire on downward transitions", () => {
        expect(
            shouldFireCeremony({
                ...upTransition,
                from: "inheritable_with_guardrails",
                to: "building",
                direction: "down"
            })
        ).toBe(false);
    });

    it("does not fire on upward to other verdicts", () => {
        expect(
            shouldFireCeremony({
                ...upTransition,
                to: "hire_ready"
            })
        ).toBe(false);
        expect(
            shouldFireCeremony({
                ...upTransition,
                from: "you_are_the_system",
                to: "building"
            })
        ).toBe(false);
    });
});

describe("idempotency flag", () => {
    it("hasCeremonyFired is false on a fresh storage", () => {
        expect(hasCeremonyFired(new MemStorage())).toBe(false);
    });

    it("markCeremonyFired then hasCeremonyFired returns true", () => {
        const s = new MemStorage();
        markCeremonyFired(s);
        expect(hasCeremonyFired(s)).toBe(true);
    });

    it("tolerates null storage", () => {
        markCeremonyFired(null);
        expect(hasCeremonyFired(null)).toBe(false);
    });
});

describe("loadLatestTransition", () => {
    it("returns null when no rows", async () => {
        const t = await loadLatestTransition(makeClient([]));
        expect(t).toBeNull();
    });

    it("hydrates the transition object from data jsonb", async () => {
        const t = await loadLatestTransition(
            makeClient([
                {
                    id: "row_1",
                    data: {
                        verdict: "inheritable_with_guardrails",
                        transition: {
                            from: "building",
                            to: "inheritable_with_guardrails",
                            direction: "up",
                            at: "2026-05-01T00:00:00Z"
                        }
                    }
                }
            ])
        );
        expect(t).not.toBeNull();
        expect(t?.from).toBe("building");
        expect(t?.to).toBe("inheritable_with_guardrails");
        expect(t?.direction).toBe("up");
    });

    it("returns null when latest row lacks a transition (initial baseline)", async () => {
        const t = await loadLatestTransition(
            makeClient([
                {
                    id: "row_1",
                    data: { verdict: "building" }
                }
            ])
        );
        expect(t).toBeNull();
    });
});

describe("bootCeremonyMoment", () => {
    it("does NOT fire when flag is already set", async () => {
        const storage = new MemStorage();
        markCeremonyFired(storage);
        const onFire = vi.fn();
        await bootCeremonyMoment({
            client: makeClient([
                {
                    id: "row_1",
                    data: {
                        transition: {
                            from: "building",
                            to: "inheritable_with_guardrails",
                            direction: "up",
                            at: "2026-05-01T00:00:00Z"
                        }
                    }
                }
            ]),
            storage,
            onFire
        });
        expect(onFire).not.toHaveBeenCalled();
    });

    it("fires when transition qualifies and flag is unset", async () => {
        const storage = new MemStorage();
        const onFire = vi.fn();
        await bootCeremonyMoment({
            client: makeClient([
                {
                    id: "row_1",
                    data: {
                        transition: {
                            from: "building",
                            to: "inheritable_with_guardrails",
                            direction: "up",
                            at: "2026-05-01T00:00:00Z"
                        }
                    }
                }
            ]),
            storage,
            onFire
        });
        expect(onFire).toHaveBeenCalledTimes(1);
        expect(hasCeremonyFired(storage)).toBe(true);
    });

    it("does not fire on downward transition", async () => {
        const storage = new MemStorage();
        const onFire = vi.fn();
        await bootCeremonyMoment({
            client: makeClient([
                {
                    id: "row_1",
                    data: {
                        transition: {
                            from: "hire_ready",
                            to: "inheritable_with_guardrails",
                            direction: "down",
                            at: "2026-05-01T00:00:00Z"
                        }
                    }
                }
            ]),
            storage,
            onFire
        });
        expect(onFire).not.toHaveBeenCalled();
        expect(hasCeremonyFired(storage)).toBe(false);
    });
});
