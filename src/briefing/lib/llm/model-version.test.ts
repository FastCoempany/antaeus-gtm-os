import { describe, expect, it } from "vitest";
import { modelVersionHash, shortModelVersion } from "./model-version";

describe("modelVersionHash", () => {
    const BASE = {
        model_api_id: "claude-haiku-4-5-20251001",
        user_prompt: "test prompt",
        prompt_version: "enrich-1.0"
    };

    it("produces a 64-char hex string", async () => {
        const hash = await modelVersionHash(BASE);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic for identical inputs", async () => {
        const a = await modelVersionHash(BASE);
        const b = await modelVersionHash(BASE);
        expect(a).toBe(b);
    });

    it("differs when model_api_id changes", async () => {
        const a = await modelVersionHash(BASE);
        const b = await modelVersionHash({ ...BASE, model_api_id: "claude-opus-4-7" });
        expect(a).not.toBe(b);
    });

    it("differs when user_prompt changes by even one character", async () => {
        const a = await modelVersionHash(BASE);
        const b = await modelVersionHash({ ...BASE, user_prompt: "test prompts" });
        expect(a).not.toBe(b);
    });

    it("differs when prompt_version changes", async () => {
        const a = await modelVersionHash(BASE);
        const b = await modelVersionHash({ ...BASE, prompt_version: "enrich-2.0" });
        expect(a).not.toBe(b);
    });

    it("differs when system_prompt is added", async () => {
        const a = await modelVersionHash(BASE);
        const b = await modelVersionHash({ ...BASE, system_prompt: "be helpful" });
        expect(a).not.toBe(b);
    });

    it("differs when temperature changes", async () => {
        const a = await modelVersionHash({ ...BASE, temperature: 0 });
        const b = await modelVersionHash({ ...BASE, temperature: 0.5 });
        expect(a).not.toBe(b);
    });

    it("differs when max_tokens changes", async () => {
        const a = await modelVersionHash({ ...BASE, max_tokens: 1000 });
        const b = await modelVersionHash({ ...BASE, max_tokens: 2000 });
        expect(a).not.toBe(b);
    });
});

describe("shortModelVersion", () => {
    it("returns the first 12 chars of a hash", () => {
        const hash =
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
        expect(shortModelVersion(hash)).toBe("2cf24dba5fb0");
    });

    it("handles a short input gracefully", () => {
        expect(shortModelVersion("abc")).toBe("abc");
    });
});
