import { describe, expect, it } from "vitest";
import { isPlaceholderName } from "./placeholders";

describe("isPlaceholderName", () => {
    it("flags the migration blob sentinel", () => {
        expect(isPlaceholderName("__gtmos_migration_blob__")).toBe(true);
    });

    it("flags any double-underscore-wrapped name", () => {
        expect(isPlaceholderName("__placeholder__")).toBe(true);
        expect(isPlaceholderName("__x__")).toBe(true);
    });

    it("flags a bare gtmos_migration_blob substring", () => {
        expect(isPlaceholderName("gtmos_migration_blob")).toBe(true);
        expect(isPlaceholderName("row gtmos_migration_blob 1")).toBe(true);
    });

    it("does NOT flag real account names", () => {
        expect(isPlaceholderName("Acme")).toBe(false);
        expect(isPlaceholderName("Home Depot")).toBe(false);
        expect(isPlaceholderName("Cascadia Health Systems")).toBe(false);
    });

    it("does NOT flag names with a single leading underscore", () => {
        expect(isPlaceholderName("_internal")).toBe(false);
        expect(isPlaceholderName("my_account")).toBe(false);
    });

    it("returns false for null/undefined/empty (handled elsewhere)", () => {
        expect(isPlaceholderName(null)).toBe(false);
        expect(isPlaceholderName(undefined)).toBe(false);
        expect(isPlaceholderName("")).toBe(false);
        expect(isPlaceholderName("   ")).toBe(false);
    });
});
