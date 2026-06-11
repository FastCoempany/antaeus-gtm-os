/**
 * The voice gate — strict everywhere, CI-blocking (01 §2.5).
 *
 * Walks every production source file under src/, extracts every t()
 * declaration, and validates each string against the voice rules.
 * Because vitest runs in the existing CI unit-test job, a failing
 * string blocks the merge with no workflow changes — the strictest
 * posture, locked at founder direction.
 *
 * Waivers: a t() call preceded by `// voice-waiver: <rule> — <reason>`
 * (same line or the line above) is skipped and counted. The gate fails
 * when active waivers exceed the product-wide ceiling of 10 (decision
 * #4, 2026-06-08). Waivers are founder-approved canon changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { validateString, type StringClass } from "./validator";
import type { VoiceFamily } from "./family-temperatures";

const SRC_ROOT = resolve(__dirname, "../..");
const WAIVER_CEILING = 10;

interface FoundString {
    readonly file: string;
    readonly line: number;
    readonly text: string;
    readonly stringClass: StringClass;
    readonly family: VoiceFamily | undefined;
    readonly waived: boolean;
}

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full, out);
        } else if (
            /\.(ts|tsx)$/.test(entry) &&
            !/\.test\.(ts|tsx)$/.test(entry) &&
            !/\.d\.ts$/.test(entry)
        ) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Extract t("...") / t('...') / t(`...`) calls with an optional meta
 * object. Literal-only by design: the gate validates what it can read
 * statically, and the t() contract requires literal first arguments.
 */
const T_CALL = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*)\1\s*(?:,\s*\{([^}]*)\})?\s*\)/g;

function parseMeta(meta: string | undefined): {
    stringClass: StringClass;
    family: VoiceFamily | undefined;
} {
    let stringClass: StringClass = "label";
    let family: VoiceFamily | undefined;
    if (meta) {
        const classMatch = meta.match(/class:\s*["'](label|body|authored)["']/);
        if (classMatch) stringClass = classMatch[1] as StringClass;
        const familyMatch = meta.match(/family:\s*["']([a-z-]+)["']/);
        if (familyMatch) family = familyMatch[1] as VoiceFamily;
    }
    return { stringClass, family };
}

function extractStrings(file: string): FoundString[] {
    const source = readFileSync(file, "utf8");
    const lines = source.split("\n");
    const found: FoundString[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        T_CALL.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = T_CALL.exec(line)) !== null) {
            const raw = match[2]
                .replace(/\\n/g, " ")
                .replace(/\\(["'`])/g, "$1");
            const { stringClass, family } = parseMeta(match[3]);
            const waived =
                /\/\/\s*voice-waiver:/.test(line) ||
                (i > 0 && /\/\/\s*voice-waiver:/.test(lines[i - 1]));
            found.push({
                file: relative(SRC_ROOT, file),
                line: i + 1,
                text: raw,
                stringClass,
                family,
                waived,
            });
        }
    }
    return found;
}

describe("voice gate — every declared operator-facing string passes", () => {
    const files = walk(SRC_ROOT);
    const all = files.flatMap(extractStrings);
    // The marker's own definition file declares no strings; everything
    // found is a real declaration somewhere in product code.
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
