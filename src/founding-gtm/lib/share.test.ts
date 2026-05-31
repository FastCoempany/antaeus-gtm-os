import { describe, expect, it, vi } from "vitest";
import {
    SHARE_SNAPSHOT_SCHEMA_VERSION,
    buildShareSnapshot,
    buildShareUrl,
    createShare,
    generateShareToken,
    listShares,
    parseShareSnapshot,
    regenerateShareSnapshot,
    resolveShareToken,
    revokeShare,
    type ShareSnapshot
} from "./share";
import type { AuthoredSection } from "./types";

const SAMPLE_SECTIONS: ReadonlyArray<AuthoredSection> = [
    {
        id: "who_hits",
        kicker: "Section 1",
        title: "Who hits, who misses, why",
        status: "ready",
        body: ["sample body"],
        evidence: ["e1"],
        surprise: null
    }
];

function fakeSnapshot(over: Partial<ShareSnapshot> = {}): ShareSnapshot {
    return {
        schemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
        snapshotIso: "2026-05-31T10:00:00.000Z",
        workspaceName: "Acme",
        verdictLabel: "Building",
        sections: SAMPLE_SECTIONS,
        ...over
    };
}

describe("generateShareToken", () => {
    it("returns a URL-safe base64 string", () => {
        const t = generateShareToken();
        expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
        // 32 random bytes → base64url without padding is 43 chars.
        expect(t.length).toBe(43);
    });

    it("returns distinct tokens", () => {
        const a = generateShareToken();
        const b = generateShareToken();
        expect(a).not.toBe(b);
    });
});

describe("buildShareSnapshot", () => {
    it("composes the snapshot with current schema version", () => {
        const s = buildShareSnapshot({
            sections: SAMPLE_SECTIONS,
            workspaceName: "Acme",
            verdictLabel: "Inheritable with guardrails",
            nowIso: "2026-05-31T10:00:00.000Z"
        });
        expect(s.schemaVersion).toBe(SHARE_SNAPSHOT_SCHEMA_VERSION);
        expect(s.snapshotIso).toBe("2026-05-31T10:00:00.000Z");
        expect(s.workspaceName).toBe("Acme");
        expect(s.verdictLabel).toBe("Inheritable with guardrails");
        expect(s.sections).toEqual(SAMPLE_SECTIONS);
    });

    it("falls back to current iso when nowIso is omitted", () => {
        const s = buildShareSnapshot({
            sections: SAMPLE_SECTIONS,
            workspaceName: "Acme",
            verdictLabel: null
        });
        expect(s.snapshotIso).toBeTruthy();
    });
});

describe("parseShareSnapshot — defensive read-mode parsing", () => {
    it("returns null on non-object input", () => {
        expect(parseShareSnapshot(null)).toBeNull();
        expect(parseShareSnapshot("not json")).toBeNull();
        expect(parseShareSnapshot([])).toBeNull();
    });

    it("returns null when schemaVersion mismatches", () => {
        expect(
            parseShareSnapshot({ schemaVersion: 99, sections: SAMPLE_SECTIONS })
        ).toBeNull();
    });

    it("returns null when sections are absent or empty", () => {
        expect(
            parseShareSnapshot({
                schemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
                sections: []
            })
        ).toBeNull();
    });

    it("round-trips a fresh snapshot", () => {
        const s = fakeSnapshot();
        const back = parseShareSnapshot(JSON.parse(JSON.stringify(s)));
        expect(back).not.toBeNull();
        expect(back!.workspaceName).toBe("Acme");
        expect(back!.verdictLabel).toBe("Building");
        expect(back!.sections.length).toBe(1);
    });

    it("tolerates missing optional fields", () => {
        const s = parseShareSnapshot({
            schemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
            sections: SAMPLE_SECTIONS
        });
        expect(s).not.toBeNull();
        expect(s!.workspaceName).toBe("");
        expect(s!.verdictLabel).toBeNull();
    });
});

describe("buildShareUrl", () => {
    it("composes an absolute URL with the token query-encoded", () => {
        expect(buildShareUrl("abc-123", "https://antaeus.app")).toBe(
            "https://antaeus.app/founding-gtm-share/?t=abc-123"
        );
    });

    it("strips trailing slashes from origin", () => {
        expect(buildShareUrl("xyz", "https://antaeus.app///")).toBe(
            "https://antaeus.app/founding-gtm-share/?t=xyz"
        );
    });

    it("returns empty string for empty inputs", () => {
        expect(buildShareUrl("", "https://antaeus.app")).toBe("");
        expect(buildShareUrl("abc", null)).toBe("");
        expect(buildShareUrl("abc", undefined)).toBe("");
    });
});

// ─── DataClient mock for CRUD + RPC tests ──────────────────────────────

function fakeRow(over: Record<string, unknown> = {}) {
    return {
        id: "row-1",
        token: "tok-1",
        label: null,
        snapshot: fakeSnapshot(),
        revoked_at: null,
        created_at: "2026-05-31T10:00:00.000Z",
        updated_at: "2026-05-31T10:00:00.000Z",
        workspace_id: "ws-1",
        created_by: null,
        ...over
    };
}

