import { describe, expect, it } from "vitest";
import {
    buildColdCallHref,
    createDealFromCall,
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToSignalConsole,
    readInboundAccount
} from "./handoff";

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
    raw(): Map<string, string> {
        return this.store;
    }
}

describe("buildColdCallHref", () => {
    it("appends the canonical continuity params", () => {
        const url = buildColdCallHref({
            href: "/app/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console"
        });
        expect(url).toContain("returnTo=%2Fapp%2Fcold-call-studio%2F");
        expect(url).toContain("returnLabel=Back+to+Cold+Call+Studio");
        expect(url).toContain("focusObject=Acme");
        expect(url).toContain("focusRoom=Signal+Console");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=cold-call-studio");
    });

    it("preserves any pre-existing query params on the href", () => {
        const url = buildColdCallHref({
            href: "/app/deal-workspace/?stage=prospect",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        expect(url).toContain("stage=prospect");
        expect(url).toContain("returnTo=%2Fapp%2Fcold-call-studio%2F");
    });

    it("includes ?account= when supplied", () => {
        const url = buildColdCallHref({
            href: "/app/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace",
            account: "Acme"
        });
        expect(url).toContain("account=Acme");
    });

    it("merges extra params, ignoring blanks", () => {
        const url = buildColdCallHref({
            href: "/app/poc-framework/",
            focusObject: "Acme",
            roomLabel: "PoC",
            extra: { thread: "ask", blank: "" }
        });
        expect(url).toContain("thread=ask");
        expect(url).not.toContain("blank=");
    });
});

describe("hrefToSignalConsole / hrefToCallPlanner / hrefToDealWorkspace", () => {
    it("send to the right path with the focus object", () => {
        expect(hrefToSignalConsole("Acme")).toContain("/app/signal-console/");
        expect(hrefToCallPlanner("Acme")).toContain("/app/discovery-agenda/");
        expect(hrefToDealWorkspace("Acme")).toContain("/app/deal-workspace/");
    });

    it("fall back to a sensible focus object when account is empty", () => {
        const url = hrefToSignalConsole("");
        expect(url).toContain("focusObject=Cold+call+prep");
    });
});

describe("readInboundAccount", () => {
    it("reads ?account= when present", () => {
        expect(readInboundAccount("?account=Acme")).toBe("Acme");
    });

    it("falls back to ?focusObject= when account is missing", () => {
        expect(readInboundAccount("?focusObject=Beta")).toBe("Beta");
    });

    it("returns null when neither is set", () => {
        expect(readInboundAccount("")).toBeNull();
        expect(readInboundAccount("?other=42")).toBeNull();
    });

    it("prefers account over focusObject when both are set", () => {
        expect(readInboundAccount("?account=Acme&focusObject=Beta")).toBe(
            "Acme"
        );
    });

    it("returns null on malformed search", () => {
        // URLSearchParams is forgiving, but verify pure path behaves
        expect(readInboundAccount("?")).toBeNull();
    });
});

describe("createDealFromCall", () => {
    it("appends a fresh deal record into gtmos_deal_workspaces", () => {
        const s = new MemStorage();
        const id = createDealFromCall("Acme", 1746000000000, s);
        expect(id).not.toBeNull();
        const raw = s.getItem("gtmos_deal_workspaces");
        expect(raw).not.toBeNull();
        const arr = JSON.parse(raw as string) as Array<{
            id: string;
            accountName: string;
            stage: string;
            nextStep: string;
        }>;
        expect(arr).toHaveLength(1);
        expect(arr[0]?.accountName).toBe("Acme");
        expect(arr[0]?.stage).toBe("prospect");
        expect(arr[0]?.nextStep).toContain("First meeting from cold call");
    });

    it("preserves prior deals when appending", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "existing", accountName: "Beta", stage: "demo" }])
        );
        createDealFromCall("Acme", 1, s);
        const arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{ id: string }>;
        expect(arr.map((d) => d.id)).toEqual(["existing", expect.any(String)]);
    });

    it("starts fresh when prior storage is hostile JSON", () => {
        const s = new MemStorage();
        s.seed("gtmos_deal_workspaces", "{not-json");
        const id = createDealFromCall("Acme", 1, s);
        expect(id).not.toBeNull();
        const arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as unknown[];
        expect(arr).toHaveLength(1);
    });

    it("returns null when account name is empty (won't write)", () => {
        const s = new MemStorage();
        const id = createDealFromCall("", 1, s);
        expect(id).toBeNull();
        expect(s.getItem("gtmos_deal_workspaces")).toBeNull();
    });

    it("returns null when storage is null", () => {
        const id = createDealFromCall("Acme", 1, null);
        expect(id).toBeNull();
    });
});
