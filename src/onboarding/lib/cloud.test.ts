import { describe, expect, it, vi } from "vitest";
import {
    isOnboardingCompleteInCloud,
    persistOnboardingToCloud
} from "./cloud";
import type { OnboardingDraft } from "./types";
import type { DataClient } from "@/lib/data-client";

const DRAFT: OnboardingDraft = {
    companyName: "Antaeus",
    role: "founder",
    productCategory: "cx-support-automation",
    industries: [],
    industryAgnostic: false,
    icpStatement: "Founder-led B2B SaaS",
    icpPain: "handoff confusion",
    firstAccountName: "Acme",
    firstAccountSignal: "hiring a CRO",
    annualQuota: 1_000_000,
    avgDealSize: 25_000
};

interface MockOpts {
    listRows?: Array<{ workspace_id: string; onboarding_completed?: boolean }>;
    listThrows?: boolean;
    workspaceId?: string | null;
}

function makeClient(opts: MockOpts = {}): {
    client: DataClient;
    inserts: Array<Record<string, unknown>>;
    updates: Array<{ id: string; patch: Record<string, unknown> }>;
} {
    const inserts: Array<Record<string, unknown>> = [];
    const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
    const workspaceProfile = {
        list: vi.fn(async () => {
            if (opts.listThrows) throw new Error("down");
            return (opts.listRows ?? []) as never;
        }),
        get: vi.fn(async () => null as never),
        insert: vi.fn(async (row: Record<string, unknown>) => {
            inserts.push(row);
            return row as never;
        }),
        update: vi.fn(async (id: string, patch: Record<string, unknown>) => {
            updates.push({ id, patch });
            return { workspace_id: id, ...patch } as never;
        }),
        remove: vi.fn(async () => undefined),
        subscribe: vi.fn(() => ({ unsubscribe: () => undefined }) as never)
    };
    const client = {
        currentWorkspace: vi.fn(async () =>
            opts.workspaceId === null ? null : ({ id: opts.workspaceId ?? "ws-1" } as never)
        ),
        workspaceProfile
    } as unknown as DataClient;
    return { client, inserts, updates };
}

describe("persistOnboardingToCloud", () => {
    it("updates the onboarding columns when a row exists — never commercial fields", async () => {
        const { client, updates } = makeClient({
            listRows: [{ workspace_id: "ws-1" }]
        });
        const r = await persistOnboardingToCloud(client, DRAFT);
        expect(r.persisted).toBe(true);
        expect(updates).toHaveLength(1);
        expect(updates[0]?.id).toBe("ws-1");
        expect(updates[0]?.patch).toMatchObject({ onboarding_completed: true });
        expect(updates[0]?.patch).toHaveProperty("onboarding_answers");
        // Single source of truth: NEVER clobber the commercial profile.
        expect(updates[0]?.patch).not.toHaveProperty("product_category");
        expect(updates[0]?.patch).not.toHaveProperty("value_prop");
        expect(updates[0]?.patch).not.toHaveProperty("what_we_sell");
    });

    it("inserts with the workspace_id PK + onboarding cols when no row exists", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: "ws-9" });
        const r = await persistOnboardingToCloud(client, DRAFT);
        expect(r.persisted).toBe(true);
        expect(inserts).toHaveLength(1);
        expect(inserts[0]).toMatchObject({
            workspace_id: "ws-9",
            onboarding_completed: true
        });
        expect(inserts[0]).not.toHaveProperty("product_category");
    });

    it("captures the answers shape from the draft", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: "ws-1" });
        await persistOnboardingToCloud(client, DRAFT);
        const answers = inserts[0]?.["onboarding_answers"] as Record<string, unknown>;
        expect(answers.companyName).toBe("Antaeus");
        expect(answers.role).toBe("founder");
        expect(answers.productCategory).toBe("cx-support-automation");
        expect(answers.industries).toEqual([]);
        expect(answers.industryAgnostic).toBe(false);
        expect(answers.firstAccount).toBe("Acme");
    });

    it("returns persisted:false (no throw) when no workspace resolvable", async () => {
        const { client, inserts } = makeClient({ listRows: [], workspaceId: null });
        const r = await persistOnboardingToCloud(client, DRAFT);
        expect(r.persisted).toBe(false);
        expect(inserts).toHaveLength(0);
    });

    it("returns persisted:false (no throw) when the list call fails", async () => {
        const { client } = makeClient({ listThrows: true });
        const r = await persistOnboardingToCloud(client, DRAFT);
        expect(r.persisted).toBe(false);
    });
});

describe("isOnboardingCompleteInCloud", () => {
    it("true when a row has onboarding_completed", async () => {
        const { client } = makeClient({
            listRows: [{ workspace_id: "ws-1", onboarding_completed: true }]
        });
        expect(await isOnboardingCompleteInCloud(client)).toBe(true);
    });

    it("false when the row exists but onboarding_completed is false", async () => {
        const { client } = makeClient({
            listRows: [{ workspace_id: "ws-1", onboarding_completed: false }]
        });
        expect(await isOnboardingCompleteInCloud(client)).toBe(false);
    });

    it("false when no row exists", async () => {
        const { client } = makeClient({ listRows: [] });
        expect(await isOnboardingCompleteInCloud(client)).toBe(false);
    });

    it("false (fail open) when the read throws", async () => {
        const { client } = makeClient({ listThrows: true });
        expect(await isOnboardingCompleteInCloud(client)).toBe(false);
    });
});
