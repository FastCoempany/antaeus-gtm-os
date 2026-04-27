import { describe, expect, it } from "vitest";
import { loadActions, saveActions } from "./persistence";
import type { ActionEntry } from "./types";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.store.set(k, v);
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

function makeEntry(p: Partial<ActionEntry>): ActionEntry {
    return {
        id: p.id ?? "li-1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "Sarah",
        actionType: p.actionType ?? "content_engage",
        temperature: p.temperature ?? "ice_cold",
        content: p.content ?? "",
        motionKey: p.motionKey ?? "credibility",
        motionLabel: p.motionLabel ?? "",
        cueLabel: p.cueLabel ?? "",
        whyNow: p.whyNow ?? "",
        recommendedNext: p.recommendedNext ?? "",
        outcome: p.outcome ?? null,
        outcomeDate: p.outcomeDate ?? null,
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("loadActions", () => {
    it("returns [] when storage is null", () => {
        expect(loadActions(null)).toHaveLength(0);
    });

    it("returns [] when key is missing", () => {
        const s = new MemStorage();
        expect(loadActions(s)).toHaveLength(0);
    });

    it("returns [] when JSON is malformed", () => {
        const s = new MemStorage();
        s.seed("gtmos_linkedin_log", "{not json");
        expect(loadActions(s)).toHaveLength(0);
    });

    it("returns [] when shape is wrong (no actions array)", () => {
        const s = new MemStorage();
        s.seed("gtmos_linkedin_log", JSON.stringify({ actions: "nope" }));
        expect(loadActions(s)).toHaveLength(0);
    });

    it("drops malformed rows but keeps good ones", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_linkedin_log",
            JSON.stringify({
                actions: [
                    makeEntry({ id: "good-1" }),
                    null,
                    { missing: "fields" },
                    {
                        ...makeEntry({}),
                        actionType: "ghost-action"
                    },
                    makeEntry({ id: "good-2" })
                ]
            })
        );
        const out = loadActions(s);
        expect(out.map((c) => c.id)).toEqual(["good-1", "good-2"]);
    });

    it("normalizes unknown outcome to null", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_linkedin_log",
            JSON.stringify({
                actions: [
                    {
                        ...makeEntry({}),
                        outcome: "made-up"
                    }
                ]
            })
        );
        const out = loadActions(s);
        expect(out[0]?.outcome).toBeNull();
    });

    it("normalizes unknown motionKey to credibility", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_linkedin_log",
            JSON.stringify({
                actions: [
                    {
                        ...makeEntry({}),
                        motionKey: "weird"
                    }
                ]
            })
        );
        expect(loadActions(s)[0]?.motionKey).toBe("credibility");
    });

    it("normalizes unknown temperature to ice_cold", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_linkedin_log",
            JSON.stringify({
                actions: [
                    {
                        ...makeEntry({}),
                        temperature: "lukewarm"
                    }
                ]
            })
        );
        expect(loadActions(s)[0]?.temperature).toBe("ice_cold");
    });

    it("preserves valid entries verbatim", () => {
        const s = new MemStorage();
        const entry = makeEntry({
            id: "x",
            accountName: "Acme",
            contactName: "Sarah",
            actionType: "connection_request",
            outcome: "accepted",
            outcomeDate: "2026-04-27T01:00:00Z"
        });
        s.seed(
            "gtmos_linkedin_log",
            JSON.stringify({ actions: [entry] })
        );
        expect(loadActions(s)[0]).toEqual(entry);
    });
});

describe("saveActions", () => {
    it("writes the actions[] envelope shape (legacy parity)", () => {
        const s = new MemStorage();
        saveActions([makeEntry({ id: "a" }), makeEntry({ id: "b" })], s);
        const raw = s.getItem("gtmos_linkedin_log");
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string) as { actions: unknown[] };
        expect(Array.isArray(parsed.actions)).toBe(true);
        expect(parsed.actions).toHaveLength(2);
    });

    it("round-trips through loadActions", () => {
        const s = new MemStorage();
        const entries = [makeEntry({ id: "1" }), makeEntry({ id: "2" })];
        saveActions(entries, s);
        expect(loadActions(s).map((c) => c.id)).toEqual(["1", "2"]);
    });
});
