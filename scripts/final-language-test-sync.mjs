import fs from "node:fs";

const edits = [
  ["src/dashboard/components/ReadinessDrawer.test.tsx", "You are the system", "Founder-dependent"],
  ["src/linkedin-playbook/state.test.ts", 'toContain("Comment")', 'toContain("useful comment")'],
  ["src/territory-architect/lib/field-read.test.ts", "carve one division", "create one territory segment"],
  ["src/dashboard/v4/lib/cockpit.test.ts", "You are the system", "Founder-dependent"]
];
for (const [path, from, to] of edits) {
  const s = fs.readFileSync(path, "utf8");
  if (!s.includes(from)) {
    console.log(`No match: ${path} :: ${from}`);
    continue;
  }
  fs.writeFileSync(path, s.split(from).join(to));
  console.log(`Updated ${path}`);
}
