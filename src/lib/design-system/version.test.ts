/**
 * Design-system version sync gate.
 *
 * The design system's version lives in three places (scoping doc Part
 * VI §6.2): deliverables/design-system/VERSION, the package.json
 * `antaeusDesignSystem` field, and the README header. This test fails
 * the build when they drift, which makes version sync CI-blocking
 * through the existing unit-test job with no workflow changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function read(rel: string): string {
    return readFileSync(resolve(root, rel), "utf8");
}

describe("design-system version sync", () => {
    const versionFile = read("deliverables/design-system/VERSION").trim();

    it("VERSION is a semver string", () => {
        expect(versionFile).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("package.json antaeusDesignSystem matches VERSION", () => {
        const pkg = JSON.parse(read("package.json")) as {
            antaeusDesignSystem?: string;
        };
        expect(pkg.antaeusDesignSystem).toBe(versionFile);
    });

    it("CHANGELOG has an entry for the current version", () => {
        const changelog = read("deliverables/design-system/CHANGELOG.md");
        expect(changelog).toContain(`## ${versionFile}`);
    });

    it("README header carries the current version", () => {
        const readme = read("deliverables/design-system/README.md");
        expect(readme).toContain(`**Version:** ${versionFile}`);
    });

    it("the canonical tokens file exists and carries the core roles", () => {
        const tokens = read("src/styles/tokens.css");
        for (const token of [
            "--ds-orange",
            "--ds-ink",
            "--ds-field",
            "--ds-motion-base",
            "--ds-z-wayfinder",
            "--ds-page-max",
            "--ds-measure",
        ]) {
            expect(tokens).toContain(token);
        }
    });
});
