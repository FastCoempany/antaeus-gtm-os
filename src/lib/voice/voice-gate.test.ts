/**
 * The voice gate — strict everywhere, CI-blocking (01 §2.5).
 *
 * Walks every production source file under src/, extracts every t()
 * declaration (gate-scan.ts, full-source scanning), and validates each
 * string. Because vitest runs in the existing CI unit-test job, a
 * failing string blocks the merge with no workflow changes.
 *
 * Waivers: a t() call preceded by `// voice-waiver: <rule> — <reason>`
 * (same line or the line above) is skipped and counted. The gate fails
 * when active waivers exceed the product-wide ceiling of 10 (decision
 * #4, 2026-06-08). Waivers are founder-approved canon changes.
 */
import { describe, expect, it } from "vitest";
import { relative, resolve } from "node:path";
import { validateString } from "./validator";
import { extractStringsFromFile, walkSources } from "./gate-scan";

const SRC_ROOT = resolve(__dirname, "../..");
const WAIVER_CEILING = 10;

describe("voice gate — every declared operator-facing string passes", () => {
    const files = walkSources(SRC_ROOT);
    const all = files.flatMap((f) =>
        extractStringsFromFile(f, relative(SRC_ROOT, f)),
    );
    const active = all.filter((s) => !s.waived);
    const waived = all.filter((s) => s.waived);

    it(`active waivers stay at or under the ceiling of ${WAIVER_CEILING}`, () => {
        expect(
            waived.length,
            `Waived strings:\n${waived.map((w) => `  ${w.file}:${w.line} "${w.text}"`).join("\n")}`,
        ).toBeLessThanOrEqual(WAIVER_CEILING);
    });

    it("every non-waived t() string passes the validator", () => {
        const failures: string[] = [];
        for (const s of active) {
            const result = validateString(s.text, {
                class: s.stringClass,
                family: s.family,
            });
            if (!result.ok) {
                const detail = result.violations
                    .filter((v) => v.severity === "error")
                    .map((v) => `${v.rule}: ${v.detail}`)
                    .join("; ");
                failures.push(`${s.file}:${s.line} "${s.text}" → ${detail}`);
            }
        }
        expect(
            failures,
            `Voice gate failures:\n${failures.join("\n")}`,
        ).toEqual([]);
    });
});
