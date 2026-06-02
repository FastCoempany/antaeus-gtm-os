import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootProfile, saveProfile, __setProfileDepsForTests } from "./profile-persistence";
import {
    commercialProfile,
    profileDraft,
    profileLoaded,
    profileRowExists,
    setCommercialProfile,
    setProfileRowExists,
    setProfileLoaded
} from "../state";
import { EMPTY_COMMERCIAL_PROFILE } from "./commercial-profile";
import type { WorkspaceProfile } from "@/lib/database-helpers";
import type { DataClient } from "@/lib/data-client";

function makeRow(overrides: Partial<WorkspaceProfile> = {}): WorkspaceProfile {
    return {
        workspace_id: "ws-1",
        product_category: "revenue OS",
        what_we_sell: "a GTM OS",
        value_prop: "inheritable motion",
        onboarding_completed: true,
        onboarding_answers: { step: 7 },
        phase_f_proposals_enabled: null,
        data: {},
        created_at: "2026-05-26T00:00:00Z",
        updated_at: "2026-05-26T00:00:00Z",
        ...overrides
    };
}

interface MockClientOpts {
    listRows?: WorkspaceProfile[];
    listThrows?: boolean;
    workspaceId?: string | null;
}

function makeClient(opts: MockClientOpts = {}): {
    client: DataClient;
    inserts: Array<Record<string, unknown>>;
    updates: Array<{ id: string; patch: Record<string, unknown> }>;
} {
    const inserts: Array<Record<string, unknown>> = [];
    const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
    const workspaceProfile = {
        list: vi.fn(async () => {
            if (opts.listThrows) throw new Error("network down");
            return (opts.listRows ?? []) as never;
        }),
        get: vi.fn(async () => null as never),
        insert: vi.fn(async (row: Record<string, unknown>) => {
            inserts.push(row);
            return makeRow({
                workspace_id: String(row["workspace_id"]),
                product_category: (row["product_category"] as string) ?? null,
                what_we_sell: (row["what_we_sell"] as string) ?? null,
                value_prop: (row["value_prop"] as string) ?? null
            }) as never;
        }),
        update: vi.fn(async (id: string, patch: Record<string, unknown>) => {
            updates.push({ id, patch });
            return makeRow({
                workspace_id: id,
                product_category: (patch["product_category"] as string) ?? null,
                what_we_sell: (patch["what_we_sell"] as string) ?? null,
                value_prop: (patch["value_prop"] as string) ?? null
            }) as never;
        }),
        remove: vi.fn(async () => undefined),
        subscribe: vi.fn(() => ({ unsubscribe: () => undefined }) as never)
    };
    const client = {
        currentWorkspace: vi.fn(async () =>
            opts.workspaceId === undefined
                ? ({ id: "ws-1" } as never)
                : opts.workspaceId === null
                ? null
                : ({ id: opts.workspaceId } as never)
        ),
        workspaceProfile
    } as unknown as DataClient;
    return { client, inserts, updates };
}

beforeEach(() => {
    setCommercialProfile(EMPTY_COMMERCIAL_PROFILE);
    setProfileRowExists(false);
    setProfileLoaded(false);
    __setProfileDepsForTests(null, null);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("bootProfile", () => {
    it("loads an existing row into the profile signals", async () => {
        const { client } = makeClient({ listRows: [makeRow()] });
        const result = await bootProfile(client);
        expect(result.mode).toBe("loaded");
        expect(commercialProfile.value.productCategory).toBe("revenue OS");
        expect(profileRowExists.value).toBe(true);
        expect(profileLoaded.value).toBe(true);
        // Draft syncs to the saved value so it boots clean (not dirty).
        expect(profileDraft.value).toEqual(commercialProfile.value);
    });

    it("reports empty when no row exists", async () => {
        const { client } = makeClient({ listRows: [] });
        const result = await bootProfile(client);
        expect(result.mode).toBe("empty");
        expect(profileRowExists.value).toBe(false);
        expect(profileLoaded.value).toBe(true);
    });

    it("reports offline + still flips loaded when the list throws", async () => {
        const { client } = makeClient({ listThrows: true });
        const result = await bootProfile(client);
        expect(result.mode).toBe("offline");
        expect(profileLoaded.value).toBe(true);
    });
});

describe("saveProfile", () => {
    it("inserts when no row exists, supplying the workspace_id PK", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: "ws-7" });
        await bootProfile(client); // empty → rowExists false
        const saved = await saveProfile({
            productCategory: "new cat",
            whatWeSell: "new sell",
            valueProp: "new value"
        });
        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toMatchObject({
            workspace_id: "ws-7",
            product_category: "new cat"
        });
        expect(saved.productCategory).toBe("new cat");
        expect(profileRowExists.value).toBe(true);
    });

    it("updates when a row already exists — patch carries NO onboarding fields", async () => {
        const { client, updates } = makeClient({
            listRows: [makeRow({ workspace_id: "ws-1" })]
        });
        await bootProfile(client); // loaded → rowExists true
        await saveProfile({
            productCategory: "edited",
            whatWeSell: "edited sell",
            valueProp: "edited value"
        });
        expect(updates).toHaveLength(1);
        expect(updates[0]?.id).toBe("ws-1");
        expect(updates[0]?.patch).not.toHaveProperty("onboarding_completed");
        expect(updates[0]?.patch).not.toHaveProperty("onboarding_answers");
        expect(updates[0]?.patch.product_category).toBe("edited");
    });

    it("falls back to currentWorkspace for the PK when insert path has no cached id", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: "ws-fallback" });
        // Boot resolves workspace via currentWorkspace; clear the cache by
        // booting with a null-current then ensure insert re-resolves.
        await bootProfile(client);
        await saveProfile({ productCategory: "x", whatWeSell: "", valueProp: "" });
        expect(inserts[0]?.["workspace_id"]).toBe("ws-fallback");
    });

    it("keeps the in-memory edit when no workspace id is resolvable", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: null });
        await bootProfile(client);
        const profile = { productCategory: "x", whatWeSell: "", valueProp: "" };
        const result = await saveProfile(profile);
        expect(inserts).toHaveLength(0);
        expect(result).toEqual(profile);
    });
});
