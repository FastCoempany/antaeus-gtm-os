import { describe, expect, it } from "vitest";
import { getAccountExecutionContext } from "./execution-context";
import type { Account } from "./types";

function acct(name: string): Account {
    return { id: "a", name, signals: [] };
}

function storage(deals: unknown, touches: unknown): { getItem: (k: string) => string | null } {
    return {
        getItem(key: string): string | null {
            if (key === "gtmos_deal_workspaces") return JSON.stringify(deals);
            if (key === "gtmos_outbound_touches") return JSON.stringify(touches);
            return null;
        }
    };
}

describe("getAccountExecutionContext", () => {
    it("returns ice_cold when no storage is provided", () => {
        const ctx = getAccountExecutionContext(acct("Acme"), null);
        expect(ctx.temperature).toBe("ice_cold");
        expect(ctx.touchCount).toBe(0);
    });

    it("returns ice_cold when storage has nothing for the account", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage([], { touches: [] })
        );
        expect(ctx.temperature).toBe("ice_cold");
        expect(ctx.hasActiveDeal).toBe(false);
        expect(ctx.hasReplies).toBe(false);
    });

    it("returns cool when there are touches but no replies and no deal", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage([], { touches: [{ account: "Acme", outcome: "sent" }] })
        );
        expect(ctx.temperature).toBe("cool");
        expect(ctx.touchCount).toBe(1);
    });

    it("returns warm when reply outcomes exist", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage([], {
                touches: [
                    { account: "Acme", outcome: "sent" },
                    { account: "Acme", outcome: "replied" }
                ]
            })
        );
        expect(ctx.temperature).toBe("warm");
        expect(ctx.hasReplies).toBe(true);
    });

    it("returns warm when a prospect-stage deal exists (no reply)", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage([{ accountName: "Acme", stage: "prospect" }], { touches: [] })
        );
        expect(ctx.temperature).toBe("warm");
        expect(ctx.hasActiveDeal).toBe(true);
    });

    it("returns hot when a deal exists past prospect stage", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage([{ accountName: "Acme", stage: "negotiation" }], { touches: [] })
        );
        expect(ctx.temperature).toBe("hot");
        expect(ctx.hasActiveDeal).toBe(true);
    });

    it("ignores closed deals (won/lost)", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage(
                [
                    { accountName: "Acme", stage: "closed-won" },
                    { accountName: "Acme", stage: "closed-lost" }
                ],
                { touches: [] }
            )
        );
        expect(ctx.hasActiveDeal).toBe(false);
        expect(ctx.temperature).toBe("ice_cold");
    });

    it("matches account names case-insensitively", () => {
        const ctx = getAccountExecutionContext(
            acct("ACME"),
            storage([{ accountName: "acme", stage: "discovery" }], { touches: [] })
        );
        expect(ctx.hasActiveDeal).toBe(true);
        expect(ctx.temperature).toBe("hot");
    });

    it("survives malformed deal/touch data", () => {
        const ctx = getAccountExecutionContext(
            acct("Acme"),
            storage("not an array", { touches: "garbage" })
        );
        expect(ctx.temperature).toBe("ice_cold");
    });
});
