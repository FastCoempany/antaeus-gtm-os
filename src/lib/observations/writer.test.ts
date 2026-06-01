import { describe, expect, it, vi } from "vitest";
import { runGenerator, writeObservation } from "./writer";
import type {
    GeneratorContext,
    ObservationCandidate,
    RegisteredGenerator
} from "./types";
import type { DataClient, NounAccessor } from "@/lib/data-client";

interface MockObsRow {
    id: string;
    workspace_id: string;
    written_at: string;
    observation_text: string;
    related_object_type: string | null;
    related_object_id: string | null;
    source_generator: string;
    confidence: string | null;
    status: string;
    superseded_by: string | null;
    dismissed_at: string | null;
    dismissed_reason: string | null;
}

function makeRow(overrides: Partial<MockObsRow> = {}): MockObsRow {
    return {
        id: `obs-${Math.random().toString(36).slice(2, 8)}`,
        workspace_id: "ws-1",
        written_at: "2026-05-19T12:00:00Z",
        observation_text: "default text",
        related_object_type: null,
        related_object_id: null,
        source_generator: "phase-b/signal-decay",
        confidence: null,
        status: "active",
        superseded_by: null,
        dismissed_at: null,
        dismissed_reason: null,
        ...overrides
    };
}

function makeDataClient(opts: {
    existingRows?: MockObsRow[];
} = {}): {
    data: DataClient;
    inserts: MockObsRow[];
    updates: Array<{ id: string; patch: Partial<MockObsRow> }>;
    storedRows: MockObsRow[];
} {
    const storedRows: MockObsRow[] = (opts.existingRows ?? []).slice();
    const inserts: MockObsRow[] = [];
    const updates: Array<{ id: string; patch: Partial<MockObsRow> }> = [];

    const observations: NounAccessor<"observations"> = {
        list: vi.fn(async (options) => {
            if (!options?.where) return storedRows as never;
            return storedRows.filter((row) => {
                return Object.entries(options.where as Record<string, unknown>).every(
                    ([key, value]) => {
                        return (row as unknown as Record<string, unknown>)[key] === value;
                    }
                );
            }) as never;
        }),
        get: vi.fn(async (id) => (storedRows.find((r) => r.id === id) ?? null) as never),
        insert: vi.fn(async (row) => {
            const fresh: MockObsRow = makeRow({ ...(row as Partial<MockObsRow>) });
            // Honor explicit id if the caller set it; otherwise the generated one
            // from makeRow stands.
            storedRows.push(fresh);
            inserts.push(fresh);
            return fresh as never;
        }),
        update: vi.fn(async (id, patch) => {
            const row = storedRows.find((r) => r.id === id);
            if (!row) throw new Error("row not found");
            Object.assign(row, patch);
            updates.push({ id, patch: patch as Partial<MockObsRow> });
            return row as never;
        }),
        remove: vi.fn(async (id) => {
            const idx = storedRows.findIndex((r) => r.id === id);
            if (idx >= 0) storedRows.splice(idx, 1);
        }),
        subscribe: vi.fn(() => ({ unsubscribe: () => undefined }) as never)
    };

    const data: DataClient = {
        client: {} as never,
        currentUserId: vi.fn(async () => "user-1"),
        currentWorkspace: vi.fn(async () => null as never),
        workspaces: {} as never,
        workspaceMembers: {} as never,
        icps: {} as never,
        deals: {} as never,
        sequences: {} as never,
        signalConsoleAccounts: {} as never,
        signals: {} as never,
        discoveryFrameworks: {} as never,
        discoveryCallLogs: {} as never,
        pipelineSettings: {} as never,
        profiles: {} as never,
        studioArtifacts: {} as never,
        proofs: {} as never,
        advisorDeployments: {} as never,
        readinessSnapshots: {} as never,
        handoffArtifacts: {} as never,
        foundingGtmShares: {} as never,
        scheduledSkills: {} as never,
        scheduledSkillFires: {} as never,
        outdoorsEvents: {} as never,
        outdoorsEventsRuns: {} as never,
        workspaceSessions: {} as never,
        workspaceProfile: {} as never,
        observations,
        briefingRuns: {} as never,
        briefingRawItems: {} as never,
        briefingEnrichedItems: {} as never,
        briefingClusters: {} as never,
        briefingPatterns: {} as never,
        briefingAuditEnvelopes: {} as never,
        briefingPatternFeedback: {} as never
    };

    return { data, inserts, updates, storedRows };
}

const CANDIDATE: ObservationCandidate = {
    observationText: "Meridian's signals are running ahead of your outreach this week.",
    relatedObjectType: "account",
    relatedObjectId: "acct-meridian",
    confidence: "high"
};

const CTX: GeneratorContext = {
    workspaceId: "ws-1",
    now: "2026-05-19T12:00:00Z",
    session: null
};

// ─── writeObservation ────────────────────────────────────────────

describe("writeObservation — fresh insert", () => {
    it("inserts a new observation when none exist", async () => {
        const mock = makeDataClient();
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: "phase-b/signal-decay",
            candidate: CANDIDATE
        });
        expect(result.inserted?.observationText).toBe(CANDIDATE.observationText);
        expect(mock.inserts).toHaveLength(1);
        expect(mock.inserts[0]).toMatchObject({
            workspace_id: "ws-1",
            observation_text: CANDIDATE.observationText,
            source_generator: "phase-b/signal-decay",
            confidence: "high",
            status: "active"
        });
    });
});

