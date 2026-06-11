/**
 * Extraction unit tests — these encode the adversarial findings of
 * 2026-06-08 so the gate can never silently regress to missing the
 * strings it exists to catch.
 */
import { describe, expect, it } from "vitest";
import { extractStringsFromSource } from "./gate-scan";

describe("t() extraction", () => {
    it("finds a simple single-line call", () => {
        const found = extractStringsFromSource(`const a = t("Send it now");`, "x.tsx");
        expect(found).toHaveLength(1);
        expect(found[0].text).toBe("Send it now");
        expect(found[0].stringClass).toBe("label");
    });

    it("finds a prettier-wrapped call with meta and trailing comma", () => {
        // The exact shape prettier produces for long calls — the case
        // the original per-line scanner missed entirely.
        const source = [
            `const msg = t(`,
            `    "A long operator-facing sentence that prettier wrapped onto its own line.",`,
            `    { class: "body", family: "command-chamber" },`,
            `);`,
        ].join("\n");
        const found = extractStringsFromSource(source, "x.tsx");
        expect(found).toHaveLength(1);
        expect(found[0].text).toContain("prettier wrapped");
        expect(found[0].stringClass).toBe("body");
        expect(found[0].family).toBe("command-chamber");
        expect(found[0].line).toBe(1); // the call starts on line 1
    });

    it("parses meta class and family on one line", () => {
        const found = extractStringsFromSource(
            `t("Quiet for eleven days.", { class: "authored", family: "system-ledger" })`,
            "x.tsx",
        );
        expect(found[0].stringClass).toBe("authored");
        expect(found[0].family).toBe("system-ledger");
    });

    it("does not match it(), format(), or other -t( suffixed calls", () => {
        const source = [
            `it("a test name", () => {});`,
            `format("not operator facing");`,
            `expect("nothing");`,
        ].join("\n");
        expect(extractStringsFromSource(source, "x.tsx")).toHaveLength(0);
    });

    it("handles escaped quotes inside the string", () => {
        const found = extractStringsFromSource(
            `t("The \\"pilot\\" results are in.")`,
            "x.tsx",
        );
        expect(found[0].text).toBe(`The "pilot" results are in.`);
    });

    it("marks a same-line waiver", () => {
        const found = extractStringsFromSource(
            `const a = t("Invalid login credentials"); // voice-waiver: third-party — Supabase verbatim`,
            "x.tsx",
        );
        expect(found[0].waived).toBe(true);
    });

    it("marks a line-above waiver on a wrapped call", () => {
        const source = [
            `// voice-waiver: legal — terms text is legally fixed`,
            `const a = t(`,
            `    "Legally constrained sentence goes here.",`,
            `    { class: "body" },`,
            `);`,
        ].join("\n");
        const found = extractStringsFromSource(source, "x.tsx");
        expect(found[0].waived).toBe(true);
    });

    it("does not waive a call with no waiver comment nearby", () => {
        const source = [
            `// voice-waiver: somewhere far away`,
            `const unrelated = 1;`,
            `const b = 2;`,
            `const a = t("Send it now");`,
        ].join("\n");
        expect(extractStringsFromSource(source, "x.tsx")[0].waived).toBe(false);
    });

    it("finds multiple calls and reports correct line numbers", () => {
        const source = [
            `const a = t("One");`,
            ``,
            `const b = t("Two", { class: "label" });`,
        ].join("\n");
        const found = extractStringsFromSource(source, "x.tsx");
        expect(found).toHaveLength(2);
        expect(found[0].line).toBe(1);
        expect(found[1].line).toBe(3);
    });
});
