import { describe, expect, it } from "vitest";
import {
    buildLinkedInRoomHref,
    hrefToOutboundStudio,
    hrefToSignalConsole,
    readInboundAccount
} from "./handoff";

describe("buildLinkedInRoomHref", () => {
    it("appends the canonical continuity params", () => {
        const url = buildLinkedInRoomHref({
            href: "/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console"
        });
        expect(url).toContain("returnTo=%2Flinkedin-playbook%2F");
        expect(url).toContain("returnLabel=Back+to+LinkedIn+Playbook");
        expect(url).toContain("focusObject=Acme");
        expect(url).toContain("focusRoom=Signal+Console");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=linkedin-playbook");
    });

    it("omits focusObject when blank + falls back roomLabel", () => {
        // Phase 2.4 audit — Invariant 8: empty focus = no param.
        // The "LinkedIn cue" placeholder was retired (it leaked into
        // the destination's focused-object slot on every cold cross-
        // room handoff). roomLabel still defaults to "LinkedIn
        // Playbook" since it's a label, not user data.
        const url = buildLinkedInRoomHref({
            href: "/signal-console/",
            focusObject: "",
            roomLabel: ""
        });
        expect(url).not.toContain("focusObject=");
        expect(url).toContain("focusRoom=LinkedIn+Playbook");
    });

    it("preserves any pre-existing query params on the href", () => {
        const url = buildLinkedInRoomHref({
            href: "/outbound-studio/?temp=warm",
            focusObject: "Acme",
            roomLabel: "Outbound Studio"
        });
        expect(url).toContain("temp=warm");
        expect(url).toContain("returnTo=%2Flinkedin-playbook%2F");
    });

    it("includes ?account= when supplied", () => {
        const url = buildLinkedInRoomHref({
            href: "/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console",
            account: "Acme"
        });
        expect(url).toContain("account=Acme");
    });

    it("merges extra params, ignoring blanks", () => {
        const url = buildLinkedInRoomHref({
            href: "/poc-framework/",
            focusObject: "Acme",
            roomLabel: "PoC",
            extra: { stage: "demo", blank: "" }
        });
        expect(url).toContain("stage=demo");
        expect(url).not.toContain("blank=");
    });
});

describe("hrefToSignalConsole / hrefToOutboundStudio", () => {
    it("send to the right path with the focus object", () => {
        expect(hrefToSignalConsole("Acme")).toContain(
            "/signal-console/"
        );
        expect(hrefToOutboundStudio("Acme")).toContain(
            "/outbound-studio/"
        );
    });

    it("threads ?account= through both", () => {
        expect(hrefToSignalConsole("Acme")).toContain("account=Acme");
        expect(hrefToOutboundStudio("Acme")).toContain("account=Acme");
    });

    it("omits focusObject when account is empty (Invariant 8)", () => {
        // Phase 2.4 audit retired the "LinkedIn cue" placeholder.
        const url = hrefToSignalConsole("");
        expect(url).not.toContain("focusObject=");
        // Continuity still present.
        expect(url).toContain("returnTo=%2Flinkedin-playbook%2F");
    });
});

describe("readInboundAccount", () => {
    it("reads ?account= when present", () => {
        expect(readInboundAccount("?account=Acme")).toBe("Acme");
    });

    it("does NOT fall back to ?focusObject= (PR #23 Codex P2 fix)", () => {
        // buildLinkedInRoomHref defaults focusObject to the placeholder
        // "LinkedIn cue" when no real account is supplied; falling back to
        // it here would prefill the cue ledger with that literal string
        // on roundtrip and pollute the action log.
        expect(readInboundAccount("?focusObject=LinkedIn+cue")).toBeNull();
        expect(readInboundAccount("?focusObject=Beta")).toBeNull();
    });

    it("returns null when ?account= is not set", () => {
        expect(readInboundAccount("")).toBeNull();
        expect(readInboundAccount("?other=42")).toBeNull();
    });

    it("ignores focusObject even when account is also set", () => {
        expect(readInboundAccount("?account=Acme&focusObject=Beta")).toBe(
            "Acme"
        );
    });
});
