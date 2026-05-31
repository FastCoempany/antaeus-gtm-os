import { describe, expect, it } from "vitest";
import { parseSkill } from "./parser";

const VALID = `---
id: triage-week-reads
label: Triage the week's reads
description: Open the Dashboard with focus on undismissed observations.
keywords: [observations, dashboard, week]
action:
  kind: route
  target: /dashboard/
---

# Triage the week's reads

Body of the recipe — surfaced in a future help panel.
`;

describe("parseSkill — happy path", () => {
    it("parses a minimal route recipe", () => {
        const r = parseSkill(VALID);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.skill.id).toBe("triage-week-reads");
        expect(r.skill.label).toBe("Triage the week's reads");
        expect(r.skill.description).toContain("Dashboard");
        expect(r.skill.keywords).toEqual(["observations", "dashboard", "week"]);
        expect(r.skill.action.kind).toBe("route");
        if (r.skill.action.kind === "route") {
            expect(r.skill.action.target).toBe("/dashboard/");
        }
        expect(r.skill.body).toContain("# Triage the week's reads");
    });

    it("parses compose-context-and-route with shorthand sources", () => {
        const recipe = `---
id: prep-next-call
label: Prep for my next call
description: Drop into Discovery Studio for the next account on the agenda.
keywords: [discovery, call]
action:
  kind: compose-context-and-route
  target: /discovery-studio/
  sources: source=latest-call-planner-agenda|paramName=account|required=true
---

# Prep
`;
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        if (r.skill.action.kind !== "compose-context-and-route") {
            throw new Error("wrong action kind");
        }
        expect(r.skill.action.target).toBe("/discovery-studio/");
        expect(r.skill.action.sources.length).toBe(1);
        expect(r.skill.action.sources[0]!.source).toBe(
            "latest-call-planner-agenda"
        );
        expect(r.skill.action.sources[0]!.paramName).toBe("account");
        expect(r.skill.action.sources[0]!.required).toBe(true);
    });

    it("parses filter-and-route with passthrough filter + limit", () => {
        const recipe = `---
id: whats-at-risk
label: What's at risk this week
description: Open Deal Workspace with the top stalled deals pre-filtered.
keywords: [risk, stalled, deals]
action:
  kind: filter-and-route
  target: /deal-workspace/
  source: top-stalled-deals
  filter: passthrough
  paramName: ids
  limit: 5
---

# Risk
`;
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        if (r.skill.action.kind !== "filter-and-route") {
            throw new Error("wrong action kind");
        }
        expect(r.skill.action.source).toBe("top-stalled-deals");
        expect(r.skill.action.paramName).toBe("ids");
        expect(r.skill.action.limit).toBe(5);
        expect(r.skill.action.filter.kind).toBe("passthrough");
    });

    it("treats missing keywords as empty array", () => {
        const recipe = VALID.replace("keywords: [observations, dashboard, week]\n", "");
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.skill.keywords).toEqual([]);
    });
});

describe("parseSkill — failure modes", () => {
    it("rejects a recipe without frontmatter", () => {
        const r = parseSkill("# Just a body");
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.error).toMatch(/frontmatter/i);
    });

    it("rejects a recipe missing required fields", () => {
        const r = parseSkill(`---
id: x
---

body
`);
        expect(r.ok).toBe(false);
    });

    it("rejects an unknown action kind", () => {
        const recipe = VALID.replace("kind: route", "kind: teleport");
        const r = parseSkill(recipe);
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.error).toMatch(/teleport/);
    });

    it("rejects a target that doesn't start with /", () => {
        const recipe = VALID.replace("target: /dashboard/", "target: dashboard");
        const r = parseSkill(recipe);
        expect(r.ok).toBe(false);
    });

    it("rejects an unknown source key", () => {
        const recipe = `---
id: x
label: X
description: A plain description.
action:
  kind: compose-context-and-route
  target: /dashboard/
  sources: source=hottest-mars-rover|paramName=account
---

body
`;
        const r = parseSkill(recipe);
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.error).toMatch(/mars-rover/);
    });

    it("rejects a description that violates the voice rules", () => {
        const recipe = VALID.replace(
            "description: Open the Dashboard with focus on undismissed observations.",
            "description: Leverage the dashboard to unlock synergies across rooms."
        );
        const r = parseSkill(recipe);
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.error).toMatch(/voice/i);
    });
});

describe("parseSkill — YAML edge cases", () => {
    it("handles quoted strings with apostrophes", () => {
        const recipe = `---
id: x
label: "Triage the week's reads"
description: A plain description.
action:
  kind: route
  target: /dashboard/
---

body
`;
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.skill.label).toBe("Triage the week's reads");
    });

    it("strips inline comments", () => {
        const recipe = `---
id: x # this is the id
label: X
description: A plain description.
action:
  kind: route
  target: /dashboard/
---

body
`;
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.skill.id).toBe("x");
    });

    it("tolerates trailing whitespace and CRLF line endings", () => {
        const recipe = VALID.replace(/\n/g, "\r\n");
        const r = parseSkill(recipe);
        expect(r.ok).toBe(true);
    });
});