function fakeDataClient(opts: {
    list?: ReadonlyArray<Record<string, unknown>>;
    insertReturn?: Record<string, unknown>;
    rpcReturn?: { data?: unknown; error?: unknown };
    updateThrows?: boolean;
}): { client: unknown } {
    const data = {
        foundingGtmShares: {
            list: vi.fn(async () => opts.list ?? []),
            insert: vi.fn(async () => opts.insertReturn ?? fakeRow()),
            update: vi.fn(async () => {
                if (opts.updateThrows) throw new Error("update failed");
                return fakeRow();
            })
        },
        client: {
            rpc: vi.fn(async () => opts.rpcReturn ?? { data: null, error: null })
        }
    };
    return data as unknown as { client: unknown };
}

describe("listShares", () => {
    it("returns shaped rows", async () => {
        const data = fakeDataClient({
            list: [
                fakeRow({ id: "a", token: "tok-a", label: "Sarah, w12" }),
                fakeRow({ id: "b", token: "tok-b", revoked_at: "2026-05-30T10:00:00.000Z" })
            ]
        });
        const out = await listShares(data as never);
        expect(out.length).toBe(2);
        expect(out[0]!.id).toBe("a");
        expect(out[0]!.label).toBe("Sarah, w12");
        expect(out[1]!.revokedAtIso).toBe("2026-05-30T10:00:00.000Z");
    });

    it("returns [] on error", async () => {
        const data = {
            foundingGtmShares: {
                list: vi.fn(async () => {
                    throw new Error("rls denied");
                })
            }
        };
        const out = await listShares(data as never);
        expect(out).toEqual([]);
    });
});

describe("createShare", () => {
    it("inserts with the supplied token when provided", async () => {
        const inserted = fakeRow({ id: "new", token: "supplied-token" });
        const data = fakeDataClient({ insertReturn: inserted });
        const out = await createShare(data as never, {
            snapshot: fakeSnapshot(),
            label: "Sarah",
            token: "supplied-token"
        });
        expect(out!.id).toBe("new");
        expect(out!.token).toBe("supplied-token");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertFn = (data as any).foundingGtmShares.insert;
        expect(insertFn).toHaveBeenCalledTimes(1);
        expect(insertFn.mock.calls[0]![0]).toMatchObject({
            token: "supplied-token",
            label: "Sarah"
        });
    });

    it("auto-generates a token when none is supplied", async () => {
        const data = fakeDataClient({});
        const out = await createShare(data as never, {
            snapshot: fakeSnapshot()
        });
        expect(out).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertFn = (data as any).foundingGtmShares.insert;
        const tok = insertFn.mock.calls[0]![0]!.token;
        expect(tok).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(tok.length).toBeGreaterThanOrEqual(40);
    });

    it("returns null on insert failure", async () => {
        const data = {
            foundingGtmShares: {
                insert: vi.fn(async () => {
                    throw new Error("rls denied");
                })
            }
        };
        const out = await createShare(data as never, {
            snapshot: fakeSnapshot()
        });
        expect(out).toBeNull();
    });
});

describe("revokeShare", () => {
    it("updates revoked_at to a timestamp", async () => {
        const data = fakeDataClient({});
        const ok = await revokeShare(data as never, "row-1");
        expect(ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateFn = (data as any).foundingGtmShares.update;
        expect(updateFn).toHaveBeenCalledWith("row-1", {
            revoked_at: expect.any(String)
        });
    });

    it("returns false on update failure", async () => {
        const data = fakeDataClient({ updateThrows: true });
        const ok = await revokeShare(data as never, "row-1");
        expect(ok).toBe(false);
    });
});

describe("regenerateShareSnapshot", () => {
    it("overwrites the snapshot column", async () => {
        const data = fakeDataClient({});
        const snap = fakeSnapshot({ workspaceName: "Updated" });
        const ok = await regenerateShareSnapshot(data as never, "row-1", snap);
        expect(ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateFn = (data as any).foundingGtmShares.update;
        expect(updateFn).toHaveBeenCalledWith("row-1", { snapshot: snap });
    });
});

describe("resolveShareToken", () => {
    it("parses a valid snapshot from the RPC", async () => {
        const data = fakeDataClient({
            rpcReturn: { data: fakeSnapshot(), error: null }
        });
        const out = await resolveShareToken(data as never, "tok-1");
        expect(out).not.toBeNull();
        expect(out!.workspaceName).toBe("Acme");
    });

    it("returns null when the RPC errors", async () => {
        const data = fakeDataClient({
            rpcReturn: { data: null, error: new Error("not found") }
        });
        const out = await resolveShareToken(data as never, "tok-1");
        expect(out).toBeNull();
    });

    it("returns null on malformed snapshot (schema mismatch)", async () => {
        const data = fakeDataClient({
            rpcReturn: {
                data: { schemaVersion: 99, sections: SAMPLE_SECTIONS },
                error: null
            }
        });
        const out = await resolveShareToken(data as never, "tok-1");
        expect(out).toBeNull();
    });

    it("returns null when the RPC throws", async () => {
        const data = {
            client: {
                rpc: vi.fn(async () => {
                    throw new Error("network");
                })
            }
        };
        const out = await resolveShareToken(data as never, "tok-1");
        expect(out).toBeNull();
    });
});