describe("writeObservation — dedupe", () => {
    it("dedupes against an existing identical-text active row from the same generator + object", async () => {
        const existing = makeRow({
            observation_text: CANDIDATE.observationText,
            related_object_type: CANDIDATE.relatedObjectType ?? null,
            related_object_id: CANDIDATE.relatedObjectId ?? null
        });
        const mock = makeDataClient({ existingRows: [existing] });
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: existing.source_generator,
            candidate: CANDIDATE
        });
        expect(result.deduped).toBeDefined();
        expect(result.inserted).toBeUndefined();
        expect(mock.inserts).toHaveLength(0);
    });

    it("does NOT dedupe when only related_object differs", async () => {
        const existing = makeRow({
            observation_text: CANDIDATE.observationText,
            related_object_type: "account",
            related_object_id: "different-account"
        });
        const mock = makeDataClient({ existingRows: [existing] });
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: existing.source_generator,
            candidate: CANDIDATE
        });
        expect(result.inserted).toBeDefined();
        expect(mock.inserts).toHaveLength(1);
    });

    it("does NOT dedupe when prior row is dismissed (only active rows dedupe)", async () => {
        const existing = makeRow({
            observation_text: CANDIDATE.observationText,
            related_object_type: CANDIDATE.relatedObjectType ?? null,
            related_object_id: CANDIDATE.relatedObjectId ?? null,
            status: "dismissed"
        });
        const mock = makeDataClient({ existingRows: [existing] });
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: existing.source_generator,
            candidate: CANDIDATE
        });
        expect(result.inserted).toBeDefined();
    });
});

describe("writeObservation — supersession", () => {
    it("marks prior active rows as superseded when supersedesPrior is set", async () => {
        const prior = makeRow({
            observation_text: "Old text",
            related_object_type: "account",
            related_object_id: "acct-meridian"
        });
        const mock = makeDataClient({ existingRows: [prior] });
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: prior.source_generator,
            candidate: { ...CANDIDATE, supersedesPrior: true }
        });
        expect(result.inserted).toBeDefined();
        expect(result.superseded).toHaveLength(1);
        expect(result.superseded?.[0]?.id).toBe(prior.id);
        // Mock's stored row should now have status='superseded'
        expect(prior.status).toBe("superseded");
    });

    it("does NOT mark prior rows superseded when supersedesPrior is unset", async () => {
        const prior = makeRow({
            observation_text: "Old text",
            related_object_type: "account",
            related_object_id: "acct-meridian"
        });
        const mock = makeDataClient({ existingRows: [prior] });
        await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: prior.source_generator,
            candidate: CANDIDATE
        });
        expect(prior.status).toBe("active");
    });

    it("links superseded rows back via superseded_by", async () => {
        const prior = makeRow({
            observation_text: "Old text",
            related_object_type: "account",
            related_object_id: "acct-meridian"
        });
        const mock = makeDataClient({ existingRows: [prior] });
        const result = await writeObservation({
            data: mock.data,
            workspaceId: "ws-1",
            sourceGenerator: prior.source_generator,
            candidate: { ...CANDIDATE, supersedesPrior: true }
        });
        expect(prior.superseded_by).toBe(result.inserted?.id);
    });
});

// ─── runGenerator ────────────────────────────────────────────────

describe("runGenerator", () => {
    it("runs a generator + reports the count summary", async () => {
        const mock = makeDataClient();
        const generator: RegisteredGenerator = {
            id: "test/example",
            run: async () => [CANDIDATE]
        };
        const out = await runGenerator({
            data: mock.data,
            ctx: CTX,
            generator
        });
        expect(out).toEqual({
            generatorId: "test/example",
            produced: 1,
            inserted: 1,
            deduped: 0,
            errors: 0
        });
        expect(mock.inserts).toHaveLength(1);
    });

    it("counts deduped candidates separately from inserted", async () => {
        const existing = makeRow({
            observation_text: CANDIDATE.observationText,
            related_object_type: CANDIDATE.relatedObjectType ?? null,
            related_object_id: CANDIDATE.relatedObjectId ?? null,
            source_generator: "test/example"
        });
        const mock = makeDataClient({ existingRows: [existing] });
        const generator: RegisteredGenerator = {
            id: "test/example",
            run: async () => [CANDIDATE, CANDIDATE]
        };
        const out = await runGenerator({
            data: mock.data,
            ctx: CTX,
            generator
        });
        expect(out).toEqual({
            generatorId: "test/example",
            produced: 2,
            inserted: 0,
            deduped: 2,
            errors: 0
        });
    });

    it("reports an error count when the generator throws", async () => {
        const mock = makeDataClient();
        const generator: RegisteredGenerator = {
            id: "test/broken",
            run: async () => {
                throw new Error("oops");
            }
        };
        const out = await runGenerator({
            data: mock.data,
            ctx: CTX,
            generator
        });
        expect(out.errors).toBe(1);
        expect(out.inserted).toBe(0);
        expect(out.produced).toBe(0);
    });

    it("returns zero counts when the generator produces no candidates", async () => {
        const mock = makeDataClient();
        const generator: RegisteredGenerator = {
            id: "test/silent",
            run: async () => []
        };
        const out = await runGenerator({
            data: mock.data,
            ctx: CTX,
            generator
        });
        expect(out).toEqual({
            generatorId: "test/silent",
            produced: 0,
            inserted: 0,
            deduped: 0,
            errors: 0
        });
    });
});
