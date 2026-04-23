import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { ExampleTemplate } from "./Example.template";

/**
 * Canonical component-test template.
 *
 * Copy this file when writing a new component test. It demonstrates:
 *
 *   1. Render the component with @testing-library/preact.
 *   2. Query by role / accessible name first; fall back to class only
 *      when semantic queries aren't viable.
 *   3. Simulate user interactions with fireEvent for simple cases;
 *      for multi-step flows prefer @testing-library/user-event (adds
 *      another dep — pull it in when the first real test needs it).
 *   4. Assert on visible behavior, not implementation details.
 *   5. Use `vi.fn()` for spies on handler callbacks.
 *
 * Naming convention: <ComponentName>.test.tsx, colocated with the component.
 */

describe("ExampleTemplate (canonical component test template)", () => {
    it("renders the given label", () => {
        render(<ExampleTemplate label="Ship it" onSelect={() => {}} />);
        expect(screen.getByRole("button", { name: "Ship it" })).toBeTruthy();
    });

    it("invokes onSelect when the user clicks", () => {
        const handler = vi.fn();
        render(<ExampleTemplate label="Save" onSelect={handler} />);

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(handler).toHaveBeenCalledOnce();
    });

    it("renders disabled when onSelect is omitted", () => {
        render(<ExampleTemplate label="Unavailable" />);
        const btn = screen.getByRole("button", { name: "Unavailable" });
        expect(btn.hasAttribute("disabled")).toBe(true);
        expect(btn.getAttribute("aria-disabled")).toBe("true");
    });

    it("applies the primary modifier class when primary=true", () => {
        render(<ExampleTemplate label="Go" onSelect={() => {}} primary />);
        const btn = screen.getByRole("button", { name: "Go" });
        expect(btn.classList.contains("example-template--primary")).toBe(true);
    });
});
