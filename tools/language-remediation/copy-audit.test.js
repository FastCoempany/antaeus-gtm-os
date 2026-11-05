const { test } = require("node:test");
const assert = require("node:assert/strict");
const { scanFile } = require("./copy-audit");
test("runtime violations and rejection tests are distinguished, neither disappears", () => {
    assert.equal(scanFile("src/settings/state.ts", 'flashToast("The live edge is on");')[0].category, "B");
    assert.equal(scanFile("src/state.test.ts", 'expect(text).not.toContain("Live Edge");')[0].category, "E");
    assert.equal(scanFile("src/state.ts", '// The Live Edge data adapter')[0].category, "E");
    assert.equal(scanFile("src/state.ts", 'import x from "./live edge";')[0].category, "F");
});
test("JSX, prompts, active style doctrine and runtime JS are governed", () => {
    assert.equal(scanFile("src/a.tsx", '<p>LinkedIn air cover</p>')[0].category, "A");
    assert.equal(scanFile("src/llm/prompts.ts", 'const prompt = "No might, no could";')[0].category, "C");
    assert.equal(scanFile("src/a.ts", '// Style: declarative over hedged')[0].category, "D");
    assert.equal(scanFile("js/discovery-segment-runtime.js", 'const label = "whole motion";')[0].category, "B");
});
test("negative examples do not exempt adjacent active doctrine", () => {
    const s = '<table data-copy-context="deprecated-example"><tr><td>air cover</td></tr></table><p>Use air cover.</p>';
    assert.deepEqual(scanFile("deliverables/map.html", s).map(x => x.category), ["E", "D"]);
});
test("boundaries reject substrings and reviewed contexts are exact and dated", () => {
    assert.equal(scanFile("src/a.ts", 'const frontend = "thinly";').length, 0);
    const entry = { path: "src/a.ts", phrase: "pressure", excerpt: '"blood pressure"', category: "G", owner: "test", justification: "literal measurement", reviewBy: "2099-01-01" };
    assert.deepEqual(scanFile("src/a.ts", 'const a = "blood pressure";\nconst b = "deal pressure";', [entry]).map(x => x.category), ["G", "B"]);
});
test("type keys and forbidden-term lists retain explicit technical/example classification", () => {
    assert.equal(scanFile("src/types.ts", 'type State = "heat";')[0].category, "F");
    assert.equal(scanFile("src/llm/prompts.ts", 'const BANNED_TERMS = ["air cover"];')[0].category, "E");
    assert.equal(scanFile("src/llm/prompts.ts", 'const examples = ["air cover"];')[0].category, "C");
});
