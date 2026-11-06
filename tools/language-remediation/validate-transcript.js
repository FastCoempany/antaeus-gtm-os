const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../../preview-transcript");
const coverage = JSON.parse(fs.readFileSync(path.join(root, "coverage.json"), "utf8"));
assert.equal(coverage.partial, false, "Acceptance requires a full transcript run");
assert.equal(coverage.expectedRooms.length, 21, "Expected 21 tester rooms including Readiness");
assert.deepEqual(coverage.rooms.map(r => r.id).sort(), [...coverage.expectedRooms].sort(), "Missing or repeated room");
assert.deepEqual(coverage.errors, [], "Browser runtime errors in tester walkthrough");
assert.ok(coverage.gateLines > 0 && coverage.workspaceMapCaptured && coverage.lockedOnboardingExplained, "Gate, navigation and locked-onboarding context required");
for (const room of coverage.rooms) {
    assert.ok(room.restLines > 0, `${room.id} has no rendered text`);
    assert.equal(room.unexplored, 0, `${room.id} reached exploration cap`);
    assert.deepEqual(room.failedActions, [], `${room.id} has failed interactions`);
    const html = fs.readFileSync(path.join(root, room.id, "index.html"), "utf8");
    assert.ok(html.includes('class="line"') && html.includes('class="map"'), `${room.id} is incomplete`);
    assert.ok((html.includes(`${room.actions} actions tried in this area`) || html.includes(`${room.actions} actions tried in this room`)), `${room.id} coverage metadata differs from page`);
}
console.log(`Validated ${coverage.rooms.length} rooms, ${coverage.rooms.reduce((s,r) => s+r.actions,0)} actions and ${coverage.rooms.reduce((s,r) => s+r.reveals,0)} distinct revealed states. No runtime errors, failed controls or cap omissions. Depth ${coverage.depth}; empty/unseeded and network error states also require source/regression review.`);
