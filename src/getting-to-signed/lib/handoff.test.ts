import { describe, expect, it } from "vitest";
import {
    buildNegotiationHref,
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToPocFramework
} from "./handoff";

/**
 * Negotiation handoff invariants (per
 * `deliverables/audit/continuity-params-2026-05.md`).
 *
 * Most-important assertion: Invariant 8 — when there is no real
 * focusObject value, the param MUST NOT be written (no placeholder
 * strings like "Negotiation deal" that downstream rooms would
 * accidentally consume as a real account name).
 */

describe("buildNegotiationHref", () => {
    it("writes all six canonical continuity params", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "Acme Corp"
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("returnTo")).toBe("/negotiation/");
        expect(qs.get("returnLabel")).toBe("Back to Negotiation");
        expect(qs.get("focusObject")).toBe("Acme Corp");
        expect(qs.get("focusRoom")).toBe("Deal Workspace");
        expect(qs.get("fromMode")).toBe("room");
        expect(qs.get("fromSurface")).toBe("negotiation");
    });

    it("Invariant 8 — omits focusObject when undefined", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace"
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.has("focusObject")).toBe(false);
        // Other params still written.
        expect(qs.get("returnTo")).toBe("/negotiation/");
        expect(qs.get("focusRoom")).toBe("Deal Workspace");
    });

    it("Invariant 8 — omits focusObject when whitespace-only", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "   "
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.has("focusObject")).toBe(false);
    });

    it("Invariant 8 — omits focusObject when empty string", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: ""
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.has("focusObject")).toBe(false);
    });

    it("trims focusObject before writing", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "  Acme  "
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("focusObject")).toBe("Acme");
    });

    it("respects pre-existing returnTo on the href", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/?returnTo=/dashboard/&returnLabel=Dashboard",
            roomLabel: "Deal Workspace",
            focusObject: "Acme"
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        // Pre-existing returnTo wins — preserves nested-handoff continuity.
        expect(qs.get("returnTo")).toBe("/dashboard/");
        expect(qs.get("returnLabel")).toBe("Dashboard");
        // focusObject still not written when returnTo is pre-set.
        expect(qs.has("focusObject")).toBe(false);
    });

    it("merges extra params alongside continuity params", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "Acme",
            extra: { deal: "deal-123" }
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("deal")).toBe("deal-123");
        expect(qs.get("focusObject")).toBe("Acme");
    });

    it("skips empty extra-param values", () => {
        const url = buildNegotiationHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            extra: { deal: "", account: "Acme" }
        });
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.has("deal")).toBe(false);
        expect(qs.get("account")).toBe("Acme");
    });
});

describe("hrefToDealWorkspace", () => {
    it("threads `?deal=` when dealId is supplied", () => {
        const url = hrefToDealWorkspace("deal-123", "Acme");
        expect(url).toContain("/deal-workspace/?deal=deal-123");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("focusObject")).toBe("Acme");
        expect(qs.get("focusRoom")).toBe("Deal Workspace");
    });

    it("omits `?deal=` when dealId is missing", () => {
        const url = hrefToDealWorkspace();
        expect(url.startsWith("/deal-workspace/?")).toBe(true);
        expect(url).not.toContain("deal=");
        const qs = new URLSearchParams(url.split("?")[1]);
        // Invariant 8 — no focusObject when accountName is missing.
        expect(qs.has("focusObject")).toBe(false);
    });

    it("URL-encodes the deal id", () => {
        const url = hrefToDealWorkspace("deal/with/slash");
        expect(url).toContain("/deal-workspace/?deal=deal%2Fwith%2Fslash");
    });
});

describe("hrefToFutureAutopsy", () => {
    it("threads `?deal=` and writes focusRoom", () => {
        const url = hrefToFutureAutopsy("deal-123", "Acme");
        expect(url).toContain("/future-autopsy/?deal=deal-123");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("focusRoom")).toBe("Future Autopsy");
    });

    it("Invariant 8 — omits focusObject when accountName is missing", () => {
        const url = hrefToFutureAutopsy("deal-123");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.has("focusObject")).toBe(false);
    });
});

describe("hrefToAdvisorDeploy", () => {
    it("writes focusRoom = Advisor Deploy", () => {
        const url = hrefToAdvisorDeploy("deal-123", "Acme");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("focusRoom")).toBe("Advisor Deploy");
        expect(qs.get("focusObject")).toBe("Acme");
    });

    it("works with no args at all (cold landing)", () => {
        const url = hrefToAdvisorDeploy();
        expect(url).toContain("/advisor-deploy/?");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("returnTo")).toBe("/negotiation/");
        expect(qs.has("deal")).toBe(false);
        expect(qs.has("focusObject")).toBe(false);
    });
});

describe("hrefToPocFramework", () => {
    it("writes focusRoom = PoC Framework", () => {
        const url = hrefToPocFramework("deal-123", "Acme");
        const qs = new URLSearchParams(url.split("?")[1]);
        expect(qs.get("focusRoom")).toBe("PoC Framework");
        expect(qs.get("focusObject")).toBe("Acme");
    });
});
