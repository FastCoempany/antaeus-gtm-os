import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/preact";
import { __setDemoModeOverrideForTests } from "@/lib/data-client-demo-local";
import { prospects, resetSession } from "../state";
import { ProspectingDeskV4 } from "./ProspectingDeskV4";
import { __resetResearchStateForTests } from "./research-state";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
    __resetResearchStateForTests();
    __setDemoModeOverrideForTests(true);
    localStorage.setItem("gtmos_demo_seed_meta", JSON.stringify({ mode: "ent" }));
});

afterEach(() => {
    __setDemoModeOverrideForTests(null);
});

function button(container: Element, label: string): HTMLButtonElement {
    const b = [...container.querySelectorAll("button")].find((x) => x.textContent?.trim() === label);
    if (!b) throw new Error(`No button "${label}"`);
    return b as HTMLButtonElement;
}

describe("Prospecting Desk — search the web, then add to Just added", () => {
    it("no longer claims the room does not search", () => {
        const { container } = render(<ProspectingDeskV4 />);
        expect(container.textContent).not.toMatch(/does not (run|claim)/i);
        expect(container.textContent).toContain("Search the web");
        expect(container.textContent).toContain("Research companies you name");
    });

    it("searches, labels sample results, adds a company with its citations, and keeps the qualification gate", async () => {
        const { container, getByLabelText } = render(<ProspectingDeskV4 />);
        fireEvent.input(getByLabelText("Describe who you're after"), { target: { value: "HR tech companies hiring" } });
        fireEvent.click(button(container, "Search the web"));

        await waitFor(() => expect(container.querySelectorAll(".pd4-hit").length).toBeGreaterThan(0));
        expect(container.textContent).toContain("Sample results — the demo doesn't run a live web search");
        const first = container.querySelector(".pd4-hit")!;
        const name = first.querySelector(".pd4-hitn")!.textContent!;
        expect(first.querySelector(".pd4-srcs a")?.getAttribute("href")).toMatch(/^https:\/\//);

        fireEvent.click([...first.querySelectorAll("button")].find((b) => b.textContent === "Add to Just added")!);

        const added = prospects.value.find((p) => p.accountName === name)!;
        expect(added.stage).toBe("captured");
        expect(added.notes + added.entryPoint + added.approach).toBe("");
        expect(added.webResearch?.sources.length).toBeGreaterThan(0);
        expect(added.webResearch?.sample).toBe(true);

        // The detail panel opens with the citation line; Send stays disabled.
        await waitFor(() => expect(container.querySelector(".pd4-rdet")).not.toBeNull());
        expect(container.querySelector(".pd4-rdk")!.textContent).toMatch(/Sample research from the demo data · .+ · 1 source/);
        const send = [...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Send "))!;
        expect(send.disabled).toBe(true);

        expect(first.querySelector(".pd4-hitadd")!.textContent).toBe("Added");
    });

    it("research drafts are suggestions: the account only becomes ready after the seller uses all three", async () => {
        const { container, getByLabelText } = render(<ProspectingDeskV4 />);
        fireEvent.input(getByLabelText("Research companies you name"), { target: { value: "Workday" } });
        fireEvent.click(button(container, "Research"));
        await waitFor(() => expect(container.querySelector(".pd4-hit")).not.toBeNull());
        fireEvent.click(button(container, "Add to Just added"));

        const id = prospects.value.find((p) => p.accountName === "Workday")!.id;
        await waitFor(() => expect(container.querySelectorAll(".pd4-sugg").length).toBe(3));
        expect(prospects.value.find((p) => p.id === id)!.stage).toBe("captured");

        for (let i = 0; i < 3; i += 1) {
            fireEvent.click(container.querySelector(".pd4-sugguse")!);
        }
        await waitFor(() => expect(prospects.value.find((p) => p.id === id)!.stage).toBe("ready"));
        const p = prospects.value.find((x) => x.id === id)!;
        expect(p.notes).toBe(p.webResearch!.suggested!.targetFit);
    });

    it("saved searches can be checked again for new matches", async () => {
        const { container, getByLabelText } = render(<ProspectingDeskV4 />);
        fireEvent.input(getByLabelText("Describe who you're after"), { target: { value: "Staffing and HR tech" } });
        fireEvent.click(button(container, "Save this search"));
        await waitFor(() => expect(container.textContent).toContain("Saved searches"));
        fireEvent.click(button(container, "Check for new matches"));
        await waitFor(() => expect(container.querySelector(".pd4-rtitle")?.textContent).toMatch(/new companies/));
        await waitFor(() => expect(container.textContent).toMatch(/Last checked .+ new then/));
    });
});

describe("Prospecting Desk — demo simulates the weekly automatic re-check", () => {
    it("adds one sample company per due saved search, marks it, and leaves fresh searches alone", async () => {
        const { setQueryCards, queryCards } = await import("../state");
        const { simulateDemoRerun } = await import("./research-state");
        const { autoRerunEnabled } = await import("../lib/auto-rerun");
        autoRerunEnabled.value = null;
        const now = Date.parse("2026-11-05T12:00:00Z");
        const base = { platform: "linkedin" as const, intent: "", notes: "", targetIcp: "", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" };
        setQueryCards([
            { ...base, id: "q-due", query: "Airlines hiring pilots" },
            { ...base, id: "q-fresh", query: "Retail chains hiring", lastCheckedAt: "2026-11-04T12:00:00Z" }
        ]);
        const added = await simulateDemoRerun({ force: true, now });
        expect(added).toBe(1);
        const p = prospects.value.find((x) => x.sourceQueryId === "q-due")!;
        expect(p.stage).toBe("captured");
        expect(p.webResearch?.auto).toBe(true);
        expect(p.webResearch?.sample).toBe(true);
        const due = queryCards.value.find((c) => c.id === "q-due")!;
        expect(due.lastCheckedBy).toBe("auto");
        expect(due.lastNewCount).toBe(1);
        expect(queryCards.value.find((c) => c.id === "q-fresh")!.lastCheckedBy).toBeUndefined();

        const { container } = render(<ProspectingDeskV4 />);
        expect(container.textContent).toContain("Checked automatically");
        expect(container.textContent).toContain("found by the weekly check");
        expect(container.textContent).toContain("Turn off weekly checks");
    });

    it("does nothing when the demo switch is off", async () => {
        const { setQueryCards } = await import("../state");
        const { simulateDemoRerun } = await import("./research-state");
        const { autoRerunEnabled } = await import("../lib/auto-rerun");
        autoRerunEnabled.value = false;
        setQueryCards([{ id: "q", platform: "linkedin", query: "Airlines hiring pilots", intent: "", notes: "", targetIcp: "", createdAt: "x", updatedAt: "x" }]);
        expect(await simulateDemoRerun({ force: true })).toBe(0);
        expect(prospects.value).toHaveLength(0);
    });
});
