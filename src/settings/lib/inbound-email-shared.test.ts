import { describe, it, expect } from "vitest";
import {
    parseInbound,
    extractCaptureToken,
    matchAccount,
    buildTouchBlob
} from "../../../supabase/functions/inbound-email/_shared";

describe("inbound email parsing", () => {
    it("finds the capture token and keeps the real recipients", () => {
        const mail = parseInbound({
            From: "Founder <me@vectyr.ai>",
            ToFull: [{ email: "sarah.chen@northwind.com" }],
            BccFull: [{ email: "log+aabbccddeeff0011@in.antaeus.app" }],
            Subject: "Quick question about your forecast rebuild",
            Date: "2026-07-10T14:00:00Z"
        });
        expect(mail.captureToken).toBe("aabbccddeeff0011");
        expect(mail.recipients).toEqual(["sarah.chen@northwind.com"]);
        expect(mail.from).toBe("me@vectyr.ai");
        expect(mail.sentAt).toBe("2026-07-10T14:00:00.000Z");
    });

    it("parses raw comma lists with display names", () => {
        const mail = parseInbound({
            To: '"Chen, Sarah" <sarah@northwind.com>, log+aabbccddeeff@in.antaeus.app',
            Subject: "hi"
        });
        expect(mail.captureToken).toBe("aabbccddeeff");
        expect(mail.recipients).toEqual(["sarah@northwind.com"]);
    });

    it("no token → null, mail is skippable", () => {
        expect(extractCaptureToken(["someone@example.com"])).toBeNull();
    });
});

describe("matchAccount", () => {
    const accounts = [
        { name: "Northwind Robotics", domain: "northwind.com" },
        { name: "Apex Manufacturing", domain: null }
    ];

    it("matches by domain, including subdomains", () => {
        expect(matchAccount(["sarah@mail.northwind.com"], accounts)).toBe("Northwind Robotics");
    });

    it("falls back to the account name inside the domain", () => {
        expect(matchAccount(["ops@apexmanufacturing.io"], accounts)).toBe("Apex Manufacturing");
    });

    it("no match → null", () => {
        expect(matchAccount(["x@unrelated.com"], accounts)).toBeNull();
    });
});

describe("buildTouchBlob", () => {
    it("carries subject + recipient, never a body, channel email", () => {
        const blob = buildTouchBlob({
            accountName: "Northwind Robotics",
            recipient: "sarah@northwind.com",
            subject: "Quick question",
            sentAt: "2026-07-10T14:00:00.000Z"
        });
        expect(blob).toMatchObject({
            accountName: "Northwind Robotics",
            channel: "email",
            content: "Quick question",
            capturedVia: "bcc",
            createdAt: "2026-07-10T14:00:00.000Z"
        });
        expect(JSON.stringify(blob)).not.toContain("Body");
    });
});
